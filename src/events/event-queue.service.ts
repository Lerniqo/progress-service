import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { EventQueueDocument } from '../schemas/event-queue.schema';
import * as dto from './dto';

@Injectable()
export class EventQueueService {
  constructor(
    @InjectModel('EventQueue')
    private readonly eventQueueModel: Model<EventQueueDocument>,
    @InjectModel('Event')
    private readonly eventModel: Model<any>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventQueueService.name);
  }

  /**
   * Add an event to the queue for processing
   */
  async enqueueEvent(event: dto.Event): Promise<string> {
    try {
      const queuedEvent = new this.eventQueueModel({
        eventType: event.eventType,
        userId: this.extractUserId(event.eventData),
        eventData: event.eventData,
        metadata: event.metadata,
      });

      const saved = await queuedEvent.save();

      this.logger.info(
        {
          eventId: saved._id,
          eventType: event.eventType,
          userId: saved.userId,
        },
        'Event added to queue',
      );

      return (saved._id as any).toString();
    } catch (error) {
      this.logger.error(
        {
          error: error.message,
          eventType: event.eventType,
        },
        'Failed to enqueue event',
      );
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
  }> {
    const total = await this.eventQueueModel.countDocuments();
    return { total };
  }

  /**
   * Process a queued event immediately
   */
  async processEvent(eventId: string): Promise<void> {
    try {
      const queuedEvent = await this.eventQueueModel.findById(eventId);
      if (!queuedEvent) {
        throw new Error(`Event not found: ${eventId}`);
      }

      // Create the actual event document
      const eventDocument = new this.eventModel({
        eventType: queuedEvent.eventType,
        eventData: queuedEvent.eventData,
        metadata: queuedEvent.metadata,
        userId: queuedEvent.userId,
      });

      await eventDocument.save();

      // Remove from queue after successful processing
      await this.eventQueueModel.deleteOne({ _id: eventId });

      this.logger.info(
        {
          eventId,
          eventType: queuedEvent.eventType,
          userId: queuedEvent.userId,
        },
        'Event processed successfully',
      );
    } catch (error) {
      this.logger.error(
        {
          eventId,
          error: error.message,
        },
        'Error processing event',
      );

      throw error;
    }
  }

  /**
   * Extract user ID from event data
   */
  private extractUserId(eventData: any): string {
    return eventData?.userId || eventData?.user?.id || 'unknown';
  }
}
