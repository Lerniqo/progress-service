import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';

describe('AppController', () => {
  let appController: AppController;
  let mockDatabaseHealthService: Partial<DatabaseHealthService>;

  beforeEach(async () => {
    mockDatabaseHealthService = {
      checkHealth: jest.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Database connection is healthy',
        details: {
          readyState: 1,
          readyStateText: 'connected',
        },
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseHealthService,
          useValue: mockDatabaseHealthService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status with database info', async () => {
      const result = await appController.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'progress-service');
      expect(result).toHaveProperty('database.status', 'healthy');
      expect(result).toHaveProperty(
        'database.message',
        'Database connection is healthy',
      );
      expect(mockDatabaseHealthService.checkHealth).toHaveBeenCalled();
    });
  });

  describe('database health', () => {
    it('should return detailed database health info', async () => {
      const result = await appController.getDatabaseHealth();

      expect(result).toEqual({
        status: 'healthy',
        message: 'Database connection is healthy',
        details: {
          readyState: 1,
          readyStateText: 'connected',
        },
      });
      expect(mockDatabaseHealthService.checkHealth).toHaveBeenCalled();
    });
  });
});
