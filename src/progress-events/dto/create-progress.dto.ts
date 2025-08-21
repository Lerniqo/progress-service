import {
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgressDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number = 0;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAccessedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedLessons?: string[] = [];

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTimeSpent?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuizAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageQuizScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVideosWatched?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVideoWatchTime?: number;
}

export class UpdateProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAccessedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedLessons?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTimeSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuizAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageQuizScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVideosWatched?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVideoWatchTime?: number;
}
