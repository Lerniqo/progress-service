import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaConfigService } from './kafka-config.service';
import { KafkaService } from './kafka.service';

@Module({
  imports: [ConfigModule],
  providers: [KafkaConfigService, KafkaService],
  exports: [KafkaService, KafkaConfigService],
})
export class KafkaModule {}
