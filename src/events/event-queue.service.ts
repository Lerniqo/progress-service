/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { EventQueueDocument } from '../schemas/event-queue.schema';
import { KafkaService } from '../kafka/kafka.service';
import * as dto from './dto';
import { Event } from '../schemas/index.js';

interface QueuedEvent {
  id: string;
  event: Event;
  timestamp: Date;
  retryCount: number;
}

@Injectable()
export class EventQueueService implements OnModuleInit, OnModuleDestroy {
  private inMemoryQueue: QueuedEvent[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private eventCounter = 0;
  private readonly PROCESSING_INTERVAL_MS = 100; // Process every 100ms
  private readonly BATCH_SIZE = 10; // Process up to 10 events per batch
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectModel('EventQueue')
    private readonly eventQueueModel: Model<EventQueueDocument>,
    @InjectModel('Event')
    private readonly eventModel: Model<any>,
    private readonly kafkaService: KafkaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventQueueService.name);
  }

  onModuleInit() {
    this.logger.info('Starting event queue processor...');
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.info('Stopping event queue processor...');
    this.stopProcessing();
    // Process remaining events before shutdown
    await this.processRemainingEvents();
  }

  /**
   * Add an event to the in-memory queue for processing
   */
  enqueueEvent(event: dto.Event, userId: string): string {
    try {
      const queuedEvent: QueuedEvent = {
        id: `evt_${Date.now()}_${++this.eventCounter}`,
        event: { ...event, userId },
        timestamp: new Date(),
        retryCount: 0,
      };

      this.inMemoryQueue.push(queuedEvent);

      this.logger.info(
        {
          eventId: queuedEvent.id,
          eventType: event.eventType,
          queueLength: this.inMemoryQueue.length,
        },
        'Event added to in-memory queue',
      );

      return queuedEvent.id;
    } catch (error) {
      this.logger.error(
        {
          error: (error as Error).message,
          eventType: event.eventType,
        },
        'Failed to enqueue event',
      );
      throw error;
    }
  }

  /**
   * Start the background processor
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      if (!this.isProcessing && this.inMemoryQueue.length > 0) {
        void this.processBatch();
      }
    }, this.PROCESSING_INTERVAL_MS);

    this.logger.info('Event queue processor started');
  }

  /**
   * Stop the background processor
   */
  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.info('Event queue processor stopped');
    }
  }

  /**
   * Process remaining events before shutdown
   */
  private async processRemainingEvents(): Promise<void> {
    this.logger.info(
      { remainingEvents: this.inMemoryQueue.length },
      'Processing remaining events before shutdown',
    );

    while (this.inMemoryQueue.length > 0) {
      await this.processBatch();
    }

    this.logger.info('All remaining events processed');
  }

  /**
   * Process a batch of events from the queue
   */
  private async processBatch(): Promise<void> {
    this.isProcessing = true;

    try {
      const batch = this.inMemoryQueue.splice(0, this.BATCH_SIZE);

      this.logger.debug(
        {
          batchSize: batch.length,
          remainingInQueue: this.inMemoryQueue.length,
        },
        'Processing event batch',
      );

      // Process events in parallel within the batch
      await Promise.allSettled(
        batch.map((queuedEvent) => this.processSingleEvent(queuedEvent)),
      );
    } catch (error) {
      this.logger.error(
        {
          error: (error as Error).message,
        },
        'Error processing batch',
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event: save to MongoDB and publish to Kafka
   */
  private async processSingleEvent(queuedEvent: QueuedEvent): Promise<void> {
    try {
      const { event, id } = queuedEvent;

      // Step 1: Save to MongoDB
      const eventDocument = new this.eventModel({
        eventType: event.eventType,
        eventData: event.eventData,
        metadata: event.metadata,
        userId: this.extractUserId(event.eventData),
      });

      const savedEvent = await eventDocument.save();

      this.logger.info(
        {
          eventId: id,
          mongoId: savedEvent._id,
          eventType: event.eventType,
        },
        'Event saved to MongoDB',
      );

      // Step 2: Publish to Kafka
      const kafkaMessage = {
        eventId: savedEvent._id.toString(),
        eventType: event.eventType,
        userId: this.extractUserId(event.eventData),
        eventData: event.eventData,
        metadata: event.metadata,
        timestamp: savedEvent.createdAt || new Date(),
      };

      await this.kafkaService.sendMessage('events', kafkaMessage);

      this.logger.info(
        {
          eventId: id,
          mongoId: savedEvent._id,
          eventType: event.eventType,
        },
        'Event published to Kafka',
      );
    } catch (error) {
      this.logger.error(
        {
          eventId: queuedEvent.id,
          eventType: queuedEvent.event.eventType,
          error: (error as Error).message,
          retryCount: queuedEvent.retryCount,
        },
        'Error processing event',
      );

      // Retry logic
      if (queuedEvent.retryCount < this.MAX_RETRIES) {
        queuedEvent.retryCount++;
        this.inMemoryQueue.push(queuedEvent); // Re-queue for retry
        this.logger.warn(
          {
            eventId: queuedEvent.id,
            retryCount: queuedEvent.retryCount,
          },
          'Event re-queued for retry',
        );
      } else {
        this.logger.error(
          {
            eventId: queuedEvent.id,
            eventType: queuedEvent.event.eventType,
          },
          'Event processing failed after max retries - dropping event',
        );
      }
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    isProcessing: boolean;
  } {
    return {
      total: this.inMemoryQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Extract user ID from event data
   */
  private extractUserId(eventData: any): string {
    return eventData?.userId || eventData?.user?.id || 'unknown';
  }
}
