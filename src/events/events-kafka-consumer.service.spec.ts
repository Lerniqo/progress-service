import { Test, TestingModule } from '@nestjs/testing';
import { EventsKafkaConsumerService } from './events-kafka-consumer.service';
import { KafkaService } from '../kafka/kafka.service';
import { EventsService } from './events.service';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { EventType } from '../schemas/event-types.enum';

describe('EventsKafkaConsumerService', () => {
  let service: EventsKafkaConsumerService;

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockKafkaService = {
    consumeMessages: jest.fn(),
  };

  const mockEventsService = {
    processEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsKafkaConsumerService,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<EventsKafkaConsumerService>(
      EventsKafkaConsumerService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should start Kafka consumers on module initialization', async () => {
      mockKafkaService.consumeMessages.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockKafkaService.consumeMessages).toHaveBeenCalledWith(
        'dualmatch:question',
        expect.any(Function),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Kafka consumers started successfully',
      );
    });

    it('should handle errors during consumer startup', async () => {
      const error = new Error('Connection failed');
      mockKafkaService.consumeMessages.mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start Kafka consumers',
        error,
      );
    });
  });

  describe('consumeDualMatchQuestions', () => {
    let messageHandler: (payload: any) => Promise<void>;

    beforeEach(async () => {
      mockKafkaService.consumeMessages.mockImplementation((topic, handler) => {
        messageHandler = handler;
        return Promise.resolve();
      });
      await service.onModuleInit();
    });

    it('should process valid dualmatch:question messages', async () => {
      const mockMessage = {
        userId: 'user123',
        isCorrect: true,
        questionId: 'q123',
        timestamp: Date.now(),
        answer: 'option A',
        concept: ['math', 'algebra'],
      };

      const mockResult = {
        queueId: 'queue123',
        status: 'accepted',
        message: 'Event has been queued for processing',
        timestamp: new Date(),
      };

      mockEventsService.processEvent.mockReturnValue(mockResult);

      const payload = {
        topic: 'dualmatch:question',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(mockMessage)),
          offset: '0',
        },
      };

      await messageHandler(payload);

      expect(mockEventsService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.QUESTION_ATTEMPT,
          eventData: expect.objectContaining({
            questionId: mockMessage.questionId,
            answer: mockMessage.answer,
            isCorrect: mockMessage.isCorrect,
            concept: mockMessage.concept,
          }),
        }),
        mockMessage.userId,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          queueId: mockResult.queueId,
          userId: mockMessage.userId,
          questionId: mockMessage.questionId,
        }),
        'Successfully processed dualmatch:question event',
      );
    });

    it('should handle messages with no value', async () => {
      const payload = {
        topic: 'dualmatch:question',
        partition: 0,
        message: {
          value: null,
          offset: '0',
        },
      };

      await messageHandler(payload);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Received message with no value',
      );
      expect(mockEventsService.processEvent).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in message', async () => {
      const payload = {
        topic: 'dualmatch:question',
        partition: 0,
        message: {
          value: Buffer.from('invalid json'),
          offset: '0',
        },
      };

      await messageHandler(payload);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          topic: 'dualmatch:question',
        }),
        'Error processing dualmatch:question message',
      );
    });

    it('should handle errors during event processing', async () => {
      const mockMessage = {
        userId: 'user123',
        isCorrect: false,
        questionId: 'q123',
        timestamp: Date.now(),
        answer: 'option B',
        concept: ['physics'],
      };

      const error = new Error('Processing failed');
      mockEventsService.processEvent.mockImplementation(() => {
        throw error;
      });

      const payload = {
        topic: 'dualmatch:question',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(mockMessage)),
          offset: '0',
        },
      };

      await messageHandler(payload);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Processing failed',
          topic: 'dualmatch:question',
        }),
        'Error processing dualmatch:question message',
      );
    });
  });
});
