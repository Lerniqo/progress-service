import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsString, IsOptional, IsDate, IsObject } from 'class-validator';
import * as eventDataBaseSchema from './event-data-base.schema';

@Schema({ 
  timestamps: true,
  collection: 'event_queue' 
})
export class EventQueue {
  @IsString()
  @Prop({ required: true })
  eventType: string;

  @IsString()
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object, required: true })
  eventData: eventDataBaseSchema.EventDataBase;

  @IsOptional()
  @IsObject()
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @IsDate()
  @Prop({ required: true })
  createdAt: Date;

  @IsDate()
  @Prop({ required: true })
  updatedAt: Date;
}

export type EventQueueDocument = EventQueue & Document;
export const EventQueueSchema = SchemaFactory.createForClass(EventQueue);