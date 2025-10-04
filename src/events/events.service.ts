import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import * as dto from './dto';
import { EventQueueService } from './event-queue.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly eventQueueService: EventQueueService,
  ) {
    this.logger.setContext(EventsService.name);
  }

  /**
   * Process an event by adding it to the queue and returning immediately
   * @param event The event to process
   * @returns Promise with queue ID and HTTP 202 status
   */
  async processEvent(event: dto.Event): Promise<{
    queueId: string;
    status: string;
    message: string;
    timestamp: Date;
  }> {
    try {
      this.logger.info(
        {
          eventType: event.eventType,
          timestamp: event.timestamp,
        },
        'Received event for processing',
      );

      // Add event to queue for asynchronous processing
      const queueId = await this.eventQueueService.enqueueEvent(event);

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
          error: error.message,
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
  async getProcessingStats() {
    return await this.eventQueueService.getQueueStats();
  }
}
