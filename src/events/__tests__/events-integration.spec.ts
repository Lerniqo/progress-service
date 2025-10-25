/**
 * Integration tests for the Events module
 * These tests demonstrate best practices for testing module interactions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsController } from '../events.controller';
import { EventsService } from '../events.service';
import { EventQueueService } from '../event-queue.service';
import { KafkaService } from '../../kafka/kafka.service';
import { PinoLogger } from 'nestjs-pino';
import { EventType } from '../../schemas/event-types.enum';
import {
  TestDataFactory,
  MockConfigurations,
  PerformanceTestUtils,
} from './test-utils';

describe('Events Module Integration Tests', () => {
  let module: TestingModule;
  let controller: EventsController;
  let eventsService: EventsService;
  let eventQueueService: EventQueueService;
  let logger: jest.Mocked<any>;
  let mockDocument: any;

  // Helper function to create mock request
  const createMockRequest = (userId = 'test-user-123') =>
    ({
      headers: {
        'x-user-id': userId,
      },
    }) as any;

  beforeEach(async () => {
    // Create a mock document that will be returned by the constructor
    mockDocument = {
      _id: 'mock-queue-id',
      userId: 'test-user-123',
      eventType: 'QUIZ_ATTEMPT',
      save: jest.fn().mockResolvedValue({
        _id: 'mock-queue-id',
        userId: 'test-user-123',
        eventType: 'QUIZ_ATTEMPT',
      }),
    };

    // Create comprehensive mocks
    const loggerMock = MockConfigurations.createPinoLoggerMock();

    // Create proper constructor functions for Mongoose models
    const MockEventQueueModel = jest
      .fn()
      .mockImplementation(() => mockDocument) as any;
    MockEventQueueModel.countDocuments = jest.fn();
    MockEventQueueModel.findById = jest.fn();
    MockEventQueueModel.deleteOne = jest.fn();

    const MockEventModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({}),
    }));

    // Create mock for KafkaService
    const mockKafkaService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        EventsService,
        EventQueueService,
        {
          provide: PinoLogger,
          useValue: loggerMock,
        },
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
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get<EventsService>(EventsService);
    eventQueueService = module.get<EventQueueService>(EventQueueService);
    logger = module.get(PinoLogger);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('Full Event Processing Flow', () => {
    it('should process event from controller through to queue storage', () => {
      // Arrange
      const event = TestDataFactory.createQuizAttemptEvent();
      const mockRequest = {
        headers: {
          'x-user-id': 'test-user-123',
        },
      } as any;

      // Act
      const result = controller.ingestEvent(mockRequest, event);

      // Assert - Verify full flow
      expect(result.queueId).toBeDefined();
      expect(result.queueId).toMatch(/^evt_\d+_\d+$/); // In-memory queue ID pattern
      expect(result.status).toBe('accepted');
      expect(result.message).toBe('Event has been queued for processing');

      // Verify logging at each level
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: event.eventType,
          timestamp: event.timestamp,
        }),
        'Ingesting event',
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: event.eventType,
        }),
        'Received event for processing',
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: result.queueId,
          eventType: event.eventType,
        }),
        'Event added to in-memory queue',
      );
    });

    it('should handle the complete event lifecycle with processing', async () => {
      // Arrange
      const event = TestDataFactory.createVideoWatchEvent();
      const mockQueueId = 'lifecycle-queue-456';

      // Setup queue storage
      mockDocument.save.mockResolvedValue({
        _id: mockQueueId,
        userId: 'test-user-123',
        eventType: event.eventType,
        eventData: event.eventData,
        metadata: event.metadata,
      });

      // Act - Complete lifecycle (event is automatically processed by in-memory queue)
      const mockRequest = {
        headers: {
          'x-user-id': 'test-user-123',
        },
      } as any;
      const ingestResult = await controller.ingestEvent(mockRequest, event);

      // Assert
      expect(ingestResult.queueId).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: event.eventType,
        }),
        'Event added to in-memory queue',
      );
    });
  });

  describe('Performance Integration Tests', () => {
    it('should process events within acceptable time limits', async () => {
      // Arrange
      const event = TestDataFactory.createQuizAttemptEvent();
      const performanceBenchmark =
        PerformanceTestUtils.createPerformanceBenchmark(50); // 50ms max

      mockDocument.save.mockResolvedValue({
        _id: 'perf-test-123',
      });

      // Act & Measure
      const { duration } = await PerformanceTestUtils.measureExecutionTime(
        async () => {
          return await controller.ingestEvent(createMockRequest(), event);
        },
      );

      // Assert
      performanceBenchmark.assertPerformance(duration);
    });

    it('should handle concurrent event processing efficiently', async () => {
      // Arrange
      const events = TestDataFactory.createEventBatch(10);

      // Act
      const { result: results, duration } =
        await PerformanceTestUtils.measureExecutionTime(async () => {
          return await Promise.all(
            events.map((event) =>
              controller.ingestEvent(createMockRequest(), event),
            ),
          );
        });

      // Assert
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(200); // Should handle 10 concurrent events in under 200ms
      results.forEach((result) => {
        expect(result.queueId).toMatch(/^evt_\d+_\d+$/); // Each should have a queue ID
        expect(result.status).toBe('accepted');
      });
    });
  });

  describe('Statistics Integration', () => {
    it('should provide accurate queue statistics through controller', async () => {
      // Arrange - Add some events to the queue
      const events = TestDataFactory.createEventBatch(3);
      await Promise.all(
        events.map((event) =>
          controller.ingestEvent(createMockRequest(), event),
        ),
      );

      // Act
      const stats = controller.getStats();

      // Assert - Check stats structure
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('isProcessing');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.isProcessing).toBe('boolean');
    });

    it('should handle statistics errors gracefully', () => {
      // Arrange - Mock getQueueStats to throw error
      const statsSpy = jest
        .spyOn(eventQueueService, 'getQueueStats')
        .mockImplementation(() => {
          throw new Error('Statistics service unavailable');
        });

      // Act & Assert
      expect(() => controller.getStats()).toThrow(
        'Statistics service unavailable',
      );

      statsSpy.mockRestore();
    });
  });

  describe('Event Type Specific Integration', () => {
    it('should handle quiz attempt events with complete flow', async () => {
      // Arrange
      const quizEvent = TestDataFactory.createQuizAttemptEvent({
        eventData: {
          userId: 'quiz-user-123',
          courseId: 'advanced-math',
          quizId: 'algebra-final',
          score: 92,
          completed: true,
          attemptDuration: 1800, // 30 minutes
        },
      });

      // Act
      const result = await controller.ingestEvent(
        createMockRequest('quiz-user-123'),
        quizEvent,
      );

      // Assert
      expect(result.queueId).toMatch(/^evt_\d+_\d+$/);
      expect(result.status).toBe('accepted');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.QUIZ_ATTEMPT,
        }),
        'Ingesting event',
      );
    });

    it('should handle video watch events with partial completion', async () => {
      // Arrange
      const videoEvent = TestDataFactory.createVideoWatchEvent({
        eventData: {
          userId: 'video-user-456',
          videoId: 'intro-to-physics',
          watchDuration: 180,
          totalDuration: 600,
          completed: false,
          watchPercentage: 30,
        },
      });

      // Act
      const result = await controller.ingestEvent(
        createMockRequest('video-user-456'),
        videoEvent,
      );

      // Assert
      expect(result.queueId).toMatch(/^evt_\d+_\d+$/);
      expect(result.status).toBe('accepted');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.VIDEO_WATCH,
        }),
        'Ingesting event',
      );
    });
  });

  describe('Module Configuration Integration', () => {
    it('should properly initialize all dependencies', () => {
      expect(controller).toBeDefined();
      expect(eventsService).toBeDefined();
      expect(eventQueueService).toBeDefined();
      expect(logger).toBeDefined();
    });

    it('should set correct logger contexts', () => {
      expect(logger.setContext).toHaveBeenCalledWith('EventsController');
      expect(logger.setContext).toHaveBeenCalledWith('EventsService');
      expect(logger.setContext).toHaveBeenCalledWith('EventQueueService');
    });
  });
});
