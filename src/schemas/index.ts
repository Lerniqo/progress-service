// Export all schemas and types
export * from './progress.schema';
export * from './progress-event.schema';
export * from './event-types.enum';
export * from './quiz-attempt.interface';
export * from './video-watch.interface';
export * from './ai-tutor-interaction.interface';
export * from './types';
export { SchemasModule } from './schemas.module';

// Export constants that were missing
export const SCHEMA_TOKENS = {
  PROGRESS_EVENT: 'ProgressEvent',
  PROGRESS: 'Progress',
} as const;

export const COLLECTION_NAMES = {
  PROGRESS_EVENTS: 'progress_events',
  PROGRESS: 'progress',
} as const;
