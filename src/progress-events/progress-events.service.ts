import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  // Schemas and Documents
  ProgressEvent,
  ProgressEventDocument,
  
  // Event Data Types
  EventData,
  QuizAttemptEventData,
  VideoWatchEventData,
  AITutorInteractionEventData,
  
  // Enums
  EventType,
  
  // Utility Types and Constants
  SCHEMA_TOKENS,
  CreateProgressEventPayload,
  ProgressEventQueryOptions,
  TypedProgressEvent,
  
  // Type Guards
  isQuizAttemptEventData,
  isVideoWatchEventData,
  isAITutorInteractionEventData,
} from '../schemas';

/**
 * Service for managing progress events
 */
@Injectable()
export class ProgressEventsService {
  private readonly logger = new Logger(ProgressEventsService.name);

  constructor(
    @InjectModel(SCHEMA_TOKENS.PROGRESS_EVENT)
    private progressEventModel: Model<ProgressEventDocument>,
  ) {}

  /**
   * Create a new progress event
   */
  async createEvent(
    userId: string,
    eventType: EventType,
    eventData: EventData,
    options?: {
      sessionId?: string;
      courseId?: string;
      moduleId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<ProgressEventDocument> {
    try {
      const event = new this.progressEventModel({
        userId,
        timestamp: new Date(),
        eventType,
        eventData,
        ...options,
      });

      const savedEvent = await event.save();

      this.logger.log(`Created ${eventType} event for user ${userId}`, {
        eventId: savedEvent._id,
      });

      return savedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to create ${eventType} event for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Create a quiz attempt event
   */
  async createQuizAttemptEvent(
    userId: string,
    quizData: QuizAttemptEventData,
    options?: {
      courseId?: string;
      moduleId?: string;
      sessionId?: string;
    },
  ): Promise<ProgressEventDocument> {
    return this.createEvent(userId, EventType.QUIZ_ATTEMPT, quizData, {
      ...options,
      metadata: {
        score: quizData.score,
        attemptNumber: quizData.attemptNumber,
        timeSpent: quizData.timeSpent,
      },
    });
  }

  /**
   * Create a video watch event
   */
  async createVideoWatchEvent(
    userId: string,
    videoData: VideoWatchEventData,
    options?: {
      courseId?: string;
      moduleId?: string;
      sessionId?: string;
    },
  ): Promise<ProgressEventDocument> {
    return this.createEvent(userId, EventType.VIDEO_WATCH, videoData, {
      ...options,
      metadata: {
        watchPercentage: videoData.watchPercentage,
        completed: videoData.completed,
        quality: videoData.quality,
      },
    });
  }

  /**
   * Create an AI tutor interaction event
   */
  async createAITutorInteractionEvent(
    userId: string,
    tutorData: AITutorInteractionEventData,
    options?: {
      courseId?: string;
      moduleId?: string;
    },
  ): Promise<ProgressEventDocument> {
    return this.createEvent(userId, EventType.AI_TUTOR_INTERACTION, tutorData, {
      ...options,
      sessionId: tutorData.sessionId,
      metadata: {
        topic: tutorData.topic,
        messagesCount: tutorData.messages.length,
        duration: tutorData.duration,
        rating: tutorData.rating,
        resolved: tutorData.resolved,
      },
    });
  }

  /**
   * Get all events for a user
   */
  async getUserEvents(
    userId: string,
    options?: {
      eventType?: EventType;
      courseId?: string;
      moduleId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    },
  ): Promise<ProgressEventDocument[]> {
    const query: any = { userId };

    if (options?.eventType) query.eventType = options.eventType;
    if (options?.courseId) query.courseId = options.courseId;
    if (options?.moduleId) query.moduleId = options.moduleId;

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    const queryBuilder = this.progressEventModel
      .find(query)
      .sort({ timestamp: -1 });

    if (options?.limit) queryBuilder.limit(options.limit);
    if (options?.skip) queryBuilder.skip(options.skip);

    return queryBuilder.exec();
  }

  /**
   * Get user progress summary for a course
   */
  async getUserCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<{
    totalEvents: number;
    quizAttempts: number;
    averageQuizScore: number;
    videosWatched: number;
    totalVideoTime: number;
    tutorInteractions: number;
    lastActivity: Date | null;
  }> {
    const events = await this.getUserEvents(userId, { courseId });

    const summary = {
      totalEvents: events.length,
      quizAttempts: 0,
      averageQuizScore: 0,
      videosWatched: 0,
      totalVideoTime: 0,
      tutorInteractions: 0,
      lastActivity: events.length > 0 ? events[0].timestamp : null,
    };

    let totalQuizScore = 0;

    for (const event of events) {
      switch (event.eventType) {
        case EventType.QUIZ_ATTEMPT:
          summary.quizAttempts++;
          const quizData = event.eventData as QuizAttemptEventData;
          totalQuizScore += quizData.score;
          break;

        case EventType.VIDEO_WATCH:
          summary.videosWatched++;
          const videoData = event.eventData as VideoWatchEventData;
          summary.totalVideoTime += videoData.watchedDuration;
          break;

        case EventType.AI_TUTOR_INTERACTION:
          summary.tutorInteractions++;
          break;
      }
    }

    if (summary.quizAttempts > 0) {
      summary.averageQuizScore = Math.round(
        totalQuizScore / summary.quizAttempts,
      );
    }

    return summary;
  }

  /**
   * Get quiz performance analytics
   */
  async getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    uniqueStudents: number;
    averageScore: number;
    averageAttempts: number;
    completionRate: number;
  }> {
    const quizEvents = await this.progressEventModel
      .find({
        eventType: EventType.QUIZ_ATTEMPT,
        'eventData.quizId': quizId,
      })
      .exec();

    if (quizEvents.length === 0) {
      return {
        totalAttempts: 0,
        uniqueStudents: 0,
        averageScore: 0,
        averageAttempts: 0,
        completionRate: 0,
      };
    }

    const uniqueStudents = new Set(quizEvents.map((e) => e.userId)).size;
    const totalScore = quizEvents.reduce(
      (sum, event) => sum + (event.eventData as QuizAttemptEventData).score,
      0,
    );
    const averageScore = Math.round(totalScore / quizEvents.length);

    // Calculate average attempts per student
    const studentAttempts = quizEvents.reduce(
      (acc, event) => {
        const userId = event.userId;
        const attemptNumber = (event.eventData as QuizAttemptEventData)
          .attemptNumber;
        acc[userId] = Math.max(acc[userId] || 0, attemptNumber);
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalAttemptsPerStudent = Object.values(studentAttempts).reduce(
      (sum, attempts) => sum + attempts,
      0,
    );
    const averageAttempts = Math.round(
      totalAttemptsPerStudent / uniqueStudents,
    );

    // Calculate completion rate (students who scored above 60%)
    const passingStudents = Object.keys(studentAttempts).filter((userId) => {
      const userEvents = quizEvents.filter((e) => e.userId === userId);
      const bestScore = Math.max(
        ...userEvents.map((e) => (e.eventData as QuizAttemptEventData).score),
      );
      return bestScore >= 60;
    }).length;

    const completionRate = Math.round((passingStudents / uniqueStudents) * 100);

    return {
      totalAttempts: quizEvents.length,
      uniqueStudents,
      averageScore,
      averageAttempts,
      completionRate,
    };
  }

  /**
   * Get video engagement analytics
   */
  async getVideoAnalytics(videoId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    averageWatchTime: number;
    completionRate: number;
    averageWatchPercentage: number;
  }> {
    const videoEvents = await this.progressEventModel
      .find({
        eventType: EventType.VIDEO_WATCH,
        'eventData.videoId': videoId,
      })
      .exec();

    if (videoEvents.length === 0) {
      return {
        totalViews: 0,
        uniqueViewers: 0,
        averageWatchTime: 0,
        completionRate: 0,
        averageWatchPercentage: 0,
      };
    }

    const uniqueViewers = new Set(videoEvents.map((e) => e.userId)).size;
    const totalWatchTime = videoEvents.reduce(
      (sum, event) =>
        sum + (event.eventData as VideoWatchEventData).watchedDuration,
      0,
    );
    const averageWatchTime = Math.round(totalWatchTime / videoEvents.length);

    const completedViews = videoEvents.filter(
      (event) => (event.eventData as VideoWatchEventData).completed,
    ).length;
    const completionRate = Math.round(
      (completedViews / videoEvents.length) * 100,
    );

    const totalWatchPercentage = videoEvents.reduce(
      (sum, event) =>
        sum + ((event.eventData as VideoWatchEventData).watchPercentage || 0),
      0,
    );
    const averageWatchPercentage = Math.round(
      totalWatchPercentage / videoEvents.length,
    );

    return {
      totalViews: videoEvents.length,
      uniqueViewers,
      averageWatchTime,
      completionRate,
      averageWatchPercentage,
    };
  }
}
