import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ProgressService } from './progress.service';
import type { CreateProgressDto, UpdateProgressDto } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProgressDto: CreateProgressDto) {
    return this.progressService.create(createProgressDto);
  }

  @Get()
  async findAll() {
    return this.progressService.findAll();
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.progressService.findByUserId(userId);
  }

  @Get('user/:userId/course/:courseId')
  async findByUserAndCourse(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.findByUserAndCourse(userId, courseId);
  }

  @Put('user/:userId/course/:courseId')
  async update(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.update(userId, courseId, updateProgressDto);
  }

  @Delete('user/:userId/course/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    await this.progressService.delete(userId, courseId);
  }

  @Get('health/db')
  async healthCheck() {
    const isHealthy = await this.progressService.healthCheck();
    return {
      status: isHealthy ? 'ok' : 'error',
      database: isHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
