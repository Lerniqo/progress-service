import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import * as dto from './dto';
import { EventQueueService } from './event-queue.service';
import { EventDocument } from '../schemas/index.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly eventQueueService: EventQueueService,
    @InjectModel('Event') private readonly eventModel: Model<EventDocument>,
  ) {
    this.logger.setContext(EventsService.name);
  }

  async getUserEventStats(userId: string, eventType: string) {
    const filter: { userId: string; eventType: string } = { userId, eventType };
    const result = await this.eventModel
      .aggregate([
        { $match: filter },
        { $unwind: '$eventData.concepts' },
        {
          $group: {
            _id: '$eventData.concepts',
            eventType: { $first: '$eventType' },
            totalEvents: { $sum: 1 },
          },
        },
      ])
      .exec();
    const latestEvents = await this.eventModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();
    return { conceptStats: result, latestEvents };
  }

  async isUserDoneSufficientQuestions(
    userId: string,
  ): Promise<{ isPersonalizationReady: boolean }> {
    const filter: { userId: string } = { userId };
    return await this.eventModel
      .find(filter)
      .countDocuments()
      .then((count) => {
        return { isPersonalizationReady: count >= 50 };
      });
  }

  async getEventsByUserId(userId: string, eventType?: string, limit = 100) {
    const filter: { userId: string; eventType?: string } = { userId };
    if (eventType) {
      filter.eventType = eventType;
    }

    return this.eventModel
      .find(filter)
      .limit(limit)
      .sort({ timestamp: -1 })
      .exec();
  }

  /**
   * Process an event by adding it to the queue and returning immediately
   * @param event The event to process
   * @returns Promise with queue ID and HTTP 202 status
   */
  processEvent(event: dto.Event): {
    queueId: string;
    status: string;
    message: string;
    timestamp: Date;
  } {
    try {
      this.logger.info(
        {
          eventType: event.eventType,
          timestamp: event.timestamp,
        },
        'Received event for processing',
      );

      // Add event to queue for asynchronous processing
      const queueId = this.eventQueueService.enqueueEvent(event);

      this.logger.info(
        {
          queueId,
          eventType: event.eventType,
        },
        'Event added to processing queue',
      );

      return {
        queueId,
        status: 'accepted',
        message: 'Event has been queued for processing',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        {
          error: (error as Error).message,
          eventType: event.eventType,
        },
        'Failed to queue event for processing',
      );

      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return this.eventQueueService.getQueueStats();
  }
}
