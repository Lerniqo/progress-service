import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './events.schema';
import { QuizeAttemptSchema } from './quize-attempt-data.schema';
import { EventQueueSchema } from './event-queue.schema';
import { ChatBotMessageSchema } from './chat-bot-message-data.schema';

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
      { name: 'Event', schema: EventSchema },
      {
        name: 'QuizeAttemptData',
        schema: QuizeAttemptSchema,
      },
      {
        name: 'EventQueue',
        schema: EventQueueSchema,
      },
      {
        name: 'ChatBotMessageData',
        schema: ChatBotMessageSchema,
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
      PROGRESS_EVENT: 'Event',
      PROGRESS: 'Progress',
      EVENT_QUEUE: 'EventQueue',
      CHAT_BOT_MESSAGE: 'ChatBotMessage',
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
      CHAT_BOT_MESSAGES: 'chat_bot_messages',
    } as const;
  }
}
