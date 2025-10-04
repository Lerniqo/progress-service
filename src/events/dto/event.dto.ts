import { IsDateString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import * as schemas from '../../schemas';

export class Event {
  @ApiProperty({ description: 'Type of the event', enum: schemas.EventType })
  @IsEnum(schemas.EventType)
  eventType: schemas.EventType;

  @ApiProperty({ description: 'Data associated with the event' })
  @IsObject()
  eventData: schemas.EventDataBase;

  @ApiProperty({ description: 'Optional metadata for the event' })
  @IsOptional()
  @IsObject()
  metaData?: Record<string, any>;

  @ApiProperty({ description: 'Timestamp of the event' })
  @IsDateString()
  @IsOptional()
  timestamp?: Date;
}
