import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProgressEventsService } from './progress-events.service';
import { CreateProgressEventDto, UpdateProgressEventDto } from './dto';
import { EventType } from '../schemas/event-types.enum';
import { QuizAttemptEventData } from '../schemas/quiz-attempt.interface';
import { VideoWatchEventData } from '../schemas/video-watch.interface';
import { AITutorInteractionEventData } from '../schemas/ai-tutor-interaction.interface';

/**
 * Controller for progress events API endpoints
 */
@Controller('progress-events')
export class ProgressEventsController {
  private readonly logger = new Logger(ProgressEventsController.name);

  constructor(private readonly progressEventsService: ProgressEventsService) {}

  /**
   * Create a quiz attempt event
   */
  @Post('quiz-attempt')
  async createQuizAttempt(
    @Body()
    body: {
      userId: string;
      eventData: QuizAttemptEventData;
      courseId?: string;
      moduleId?: string;
      sessionId?: string;
    },
  ) {
    try {
      const event = await this.progressEventsService.createQuizAttemptEvent(
        body.userId,
        body.eventData,
        {
          courseId: body.courseId,
          moduleId: body.moduleId,
          sessionId: body.sessionId,
        },
      );

      return {
        success: true,
        message: 'Quiz attempt event created successfully',
        eventId: event._id,
        timestamp: event.timestamp,
      };
    } catch (error) {
      this.logger.error('Failed to create quiz attempt event', error);
      throw new HttpException(
        'Failed to create quiz attempt event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a video watch event
   */
  @Post('video-watch')
  async createVideoWatch(
    @Body()
    body: {
      userId: string;
      eventData: VideoWatchEventData;
      courseId?: string;
      moduleId?: string;
      sessionId?: string;
    },
  ) {
    try {
      const event = await this.progressEventsService.createVideoWatchEvent(
        body.userId,
        body.eventData,
        {
          courseId: body.courseId,
          moduleId: body.moduleId,
          sessionId: body.sessionId,
        },
      );

      return {
        success: true,
        message: 'Video watch event created successfully',
        eventId: event._id,
        timestamp: event.timestamp,
      };
    } catch (error) {
      this.logger.error('Failed to create video watch event', error);
      throw new HttpException(
        'Failed to create video watch event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create an AI tutor interaction event
   */
  @Post('ai-tutor-interaction')
  async createAITutorInteraction(
    @Body()
    body: {
      userId: string;
      eventData: AITutorInteractionEventData;
      courseId?: string;
      moduleId?: string;
    },
  ) {
    try {
      const event =
        await this.progressEventsService.createAITutorInteractionEvent(
          body.userId,
          body.eventData,
          {
            courseId: body.courseId,
            moduleId: body.moduleId,
          },
        );

      return {
        success: true,
        message: 'AI tutor interaction event created successfully',
        eventId: event._id,
        timestamp: event.timestamp,
      };
    } catch (error) {
      this.logger.error('Failed to create AI tutor interaction event', error);
      throw new HttpException(
        'Failed to create AI tutor interaction event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user events with filtering options
   */
  @Get('user/:userId')
  async getUserEvents(
    @Param('userId') userId: string,
    @Query('eventType') eventType?: EventType,
    @Query('courseId') courseId?: string,
    @Query('moduleId') moduleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    try {
      const options = {
        eventType,
        courseId,
        moduleId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        skip: skip ? parseInt(skip, 10) : undefined,
      };

      const events = await this.progressEventsService.getUserEvents(
        userId,
        options,
      );

      return {
        success: true,
        count: events.length,
        events: events.map((event) => ({
          id: event._id,
          eventType: event.eventType,
          timestamp: event.timestamp,
          eventData: event.eventData,
          courseId: event.courseId,
          moduleId: event.moduleId,
          sessionId: event.sessionId,
          metadata: event.metadata,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get events for user ${userId}`, error);
      throw new HttpException(
        'Failed to retrieve user events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user progress summary for a course
   */
  @Get('user/:userId/course/:courseId/summary')
  async getUserCourseProgress(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    try {
      const summary = await this.progressEventsService.getUserCourseProgress(
        userId,
        courseId,
      );

      return {
        success: true,
        userId,
        courseId,
        summary,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get course progress for user ${userId} in course ${courseId}`,
        error,
      );
      throw new HttpException(
        'Failed to retrieve course progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get quiz analytics
   */
  @Get('analytics/quiz/:quizId')
  async getQuizAnalytics(@Param('quizId') quizId: string) {
    try {
      const analytics =
        await this.progressEventsService.getQuizAnalytics(quizId);

      return {
        success: true,
        quizId,
        analytics,
      };
    } catch (error) {
      this.logger.error(`Failed to get quiz analytics for ${quizId}`, error);
      throw new HttpException(
        'Failed to retrieve quiz analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get video analytics
   */
  @Get('analytics/video/:videoId')
  async getVideoAnalytics(@Param('videoId') videoId: string) {
    try {
      const analytics =
        await this.progressEventsService.getVideoAnalytics(videoId);

      return {
        success: true,
        videoId,
        analytics,
      };
    } catch (error) {
      this.logger.error(`Failed to get video analytics for ${videoId}`, error);
      throw new HttpException(
        'Failed to retrieve video analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    return {
      success: true,
      message: 'Progress Events service is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
