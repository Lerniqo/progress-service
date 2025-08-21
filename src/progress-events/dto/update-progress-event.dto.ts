import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressEventDto } from './create-progress-event.dto';

export class UpdateProgressEventDto extends PartialType(
  CreateProgressEventDto,
) {}
