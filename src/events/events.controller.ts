import { Body, Controller, Post, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { PinoLogger } from 'nestjs-pino';
import { Event } from './dto';

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
                queueId: { type: 'string', description: 'Unique identifier for the queued event' },
                status: { type: 'string', example: 'accepted' },
                message: { type: 'string', example: 'Event has been queued for processing' },
                timestamp: { type: 'string', format: 'date-time' }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid event data' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async ingestEvent(@Body() event: Event) {
        if (!event.timestamp) {
            event.timestamp = new Date();
        }

        this.logger.info({ 
            eventType: event.eventType,
            timestamp: event.timestamp 
        }, 'Ingesting event');
        
        return await this.eventsService.processEvent(event);
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
                retrying: { type: 'number' }
            }
        }
    })
    async getStats() {
        return await this.eventsService.getProcessingStats();
    }
}