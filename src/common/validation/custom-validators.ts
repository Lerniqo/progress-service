import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { EventType } from '../../schemas/event-types.enum';

interface QuizAttemptData {
  quizId: string;
  score: number;
  attemptNumber: number;
  answers: unknown[];
}

interface VideoWatchData {
  videoId: string;
  watchedDuration: number;
  totalDuration: number;
}

interface AITutorMessage {
  sender: string;
  content: string;
  timestamp: string | Date;
}

interface AITutorInteractionData {
  sessionId: string;
  messages: AITutorMessage[];
}

/**
 * Custom validator to ensure event data matches event type
 */
@ValidatorConstraint({ name: 'eventDataMatchesType', async: false })
export class EventDataMatchesTypeConstraint
  implements ValidatorConstraintInterface
{
  validate(eventData: unknown, args: ValidationArguments) {
    const object = args.object as { eventType: EventType };
    const eventType = object.eventType;

    if (!eventType || !eventData) {
      return false;
    }

    switch (eventType) {
      case EventType.QUIZ_ATTEMPT:
        return this.validateQuizAttemptData(eventData);
      case EventType.VIDEO_WATCH:
        return this.validateVideoWatchData(eventData);
      case EventType.AI_TUTOR_INTERACTION:
        return this.validateAITutorInteractionData(eventData);
      default:
        return true; // Allow other event types for extensibility
    }
  }

  private validateQuizAttemptData(data: unknown): data is QuizAttemptData {
    if (!data || typeof data !== 'object') return false;
    const typedData = data as Partial<QuizAttemptData>;

    return !!(
      typedData.quizId &&
      typeof typedData.score === 'number' &&
      typedData.score >= 0 &&
      typedData.score <= 100 &&
      typeof typedData.attemptNumber === 'number' &&
      typedData.attemptNumber > 0 &&
      Array.isArray(typedData.answers) &&
      typedData.answers.length > 0
    );
  }

  private validateVideoWatchData(data: unknown): data is VideoWatchData {
    if (!data || typeof data !== 'object') return false;
    const typedData = data as Partial<VideoWatchData>;

    return !!(
      typedData.videoId &&
      typeof typedData.watchedDuration === 'number' &&
      typedData.watchedDuration >= 0 &&
      typeof typedData.totalDuration === 'number' &&
      typedData.totalDuration > 0 &&
      typedData.watchedDuration <= typedData.totalDuration
    );
  }

  private validateAITutorInteractionData(
    data: unknown,
  ): data is AITutorInteractionData {
    if (!data || typeof data !== 'object') return false;
    const typedData = data as Partial<AITutorInteractionData>;

    return !!(
      typedData.sessionId &&
      Array.isArray(typedData.messages) &&
      typedData.messages.length > 0 &&
      typedData.messages.every((msg: unknown) => {
        if (!msg || typeof msg !== 'object') return false;
        const typedMsg = msg as Partial<AITutorMessage>;
        return (
          typedMsg.sender &&
          ['student', 'tutor'].includes(typedMsg.sender) &&
          typedMsg.content &&
          typedMsg.timestamp
        );
      })
    );
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as { eventType: EventType };
    return `Event data does not match the event type: ${object.eventType}`;
  }
}

export function EventDataMatchesType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EventDataMatchesTypeConstraint,
    });
  };
}

/**
 * Custom validator for quiz score percentage
 */
@ValidatorConstraint({ name: 'validPercentage', async: false })
export class ValidPercentageConstraint implements ValidatorConstraintInterface {
  validate(value: number) {
    return (
      typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value)
    );
  }

  defaultMessage() {
    return 'Value must be a valid percentage between 0 and 100';
  }
}

export function IsValidPercentage(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidPercentageConstraint,
    });
  };
}

/**
 * Custom validator for user ID format (if you have specific requirements)
 */
@ValidatorConstraint({ name: 'validUserId', async: false })
export class ValidUserIdConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Example validation rules - adjust based on your user ID format
    // This example assumes UUIDs or alphanumeric strings
    const userIdRegex = /^[a-zA-Z0-9-_]{3,50}$/;
    return userIdRegex.test(value);
  }

  defaultMessage() {
    return 'User ID must be a valid alphanumeric string between 3 and 50 characters';
  }
}

export function IsValidUserId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidUserIdConstraint,
    });
  };
}
