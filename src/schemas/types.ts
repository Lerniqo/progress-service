/**
 * Schema Type Definitions
 * 
 * This file contains utility types, interfaces, and type guards
 * for working with schemas in a type-safe manner.
 */

import { Document, Model } from 'mongoose';
import { EventType } from './event-types.enum';
import type { 
  ProgressDocument, 
  ProgressEventDocument,
  QuizAttemptEventData,
  VideoWatchEventData,
  AITutorInteractionEventData
} from './index';

// =============================================================================
// MODEL TYPES
// =============================================================================

/**
 * Mongoose model types for dependency injection
 */
export type ProgressModel = Model<ProgressDocument>;
export type ProgressEventModel = Model<ProgressEventDocument>;

// =============================================================================
// UNION TYPES
// =============================================================================

/**
 * Union type for all possible event data types
 */
export type EventDataUnion = 
  | QuizAttemptEventData 
  | VideoWatchEventData 
  | AITutorInteractionEventData;

/**
 * Mapped type for event data based on event type
 */
export type EventDataMap = {
  [EventType.QUIZ_ATTEMPT]: QuizAttemptEventData;
  [EventType.VIDEO_WATCH]: VideoWatchEventData;
  [EventType.AI_TUTOR_INTERACTION]: AITutorInteractionEventData;
  [EventType.LESSON_COMPLETION]: Record<string, any>;
  [EventType.COURSE_ENROLLMENT]: Record<string, any>;
  [EventType.MODULE_START]: Record<string, any>;
  [EventType.MODULE_COMPLETION]: Record<string, any>;
  [EventType.ASSIGNMENT_SUBMISSION]: Record<string, any>;
  [EventType.DISCUSSION_POST]: Record<string, any>;
  [EventType.RESOURCE_ACCESS]: Record<string, any>;
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract event data type based on event type
 */
export type ExtractEventData<T extends EventType> = T extends keyof EventDataMap 
  ? EventDataMap[T] 
  : Record<string, any>;

/**
 * Progress event with typed event data
 */
export type TypedProgressEvent<T extends EventType = EventType> = Omit<ProgressEventDocument, 'eventData'> & {
  eventData: ExtractEventData<T>;
};

/**
 * Create progress event payload with typed event data
 */
export type CreateProgressEventPayload<T extends EventType = EventType> = {
  userId: string;
  eventType: T;
  eventData: ExtractEventData<T>;
  courseId?: string;
  moduleId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if event data is QuizAttemptEventData
 */
export function isQuizAttemptEventData(
  eventType: EventType,
  eventData: any
): eventData is QuizAttemptEventData {
  return eventType === EventType.QUIZ_ATTEMPT && 
         eventData && 
         typeof eventData.quizId === 'string' &&
         typeof eventData.score === 'number' &&
         Array.isArray(eventData.answers);
}

/**
 * Type guard to check if event data is VideoWatchEventData
 */
export function isVideoWatchEventData(
  eventType: EventType,
  eventData: any
): eventData is VideoWatchEventData {
  return eventType === EventType.VIDEO_WATCH &&
         eventData &&
         typeof eventData.videoId === 'string' &&
         typeof eventData.watchedDuration === 'number' &&
         typeof eventData.totalDuration === 'number';
}

/**
 * Type guard to check if event data is AITutorInteractionEventData
 */
export function isAITutorInteractionEventData(
  eventType: EventType,
  eventData: any
): eventData is AITutorInteractionEventData {
  return eventType === EventType.AI_TUTOR_INTERACTION &&
         eventData &&
         typeof eventData.sessionId === 'string' &&
         Array.isArray(eventData.messages);
}

// =============================================================================
// QUERY TYPES
// =============================================================================

/**
 * Common query options for progress events
 */
export interface ProgressEventQueryOptions {
  userId?: string;
  courseId?: string;
  moduleId?: string;
  sessionId?: string;
  eventType?: EventType | EventType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
  sort?: 'asc' | 'desc';
}

/**
 * Aggregation pipeline stages for progress analytics
 */
export interface ProgressAnalyticsQuery {
  userId?: string;
  courseId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  groupBy?: 'day' | 'week' | 'month' | 'eventType';
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Paginated response for progress events
 */
export interface PaginatedProgressEvents {
  events: ProgressEventDocument[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Progress analytics response
 */
export interface ProgressAnalytics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  totalTimeSpent: number;
  averageSessionTime: number;
  completionRate: number;
  streakDays: number;
}
