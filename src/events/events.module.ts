import { Module } from '@nestjs/common';
import { SchemasModule } from '../schemas';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventQueueService } from './event-queue.service';

@Module({
  imports: [SchemasModule],
  controllers: [EventsController],
  providers: [EventsService, EventQueueService],
  exports: [EventsService, EventQueueService],
})
export class EventsModule {}
