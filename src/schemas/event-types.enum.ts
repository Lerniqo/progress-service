/**
 * Enum defining all possible event types for progress tracking
 */
export enum EventType {
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  QUESTION_ATTEMPT = 'QUESTION_ATTEMPT',
}

/**
 * Array of all event types for validation purposes
 */
export const EVENT_TYPES = Object.values(EventType);
