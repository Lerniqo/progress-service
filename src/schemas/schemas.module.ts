import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

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
      { name: 'Event', schema: require('./events.schema').EventSchema },
      { name: 'QuizeAttemptData', schema: require('./quize-attempt-data.schema').QuizeAttemptSchema },
      { name: 'EventQueue', schema: require('./event-queue.schema').EventQueueSchema },
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
      PROGRESS_EVENT: 'Event',
      PROGRESS: 'Progress',
      EVENT_QUEUE: 'EventQueue',
    } as const;
  }

  /**
   * Static method to get collection names for direct MongoDB operations if needed
   */
  static get COLLECTION_NAMES() {
    return {
      PROGRESS_EVENTS: 'progress_events',
      PROGRESS: 'progress',
      EVENT_QUEUE: 'event_queue',
    } as const;
  }
}
