export * from './event-types.enum';
export { SchemasModule } from './schemas.module';
export * from './events.schema';
export * from './quize-attempt-data.schema';
export * from './event-data-base.schema';
export * from './event-queue.schema';
export * from './chat-bot-message-data.schema';

// Export constants that were missing
export const SCHEMA_TOKENS = {
  PROGRESS_EVENT: 'ProgressEvent',
  PROGRESS: 'Progress',
  EVENT_QUEUE: 'EventQueue',
  CHAT_BOT_MESSAGE: 'ChatBotMessage',
} as const;

export const COLLECTION_NAMES = {
  PROGRESS_EVENTS: 'progress_events',
  PROGRESS: 'progress',
  EVENT_QUEUE: 'event_queue',
  CHAT_BOT_MESSAGES: 'chat_bot_messages',
} as const;
