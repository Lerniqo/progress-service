import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProgressDocument = Progress & Document;

@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt fields
})
export class Progress {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  courseId: string;

  @Prop({ required: true, min: 0, max: 100 })
  completionPercentage: number;

  @Prop({ required: true })
  lastAccessedAt: Date;

  @Prop({ default: [] })
  completedLessons: string[];

  @Prop({ default: 0 })
  totalTimeSpent: number; // in minutes
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);

// Re-export progress event related schemas and types
export * from './progress-event.schema';
export * from './event-types.enum';
export * from './quiz-attempt.interface';
export * from './video-watch.interface';
export * from './ai-tutor-interaction.interface';
