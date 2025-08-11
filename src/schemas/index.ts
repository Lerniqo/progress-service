/**
 * Schemas Package Export Index
 * 
 * This file provides a centralized export point for all schema-related
 * types, interfaces, enums, and modules used throughout the application.
 */

// =============================================================================
// CORE SCHEMAS & DOCUMENTS
// =============================================================================
export * from './progress.schema';
export * from './progress-event.schema';

// =============================================================================
// EVENT DATA SCHEMAS (formerly interfaces, now NestJS schemas)
// =============================================================================
export * from './quiz-attempt.interface';
export * from './video-watch.interface';
export * from './ai-tutor-interaction.interface';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================
export * from './event-types.enum';

// =============================================================================
// NESTJS MODULE
// =============================================================================
export * from './schemas.module';

// =============================================================================
// UTILITY TYPES & TYPE GUARDS
// =============================================================================
export * from './types';

// =============================================================================
// TYPE ALIASES & UTILITY TYPES
// =============================================================================

// Re-export commonly used document types for convenience
export type { 
  ProgressDocument, 
  ProgressEventDocument 
} from './progress.schema';

export type { 
  EventData 
} from './progress-event.schema';

// Export event data types for type checking
export type { 
  QuizAttemptEventData,
  QuizAnswer
} from './quiz-attempt.interface';

export type { 
  VideoWatchEventData 
} from './video-watch.interface';

export type { 
  AITutorInteractionEventData,
  TutorMessage 
} from './ai-tutor-interaction.interface';

// =============================================================================
// SCHEMA CONSTANTS
// =============================================================================

/**
 * Schema name constants for consistent usage across the application
 * Use these instead of hardcoded strings when injecting models
 */
export const SCHEMA_TOKENS = {
  PROGRESS_EVENT: 'ProgressEvent',
  PROGRESS: 'Progress',
} as const;

/**
 * Collection name constants for direct MongoDB operations
 */
export const COLLECTION_NAMES = {
  PROGRESS_EVENTS: 'progress_events',
  PROGRESS: 'progress',
} as const;

/**
 * Index name constants for MongoDB operations
 */
export const INDEX_NAMES = {
  USER_TIMESTAMP: 'userId_1_timestamp_-1',
  USER_EVENT_TYPE: 'userId_1_eventType_1',
  COURSE_TIMESTAMP: 'courseId_1_timestamp_-1',
  EVENT_TYPE_TIMESTAMP: 'eventType_1_timestamp_-1',
  SESSION_TIMESTAMP: 'sessionId_1_timestamp_1',
} as const;

// =============================================================================
// EXAMPLES (Optional - for development reference)
// =============================================================================
// Uncomment the following line to export usage examples
// export * from './examples';
