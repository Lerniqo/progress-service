import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaConfigService } from './kafka-config.service';
import { KafkaService } from './kafka.service';
import { KafkaHealthService } from './kafka-health.service';

@Module({
  imports: [ConfigModule],
  providers: [KafkaConfigService, KafkaService, KafkaHealthService],
  exports: [KafkaService, KafkaConfigService, KafkaHealthService],
})
export class KafkaModule {}
