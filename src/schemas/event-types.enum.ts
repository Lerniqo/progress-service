/**
 * Enum defining all possible event types for progress tracking
 */
export enum EventType {
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  VIDEO_WATCH = 'VIDEO_WATCH',
  AI_TUTOR_INTERACTION = 'AI_TUTOR_INTERACTION',
}

/**
 * Array of all event types for validation purposes
 */
export const EVENT_TYPES = Object.values(EventType);
