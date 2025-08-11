import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  IsBoolean,
  IsDate,
} from 'class-validator';

/**
 * Schema for individual messages in AI tutor interaction
 */
@Schema({ _id: false })
export class TutorMessage {
  /** Who sent the message */
  @Prop({ required: true, type: String, enum: ['student', 'tutor'] })
  @IsString()
  @IsIn(['student', 'tutor'])
  sender: 'student' | 'tutor';

  /** Content of the message */
  @Prop({ required: true, type: String, maxlength: 10000 })
  @IsString()
  content: string;

  /** Timestamp when the message was sent */
  @Prop({ required: true, type: Date })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}

export const TutorMessageSchema = SchemaFactory.createForClass(TutorMessage);

/**
 * Schema for AI tutor interaction event data with validation
 */
@Schema({ _id: false })
export class AITutorInteractionEventData {
  /** Unique identifier for the tutoring session */
  @Prop({ required: true, type: String, index: true })
  @IsString()
  sessionId: string;

  /** Array of messages exchanged in the session */
  @Prop({
    required: true,
    type: [TutorMessageSchema],
    validate: {
      validator: (messages: TutorMessage[]) => messages.length > 0,
      message: 'At least one message must be provided',
    },
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TutorMessage)
  messages: TutorMessage[];

  /** Optional: Subject or topic of the interaction */
  @Prop({
    type: String,
    maxlength: 500,
    enum: [
      'math',
      'science',
      'english',
      'history',
      'programming',
      'physics',
      'chemistry',
      'biology',
      'economics',
      'psychology',
      'general',
      'other',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'math',
    'science',
    'english',
    'history',
    'programming',
    'physics',
    'chemistry',
    'biology',
    'economics',
    'psychology',
    'general',
    'other',
  ])
  topic?: string;

  /** Optional: Duration of the interaction in seconds */
  @Prop({ type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  /** Optional: Rating given by student (1-5) */
  @Prop({ type: Number, min: 1, max: 5, enum: [1, 2, 3, 4, 5] })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsIn([1, 2, 3, 4, 5])
  rating?: number;

  /** Optional: Feedback provided by student */
  @Prop({ type: String, maxlength: 2000 })
  @IsOptional()
  @IsString()
  feedback?: string;

  /** Optional: Whether the session was resolved */
  @Prop({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;
}

export const AITutorInteractionEventDataSchema = SchemaFactory.createForClass(
  AITutorInteractionEventData,
);

// Add pre-save middleware to automatically calculate duration and set resolved status
AITutorInteractionEventDataSchema.pre('save', function (next) {
  const doc = this as any;

  // Auto-calculate duration if not provided
  if (!doc.duration && doc.messages.length >= 2) {
    const firstMessage = doc.messages[0];
    const lastMessage = doc.messages[doc.messages.length - 1];
    if (firstMessage.timestamp && lastMessage.timestamp) {
      const duration = Math.floor(
        (lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()) /
          1000,
      );
      doc.duration = Math.max(duration, 0);
    }
  }

  // Auto-set resolved status based on rating
  if (doc.rating && doc.resolved === undefined) {
    doc.resolved = doc.rating >= 3;
  }

  next();
});
