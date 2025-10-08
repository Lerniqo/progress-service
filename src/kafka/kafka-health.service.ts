import { Injectable } from '@nestjs/common';
import { KafkaService } from './kafka.service';

export interface KafkaHealthCheckResponse {
  status: string;
  producer: boolean;
  consumer: boolean;
  details?: any;
}

@Injectable()
export class KafkaHealthService {
  constructor(private readonly kafkaService: KafkaService) {}

  isHealthy(): KafkaHealthCheckResponse {
    try {
      const producerConnected = this.kafkaService.isProducerReady();
      const consumerConnected = this.kafkaService.isConsumerReady();

      const isHealthy = producerConnected && consumerConnected;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        producer: producerConnected,
        consumer: consumerConnected,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        producer: false,
        consumer: false,
        details: (error as Error).message,
      };
    }
  }
}
