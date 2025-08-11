import { Module } from '@nestjs/common';
import { ProgressEventsController } from './progress-events.controller';
import { ProgressEventsService } from './progress-events.service';
import { SchemasModule } from '../schemas/schemas.module';

@Module({
  imports: [SchemasModule],
  controllers: [ProgressEventsController],
  providers: [ProgressEventsService],
  exports: [ProgressEventsService],
})
export class ProgressEventsModule {}
