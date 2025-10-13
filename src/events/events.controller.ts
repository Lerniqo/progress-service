import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { PinoLogger } from 'nestjs-pino';
import { Event } from './dto';
import type { Request } from 'express';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventsController.name);
  }

  @Post('/')
  @HttpCode(HttpStatus.ACCEPTED) // 202 status code
  @ApiOperation({ summary: 'Ingest a progress event' })
  @ApiResponse({
    status: 202,
    description: 'Event has been accepted and queued for processing',
    schema: {
      type: 'object',
      properties: {
        queueId: {
          type: 'string',
          description: 'Unique identifier for the queued event',
        },
        status: { type: 'string', example: 'accepted' },
        message: {
          type: 'string',
          example: 'Event has been queued for processing',
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  ingestEvent(@Body() event: Event) {
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    this.logger.info(
      {
        eventType: event.eventType,
        timestamp: event.timestamp,
      },
      'Ingesting event',
    );

    return this.eventsService.processEvent(event);
  }

  @Get('/stats')
  @ApiOperation({ summary: 'Get event processing statistics' })
  @ApiResponse({
    status: 200,
    description: 'Event processing statistics',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number' },
        processing: { type: 'number' },
        completed: { type: 'number' },
        failed: { type: 'number' },
        retrying: { type: 'number' },
      },
    },
  })
  getStats() {
    return this.eventsService.getProcessingStats();
  }
  @Get('/user/:userId')
  @ApiOperation({ summary: 'Get events by user ID' })
  @ApiResponse({
    status: 200,
    description: 'List of events for the specified user',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          userId: { type: 'string' },
          eventType: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          details: { type: 'object' },
        },
      },
    },
  })
  getEventsByUserId(@Param('userId') userId: string, @Query('eventType') eventType?: string, @Query('limit') limit?: number) {
    return this.eventsService.getEventsByUserId(userId, eventType, limit);
  }

  @Get('/user/is-personalization-ready')
  async isUserDoneSufficientQuestions(@Req() req: Request): Promise<{
    isPersonalizationReady: boolean;
  }> {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      this.logger.error('User ID not provided in request headers');
      throw new Error('User ID is required');
    }

    this.logger.info(
      { userId },
      'Checking if user has completed sufficient questions for personalization',
    );
    return await this.eventsService.isUserDoneSufficientQuestions(userId);
  }

  @Get('/user/:userId/stats')
  @ApiOperation({ summary: 'Get user event statistics' })
  @ApiResponse({
    status: 200,
    description: 'User event statistics',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        eventType: { type: 'string' },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            completed: { type: 'number' },
            failed: { type: 'number' },
          },
        },
      },
    },
  })
  getUserEventStats(@Param('userId') userId: string, @Query('eventType') eventType: string) {
    if (!userId) {
      this.logger.error('User ID not provided in request parameters');
      throw new Error('User ID is required');
    }

    this.logger.info({ userId, eventType }, 'Getting user event statistics');
    return this.eventsService.getUserEventStats(userId, eventType);
  }
}
