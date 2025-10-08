import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseHealthService } from '../database/database-health.service';
import { KafkaHealthService } from '../kafka/kafka-health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let databaseHealthService: DatabaseHealthService;

  beforeEach(async () => {
    const mockDatabaseHealthService = {
      checkHealth: jest.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Database connection is healthy',
      }),
    };

    const mockKafkaHealthService = {
      isHealthy: jest.fn().mockReturnValue({
        status: 'healthy',
        message: 'Kafka connection is healthy',
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
        {
          provide: KafkaHealthService,
          useValue: mockKafkaHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
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
        timestamp: expect.any(String) as string,
        uptime: expect.any(Number) as number,
        database: {
          status: 'healthy',
          message: 'Database connection is healthy',
        },
        kafka: expect.objectContaining({
          status: 'healthy',
        }),
      });
    });

    it('should call database health service', async () => {
      const checkHealthSpy = jest.spyOn(databaseHealthService, 'checkHealth');
      await controller.getHealth();

      expect(checkHealthSpy).toHaveBeenCalled();
    });
  });
});
