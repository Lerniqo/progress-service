import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export interface DatabaseConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  database: string;
  uri?: string;
  authSource?: string;
}

export interface DatabaseConnectionOptions extends MongooseModuleOptions {
  uri: string;
}

@Injectable()
export class DatabaseConfigService {
  private readonly logger = new Logger(DatabaseConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get database configuration from environment variables
   */
  getDatabaseConfig(): DatabaseConfig {
    const config: DatabaseConfig = {
      host: this.configService.get<string>('MONGODB_HOST', 'localhost'),
      port: parseInt(
        this.configService.get<string>('MONGODB_PORT', '27017'),
        10,
      ),
      username: this.configService.get<string>('MONGODB_USERNAME'),
      password: this.configService.get<string>('MONGODB_PASSWORD'),
      database: this.configService.get<string>(
        'MONGODB_DATABASE',
        'progress_service',
      ),
      uri: this.configService.get<string>('MONGODB_URI'),
      authSource: this.configService.get<string>(
        'MONGODB_AUTH_SOURCE',
        'admin',
      ),
    };

    this.validateConfig(config);
    return config;
  }

  /**
   * Validate database configuration
   */
  private validateConfig(config: DatabaseConfig): void {
    if (!config.database) {
      throw new Error('MONGODB_DATABASE environment variable is required');
    }

    if (config.port < 1 || config.port > 65535) {
      throw new Error('MONGODB_PORT must be a valid port number (1-65535)');
    }

    // If username is provided, password should also be provided
    if (config.username && !config.password) {
      throw new Error(
        'MONGODB_PASSWORD is required when MONGODB_USERNAME is provided',
      );
    }

    if (config.password && !config.username) {
      throw new Error(
        'MONGODB_USERNAME is required when MONGODB_PASSWORD is provided',
      );
    }
  }

  /**
   * Build MongoDB connection URI
   */
  buildConnectionUri(): string {
    const config = this.getDatabaseConfig();

    // Use provided URI if available
    if (config.uri) {
      return config.uri;
    }

    // Build URI from components
    let uri: string;
    if (config.username && config.password) {
      const encodedUsername = encodeURIComponent(config.username);
      const encodedPassword = encodeURIComponent(config.password);
      uri = `mongodb://${encodedUsername}:${encodedPassword}@${config.host}:${config.port}/${config.database}`;

      // Add auth source if authentication is used
      if (config.authSource) {
        uri += `?authSource=${config.authSource}`;
      }
    } else {
      uri = `mongodb://${config.host}:${config.port}/${config.database}`;
    }

    return uri;
  }

  /**
   * Get sanitized URI for logging (masks password)
   */
  getSanitizedUri(): string {
    const uri = this.buildConnectionUri();
    return uri.replace(/:[^:@]*@/, ':****@');
  }

  /**
   * Create Mongoose connection options with optimal settings
   */
  createMongooseOptions(): DatabaseConnectionOptions {
    const uri = this.buildConnectionUri();
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isDevelopment = nodeEnv === 'development';

    const options: DatabaseConnectionOptions = {
      uri,

      // Connection pool settings
      maxPoolSize: parseInt(
        this.configService.get<string>('MONGODB_MAX_POOL_SIZE', '10'),
        10,
      ),
      minPoolSize: parseInt(
        this.configService.get<string>('MONGODB_MIN_POOL_SIZE', '5'),
        10,
      ),

      // Timeout settings
      serverSelectionTimeoutMS: parseInt(
        this.configService.get<string>(
          'MONGODB_SERVER_SELECTION_TIMEOUT',
          '5000',
        ),
        10,
      ),
      socketTimeoutMS: parseInt(
        this.configService.get<string>('MONGODB_SOCKET_TIMEOUT', '45000'),
        10,
      ),
      connectTimeoutMS: parseInt(
        this.configService.get<string>('MONGODB_CONNECT_TIMEOUT', '10000'),
        10,
      ),

      // Heartbeat settings
      heartbeatFrequencyMS: parseInt(
        this.configService.get<string>('MONGODB_HEARTBEAT_FREQUENCY', '10000'),
        10,
      ),

      // Retry settings
      retryWrites: true,
      retryReads: true,

      // Additional options for production
      ...(!isDevelopment && {
        maxIdleTimeMS: 30000,
        wtimeoutMS: 5000,
        readPreference: 'secondaryPreferred',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
      }),
    };

    return options;
  }

  /**
   * Get database name
   */
  getDatabaseName(): string {
    return this.getDatabaseConfig().database;
  }

  /**
   * Check if authentication is configured
   */
  isAuthEnabled(): boolean {
    const config = this.getDatabaseConfig();
    return !!(config.username && config.password);
  }
}
