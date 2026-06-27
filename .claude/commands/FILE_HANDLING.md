# File Handling — Upload, Conversion & Serving

> This file covers the complete file pipeline:
> upload → validate → store → convert to PDF → extract page count → serve.
> The Electron print client expects PDFs. All files must be converted.

---

## Accepted file types

| MIME type                                                               | Extension | Convert to PDF? |
|-------------------------------------------------------------------------|-----------|-----------------|
| `application/pdf`                                                       | .pdf      | No (already PDF)|
| `application/msword`                                                    | .doc      | Yes             |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx  | Yes             |
| `image/jpeg`                                                            | .jpg/.jpeg| Yes             |
| `image/png`                                                             | .png      | Yes             |

Reject any other MIME type with a `400 Bad Request`.

---

## File size limit

- Maximum: `20MB` per file
- Set in NestJS via `FileSizeValidator` and also in Multer config
- Return `413 Payload Too Large` if exceeded

---

## Storage structure

```
uploads/
  originals/
    {userId}/
      {uuid}-{originalFilename}    ← raw uploaded file
  pdfs/
    {userId}/
      {uuid}.pdf                   ← converted PDF version
```

Store the base upload directory in `.env` as `UPLOAD_DIR=./uploads`.
Never hardcode the path. Always use `path.join(uploadDir, ...)`.

---

## NestJS file upload setup

```typescript
// files.controller.ts
import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly config: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = join(process.cwd(), 'uploads', 'originals', req.user.id);
        // Ensure directory exists — do this in service, not here
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uuid = uuidv4();
        const ext  = extname(file.originalname);
        cb(null, `${uuid}${ext}`);
      },
    }),
  }))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),  // 20MB
          new FileTypeValidator({
            fileType: /(pdf|msword|wordprocessingml|jpeg|jpg|png)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user,
  ) {
    return this.filesService.processUpload(file, user.id);
  }
}
```

---

## Files service — processUpload

```typescript
// files.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join, extname, basename } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { File } from './entities/file.entity';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    private readonly config: ConfigService,
  ) {}

  async processUpload(file: Express.Multer.File, userId: string) {
    // Ensure PDF output directory exists
    const pdfDir = join(process.cwd(), 'uploads', 'pdfs', userId);
    if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

    let pdfPath: string;
    let pageCount = 1;

    const isPdf = file.mimetype === 'application/pdf';

    if (isPdf) {
      pdfPath = file.path;
      pageCount = await this.getPdfPageCount(file.path);
    } else {
      pdfPath = await this.convertToPdf(file.path, pdfDir);
      pageCount = await this.getPdfPageCount(pdfPath);
    }

    // Build public URLs
    const uploadDir  = this.config.get<string>('UPLOAD_DIR');
    const fileUrl    = file.path.replace(process.cwd(), '');
    const pdfUrl     = pdfPath.replace(process.cwd(), '');

    // Save to database
    const record = this.fileRepo.create({
      userId,
      originalName: file.originalname,
      storedName:   basename(file.path),
      mimeType:     file.mimetype,
      sizeBytes:    file.size,
      pageCount,
      fileUrl,
      pdfUrl,
    });
    await this.fileRepo.save(record);

    return {
      fileId:    record.id,
      fileName:  file.originalname,
      fileUrl,
      pdfUrl,
      pageCount,
    };
  }

  private async convertToPdf(inputPath: string, outputDir: string): Promise<string> {
    // LibreOffice headless conversion
    // --convert-to pdf  → output format
    // --outdir          → output directory
    // --headless        → no GUI
    const cmd = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    try {
      await execAsync(cmd, { timeout: 30000 });  // 30 second timeout
    } catch (err) {
      throw new InternalServerErrorException('File conversion failed');
    }

    // LibreOffice outputs filename with .pdf extension replacing original ext
    const originalBase = basename(inputPath, extname(inputPath));
    return join(outputDir, `${originalBase}.pdf`);
  }

  private async getPdfPageCount(pdfPath: string): Promise<number> {
    try {
      const buffer = await fs.readFile(pdfPath);
      const data   = await pdfParse(buffer);
      return data.numpages;
    } catch {
      return 1;  // fallback if parse fails
    }
  }
}
```

---

## LibreOffice installation

LibreOffice must be installed on the server for conversion to work.

```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# Verify installation
libreoffice --version
```

For Docker-based production:
```dockerfile
RUN apt-get update && apt-get install -y libreoffice && apt-get clean
```

---

## Serving files (authenticated)

Files should only be accessible to the owner or admin. Never expose raw file paths publicly.

```typescript
// files.controller.ts
@Get(':filename')
@UseGuards(JwtAuthGuard)
async serveFile(
  @Param('filename') filename: string,
  @CurrentUser() user,
  @Res() res: Response,
) {
  // Verify ownership
  const file = await this.filesService.findByFilename(filename, user.id);
  if (!file) throw new NotFoundException('File not found');

  const filePath = join(process.cwd(), file.fileUrl);
  res.sendFile(filePath);
}
```

---

## npm packages required

```bash
npm install multer @types/multer
npm install pdf-parse @types/pdf-parse
npm install uuid @types/uuid
npm install @nestjs/platform-express
```

---

## What the frontend expects from POST /api/files/upload

```typescript
// Response shape — must match frontend expectation
{
  statusCode: 200,
  message: 'Success',
  data: {
    fileId:    'uuid',
    fileName:  'CV_John_Kamau.pdf',
    fileUrl:   '/uploads/originals/user123/uuid.pdf',
    pdfUrl:    '/uploads/pdfs/user123/uuid.pdf',
    pageCount: 4,
  }
}
```

The frontend uses `pageCount` for the cost estimate. This must be accurate.

---

## Security rules

- Never trust the client-provided filename — always use the stored name
- Never serve files from a public static directory — always go through the authenticated endpoint
- Sanitize filenames — strip path traversal characters (`..`, `/`, `\`)
- Validate MIME type from the actual file content (Multer does this), not just the extension
- Delete original file after successful PDF conversion if disk space is a concern
