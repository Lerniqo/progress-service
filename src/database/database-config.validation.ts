export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

export interface EnvironmentVariables {
  NODE_ENV: Environment;
  APP_PORT: number;
  MONGODB_HOST: string;
  MONGODB_PORT: number;
  MONGODB_USERNAME?: string;
  MONGODB_PASSWORD?: string;
  MONGODB_DATABASE: string;
  MONGODB_URI?: string;
  MONGODB_AUTH_SOURCE: string;
  MONGODB_MAX_POOL_SIZE: number;
  MONGODB_MIN_POOL_SIZE: number;
  MONGODB_SERVER_SELECTION_TIMEOUT: number;
  MONGODB_SOCKET_TIMEOUT: number;
  MONGODB_CONNECT_TIMEOUT: number;
  MONGODB_HEARTBEAT_FREQUENCY: number;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const errors: string[] = [];

  // Validate NODE_ENV
  const nodeEnv = (config.NODE_ENV as string) || 'development';
  if (!Object.values(Environment).includes(nodeEnv as Environment)) {
    errors.push(
      `NODE_ENV must be one of: ${Object.values(Environment).join(', ')}`,
    );
  }

  // Validate port numbers
  const appPort = parseInt(config.APP_PORT as string) || 3000;
  const mongoPort = parseInt(config.MONGODB_PORT as string) || 27017;

  if (appPort < 1 || appPort > 65535) {
    errors.push('APP_PORT must be a valid port number (1-65535)');
  }

  if (mongoPort < 1 || mongoPort > 65535) {
    errors.push('MONGODB_PORT must be a valid port number (1-65535)');
  }

  // Validate required strings
  const mongoHost = (config.MONGODB_HOST as string) || 'localhost';
  const mongoDatabase =
    (config.MONGODB_DATABASE as string) || 'progress_service';
  const mongoAuthSource = (config.MONGODB_AUTH_SOURCE as string) || 'admin';

  if (!mongoHost.trim()) {
    errors.push('MONGODB_HOST cannot be empty');
  }

  if (!mongoDatabase.trim()) {
    errors.push('MONGODB_DATABASE cannot be empty');
  }

  // Validate authentication credentials
  const mongoUsername = config.MONGODB_USERNAME as string;
  const mongoPassword = config.MONGODB_PASSWORD as string;

  if (mongoUsername && !mongoPassword) {
    errors.push(
      'MONGODB_PASSWORD is required when MONGODB_USERNAME is provided',
    );
  }

  if (mongoPassword && !mongoUsername) {
    errors.push(
      'MONGODB_USERNAME is required when MONGODB_PASSWORD is provided',
    );
  }

  // Validate MongoDB connection settings
  const maxPoolSize = parseInt(config.MONGODB_MAX_POOL_SIZE as string) || 10;
  const minPoolSize = parseInt(config.MONGODB_MIN_POOL_SIZE as string) || 5;

  if (maxPoolSize < 1 || maxPoolSize > 100) {
    errors.push('MONGODB_MAX_POOL_SIZE must be between 1 and 100');
  }

  if (minPoolSize < 1 || minPoolSize > 50) {
    errors.push('MONGODB_MIN_POOL_SIZE must be between 1 and 50');
  }

  if (minPoolSize > maxPoolSize) {
    errors.push(
      'MONGODB_MIN_POOL_SIZE cannot be greater than MONGODB_MAX_POOL_SIZE',
    );
  }

  // Validate timeout settings
  const serverSelectionTimeout =
    parseInt(config.MONGODB_SERVER_SELECTION_TIMEOUT as string) || 5000;
  const socketTimeout =
    parseInt(config.MONGODB_SOCKET_TIMEOUT as string) || 45000;
  const connectTimeout =
    parseInt(config.MONGODB_CONNECT_TIMEOUT as string) || 10000;
  const heartbeatFrequency =
    parseInt(config.MONGODB_HEARTBEAT_FREQUENCY as string) || 10000;

  if (serverSelectionTimeout < 1000 || serverSelectionTimeout > 60000) {
    errors.push(
      'MONGODB_SERVER_SELECTION_TIMEOUT must be between 1000 and 60000 ms',
    );
  }

  if (socketTimeout < 1000 || socketTimeout > 120000) {
    errors.push('MONGODB_SOCKET_TIMEOUT must be between 1000 and 120000 ms');
  }

  if (connectTimeout < 1000 || connectTimeout > 60000) {
    errors.push('MONGODB_CONNECT_TIMEOUT must be between 1000 and 60000 ms');
  }

  if (heartbeatFrequency < 1000 || heartbeatFrequency > 60000) {
    errors.push(
      'MONGODB_HEARTBEAT_FREQUENCY must be between 1000 and 60000 ms',
    );
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation error:\n${errors.join('\n')}`);
  }

  return {
    NODE_ENV: nodeEnv as Environment,
    APP_PORT: appPort,
    MONGODB_HOST: mongoHost,
    MONGODB_PORT: mongoPort,
    MONGODB_USERNAME: mongoUsername,
    MONGODB_PASSWORD: mongoPassword,
    MONGODB_DATABASE: mongoDatabase,
    MONGODB_URI: config.MONGODB_URI as string,
    MONGODB_AUTH_SOURCE: mongoAuthSource,
    MONGODB_MAX_POOL_SIZE: maxPoolSize,
    MONGODB_MIN_POOL_SIZE: minPoolSize,
    MONGODB_SERVER_SELECTION_TIMEOUT: serverSelectionTimeout,
    MONGODB_SOCKET_TIMEOUT: socketTimeout,
    MONGODB_CONNECT_TIMEOUT: connectTimeout,
    MONGODB_HEARTBEAT_FREQUENCY: heartbeatFrequency,
  };
}
