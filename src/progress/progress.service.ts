import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from '../schemas/progress.schema';

export interface CreateProgressDto {
  userId: string;
  courseId: string;
  completionPercentage?: number;
  lastAccessedAt?: Date;
  completedLessons?: string[];
  totalTimeSpent?: number;
}

export interface UpdateProgressDto {
  completionPercentage?: number;
  lastAccessedAt?: Date;
  completedLessons?: string[];
  totalTimeSpent?: number;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  async create(createProgressDto: CreateProgressDto): Promise<Progress> {
    const progress = new this.progressModel({
      ...createProgressDto,
      lastAccessedAt: createProgressDto.lastAccessedAt || new Date(),
      completionPercentage: createProgressDto.completionPercentage || 0,
    });
    return progress.save();
  }

  async findAll(): Promise<Progress[]> {
    return this.progressModel.find().exec();
  }

  async findByUserId(userId: string): Promise<Progress[]> {
    return this.progressModel.find({ userId }).exec();
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Progress | null> {
    return this.progressModel.findOne({ userId, courseId }).exec();
  }

  async update(
    userId: string,
    courseId: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<Progress | null> {
    return this.progressModel
      .findOneAndUpdate(
        { userId, courseId },
        { ...updateProgressDto, lastAccessedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async delete(userId: string, courseId: string): Promise<Progress | null> {
    return this.progressModel.findOneAndDelete({ userId, courseId }).exec();
  }

  // Health check method to test database connectivity
  async healthCheck(): Promise<boolean> {
    try {
      const count = await this.progressModel.countDocuments();
      return true;
    } catch (error) {
      return false;
    }
  }
}
