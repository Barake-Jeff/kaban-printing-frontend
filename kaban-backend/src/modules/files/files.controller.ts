import {
  Controller, Post, Get, Param, UseGuards,
  UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { User } from '../users/models/user.model';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|msword|officedocument\.wordprocessingml|jpeg|jpg|png)/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.filesService.processUpload(file, user.id);
  }

  @Get(':fileId')
  getFileUrl(@Param('fileId') fileId: string, @CurrentUser() user: User) {
    return this.filesService.getPresignedUrl(fileId, user.id);
  }
}
