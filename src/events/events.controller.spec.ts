import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PinoLogger } from 'nestjs-pino';
import { EventType } from '../schemas/event-types.enum';
import { Event } from './dto';
import { Request } from 'express';

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
    metadata: {
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

  const mockRequest: Partial<Request> = {
    headers: {
      'x-user-id': 'user123',
    },
  };

  beforeEach(async () => {
    const mockEventsService = {
      processEvent: jest.fn(),
      getProcessingStats: jest.fn(),
    } as any;

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

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
      const mockRequest = {
        headers: {
          'x-user-id': 'user123',
        },
      } as any;
      eventsService.processEvent.mockReturnValue(mockProcessResponse);

      // Act
      const result = await controller.ingestEvent(mockRequest, mockEvent);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(
        mockEvent,
        'user123',
      );
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: mockEvent.eventType,
          timestamp: mockEvent.timestamp,
        },
        'Ingesting event',
      );
      expect(result).toEqual(mockProcessResponse);
    });

    it('should add timestamp when not provided', () => {
      // Arrange
      const eventWithoutTimestamp = { ...mockEvent };
      delete eventWithoutTimestamp.timestamp;
      const mockRequest = {
        headers: {
          'x-user-id': 'user123',
        },
      } as any;
      eventsService.processEvent.mockReturnValue(mockProcessResponse);
      const beforeTime = new Date();

      // Act
      const result = controller.ingestEvent(mockRequest, eventWithoutTimestamp);

      // Assert
      const afterTime = new Date();
      expect(eventWithoutTimestamp.timestamp).toBeInstanceOf(Date);
      expect(eventWithoutTimestamp.timestamp!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(eventWithoutTimestamp.timestamp!.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
      expect(eventsService.processEvent).toHaveBeenCalledWith(
        eventWithoutTimestamp,
        'user123',
      );
      expect(result).toEqual(mockProcessResponse);
    });

    it('should handle different event types', () => {
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
      const mockRequest = {
        headers: {
          'x-user-id': 'user123',
        },
      } as any;
      eventsService.processEvent.mockReturnValue(videoResponse);

      // Act
      const result = controller.ingestEvent(mockRequest, videoWatchEvent);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(
        videoWatchEvent,
        'user123',
      );
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: EventType.VIDEO_WATCH,
          timestamp: videoWatchEvent.timestamp,
        },
        'Ingesting event',
      );
      expect(result).toEqual(videoResponse);
    });

    it('should handle events without metadata', () => {
      // Arrange
      const eventWithoutMetadata: Event = {
        eventType: EventType.QUIZ_ATTEMPT,
        eventData: mockEvent.eventData,
        timestamp: new Date(),
      };
      eventsService.processEvent.mockReturnValue(mockProcessResponse);

      // Act
      const result = controller.ingestEvent(
        mockRequest as Request,
        eventWithoutMetadata,
      );

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(
        eventWithoutMetadata,
        'user123',
      );
      expect(result).toEqual(mockProcessResponse);
    });

    it('should throw error when user ID is not provided', () => {
      // Arrange
      const mockRequestWithoutUserId: Partial<Request> = {
        headers: {},
      };

      // Act & Assert
      expect(() =>
        controller.ingestEvent(mockRequestWithoutUserId as Request, mockEvent),
      ).toThrow('User ID is required');
    });

    it('should propagate service errors', () => {
      // Arrange
      const error = new Error('Service processing failed');
      eventsService.processEvent.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() =>
        controller.ingestEvent(mockRequest as Request, mockEvent),
      ).toThrow(error);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventType: mockEvent.eventType,
          timestamp: mockEvent.timestamp,
        },
        'Ingesting event',
      );
    });

    it('should preserve all event properties when adding timestamp', () => {
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
        metadata: {
          customMeta: 'meta-value',
        },
      };
      eventsService.processEvent.mockReturnValue(mockProcessResponse);

      // Act
      controller.ingestEvent(mockRequest as Request, eventWithoutTimestamp);

      // Assert
      expect(eventsService.processEvent).toHaveBeenCalledWith(
        {
          ...eventWithoutTimestamp,
          timestamp: expect.any(Date),
        },
        'user123',
      );
    });
  });

  describe('getStats', () => {
    it('should return processing statistics', () => {
      // Arrange
      const mockStats = {
        total: 100,
        isProcessing: true,
      };
      eventsService.getProcessingStats.mockReturnValue(mockStats);

      // Act
      const result = controller.getStats();

      // Assert
      expect(eventsService.getProcessingStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('should handle empty statistics', () => {
      // Arrange
      const emptyStats = {
        total: 0,
        isProcessing: false,
      };
      eventsService.getProcessingStats.mockReturnValue(emptyStats);

      // Act
      const result = controller.getStats();

      // Assert
      expect(result).toEqual(emptyStats);
    });

    it('should propagate service errors for stats', () => {
      // Arrange
      const error = new Error('Stats service error');
      eventsService.getProcessingStats.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => controller.getStats()).toThrow(error);
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid successive event ingestion', () => {
      // Arrange
      const events = [
        {
          ...mockEvent,
          eventData: { ...mockEvent.eventData, userId: 'user1' },
        },
        {
          ...mockEvent,
          eventData: { ...mockEvent.eventData, userId: 'user2' },
        },
        {
          ...mockEvent,
          eventData: { ...mockEvent.eventData, userId: 'user3' },
        },
      ];

      eventsService.processEvent
        .mockReturnValueOnce({ ...mockProcessResponse, queueId: 'queue1' })
        .mockReturnValueOnce({ ...mockProcessResponse, queueId: 'queue2' })
        .mockReturnValueOnce({ ...mockProcessResponse, queueId: 'queue3' });

      // Act
      const results = events.map((event) =>
        controller.ingestEvent(mockRequest as Request, event),
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].queueId).toBe('queue1');
      expect(results[1].queueId).toBe('queue2');
      expect(results[2].queueId).toBe('queue3');
      expect(eventsService.processEvent).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure scenarios', () => {
      // Arrange
      const successEvent = {
        ...mockEvent,
        eventData: { ...mockEvent.eventData, userId: 'success-user' },
      };
      const failureEvent = {
        ...mockEvent,
        eventData: { ...mockEvent.eventData, userId: 'failure-user' },
      };

      eventsService.processEvent
        .mockReturnValueOnce(mockProcessResponse)
        .mockImplementationOnce(() => {
          throw new Error('Processing failed');
        });

      // Act & Assert
      const successResult = controller.ingestEvent(
        mockRequest as Request,
        successEvent,
      );
      expect(successResult).toEqual(mockProcessResponse);

      expect(() =>
        controller.ingestEvent(mockRequest as Request, failureEvent),
      ).toThrow('Processing failed');
    });
  });
});
