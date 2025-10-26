import { Module } from '@nestjs/common';
import { SchemasModule } from '../schemas';
import { KafkaModule } from '../kafka/kafka.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventQueueService } from './event-queue.service';
import { EventsKafkaConsumerService } from './events-kafka-consumer.service';

@Module({
  imports: [SchemasModule, KafkaModule],
  controllers: [EventsController],
  providers: [EventsService, EventQueueService, EventsKafkaConsumerService],
  exports: [EventsService, EventQueueService],
})
export class EventsModule {}
