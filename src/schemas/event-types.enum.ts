/**
 * Enum defining all possible event types for progress tracking
 */
export enum EventType {
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  QUESTION_ATTEMPT = 'QUESTION_ATTEMPT',
  VIDEO_WATCH = 'VIDEO_WATCH',
  CHAT_BOT_MESSAGE = 'CHAT_BOT_MESSAGE',
}

/**
 * Array of all event types for validation purposes
 */
export const EVENT_TYPES = Object.values(EventType);
