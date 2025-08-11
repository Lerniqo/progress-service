import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseHealthService } from '../database/database-health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;
  let databaseHealthService: DatabaseHealthService;

  beforeEach(async () => {
    const mockDatabaseHealthService = {
      checkHealth: jest.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Database connection is healthy',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: DatabaseHealthService,
          useValue: mockDatabaseHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
    databaseHealthService = module.get<DatabaseHealthService>(
      DatabaseHealthService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const result = await controller.getHealth();

      expect(result).toEqual({
        status: 'ok',
        service: 'progress-service',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        database: {
          status: 'healthy',
          message: 'Database connection is healthy',
        },
      });
    });

    it('should call database health service', async () => {
      await controller.getHealth();

      expect(databaseHealthService.checkHealth).toHaveBeenCalled();
    });
  });
});
