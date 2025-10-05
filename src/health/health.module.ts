import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../database/database.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [DatabaseModule, KafkaModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
