import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsString, IsObject, IsOptional } from 'class-validator';
import * as eventDataBaseSchema from './event-data-base.schema';

@Schema({
  timestamps: true,
  collection: 'events',
})
export class Event {
  @IsString()
  @Prop({ required: true })
  eventType: string;

  @Prop({ type: Object, required: true })
  eventData: eventDataBaseSchema.EventDataBase;

  @IsString()
  @Prop({ required: true })
  userId: string;

  @IsOptional()
  @IsObject()
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
