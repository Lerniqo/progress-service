import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { EventType } from './event-types.enum';
import { QuizAttemptEventData } from './quiz-attempt.interface';
import { VideoWatchEventData } from './video-watch.interface';
import { AITutorInteractionEventData } from './ai-tutor-interaction.interface';

export type ProgressEventDocument = ProgressEvent & Document;

/**
 * Union type for all possible event data types
 */
export type EventData = 
  | QuizAttemptEventData 
  | VideoWatchEventData 
  | AITutorInteractionEventData 
  | Record<string, any>; // Allow for future event types

/**
 * Mongoose schema for storing all student interaction events
 * in a single collection called 'progress_events'
 */
@Schema({
  collection: 'progress_events',
  timestamps: true, // Automatically add createdAt and updatedAt fields
  versionKey: '__v', // Enable versioning with __v field (string key)
})
export class ProgressEvent {
  /**
   * Unique identifier for the user who triggered the event
   */
  @Prop({ 
    required: true, 
    index: true, // Index for faster queries by userId
    type: String 
  })
  userId: string;

  /**
   * Timestamp when the event occurred
   */
  @Prop({ 
    required: true, 
    index: true, // Index for faster queries by timestamp
    type: Date,
    default: Date.now
  })
  timestamp: Date;

  /**
   * Type of the event (from EventType enum)
   */
  @Prop({ 
    required: true,
    enum: Object.values(EventType),
    index: true, // Index for faster queries by eventType
    type: String
  })
  eventType: EventType;

  /**
   * Flexible payload containing event-specific data
   * Type varies based on eventType
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed, // Allow flexible object structure
  })
  eventData: EventData;

  /**
   * Optional metadata for additional context
   */
  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {}
  })
  metadata?: Record<string, any>;

  /**
   * Optional session identifier for grouping related events
   */
  @Prop({
    type: String,
    index: true
  })
  sessionId?: string;

  /**
   * Optional course identifier for course-specific events
   */
  @Prop({
    type: String,
    index: true
  })
  courseId?: string;

  /**
   * Optional module/lesson identifier for more granular tracking
   */
  @Prop({
    type: String,
    index: true
  })
  moduleId?: string;
}

export const ProgressEventSchema = SchemaFactory.createForClass(ProgressEvent);

// Add compound indexes for common query patterns
ProgressEventSchema.index({ userId: 1, timestamp: -1 }); // User events by time
ProgressEventSchema.index({ userId: 1, eventType: 1 }); // User events by type
ProgressEventSchema.index({ courseId: 1, timestamp: -1 }); // Course events by time
ProgressEventSchema.index({ eventType: 1, timestamp: -1 }); // All events of a type by time

// Add text index for searching within event data (optional)
ProgressEventSchema.index({
  'eventData.content': 'text',
  'metadata.searchableText': 'text'
});
