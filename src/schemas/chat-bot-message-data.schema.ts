import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EventDataBase } from './event-data-base.schema';
import {
  IsString,
  IsDate,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum ChatMessageSender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export class ChatBotMessageData implements EventDataBase {
  @IsDate()
  @Prop({ required: true })
  createdAt: Date;

  @IsDate()
  @Prop({ required: true })
  updatedAt: Date;

  @IsString()
  @Prop({ required: true })
  conversationId: string;

  @IsString()
  @Prop({ required: true })
  messageId: string;

  @IsEnum(ChatMessageSender)
  @Prop({
    type: String,
    enum: Object.values(ChatMessageSender),
    required: true,
  })
  sender: ChatMessageSender;

  @IsOptional()
  @IsString()
  @Prop({ required: false })
  senderId?: string;

  @IsString()
  @Prop({ required: true })
  content: string;

  @IsString()
  @Prop({
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'rich_text'],
    required: true,
  })
  contentType: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String], required: false })
  attachments?: string[];

  @IsOptional()
  @IsString()
  @Prop({ required: false })
  language?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Prop({ required: false })
  confidence?: number;

  @IsOptional()
  @IsString()
  @Prop({ required: false })
  responseTo?: string;

  @IsOptional()
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export type ChatBotMessageDocument = ChatBotMessageData & Document;
export const ChatBotMessageSchema =
  SchemaFactory.createForClass(ChatBotMessageData);
