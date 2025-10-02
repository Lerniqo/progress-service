import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  IsDate,
  IsObject,
} from 'class-validator';
import * as eventDataBaseSchema from './event-data-base.schema';

export class Event {
    @IsString()
    @Prop({ required: true })
    eventId: string;

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

    @IsDate()
    @Prop({ required: true })
    createdAt: Date;

    @IsDate()
    @Prop({ required: true })
    updatedAt: Date;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);