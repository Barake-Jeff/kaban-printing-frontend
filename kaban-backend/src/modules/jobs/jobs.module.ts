import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './models/job.model';
import { File } from '../files/models/file.model';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Job, File]),
    NotificationsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
