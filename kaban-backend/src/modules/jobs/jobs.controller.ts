import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { User } from '../users/models/user.model';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: User) {
    return this.jobsService.create(dto, user);
  }

  @Get('my-jobs')
  getMyJobs(
    @CurrentUser() user: User,
    @Query('page') page = '1',
    @Query('size') size = '10',
  ) {
    return this.jobsService.findMyJobs(user.id, Number(page), Number(size));
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.findOne(id, user.id);
  }
}
