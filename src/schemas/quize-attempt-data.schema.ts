import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Type } from 'class-transformer';
import { EventDataBase } from './event-data-base.schema';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  IsDate,
} from 'class-validator';


export class QuizeAttemptData implements EventDataBase {
    @IsDate()
    @Prop({ required: true })
    createdAt: Date;

    @IsDate()
    @Prop({ required: true })
    updatedAt: Date;

    @IsString()
    @Prop({ required: true })
    quizId: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    score: number;

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @Prop({ type: [String], required: true })
    concepts: string[];

    @IsString()
    @Prop({ type: String, enum: ["pending", "completed", "abandoned"], required: true })
    status: string;
}


export type QuizeAttemptDocument = QuizeAttemptData & Document;
export const QuizeAttemptSchema = SchemaFactory.createForClass(QuizeAttemptData);