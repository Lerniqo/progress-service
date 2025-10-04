/**
 * Jest configuration and setup for events module testing
 * This file ensures consistent test environment setup
 */

import { TestingModule } from '@nestjs/testing';

/**
 * Global test setup utilities
 */
export class TestSetup {
  /**
   * Standard timeout for async operations in tests
   */
  static readonly DEFAULT_TIMEOUT = 10000;

  /**
   * Setup Jest environment for events module
   */
  static configureJestEnvironment(): void {
    // Set default timeout for all tests
    jest.setTimeout(TestSetup.DEFAULT_TIMEOUT);

    // Mock Date.now for consistent timestamp testing
    const mockDateNow = 1640995200000; // 2022-01-01 00:00:00 UTC
    jest.spyOn(Date, 'now').mockImplementation(() => mockDateNow);

    // Suppress console logs during testing unless explicitly needed
    if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    }
  }

  /**
   * Clean up after tests
   */
  static async cleanupTestModule(module: TestingModule): Promise<void> {
    if (module) {
      await module.close();
    }
  }

  /**
   * Restore all mocks to their original state
   */
  static restoreAllMocks(): void {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  }
}

/**
 * Custom Jest matchers for events module
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidEventResponse(): R;
      toBeValidQueueStats(): R;
      toHaveBeenLoggedWith(level: string, data: any, message: string): R;
    }
  }
}

// Extend Jest matchers
expect.extend({
  toBeValidEventResponse(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.queueId === 'string' &&
      received.status === 'accepted' &&
      received.message === 'Event has been queued for processing' &&
      received.timestamp instanceof Date;

    if (pass) {
      return {
        message: () =>
          `expected ${this.utils.printReceived(received)} not to be a valid event response`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${this.utils.printReceived(received)} to be a valid event response with queueId, status, message, and timestamp`,
        pass: false,
      };
    }
  },

  toBeValidQueueStats(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.total === 'number' &&
      received.total >= 0;

    if (pass) {
      return {
        message: () =>
          `expected ${this.utils.printReceived(received)} not to be valid queue stats`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${this.utils.printReceived(received)} to be valid queue stats with non-negative total`,
        pass: false,
      };
    }
  },

  toHaveBeenLoggedWith(
    mockLogger,
    level: string,
    expectedData: any,
    expectedMessage: string,
  ) {
    const loggerMethod = mockLogger[level];

    if (!loggerMethod || typeof loggerMethod.mock === 'undefined') {
      return {
        message: () => `Logger method '${level}' is not a mock function`,
        pass: false,
      };
    }

    const calls = loggerMethod.mock.calls;
    const matchingCall = calls.find(
      (call) =>
        call.length >= 2 &&
        this.utils.stringify(call[0]) === this.utils.stringify(expectedData) &&
        call[1] === expectedMessage,
    );

    if (matchingCall) {
      return {
        message: () =>
          `expected logger.${level} not to have been called with ${this.utils.printExpected(expectedData)} and ${this.utils.printExpected(expectedMessage)}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected logger.${level} to have been called with ${this.utils.printExpected(expectedData)} and ${this.utils.printExpected(expectedMessage)}\n\nActual calls:\n${calls.map((call) => `  - ${this.utils.stringify(call)}`).join('\n')}`,
        pass: false,
      };
    }
  },
});

/**
 * Test database utilities for MongoDB testing
 */
export class TestDatabase {
  /**
   * Creates a mock MongoDB document with common methods
   */
  static createMockDocument(data: any = {}): any {
    return {
      ...data,
      _id: data._id || 'mock-document-id',
      save: jest
        .fn()
        .mockResolvedValue({ ...data, _id: data._id || 'mock-document-id' }),
      toObject: jest.fn().mockReturnValue(data),
      toJSON: jest.fn().mockReturnValue(data),
      remove: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    };
  }

  /**
   * Creates a mock MongoDB collection with common query methods
   */
  static createMockCollection(): any {
    return {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      findById: jest.fn(),
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      distinct: jest.fn(),
      createIndex: jest.fn(),
      // Query builder methods
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      lean: jest.fn().mockReturnThis(),
    };
  }
}

/**
 * Test data validation utilities
 */
export class TestValidation {
  /**
   * Validates that an object matches the expected event structure
   */
  static validateEventStructure(event: any): boolean {
    return (
      event &&
      typeof event === 'object' &&
      typeof event.eventType === 'string' &&
      typeof event.eventData === 'object' &&
      (event.metaData === undefined || typeof event.metaData === 'object') &&
      (event.timestamp === undefined || event.timestamp instanceof Date)
    );
  }

  /**
   * Validates that an object matches the expected queue response structure
   */
  static validateQueueResponseStructure(response: any): boolean {
    return (
      response &&
      typeof response === 'object' &&
      typeof response.queueId === 'string' &&
      typeof response.status === 'string' &&
      typeof response.message === 'string' &&
      response.timestamp instanceof Date
    );
  }

  /**
   * Validates queue statistics structure
   */
  static validateQueueStatsStructure(stats: any): boolean {
    return (
      stats &&
      typeof stats === 'object' &&
      typeof stats.total === 'number' &&
      stats.total >= 0
    );
  }
}

/**
 * Test environment variables and configuration
 */
export const TEST_CONFIG = {
  // Test timeouts
  UNIT_TEST_TIMEOUT: 5000,
  INTEGRATION_TEST_TIMEOUT: 10000,
  E2E_TEST_TIMEOUT: 30000,

  // Test data limits
  MAX_TEST_EVENTS: 100,
  MAX_CONCURRENT_TESTS: 10,

  // Mock configuration
  MOCK_USER_ID: 'test-user-123',
  MOCK_COURSE_ID: 'test-course-456',
  MOCK_SESSION_ID: 'test-session-789',

  // Performance thresholds
  MAX_PROCESSING_TIME_MS: 100,
  MAX_CONCURRENT_PROCESSING_TIME_MS: 500,
} as const;

/**
 * Initialize test environment
 */
if (process.env.NODE_ENV === 'test') {
  TestSetup.configureJestEnvironment();
}
