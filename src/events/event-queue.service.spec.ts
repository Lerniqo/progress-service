import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventQueueService } from './event-queue.service';
import { KafkaService } from '../kafka/kafka.service';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { EventType } from '../schemas/event-types.enum';
import * as dto from './dto';

describe('EventQueueService', () => {
  let service: EventQueueService;
  let logger: jest.Mocked<PinoLogger>;

  const mockEvent: dto.Event = {
    eventType: EventType.QUIZ_ATTEMPT,
    eventData: {
      userId: 'user123',
      courseId: 'course456',
      quizId: 'quiz789',
      score: 85,
      completed: true,
    },
    metadata: {
      userAgent: 'Mozilla/5.0',
      sessionId: 'session123',
    },
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  const mockQueuedEvent = {
    _id: 'queue-id-123',
    eventType: EventType.QUIZ_ATTEMPT,
    userId: 'user123',
    eventData: mockEvent.eventData,
    metadata: mockEvent.metadata,
    createdAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create constructor function that returns mockQueuedEvent
    const MockEventQueueModel = jest
      .fn()
      .mockImplementation(() => mockQueuedEvent) as any;
    MockEventQueueModel.countDocuments = jest.fn();
    MockEventQueueModel.findById = jest.fn();
    MockEventQueueModel.deleteOne = jest.fn();

    // Create constructor function for event model
    const MockEventModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({}),
    }));

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const mockKafkaService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventQueueService,
        {
          provide: getModelToken('EventQueue'),
          useValue: MockEventQueueModel,
        },
        {
          provide: getModelToken('Event'),
          useValue: MockEventModel,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EventQueueService>(EventQueueService);
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should set logger context', () => {
      expect(logger.setContext).toHaveBeenCalledWith('EventQueueService');
    });
  });

  describe('enqueueEvent', () => {
    it('should successfully enqueue an event and return in-memory queue ID', async () => {
      // Act
      const result = await service.enqueueEvent(mockEvent);

      // Assert - Should return in-memory queue ID pattern: evt_<timestamp>_<counter>
      expect(result).toMatch(/^evt_\d+_\d+$/);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventId: expect.stringMatching(/^evt_\d+_\d+$/),
          eventType: mockEvent.eventType,
          queueLength: 1,
        },
        'Event added to in-memory queue',
      );
    });

    it('should handle different event types', async () => {
      // Arrange
      const videoWatchEvent: dto.Event = {
        ...mockEvent,
        eventType: EventType.VIDEO_WATCH,
      };

      // Act
      const result = await service.enqueueEvent(videoWatchEvent);

      // Assert
      expect(result).toMatch(/^evt_\d+_\d+$/);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.VIDEO_WATCH,
        }),
        'Event added to in-memory queue',
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics including in-memory queue size', async () => {
      // Act
      const result = await service.getQueueStats();

      // Assert
      expect(result).toEqual({ total: 0, isProcessing: false });
    });
  });
});
