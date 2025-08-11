import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(): Promise<object> {
    const dbHealth = await this.databaseHealthService.checkHealth();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'progress-service',
      database: {
        status: dbHealth.status,
        message: dbHealth.message,
      },
    };
  }

  @Get('health/db')
  async getDatabaseHealth() {
    return this.databaseHealthService.checkHealth();
  }
}
