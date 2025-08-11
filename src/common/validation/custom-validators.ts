import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { EventType } from '../../schemas/event-types.enum';

/**
 * Custom validator to ensure event data matches event type
 */
@ValidatorConstraint({ name: 'eventDataMatchesType', async: false })
export class EventDataMatchesTypeConstraint
  implements ValidatorConstraintInterface
{
  validate(eventData: any, args: ValidationArguments) {
    const object = args.object as any;
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

  private validateQuizAttemptData(data: any): boolean {
    return !!(
      data.quizId &&
      typeof data.score === 'number' &&
      data.score >= 0 &&
      data.score <= 100 &&
      typeof data.attemptNumber === 'number' &&
      data.attemptNumber > 0 &&
      Array.isArray(data.answers) &&
      data.answers.length > 0
    );
  }

  private validateVideoWatchData(data: any): boolean {
    return !!(
      data.videoId &&
      typeof data.watchedDuration === 'number' &&
      data.watchedDuration >= 0 &&
      typeof data.totalDuration === 'number' &&
      data.totalDuration > 0 &&
      data.watchedDuration <= data.totalDuration
    );
  }

  private validateAITutorInteractionData(data: any): boolean {
    return !!(
      data.sessionId &&
      Array.isArray(data.messages) &&
      data.messages.length > 0 &&
      data.messages.every(
        (msg: any) =>
          msg.sender &&
          ['student', 'tutor'].includes(msg.sender) &&
          msg.content &&
          msg.timestamp,
      )
    );
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
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
