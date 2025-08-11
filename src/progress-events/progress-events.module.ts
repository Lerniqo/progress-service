import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressEventsController } from './progress-events.controller';
import { ProgressEventsService } from './progress-events.service';
import { 
  ProgressEvent, 
  ProgressEventSchema 
} from '../schemas/progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProgressEvent.name, schema: ProgressEventSchema },
    ]),
  ],
  controllers: [ProgressEventsController],
  providers: [ProgressEventsService],
  exports: [ProgressEventsService],
})
export class ProgressEventsModule {}
