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
} from 'class-validator';

/**
 * Schema for individual quiz answers
 */
@Schema({ _id: false }) // Don't generate _id for sub-documents
export class QuizAnswer {
  /** Unique identifier for the question */
  @Prop({ required: true, type: String })
  @IsString()
  questionId: string;

  /** Selected option by the user */
  @Prop({ required: true, type: String })
  @IsString()
  selectedOption: string;
}

export const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);

/**
 * Schema for quiz attempt event data with validation
 */
@Schema({ _id: false })
export class QuizAttemptEventData {
  /** Unique identifier for the quiz */
  @Prop({ required: true, type: String, index: true })
  @IsString()
  quizId: string;

  /** Score achieved in the quiz (0-100) */
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  /** Number of attempts made by the user */
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  attemptNumber: number;

  /** Array of answers provided by the user */
  @Prop({
    required: true,
    type: [QuizAnswerSchema],
    validate: {
      validator: (answers: QuizAnswer[]) => answers.length > 0,
      message: 'At least one answer must be provided',
    },
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswer)
  answers: QuizAnswer[];

  /** Optional: Time taken to complete the quiz in seconds */
  @Prop({ type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  /** Optional: Maximum possible score */
  @Prop({ type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;
}

export const QuizAttemptEventDataSchema =
  SchemaFactory.createForClass(QuizAttemptEventData);
