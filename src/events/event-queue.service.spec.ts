import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventQueueService } from './event-queue.service';
import { EventQueueDocument } from '../schemas/event-queue.schema';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { EventType } from '../schemas/event-types.enum';
import * as dto from './dto';

describe('EventQueueService', () => {
  let service: EventQueueService;
  let eventQueueModel: jest.Mocked<Model<EventQueueDocument>>;
  let eventModel: jest.Mocked<Model<any>>;
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
    metaData: {
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
    metadata: mockEvent.metaData,
    createdAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create constructor function that returns mockQueuedEvent
    const MockEventQueueModel = jest.fn().mockImplementation(() => mockQueuedEvent) as any;
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
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EventQueueService>(EventQueueService);
    eventQueueModel = module.get(getModelToken('EventQueue'));
    eventModel = module.get(getModelToken('Event'));
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
    it('should successfully enqueue an event', async () => {
      // Arrange
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'queue-id-123',
      });

      // Act
      const result = await service.enqueueEvent(mockEvent);

      // Assert
      expect(result).toBe('queue-id-123');
      expect(mockQueuedEvent.save).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventId: 'queue-id-123',
          eventType: mockEvent.eventType,
          userId: 'user123',
        },
        'Event added to queue'
      );
    });

    it('should extract userId from eventData.userId', async () => {
      // Arrange
      const eventWithUserId = {
        ...mockEvent,
        eventData: { userId: 'extracted-user-123', someData: 'value' },
      };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'queue-id-456',
        userId: 'extracted-user-123',
      });

      // Act
      await service.enqueueEvent(eventWithUserId);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'extracted-user-123',
        }),
        'Event added to queue'
      );
    });

    it('should extract userId from eventData.user.id', async () => {
      // Arrange
      const eventWithNestedUserId = {
        ...mockEvent,
        eventData: { user: { id: 'nested-user-456' }, someData: 'value' },
      };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'queue-id-789',
        userId: 'nested-user-456',
      });

      // Act
      await service.enqueueEvent(eventWithNestedUserId);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'nested-user-456',
        }),
        'Event added to queue'
      );
    });

    it('should use "unknown" as userId when not found in eventData', async () => {
      // Arrange
      const eventWithoutUserId = {
        ...mockEvent,
        eventData: { someData: 'value' },
      };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'queue-id-unknown',
        userId: 'unknown',
      });

      // Act
      await service.enqueueEvent(eventWithoutUserId);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'unknown',
        }),
        'Event added to queue'
      );
    });

    it('should handle database save errors', async () => {
      // Arrange
      const error = new Error('Database save failed');
      mockQueuedEvent.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.enqueueEvent(mockEvent)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: error.message,
          eventType: mockEvent.eventType,
        },
        'Failed to enqueue event'
      );
    });

    it('should handle different event types', async () => {
      // Arrange
      const videoWatchEvent: dto.Event = {
        ...mockEvent,
        eventType: EventType.VIDEO_WATCH,
      };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'video-queue-123',
        eventType: EventType.VIDEO_WATCH,
      });

      // Act
      const result = await service.enqueueEvent(videoWatchEvent);

      // Assert
      expect(result).toBe('video-queue-123');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.VIDEO_WATCH,
        }),
        'Event added to queue'
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      // Arrange
      eventQueueModel.countDocuments.mockResolvedValue(25);

      // Act
      const result = await service.getQueueStats();

      // Assert
      expect(result).toEqual({ total: 25 });
      expect(eventQueueModel.countDocuments).toHaveBeenCalledWith();
    });

    it('should return zero when queue is empty', async () => {
      // Arrange
      eventQueueModel.countDocuments.mockResolvedValue(0);

      // Act
      const result = await service.getQueueStats();

      // Assert
      expect(result).toEqual({ total: 0 });
    });

    it('should handle database query errors', async () => {
      // Arrange
      const error = new Error('Database query failed');
      eventQueueModel.countDocuments.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getQueueStats()).rejects.toThrow(error);
    });
  });

  describe('processEvent', () => {
    const mockEventId = 'event-id-123';

    it('should successfully process a queued event', async () => {
      // Arrange
      const mockFoundEvent = {
        _id: mockEventId,
        eventType: EventType.QUIZ_ATTEMPT,
        eventData: mockEvent.eventData,
        metadata: mockEvent.metaData,
        userId: 'user123',
      };

      eventQueueModel.findById.mockResolvedValue(mockFoundEvent);
      const mockSavedDocument = { save: jest.fn().mockResolvedValue({}) };
      (eventModel as any).mockImplementation(() => mockSavedDocument);
      eventQueueModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Act
      await service.processEvent(mockEventId);

      // Assert
      expect(eventQueueModel.findById).toHaveBeenCalledWith(mockEventId);
      expect(mockSavedDocument.save).toHaveBeenCalled();
      expect(eventQueueModel.deleteOne).toHaveBeenCalledWith({ _id: mockEventId });
      expect(logger.info).toHaveBeenCalledWith(
        {
          eventId: mockEventId,
          eventType: EventType.QUIZ_ATTEMPT,
          userId: 'user123',
        },
        'Event processed successfully'
      );
    });

    it('should throw error when event not found', async () => {
      // Arrange
      eventQueueModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.processEvent(mockEventId)).rejects.toThrow(
        `Event not found: ${mockEventId}`
      );
    });

    it('should handle event document save errors', async () => {
      // Arrange
      const mockFoundEvent = {
        _id: mockEventId,
        eventType: EventType.QUIZ_ATTEMPT,
        eventData: mockEvent.eventData,
        metadata: mockEvent.metaData,
        userId: 'user123',
      };

      eventQueueModel.findById.mockResolvedValue(mockFoundEvent);
      const saveError = new Error('Document save failed');
      const mockSavedDocument = { save: jest.fn().mockRejectedValue(saveError) };
      (eventModel as any).mockImplementation(() => mockSavedDocument);

      // Act & Assert
      await expect(service.processEvent(mockEventId)).rejects.toThrow(saveError);
      expect(logger.error).toHaveBeenCalledWith(
        {
          eventId: mockEventId,
          error: saveError.message,
        },
        'Error processing event'
      );
    });

    it('should handle queue deletion errors', async () => {
      // Arrange
      const mockFoundEvent = {
        _id: mockEventId,
        eventType: EventType.QUIZ_ATTEMPT,
        eventData: mockEvent.eventData,
        metadata: mockEvent.metaData,
        userId: 'user123',
      };

      eventQueueModel.findById.mockResolvedValue(mockFoundEvent);
      const mockSavedDocument = { save: jest.fn().mockResolvedValue({}) };
      (eventModel as any).mockImplementation(() => mockSavedDocument);
      
      const deleteError = new Error('Queue deletion failed');
      eventQueueModel.deleteOne.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(service.processEvent(mockEventId)).rejects.toThrow(deleteError);
      expect(logger.error).toHaveBeenCalledWith(
        {
          eventId: mockEventId,
          error: deleteError.message,
        },
        'Error processing event'
      );
    });

    it('should create event document with correct structure', async () => {
      // Arrange
      const mockFoundEvent = {
        _id: mockEventId,
        eventType: EventType.AI_TUTOR_INTERACTION,
        eventData: { userId: 'user456', interaction: 'question' },
        metadata: { sessionId: 'session456' },
        userId: 'user456',
      };

      eventQueueModel.findById.mockResolvedValue(mockFoundEvent);
      const mockSavedDocument = { save: jest.fn().mockResolvedValue({}) };
      (eventModel as any).mockImplementation((data) => {
        expect(data).toEqual({
          eventType: EventType.AI_TUTOR_INTERACTION,
          eventData: { userId: 'user456', interaction: 'question' },
          metadata: { sessionId: 'session456' },
          userId: 'user456',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        return mockSavedDocument;
      });
      eventQueueModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Act
      await service.processEvent(mockEventId);

      // Assert
      expect(mockSavedDocument.save).toHaveBeenCalled();
    });
  });

  describe('extractUserId (private method testing through public methods)', () => {
    it('should extract userId from direct userId property', async () => {
      // Arrange
      const eventData = { userId: 'direct-user-123', otherData: 'value' };
      const event = { ...mockEvent, eventData };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'test-id',
        userId: 'direct-user-123',
      });

      // Act
      await service.enqueueEvent(event);

      // Assert - verify the extracted userId is used in logging
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'direct-user-123',
        }),
        'Event added to queue'
      );
    });

    it('should extract userId from nested user.id property', async () => {
      // Arrange
      const eventData = { user: { id: 'nested-user-456' }, otherData: 'value' };
      const event = { ...mockEvent, eventData };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'test-id',
        userId: 'nested-user-456',
      });

      // Act
      await service.enqueueEvent(event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'nested-user-456',
        }),
        'Event added to queue'
      );
    });

    it('should return "unknown" when no userId is found', async () => {
      // Arrange
      const eventData = { someData: 'value', otherData: 'value2' };
      const event = { ...mockEvent, eventData };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'test-id',
        userId: 'unknown',
      });

      // Act
      await service.enqueueEvent(event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'unknown',
        }),
        'Event added to queue'
      );
    });

    it('should prioritize direct userId over nested user.id', async () => {
      // Arrange
      const eventData = { 
        userId: 'direct-user-123', 
        user: { id: 'nested-user-456' } 
      };
      const event = { ...mockEvent, eventData };
      mockQueuedEvent.save.mockResolvedValue({
        ...mockQueuedEvent,
        _id: 'test-id',
        userId: 'direct-user-123',
      });

      // Act
      await service.enqueueEvent(event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'direct-user-123',
        }),
        'Event added to queue'
      );
    });
  });
});