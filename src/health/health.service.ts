/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from '../database/database-health.service';
import { KafkaHealthService } from '../kafka/kafka-health.service';

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
  database?: {
    status: string;
    message: string;
  };
  kafka?: {
    status: string;
    producer: boolean;
    consumer: boolean;
    details?: any;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly kafkaHealthService: KafkaHealthService,
  ) {}

  async getHealth(): Promise<HealthCheckResponse> {
    const dbHealth = await this.databaseHealthService.checkHealth();
    const kafkaHealth = this.kafkaHealthService.isHealthy();

    return {
      status: 'ok',
      service: 'progress-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbHealth.status,
        message: dbHealth.message,
      },
      kafka: {
        status: kafkaHealth.status,
        producer: kafkaHealth.producer,
        consumer: kafkaHealth.consumer,
        details: kafkaHealth.details,
      },
    };
  }
}
