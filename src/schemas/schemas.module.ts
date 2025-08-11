import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressEvent, ProgressEventSchema } from './progress-event.schema';
import { Progress, ProgressSchema } from './progress.schema';

/**
 * SchemasModule - Centralized module for all MongoDB schemas
 * 
 * This module:
 * - Registers all Mongoose schemas with NestJS
 * - Provides models for dependency injection
 * - Centralizes schema configuration
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: ProgressEvent.name, 
        schema: ProgressEventSchema,
        collection: 'progress_events' // Explicit collection name
      },
      { 
        name: Progress.name, 
        schema: ProgressSchema,
        collection: 'progress' // Explicit collection name
      },
    ]),
  ],
  exports: [
    MongooseModule, // Export MongooseModule to make models available
  ],
})
export class SchemasModule {
  /**
   * Static method to get schema names for consistent usage across the app
   */
  static get SCHEMA_NAMES() {
    return {
      PROGRESS_EVENT: ProgressEvent.name,
      PROGRESS: Progress.name,
    } as const;
  }

  /**
   * Static method to get collection names for direct MongoDB operations if needed
   */
  static get COLLECTION_NAMES() {
    return {
      PROGRESS_EVENTS: 'progress_events',
      PROGRESS: 'progress',
    } as const;
  }
}
