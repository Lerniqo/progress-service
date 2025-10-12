import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { EventDataBase } from './event-data-base.schema';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';

export class QuestionAttemptData implements EventDataBase {
  @IsDate()
  @Prop({ required: true })
  createdAt: Date;

  @IsDate()
  @Prop({ required: true })
  updatedAt: Date;

  @IsString()
  @Prop({ required: true })
  questionId: string;

  @IsString()
  @Prop({ required: true })
  answer: string;

  @IsBoolean()
  @Prop({ required: true })
  isCorrect: boolean;

  @IsNumber()
  @IsOptional()
  @Prop({ required: false })
  timeTaken: number;

  @IsString()
  @Prop({ required: true })
  concept: string;
}

export type QuestionAttemptDocument = QuestionAttemptData & Document;
export const QuestionAttemptSchema =
  SchemaFactory.createForClass(QuestionAttemptData);
