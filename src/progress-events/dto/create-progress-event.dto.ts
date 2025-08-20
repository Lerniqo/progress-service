import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { EventType } from '../../schemas/event-types.enum';
import type { EventData } from '../../schemas/progress-event.schema';
import type { QuizAttemptEventData } from '../../schemas/quiz-attempt.interface';
import type { VideoWatchEventData } from '../../schemas/video-watch.interface';
import type { AITutorInteractionEventData } from '../../schemas/ai-tutor-interaction.interface';

export class CreateProgressEventDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsObject()
  @ValidateNested()
  eventData: EventData;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

// Specific DTOs for different event types for better type safety
export class CreateQuizAttemptEventDto extends CreateProgressEventDto {
  declare eventType: EventType.QUIZ_ATTEMPT;

  @ValidateNested()
  declare eventData: QuizAttemptEventData;
}

export class CreateVideoWatchEventDto extends CreateProgressEventDto {
  declare eventType: EventType.VIDEO_WATCH;

  @ValidateNested()
  declare eventData: VideoWatchEventData;
}

export class CreateAITutorInteractionEventDto extends CreateProgressEventDto {
  declare eventType: EventType.AI_TUTOR_INTERACTION;

  @ValidateNested()
  declare eventData: AITutorInteractionEventData;
}
