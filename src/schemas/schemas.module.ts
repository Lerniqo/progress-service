import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressEvent, ProgressEventSchema } from './progress-event.schema';
import { Progress, ProgressSchema } from './progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProgressEvent.name, schema: ProgressEventSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemasModule {}
