/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import { KafkaConfig, logLevel } from 'kafkajs';

@Injectable()
export class KafkaConfigService {
  private readonly logger: PinoLogger;

  constructor(
    private readonly configService: ConfigService,
    logger: PinoLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(KafkaConfigService.name);
  }

  /**
   * Get Kafka brokers as an array
   */
  getBrokers(): string[] {
    const brokers = this.configService.get<string>(
      'KAFKA_BROKERS',
      'localhost:9092',
    );
    return brokers.split(',').map((broker) => broker.trim());
  }

  /**
   * Get Kafka client ID
   */
  getClientId(): string {
    return this.configService.get<string>(
      'KAFKA_CLIENT_ID',
      'progress-service',
    );
  }

  /**
   * Get Kafka consumer group ID
   */
  getGroupId(): string {
    return this.configService.get<string>(
      'KAFKA_GROUP_ID',
      'progress-service-group',
    );
  }

  /**
   * Get Kafka log level
   */
  getLogLevel(): logLevel {
    const level = this.configService.get<string>('KAFKA_LOG_LEVEL', '4');
    const levelMap: { [key: string]: logLevel } = {
      '0': logLevel.NOTHING,
      '1': logLevel.ERROR,
      '2': logLevel.WARN,
      '4': logLevel.INFO,
      '5': logLevel.DEBUG,
    };
    return levelMap[level] || logLevel.INFO;
  }

  /**
   * Get connection timeout in milliseconds
   */
  getConnectionTimeout(): number {
    const timeout = this.configService.get<string>(
      'KAFKA_CONNECTION_TIMEOUT',
      '30000',
    );
    return parseInt(timeout, 10);
  }

  /**
   * Get request timeout in milliseconds
   */
  getRequestTimeout(): number {
    const timeout = this.configService.get<string>(
      'KAFKA_REQUEST_TIMEOUT',
      '30000',
    );
    return parseInt(timeout, 10);
  }

  /**
   * Get retry configuration
   */
  getRetryConfig() {
    return {
      maxRetryTime: this.configService.get<number>('KAFKA_RETRY_DELAY', 30000),
      initialRetryTime: this.configService.get<number>(
        'KAFKA_RETRY_DELAY',
        300,
      ),
      retries: this.configService.get<number>('KAFKA_RETRY_ATTEMPTS', 8),
    };
  }

  /**
   * Check if SASL authentication is enabled
   */
  isSaslEnabled(): boolean {
    return !!(
      this.configService.get<string>('KAFKA_SASL_USERNAME') &&
      this.configService.get<string>('KAFKA_SASL_PASSWORD')
    );
  }

  /**
   * Get SASL configuration
   */
  getSaslConfig() {
    if (!this.isSaslEnabled()) {
      return undefined;
    }

    return {
      mechanism: this.configService.get<string>(
        'KAFKA_SASL_MECHANISM',
        'plain',
      ) as any,
      username: this.configService.get<string>('KAFKA_SASL_USERNAME', ''),
      password: this.configService.get<string>('KAFKA_SASL_PASSWORD', ''),
    };
  }

  /**
   * Check if SSL is enabled
   */
  isSslEnabled(): boolean {
    return (
      this.configService.get<string>('KAFKA_SSL_ENABLED', 'false') === 'true'
    );
  }

  /**
   * Create complete Kafka configuration
   */
  createKafkaConfig(): KafkaConfig {
    const config: KafkaConfig = {
      clientId: this.getClientId(),
      brokers: this.getBrokers(),
      logLevel: this.getLogLevel(),
      connectionTimeout: this.getConnectionTimeout(),
      requestTimeout: this.getRequestTimeout(),
      retry: this.getRetryConfig(),
    };

    // Add SASL if enabled
    if (this.isSaslEnabled()) {
      config.sasl = this.getSaslConfig();
    }

    // Add SSL if enabled
    if (this.isSslEnabled()) {
      config.ssl = true;
    }

    this.logger.info(
      `Kafka configuration created for client: ${config.clientId}`,
    );
    this.logger.info(
      `Kafka brokers: ${Array.isArray(config.brokers) ? config.brokers.join(', ') : 'dynamic'}`,
    );

    return config;
  }

  /**
   * Get sanitized configuration for logging (without sensitive data)
   */
  getSanitizedConfig(): string {
    const brokers = this.getBrokers();
    const clientId = this.getClientId();
    const saslEnabled = this.isSaslEnabled();
    const sslEnabled = this.isSslEnabled();

    return JSON.stringify({
      clientId,
      brokers,
      saslEnabled,
      sslEnabled,
      groupId: this.getGroupId(),
    });
  }
}
