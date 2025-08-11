import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  IsIn,
} from 'class-validator';

/**
 * Schema for video watch event data with validation
 */
@Schema({ _id: false })
export class VideoWatchEventData {
  /** Unique identifier for the video */
  @Prop({ required: true, type: String, index: true })
  @IsString()
  videoId: string;

  /** Duration watched in seconds */
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  watchedDuration: number;

  /** Total duration of the video in seconds */
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  totalDuration: number;

  /** Optional: Percentage of video watched (0-100) */
  @Prop({ type: Number, min: 0, max: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  watchPercentage?: number;

  /** Optional: Current playback position when event was triggered */
  @Prop({ type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPosition?: number;

  /** Optional: Video quality setting used */
  @Prop({
    type: String,
    enum: [
      '144p',
      '240p',
      '360p',
      '480p',
      '720p',
      '1080p',
      '1440p',
      '2160p',
      'auto',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    '144p',
    '240p',
    '360p',
    '480p',
    '720p',
    '1080p',
    '1440p',
    '2160p',
    'auto',
  ])
  quality?: string;

  /** Optional: Playback speed used (e.g., 0.5, 0.75, 1.0, 1.25, 1.5, 2.0) */
  @Prop({
    type: Number,
    min: 0.25,
    max: 3.0,
    enum: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0],
  })
  @IsOptional()
  @IsNumber()
  @IsIn([0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0])
  playbackSpeed?: number;

  /** Optional: Whether the video was completed */
  @Prop({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export const VideoWatchEventDataSchema =
  SchemaFactory.createForClass(VideoWatchEventData);

// Add pre-save middleware to automatically calculate watchPercentage
VideoWatchEventDataSchema.pre('save', function (next) {
  const doc = this as any; // Type assertion for middleware context
  if (doc.watchedDuration && doc.totalDuration && !doc.watchPercentage) {
    doc.watchPercentage = Math.round(
      (doc.watchedDuration / doc.totalDuration) * 100,
    );
  }
  if (doc.watchPercentage >= 90 && doc.completed === undefined) {
    doc.completed = true;
  }
  next();
});
