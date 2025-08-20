/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
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
  toJSON: { virtuals: true }, // Include virtual fields in JSON output
  toObject: { virtuals: true }, // Include virtual fields in object output
})
export class ProgressEvent {
  /**
   * Unique identifier for the user who triggered the event
   */
  @Prop({
    required: true,
    index: true, // Index for faster queries by userId
    type: String,
    trim: true,
  })
  @IsString()
  userId: string;

  /**
   * Timestamp when the event occurred
   */
  @Prop({
    required: true,
    index: true, // Index for faster queries by timestamp
    type: Date,
    default: Date.now,
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  /**
   * Type of the event (from EventType enum)
   */
  @Prop({
    required: true,
    enum: Object.values(EventType),
    index: true, // Index for faster queries by eventType
    type: String,
  })
  @IsEnum(EventType)
  eventType: EventType;

  /**
   * Flexible payload containing event-specific data
   * Type varies based on eventType
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed, // Allow flexible object structure
  })
  @IsObject()
  @ValidateNested()
  eventData: EventData;

  /**
   * Optional metadata for additional context
   */
  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  /**
   * Optional session identifier for grouping related events
   */
  @Prop({
    type: String,
    index: true,
    trim: true,
    sparse: true, // Only index non-null values
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  /**
   * Optional course identifier for course-specific events
   */
  @Prop({
    type: String,
    index: true,
    trim: true,
    sparse: true,
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  /**
   * Optional module/lesson identifier for more granular tracking
   */
  @Prop({
    type: String,
    index: true,
    trim: true,
    sparse: true,
  })
  @IsOptional()
  @IsString()
  moduleId?: string;
}

export const ProgressEventSchema = SchemaFactory.createForClass(ProgressEvent);

// Virtual fields
ProgressEventSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProgressEventSchema.virtual('eventDataType').get(function () {
  return this.eventType;
});

// Add compound indexes for common query patterns
ProgressEventSchema.index({ userId: 1, timestamp: -1 }); // User events by time
ProgressEventSchema.index({ userId: 1, eventType: 1 }); // User events by type
ProgressEventSchema.index({ courseId: 1, timestamp: -1 }); // Course events by time
ProgressEventSchema.index({ eventType: 1, timestamp: -1 }); // All events of a type by time
ProgressEventSchema.index({ sessionId: 1, timestamp: 1 }); // Session events chronologically

// Add text index for searching within event data (optional)
ProgressEventSchema.index({
  'eventData.content': 'text',
  'metadata.searchableText': 'text',
});

// Add TTL index for automatic document expiration (optional - remove if not needed)
// ProgressEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

// Pre-save middleware for validation and data enrichment
ProgressEventSchema.pre('save', function (next) {
  const doc = this as any;

  // Ensure timestamp is set
  if (!doc.timestamp) {
    doc.timestamp = new Date();
  }

  // Add metadata enrichment based on event type
  if (!doc.metadata) {
    doc.metadata = {};
  }

  // Add processing timestamp
  doc.metadata.processedAt = new Date();

  // Validate event data based on event type
  try {
    switch (doc.eventType) {
      case EventType.QUIZ_ATTEMPT:
        if (doc.eventData && !doc.eventData.quizId) {
          return next(new Error('Quiz attempt events must have a quizId'));
        }
        break;
      case EventType.VIDEO_WATCH:
        if (doc.eventData && !doc.eventData.videoId) {
          return next(new Error('Video watch events must have a videoId'));
        }
        break;
      case EventType.AI_TUTOR_INTERACTION:
        if (doc.eventData && !doc.eventData.sessionId) {
          return next(
            new Error('AI tutor interaction events must have a sessionId'),
          );
        }
        break;
    }
  } catch (error) {
    return next(error as Error);
  }

  next();
});

// Post-save middleware for logging or analytics
ProgressEventSchema.post('save', function (doc) {
  // Here you could add logging, analytics, or trigger other services
  console.log(`Progress event saved: ${doc.eventType} for user ${doc.userId}`);
});

// Static methods for common queries
ProgressEventSchema.statics.findByUserId = function (
  userId: string,
  limit: number = 50,
) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit).exec();
};

ProgressEventSchema.statics.findByEventType = function (
  eventType: EventType,
  limit: number = 50,
) {
  return this.find({ eventType }).sort({ timestamp: -1 }).limit(limit).exec();
};

ProgressEventSchema.statics.findByCourseId = function (
  courseId: string,
  limit: number = 50,
) {
  return this.find({ courseId }).sort({ timestamp: -1 }).limit(limit).exec();
};

// Instance methods
ProgressEventSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};
