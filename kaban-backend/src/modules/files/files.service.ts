import {
  Injectable, OnModuleInit, Logger, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buffer: Buffer) => Promise<{ numpages: number }> = require('pdf-parse');
import { v4 as uuid } from 'uuid';
import { File } from './models/file.model';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor(
    @InjectModel(File) private readonly fileModel: typeof File,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get('MINIO_BUCKET') ?? 'printease';
    this.client = new Minio.Client({
      endPoint:  this.config.get('MINIO_ENDPOINT') ?? 'localhost',
      port:      Number(this.config.get('MINIO_PORT') ?? 9000),
      useSSL:    this.config.get('MINIO_USE_SSL') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY') ?? 'minioadmin',
      secretKey: this.config.get('MINIO_SECRET_KEY') ?? 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      }
    } catch (err) {
      this.logger.warn(`MinIO init failed (is MinIO running?): ${err.message}`);
    }
  }

  async processUpload(file: Express.Multer.File, userId: string) {
    const ext        = file.originalname.split('.').pop()?.toLowerCase() ?? 'bin';
    const storedName = `${uuid()}.${ext}`;
    const fileKey    = `originals/${userId}/${storedName}`;

    // Upload original to MinIO
    await this.client.putObject(this.bucket, fileKey, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    // Count pages
    let pageCount = 1;
    if (file.mimetype === 'application/pdf') {
      try {
        const data = await pdfParse(file.buffer);
        pageCount  = data.numpages ?? 1;
      } catch {
        pageCount = Math.max(1, Math.round(file.size / (51.2 * 1024)));
      }
    }

    const record = await this.fileModel.create({
      userId,
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      pageCount,
      fileKey,
      pdfKey: null,
    });

    return {
      fileId:       record.id,
      fileName:     record.originalName,
      pageCount:    record.pageCount,
      mimeType:     record.mimeType,
      sizeBytes:    record.sizeBytes,
      fileKey:      record.fileKey,
    };
  }

  async getPresignedUrl(fileId: string, userId: string) {
    const file = await this.fileModel.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (file.userId !== userId) throw new ForbiddenException('Access denied');

    const key = file.pdfKey ?? file.fileKey;
    const url = await this.client.presignedGetObject(this.bucket, key, 3600);
    return { url };
  }
}
