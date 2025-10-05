import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  validateSync,
  IsEnum,
} from 'class-validator';

enum LogLevel {
  NOTHING = '0',
  ERROR = '1',
  WARN = '2',
  INFO = '4',
  DEBUG = '5',
}

export class KafkaEnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  KAFKA_BROKERS!: string;

  @IsString()
  @IsNotEmpty()
  KAFKA_CLIENT_ID!: string;

  @IsString()
  @IsOptional()
  KAFKA_GROUP_ID?: string;

  @IsEnum(LogLevel)
  @IsOptional()
  KAFKA_LOG_LEVEL?: LogLevel;

  @IsString()
  @IsOptional()
  KAFKA_CONNECTION_TIMEOUT?: string;

  @IsString()
  @IsOptional()
  KAFKA_REQUEST_TIMEOUT?: string;

  @IsString()
  @IsOptional()
  KAFKA_RETRY_ATTEMPTS?: string;

  @IsString()
  @IsOptional()
  KAFKA_RETRY_DELAY?: string;

  // SASL Configuration (optional for authentication)
  @IsString()
  @IsOptional()
  KAFKA_SASL_MECHANISM?: string;

  @IsString()
  @IsOptional()
  KAFKA_SASL_USERNAME?: string;

  @IsString()
  @IsOptional()
  KAFKA_SASL_PASSWORD?: string;

  // SSL Configuration (optional)
  @IsString()
  @IsOptional()
  KAFKA_SSL_ENABLED?: string;
}

export function validateKafkaConfig(
  config: Record<string, unknown>,
): KafkaEnvironmentVariables {
  const validatedConfig = plainToInstance(KafkaEnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Kafka configuration validation failed: ${errors.toString()}`,
    );
  }

  return validatedConfig;
}
