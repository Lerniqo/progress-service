import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export interface DatabaseConfig {
  uri: string;
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
    const uri = this.configService.get<string>('MONGODB_URI');
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    return { uri };
  }

  /**
   * Validate database configuration
   */
  private validateConfig(config: DatabaseConfig): void {
    if (!config.uri) {
      throw new Error('MONGODB_URI is required');
    }

    // Basic URI validation
    if (!config.uri.startsWith('mongodb://') && !config.uri.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI must be a valid MongoDB connection string');
    }
  }

  /**
   * Build MongoDB connection URI
   */
  buildConnectionUri(): string {
    const config = this.getDatabaseConfig();
    return config.uri;
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
   * Get database name from URI
   */
  getDatabaseName(): string {
    const uri = this.buildConnectionUri();
    
    try {
      // Extract database name from URI
      const url = new URL(uri.replace('mongodb://', 'http://').replace('mongodb+srv://', 'https://'));
      const pathname = url.pathname;
      const dbName = pathname.substring(1); // Remove leading slash
      
      return dbName || 'progress_service'; // fallback to default
    } catch (error) {
      this.logger.warn('Could not extract database name from URI, using default');
      return 'progress_service';
    }
  }

  /**
   * Check if authentication is configured in URI
   */
  isAuthEnabled(): boolean {
    const uri = this.buildConnectionUri();
    // Check if URI contains username:password@ pattern
    return /@/.test(uri) && uri.includes('://') && uri.split('://')[1].includes('@');
  }
}
