/**
 * Integration tests for the Events module
 * These tests demonstrate best practices for testing module interactions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsController } from '../events.controller';
import { EventsService } from '../events.service';
import { EventQueueService } from '../event-queue.service';
import { PinoLogger } from 'nestjs-pino';
import { EventType } from '../../schemas/event-types.enum';
import {
  TestDataFactory,
  MockResponseFactory,
  MockConfigurations,
  TestAssertions,
  PerformanceTestUtils,
} from './test-utils';

describe('Events Module Integration Tests', () => {
  let module: TestingModule;
  let controller: EventsController;
  let eventsService: EventsService;
  let eventQueueService: EventQueueService;
  let logger: jest.Mocked<any>;
  let eventQueueModel: jest.Mocked<any>;
  let eventModel: jest.Mocked<any>;
  let mockDocument: any;

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
    const MockEventQueueModel = jest.fn().mockImplementation(() => mockDocument) as any;
    MockEventQueueModel.countDocuments = jest.fn();
    MockEventQueueModel.findById = jest.fn();
    MockEventQueueModel.deleteOne = jest.fn();

    const MockEventModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({}),
    }));

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
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get<EventsService>(EventsService);
    eventQueueService = module.get<EventQueueService>(EventQueueService);
    logger = module.get(PinoLogger);
    eventQueueModel = module.get(getModelToken('EventQueue'));
    eventModel = module.get(getModelToken('Event'));
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('Full Event Processing Flow', () => {
    it('should process event from controller through to queue storage', async () => {
      // Arrange
      const event = TestDataFactory.createQuizAttemptEvent();
      const mockQueueId = 'integration-queue-123';
      
      // Mock the save operation to return a document with _id
      mockDocument.save.mockResolvedValue({
        _id: mockQueueId,
        userId: 'test-user-123',
        eventType: event.eventType,
      });

      // Act
      const result = await controller.ingestEvent(event);

      // Assert - Verify full flow
      expect(result.queueId).toBe(mockQueueId);
      TestAssertions.assertEventResponse(result, mockQueueId);
      
      // Verify logging at each level
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: event.eventType,
          timestamp: event.timestamp,
        }),
        'Ingesting event'
      );
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: event.eventType,
        }),
        'Received event for processing'
      );
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          queueId: mockQueueId,
          eventType: event.eventType,
        }),
        'Event added to processing queue'
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
        metadata: event.metaData,
      });

      // Setup event processing
      eventQueueModel.findById.mockResolvedValue({
        _id: mockQueueId,
        eventType: event.eventType,
        eventData: event.eventData,
        metadata: event.metaData,
        userId: 'test-user-123',
      });

      const mockEventDocument = { save: jest.fn().mockResolvedValue({}) };
      eventModel.mockImplementation(() => mockEventDocument);
      eventQueueModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Act - Complete lifecycle
      const ingestResult = await controller.ingestEvent(event);
      await eventQueueService.processEvent(ingestResult.queueId);

      // Assert
      expect(ingestResult.queueId).toBe(mockQueueId);
      expect(eventQueueModel.findById).toHaveBeenCalledWith(mockQueueId);
      expect(mockEventDocument.save).toHaveBeenCalled();
      expect(eventQueueModel.deleteOne).toHaveBeenCalledWith({ _id: mockQueueId });
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate errors through the entire stack', async () => {
      // Arrange
      const event = TestDataFactory.createAITutorInteractionEvent();
      const dbError = new Error('Database connection lost');
      mockDocument.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.ingestEvent(event)).rejects.toThrow(dbError);
      
      // Verify error logging at service level
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: dbError.message,
          eventType: event.eventType,
        }),
        'Failed to enqueue event'
      );
    });

    it('should handle service layer errors gracefully', async () => {
      // Arrange
      const event = TestDataFactory.createMinimalEvent();
      
      // Mock service to throw error
      jest.spyOn(eventQueueService, 'enqueueEvent').mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act & Assert
      await expect(controller.ingestEvent(event)).rejects.toThrow('Service unavailable');
      
      // Verify controller still logs the attempt
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: event.eventType,
        }),
        'Ingesting event'
      );
    });
  });

  describe('Performance Integration Tests', () => {
    it('should process events within acceptable time limits', async () => {
      // Arrange
      const event = TestDataFactory.createQuizAttemptEvent();
      const performanceBenchmark = PerformanceTestUtils.createPerformanceBenchmark(50); // 50ms max
      
      mockDocument.save.mockResolvedValue({
        _id: 'perf-test-123',
      });

      // Act & Measure
      const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
        return await controller.ingestEvent(event);
      });

      // Assert
      performanceBenchmark.assertPerformance(duration);
    });

    it('should handle concurrent event processing efficiently', async () => {
      // Arrange
      const events = TestDataFactory.createEventBatch(10);
      const mockQueueIds = events.map((_, index) => `concurrent-${index}`);
      
      // Setup mocks for concurrent processing
      mockDocument.save
        .mockImplementation(async () => ({
          _id: mockQueueIds[mockDocument.save.mock.calls.length - 1],
        }));

      // Act
      const { result: results, duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
        return await Promise.all(events.map(event => controller.ingestEvent(event)));
      });

      // Assert
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(200); // Should handle 10 concurrent events in under 200ms
      expect(mockDocument.save).toHaveBeenCalledTimes(10);
    });
  });

  describe('Statistics Integration', () => {
    it('should provide accurate queue statistics through controller', async () => {
      // Arrange
      const expectedStats = MockResponseFactory.createQueueStatsResponse({ total: 25 });
      eventQueueModel.countDocuments.mockResolvedValue(25);

      // Act
      const stats = await controller.getStats();

      // Assert
      TestAssertions.assertQueueStats(stats, 25);
      expect(eventQueueModel.countDocuments).toHaveBeenCalledWith();
    });

    it('should handle statistics errors gracefully', async () => {
      // Arrange
      const statsError = new Error('Statistics service unavailable');
      eventQueueModel.countDocuments.mockRejectedValue(statsError);

      // Act & Assert
      await expect(controller.getStats()).rejects.toThrow(statsError);
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

      mockDocument.save.mockResolvedValue({
        _id: 'quiz-queue-123',
        userId: 'quiz-user-123',
      });

      // Act
      const result = await controller.ingestEvent(quizEvent);

      // Assert
      expect(result.queueId).toBe('quiz-queue-123');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.QUIZ_ATTEMPT,
        }),
        'Ingesting event'
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

      mockDocument.save.mockResolvedValue({
        _id: 'video-queue-456',
        userId: 'video-user-456',
      });

      // Act
      const result = await controller.ingestEvent(videoEvent);

      // Assert
      expect(result.queueId).toBe('video-queue-456');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.VIDEO_WATCH,
        }),
        'Ingesting event'
      );
    });

    it('should handle AI tutor interactions with confidence scoring', async () => {
      // Arrange
      const aiEvent = TestDataFactory.createAITutorInteractionEvent({
        eventData: {
          userId: 'ai-user-789',
          interactionType: 'explanation',
          query: 'Explain quantum entanglement',
          response: 'Quantum entanglement is a physical phenomenon...',
          confidence: 0.87,
          responseTime: 2500,
        },
      });

      mockDocument.save.mockResolvedValue({
        _id: 'ai-queue-789',
        userId: 'ai-user-789',
      });

      // Act
      const result = await controller.ingestEvent(aiEvent);

      // Assert
      expect(result.queueId).toBe('ai-queue-789');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.AI_TUTOR_INTERACTION,
        }),
        'Ingesting event'
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