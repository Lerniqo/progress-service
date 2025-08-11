/**
 * Schema Usage Examples
 * 
 * This file demonstrates how to use the improved schemas structure
 * with all the new features and type safety.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  // All imports from single source
  ProgressEventDocument,
  ProgressDocument,
  EventType,
  SCHEMA_TOKENS,
  COLLECTION_NAMES,
  CreateProgressEventPayload,
  ProgressEventQueryOptions,
  TypedProgressEvent,
  isQuizAttemptEventData,
  isVideoWatchEventData,
  QuizAttemptEventData,
  VideoWatchEventData,
} from '../schemas';

@Injectable()
export class SchemaUsageExamples {
  constructor(
    // Using schema tokens for consistent injection
    @InjectModel(SCHEMA_TOKENS.PROGRESS_EVENT)
    private progressEventModel: Model<ProgressEventDocument>,
    
    @InjectModel(SCHEMA_TOKENS.PROGRESS)
    private progressModel: Model<ProgressDocument>,
  ) {}

  /**
   * Example 1: Type-safe event creation with payload validation
   */
  async createQuizAttemptEvent(): Promise<ProgressEventDocument> {
    // Payload is fully typed based on event type
    const payload: CreateProgressEventPayload<EventType.QUIZ_ATTEMPT> = {
      userId: 'user123',
      eventType: EventType.QUIZ_ATTEMPT,
      courseId: 'course456',
      // eventData is automatically typed as QuizAttemptEventData
      eventData: {
        quizId: 'quiz789',
        score: 85,
        attemptNumber: 1,
        answers: [
          { questionId: 'q1', selectedOption: 'A' },
          { questionId: 'q2', selectedOption: 'C' }
        ],
        timeSpent: 120,
        maxScore: 100
      },
      metadata: {
        userAgent: 'Mozilla/5.0...',
        source: 'web'
      }
    };

    return await this.progressEventModel.create(payload);
  }

  /**
   * Example 2: Type-safe queries using options interface
   */
  async findUserEvents(options: ProgressEventQueryOptions): Promise<ProgressEventDocument[]> {
    const query: any = {};
    
    if (options.userId) query.userId = options.userId;
    if (options.courseId) query.courseId = options.courseId;
    if (options.eventType) {
      query.eventType = Array.isArray(options.eventType) 
        ? { $in: options.eventType }
        : options.eventType;
    }
    
    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    const sortOrder = options.sort === 'asc' ? 1 : -1;

    return await this.progressEventModel
      .find(query)
      .sort({ timestamp: sortOrder })
      .limit(options.limit || 50)
      .skip(options.skip || 0)
      .exec();
  }

  /**
   * Example 3: Type guards for runtime type safety
   */
  async processEvent(event: ProgressEventDocument): Promise<string> {
    // Type guards provide runtime type safety
    if (isQuizAttemptEventData(event.eventType, event.eventData)) {
      // event.eventData is now typed as QuizAttemptEventData
      const score = event.eventData.score;
      const maxScore = event.eventData.maxScore || 100;
      const percentage = (score / maxScore) * 100;
      
      return `Quiz completed with ${percentage}% score`;
    }
    
    if (isVideoWatchEventData(event.eventType, event.eventData)) {
      // event.eventData is now typed as VideoWatchEventData
      const watchPercentage = event.eventData.watchPercentage || 0;
      const completed = event.eventData.completed ? 'completed' : 'in progress';
      
      return `Video ${watchPercentage}% watched (${completed})`;
    }

    return 'Unknown event type processed';
  }

  /**
   * Example 4: Using static methods from schema
   */
  async getUserRecentEvents(userId: string): Promise<ProgressEventDocument[]> {
    // Using static method defined in schema
    return await (this.progressEventModel as any).findByUserId(userId, 20);
  }

  /**
   * Example 5: Using typed progress event
   */
  async getTypedQuizEvents(userId: string): Promise<TypedProgressEvent<EventType.QUIZ_ATTEMPT>[]> {
    const events = await this.progressEventModel
      .find({
        userId,
        eventType: EventType.QUIZ_ATTEMPT
      })
      .exec();

    // Type assertion is safe because we filtered by eventType
    return events as TypedProgressEvent<EventType.QUIZ_ATTEMPT>[];
  }

  /**
   * Example 6: Using collection names for direct operations
   */
  async getCollectionStats(): Promise<any> {
    // Using collection name constants for collection operations
    const progressEventsCount = await this.progressEventModel.countDocuments().exec();
    const progressCount = await this.progressModel.countDocuments().exec();

    return {
      progressEvents: {
        count: progressEventsCount,
        collectionName: COLLECTION_NAMES.PROGRESS_EVENTS
      },
      progress: {
        count: progressCount,
        collectionName: COLLECTION_NAMES.PROGRESS
      }
    };
  }

  /**
   * Example 7: Progress tracking with virtual fields
   */
  async getProgressWithVirtuals(userId: string, courseId: string) {
    const progress = await this.progressModel
      .findOne({ userId, courseId })
      .exec();

    if (progress) {
      return {
        completionPercentage: progress.completionPercentage,
        // Virtual fields are automatically available
        isCompleted: (progress as any).isCompleted,
        averageSessionTime: (progress as any).averageSessionTime,
        // Regular fields
        totalTimeSpent: progress.totalTimeSpent,
        completedLessons: progress.completedLessons
      };
    }

    return null;
  }

  /**
   * Example 8: Using instance methods
   */
  async updateUserProgress(userId: string, courseId: string, lessonId: string) {
    const progress = await this.progressModel
      .findOne({ userId, courseId })
      .exec();

    if (progress) {
      // Using instance method defined in schema
      await (progress as any).addCompletedLesson(lessonId);
      
      // Calculate new completion percentage
      const newPercentage = Math.min(100, progress.completedLessons.length * 10);
      await (progress as any).updateProgress(newPercentage);
      
      return progress;
    }

    return null;
  }
}
