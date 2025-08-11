import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from '../database/database-health.service';

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
  database?: {
    status: string;
    message: string;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly databaseHealthService: DatabaseHealthService) {}

  async getHealth(): Promise<HealthCheckResponse> {
    const dbHealth = await this.databaseHealthService.checkHealth();

    return {
      status: 'ok',
      service: 'progress-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbHealth.status,
        message: dbHealth.message,
      },
    };
  }
}
