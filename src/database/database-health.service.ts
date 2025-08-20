import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details?: {
    readyState: number;
    readyStateText: string;
    host?: string;
    database?: string;
    uptime?: number;
    connections?: {
      active: number;
      available: number;
    };
  };
}

// Mongoose connection states constants
const MONGO_CONNECTION_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
} as const;

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Perform a comprehensive health check of the database connection
   */
  async checkHealth(): Promise<DatabaseHealthCheck> {
    try {
      const readyState = this.connection.readyState;
      const readyStateText = this.getReadyStateText(readyState);

      if (readyState !== MONGO_CONNECTION_STATES.CONNECTED) {
        return {
          status: 'unhealthy',
          message: `Database connection is ${readyStateText}`,
          details: {
            readyState,
            readyStateText,
          },
        };
      }

      // Perform a simple ping to ensure the database is responsive
      if (this.connection.db) {
        await this.connection.db.admin().ping();
      }

      const dbStats = await this.getDatabaseStats();

      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        details: {
          readyState,
          readyStateText,
          host: this.connection.host,
          database: this.connection.name,
          uptime: process.uptime(),
          connections: dbStats,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
      );

      return {
        status: 'unhealthy' as const,
        message: `Database health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          readyState: this.connection.readyState,
          readyStateText: this.getReadyStateText(this.connection.readyState),
        },
      };
    }
  }

  /**
   * Get database connection statistics
   */
  private async getDatabaseStats(): Promise<{
    active: number;
    available: number;
  }> {
    try {
      if (!this.connection.db) {
        return { active: 0, available: 0 };
      }

      const serverStatus = (await this.connection.db
        .admin()
        .serverStatus()) as {
        connections: { current?: number; available?: number };
      };
      const connections = serverStatus.connections;

      return {
        active: connections.current || 0,
        available: connections.available || 0,
      };
    } catch (error: unknown) {
      this.logger.warn(
        'Unable to retrieve database stats',
        error instanceof Error ? error.message : String(error),
      );
      return { active: 0, available: 0 };
    }
  }

  /**
   * Convert mongoose connection ready state to human-readable text
   */
  private getReadyStateText(readyState: number): string {
    const states: Record<number, string> = {
      [MONGO_CONNECTION_STATES.DISCONNECTED]: 'disconnected',
      [MONGO_CONNECTION_STATES.CONNECTED]: 'connected',
      [MONGO_CONNECTION_STATES.CONNECTING]: 'connecting',
      [MONGO_CONNECTION_STATES.DISCONNECTING]: 'disconnecting',
    };
    return states[readyState] || 'unknown';
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    readyStateText: string;
  } {
    const readyState = this.connection.readyState;
    return {
      isConnected: readyState === MONGO_CONNECTION_STATES.CONNECTED,
      readyState,
      readyStateText: this.getReadyStateText(readyState),
    };
  }

  /**
   * Wait for the database connection to be ready
   */
  async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.connection.readyState === MONGO_CONNECTION_STATES.CONNECTED) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      this.connection.once('connected', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      this.connection.once('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }
}
