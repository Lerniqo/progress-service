import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventQueueService } from './event-queue.service';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { EventType } from '../schemas/event-types.enum';
import * as dto from './dto';

describe('EventsService', () => {
  let service: EventsService;
  let eventQueueService: jest.Mocked<EventQueueService>;
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

  beforeEach(async () => {
    const mockEventQueueService = {
      enqueueEvent: jest.fn(),
      getQueueStats: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventQueueService,
          useValue: mockEventQueueService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventQueueService = module.get(EventQueueService);
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
      expect(logger.setContext).toHaveBeenCalledWith('EventsService');
    });
  });

  describe('processEvent', () => {
    it('should successfully process an event and return queue information', async () => {
      // Arrange
      const mockQueueId = 'queue-id-123';
      eventQueueService.enqueueEvent.mockResolvedValue(mockQueueId);

      // Act
      const result = await service.processEvent(mockEvent);

      // Assert
      expect(eventQueueService.enqueueEvent).toHaveBeenCalledWith(mockEvent);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: mockEvent.eventType,
          timestamp: mockEvent.timestamp,
        },
        'Received event for processing',
      );
      expect(logger.info).toHaveBeenCalledWith(
        {
          queueId: mockQueueId,
          eventType: mockEvent.eventType,
        },
        'Event added to processing queue',
      );

      expect(result).toEqual({
        queueId: mockQueueId,
        status: 'accepted',
        message: 'Event has been queued for processing',
        timestamp: expect.any(Date),
      });
    });

    it('should handle different event types correctly', async () => {
      // Arrange
      const videoWatchEvent: dto.Event = {
        ...mockEvent,
        eventType: EventType.VIDEO_WATCH,
      };
      const mockQueueId = 'queue-id-456';
      eventQueueService.enqueueEvent.mockResolvedValue(mockQueueId);

      // Act
      const result = await service.processEvent(videoWatchEvent);

      // Assert
      expect(eventQueueService.enqueueEvent).toHaveBeenCalledWith(
        videoWatchEvent,
      );
      expect(result.queueId).toBe(mockQueueId);
      expect(result.status).toBe('accepted');
    });

    it('should handle events without metadata', async () => {
      // Arrange
      const eventWithoutMetadata: dto.Event = {
        eventType: EventType.AI_TUTOR_INTERACTION,
        eventData: { userId: 'user123', interaction: 'question' },
        timestamp: new Date(),
      };
      const mockQueueId = 'queue-id-789';
      eventQueueService.enqueueEvent.mockResolvedValue(mockQueueId);

      // Act
      const result = await service.processEvent(eventWithoutMetadata);

      // Assert
      expect(eventQueueService.enqueueEvent).toHaveBeenCalledWith(
        eventWithoutMetadata,
      );
      expect(result.queueId).toBe(mockQueueId);
    });

    it('should log error and rethrow when enqueue fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      eventQueueService.enqueueEvent.mockRejectedValue(error);

      // Act & Assert
      await expect(service.processEvent(mockEvent)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        {
          error: error.message,
          eventType: mockEvent.eventType,
        },
        'Failed to queue event for processing',
      );
    });

    it('should handle enqueue service throwing custom errors', async () => {
      // Arrange
      const customError = new Error('Queue capacity exceeded');
      eventQueueService.enqueueEvent.mockRejectedValue(customError);

      // Act & Assert
      await expect(service.processEvent(mockEvent)).rejects.toThrow(
        'Queue capacity exceeded',
      );
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: 'Queue capacity exceeded',
          eventType: mockEvent.eventType,
        },
        'Failed to queue event for processing',
      );
    });

    it('should return timestamp as Date object', async () => {
      // Arrange
      const mockQueueId = 'queue-id-123';
      eventQueueService.enqueueEvent.mockResolvedValue(mockQueueId);
      const beforeTime = new Date();

      // Act
      const result = await service.processEvent(mockEvent);

      // Assert
      const afterTime = new Date();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe('getProcessingStats', () => {
    it('should return queue statistics', async () => {
      // Arrange
      const mockStats = {
        total: 42,
        pending: 10,
        processing: 5,
        completed: 25,
        failed: 2,
      };
      eventQueueService.getQueueStats.mockResolvedValue(mockStats);

      // Act
      const result = await service.getProcessingStats();

      // Assert
      expect(eventQueueService.getQueueStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('should handle empty queue statistics', async () => {
      // Arrange
      const emptyStats = { total: 0 };
      eventQueueService.getQueueStats.mockResolvedValue(emptyStats);

      // Act
      const result = await service.getProcessingStats();

      // Assert
      expect(result).toEqual(emptyStats);
    });

    it('should propagate errors from queue service', async () => {
      // Arrange
      const error = new Error('Failed to fetch stats');
      eventQueueService.getQueueStats.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getProcessingStats()).rejects.toThrow(error);
    });
  });
});
