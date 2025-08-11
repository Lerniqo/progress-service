import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Base interface for all event data
export interface BaseEventData {
  [key: string]: any;
}

// TypeScript interfaces for specific event types
export interface QuizAttemptEventData extends BaseEventData {
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    correct: boolean;
    timeSpent: number;
  }>;
  completedAt: Date;
  isRetake: boolean;
}

export interface VideoWatchEventData extends BaseEventData {
  videoId: string;
  videoDuration: number; // in seconds
  watchedDuration: number; // in seconds
  watchProgress: number; // percentage 0-100
  playbackSpeed: number;
  watchSessions: Array<{
    startTime: number;
    endTime: number;
    watchedAt: Date;
  }>;
  completed: boolean;
  lastPosition: number; // last watched position in seconds
}

export interface AiTutorInteractionEventData extends BaseEventData {
  sessionId: string;
  messageCount: number;
  totalTokens: number;
  interactionDuration: number; // in seconds
  topics: string[];
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    tokens: number;
  }>;
  satisfactionRating?: number; // 1-5 scale
  resolved: boolean;
  category: string;
}

// Union type for all event data types
export type EventData =
  | QuizAttemptEventData
  | VideoWatchEventData
  | AiTutorInteractionEventData
  | BaseEventData;

// Enum for event types
export enum EventType {
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  VIDEO_WATCH = 'VIDEO_WATCH',
  AI_TUTOR_INTERACTION = 'AI_TUTOR_INTERACTION',
}

export type ProgressEventDocument = ProgressEvent & Document;

@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt fields
  collection: 'progress_events', // Explicitly set collection name
})
export class ProgressEvent {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: Date.now, index: true })
  timestamp: Date;

  @Prop({
    required: true,
    enum: Object.values(EventType),
    index: true,
  })
  eventType: EventType;

  @Prop({
    type: Object,
    required: true,
    default: {},
  })
  eventData: EventData;
}

export const ProgressEventSchema = SchemaFactory.createForClass(ProgressEvent);

// Add compound indexes for common queries
ProgressEventSchema.index({ userId: 1, eventType: 1 });
ProgressEventSchema.index({ userId: 1, timestamp: -1 });
ProgressEventSchema.index({ eventType: 1, timestamp: -1 });
