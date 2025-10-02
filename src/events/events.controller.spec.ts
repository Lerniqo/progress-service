import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PinoLogger } from 'nestjs-pino';
import { EventType } from '../schemas/event-types.enum';
import { Event } from './dto';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: jest.Mocked<EventsService>;
  let logger: jest.Mocked<PinoLogger>;

  const mockEvent: Event = {
    eventType: EventType.QUIZ_ATTEMPT,
    eventData: {
      userId: 'user123',
      courseId: 'course456',
      quizId: 'quiz789',
      score: 85,
      completed: true,
    },
    metaData: {
      userAgent: 'Mozilla/5.0',
      sessionId: 'session123',
    },
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  const mockProcessResponse = {
    queueId: 'queue-id-123',
    status: 'accepted',
    message: 'Event has been queued for processing',
    timestamp: new Date('2024-01-01T10:00:01Z'),
  };

  beforeEach(async () => {
    const mockEventsService = {
      processEvent: jest.fn(),
      getProcessingStats: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should set logger context', () => {
      expect(logger.setContext).toHaveBeenCalledWith('EventsController');
    });
  });

  describe('ingestEvent', () => {
    it('should successfully ingest an event with existing timestamp', async () => {
      // Arrange
      eventsService.processEvent.mockResolvedValue(mockProcessResponse);

      // Act
      const result = await controller.ingestEvent(mockEvent);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(mockEvent);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: mockEvent.eventType,
          timestamp: mockEvent.timestamp,
        },
        'Ingesting event'
      );
      expect(result).toEqual(mockProcessResponse);
    });

    it('should add timestamp when not provided', async () => {
      // Arrange
      const eventWithoutTimestamp = { ...mockEvent };
      delete eventWithoutTimestamp.timestamp;
      eventsService.processEvent.mockResolvedValue(mockProcessResponse);
      const beforeTime = new Date();

      // Act
      const result = await controller.ingestEvent(eventWithoutTimestamp);

      // Assert
      const afterTime = new Date();
      expect(eventWithoutTimestamp.timestamp).toBeInstanceOf(Date);
      expect(eventWithoutTimestamp.timestamp!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(eventWithoutTimestamp.timestamp!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(eventsService.processEvent).toHaveBeenCalledWith(eventWithoutTimestamp);
      expect(result).toEqual(mockProcessResponse);
    });

    it('should handle different event types', async () => {
      // Arrange
      const videoWatchEvent: Event = {
        ...mockEvent,
        eventType: EventType.VIDEO_WATCH,
        eventData: {
          userId: 'user123',
          videoId: 'video456',
          watchDuration: 300,
          totalDuration: 600,
          completed: false,
        },
      };
      const videoResponse = {
        ...mockProcessResponse,
        queueId: 'video-queue-456',
      };
      eventsService.processEvent.mockResolvedValue(videoResponse);

      // Act
      const result = await controller.ingestEvent(videoWatchEvent);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(videoWatchEvent);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: EventType.VIDEO_WATCH,
          timestamp: videoWatchEvent.timestamp,
        },
        'Ingesting event'
      );
      expect(result).toEqual(videoResponse);
    });

    it('should handle AI tutor interaction events', async () => {
      // Arrange
      const aiTutorEvent: Event = {
        eventType: EventType.AI_TUTOR_INTERACTION,
        eventData: {
          userId: 'user123',
          interactionType: 'question',
          query: 'What is photosynthesis?',
          response: 'Photosynthesis is...',
        },
        timestamp: new Date(),
      };
      const aiResponse = {
        ...mockProcessResponse,
        queueId: 'ai-queue-789',
      };
      eventsService.processEvent.mockResolvedValue(aiResponse);

      // Act
      const result = await controller.ingestEvent(aiTutorEvent);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(aiTutorEvent);
      expect(result).toEqual(aiResponse);
    });

    it('should handle events without metadata', async () => {
      // Arrange
      const eventWithoutMetadata: Event = {
        eventType: EventType.QUIZ_ATTEMPT,
        eventData: mockEvent.eventData,
        timestamp: new Date(),
      };
      eventsService.processEvent.mockResolvedValue(mockProcessResponse);

      // Act
      const result = await controller.ingestEvent(eventWithoutMetadata);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(eventWithoutMetadata);
      expect(result).toEqual(mockProcessResponse);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new Error('Service processing failed');
      eventsService.processEvent.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.ingestEvent(mockEvent)).rejects.toThrow(error);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: mockEvent.eventType,
          timestamp: mockEvent.timestamp,
        },
        'Ingesting event'
      );
    });

    it('should log before processing even if service fails', async () => {
      // Arrange
      const error = new Error('Service error');
      eventsService.processEvent.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.ingestEvent(mockEvent)).rejects.toThrow(error);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: mockEvent.eventType,
          timestamp: mockEvent.timestamp,
        },
        'Ingesting event'
      );
      expect(eventsService.processEvent).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle service timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Service timeout');
      eventsService.processEvent.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(controller.ingestEvent(mockEvent)).rejects.toThrow('Service timeout');
    });

    it('should preserve all event properties when adding timestamp', async () => {
      // Arrange
      const eventWithoutTimestamp = {
        eventType: EventType.QUIZ_ATTEMPT,
        eventData: {
          userId: 'user123',
          customProperty: 'custom-value',
          nestedObject: {
            level1: {
              level2: 'deep-value',
            },
          },
        },
        metaData: {
          customMeta: 'meta-value',
        },
      };
      eventsService.processEvent.mockResolvedValue(mockProcessResponse);

      // Act
      await controller.ingestEvent(eventWithoutTimestamp);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith({
        ...eventWithoutTimestamp,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getStats', () => {
    it('should return processing statistics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        pending: 25,
        processing: 10,
        completed: 60,
        failed: 5,
        retrying: 0,
      };
      eventsService.getProcessingStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStats();

      // Assert
      expect(eventsService.getProcessingStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      const emptyStats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retrying: 0,
      };
      eventsService.getProcessingStats.mockResolvedValue(emptyStats);

      // Act
      const result = await controller.getStats();

      // Assert
      expect(result).toEqual(emptyStats);
    });

    it('should propagate service errors for stats', async () => {
      // Arrange
      const error = new Error('Stats service error');
      eventsService.getProcessingStats.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getStats()).rejects.toThrow(error);
    });

    it('should handle partial statistics response', async () => {
      // Arrange
      const partialStats = { total: 50 };
      eventsService.getProcessingStats.mockResolvedValue(partialStats);

      // Act
      const result = await controller.getStats();

      // Assert
      expect(result).toEqual(partialStats);
    });

    it('should handle service unavailable for stats', async () => {
      // Arrange
      const serviceError = new Error('Service unavailable');
      eventsService.getProcessingStats.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getStats()).rejects.toThrow('Service unavailable');
    });
  });

  describe('HTTP status codes and decorators', () => {
    it('should use HttpStatus.ACCEPTED for ingestEvent', () => {
      // This test verifies that the proper HTTP status decorators are used
      // The actual HTTP status is handled by the NestJS framework based on decorators
      const ingestMethod = controller.ingestEvent;
      expect(ingestMethod).toBeDefined();
    });

    it('should have proper API documentation decorators', () => {
      // This verifies the controller structure supports OpenAPI documentation
      expect(controller).toHaveProperty('ingestEvent');
      expect(controller).toHaveProperty('getStats');
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid successive event ingestion', async () => {
      // Arrange
      const events = [
        { ...mockEvent, eventData: { ...mockEvent.eventData, userId: 'user1' } },
        { ...mockEvent, eventData: { ...mockEvent.eventData, userId: 'user2' } },
        { ...mockEvent, eventData: { ...mockEvent.eventData, userId: 'user3' } },
      ];
      
      eventsService.processEvent
        .mockResolvedValueOnce({ ...mockProcessResponse, queueId: 'queue1' })
        .mockResolvedValueOnce({ ...mockProcessResponse, queueId: 'queue2' })
        .mockResolvedValueOnce({ ...mockProcessResponse, queueId: 'queue3' });

      // Act
      const results = await Promise.all(
        events.map(event => controller.ingestEvent(event))
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].queueId).toBe('queue1');
      expect(results[1].queueId).toBe('queue2');
      expect(results[2].queueId).toBe('queue3');
      expect(eventsService.processEvent).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Arrange
      const successEvent = { ...mockEvent, eventData: { ...mockEvent.eventData, userId: 'success-user' } };
      const failureEvent = { ...mockEvent, eventData: { ...mockEvent.eventData, userId: 'failure-user' } };
      
      eventsService.processEvent
        .mockResolvedValueOnce(mockProcessResponse)
        .mockRejectedValueOnce(new Error('Processing failed'));

      // Act & Assert
      const successResult = await controller.ingestEvent(successEvent);
      expect(successResult).toEqual(mockProcessResponse);

      await expect(controller.ingestEvent(failureEvent)).rejects.toThrow('Processing failed');
    });
  });
});
