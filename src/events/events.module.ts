import { Module } from '@nestjs/common';
import { SchemasModule } from '../schemas';
import { KafkaModule } from '../kafka/kafka.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventQueueService } from './event-queue.service';

@Module({
  imports: [SchemasModule, KafkaModule],
  controllers: [EventsController],
  providers: [EventsService, EventQueueService],
  exports: [EventsService, EventQueueService],
})
export class EventsModule {}
