import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';

export type ProgressDocument = Progress & Document;

@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Progress {
  @Prop({
    required: true,
    type: String,
    index: true,
    trim: true,
  })
  @IsString()
  userId: string;

  @Prop({
    required: true,
    type: String,
    index: true,
    trim: true,
  })
  @IsString()
  courseId: string;

  @Prop({
    required: true,
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;

  @Prop({
    required: true,
    type: Date,
    default: Date.now,
  })
  @IsDate()
  @Type(() => Date)
  lastAccessedAt: Date;

  @Prop({
    type: [String],
    default: [],
    index: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedLessons: string[];

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  @IsNumber()
  @Min(0)
  totalTimeSpent: number; // in minutes

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuizAttempts?: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageQuizScore?: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVideosWatched?: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVideoWatchTime?: number; // in minutes
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);

// Virtual fields
ProgressSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProgressSchema.virtual('isCompleted').get(function () {
  return this.completionPercentage >= 100;
});

ProgressSchema.virtual('averageSessionTime').get(function () {
  // Calculate based on total time and estimated sessions
  const estimatedSessions = Math.max(1, Math.floor(this.totalTimeSpent / 30)); // 30 min avg session
  return Math.round(this.totalTimeSpent / estimatedSessions);
});

// Indexes for efficient querying
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true }); // Compound unique index
ProgressSchema.index({ courseId: 1, completionPercentage: -1 }); // Course progress leaderboard
ProgressSchema.index({ lastAccessedAt: -1 }); // Recent activity
ProgressSchema.index({ completionPercentage: 1 }); // Progress filtering

// Pre-save middleware
ProgressSchema.pre('save', function (next) {
  const doc = this as any;

  // Update lastAccessedAt on any change
  doc.lastAccessedAt = new Date();

  // Ensure completion percentage doesn't exceed 100
  if (doc.completionPercentage > 100) {
    doc.completionPercentage = 100;
  }

  // Calculate completion percentage based on completed lessons if not set manually
  if (
    doc.completedLessons &&
    doc.completedLessons.length > 0 &&
    !doc.isModified('completionPercentage')
  ) {
    // This would need to be calculated based on total lessons in the course
    // For now, we'll leave it as is
  }

  next();
});

// Static methods
ProgressSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ lastAccessedAt: -1 }).exec();
};

ProgressSchema.statics.findByCourseId = function (
  courseId: string,
  sortBy: string = 'completionPercentage',
) {
  const sortOrder = sortBy === 'completionPercentage' ? -1 : -1;
  return this.find({ courseId })
    .sort({ [sortBy]: sortOrder })
    .exec();
};

ProgressSchema.statics.getLeaderboard = function (
  courseId: string,
  limit: number = 10,
) {
  return this.find({ courseId })
    .sort({ completionPercentage: -1, totalTimeSpent: 1 })
    .limit(limit)
    .exec();
};

// Instance methods
ProgressSchema.methods.addCompletedLesson = function (lessonId: string) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    return this.save();
  }
  return Promise.resolve(this);
};

ProgressSchema.methods.updateProgress = function (percentage: number) {
  this.completionPercentage = Math.min(100, Math.max(0, percentage));
  return this.save();
};

// Re-export progress event related schemas and types
export * from './progress-event.schema';
export * from './event-types.enum';
export * from './quiz-attempt.interface';
export * from './video-watch.interface';
export * from './ai-tutor-interaction.interface';
