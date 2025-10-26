import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { KafkaService } from '../kafka/kafka.service';
import { EventsService } from './events.service';
import { EventType } from '../schemas/event-types.enum';
import * as dto from './dto';

interface DualMatchQuestionMessage {
  userId: string;
  isCorrect: boolean;
  questionId: string;
  timestamp: number;
  answer: string;
  concept: string[];
}

@Injectable()
export class EventsKafkaConsumerService implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly kafkaService: KafkaService,
    private readonly eventsService: EventsService,
  ) {
    this.logger.setContext(EventsKafkaConsumerService.name);
  }

  async onModuleInit() {
    await this.startConsumers();
  }

  private async startConsumers() {
    try {
      await this.consumeDualMatchQuestions();
      this.logger.info('Kafka consumers started successfully');
    } catch (error) {
      this.logger.error('Failed to start Kafka consumers', error);
      throw error;
    }
  }

  private async consumeDualMatchQuestions() {
    const topic = 'dualmatch:question';

    await this.kafkaService.consumeMessages(topic, async (payload) => {
      const { message } = payload;

      try {
        if (!message.value) {
          this.logger.warn('Received message with no value');
          return;
        }

        const messageValue = JSON.parse(
          message.value.toString(),
        ) as DualMatchQuestionMessage;

        this.logger.info(
          {
            userId: messageValue.userId,
            questionId: messageValue.questionId,
            isCorrect: messageValue.isCorrect,
          },
          'Processing dualmatch:question message',
        );

        // Transform Kafka message to Event DTO
        const event: dto.Event = {
          eventType: EventType.QUESTION_ATTEMPT,
          eventData: {
            createdAt: new Date(messageValue.timestamp),
            updatedAt: new Date(messageValue.timestamp),
            questionId: messageValue.questionId,
            answer: messageValue.answer,
            isCorrect: messageValue.isCorrect,
            concept: messageValue.concept,
          },
          timestamp: new Date(messageValue.timestamp),
        };

        // Process the event through EventsService
        const result = this.eventsService.processEvent(
          event,
          messageValue.userId,
        );

        this.logger.info(
          {
            queueId: result.queueId,
            userId: messageValue.userId,
            questionId: messageValue.questionId,
          },
          'Successfully processed dualmatch:question event',
        );

        // Explicit return for async function
        return Promise.resolve();
      } catch (error) {
        this.logger.error(
          {
            error: (error as Error).message,
            stack: (error as Error).stack,
            topic,
            partition: payload.partition,
            offset: message.offset,
          },
          'Error processing dualmatch:question message',
        );
        // Depending on your error handling strategy, you might want to:
        // - throw to stop consuming and retry
        // - continue processing other messages
        // - send to dead letter queue
        return Promise.resolve();
      }
    });

    this.logger.info(`Subscribed to topic: ${topic}`);
  }
}
