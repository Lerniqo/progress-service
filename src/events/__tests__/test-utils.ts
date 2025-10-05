/**
 * Shared test utilities and mock factories for the events module
 * This file provides consistent test data and mocking helpers
 */

import { EventType } from '../../schemas/event-types.enum';
import * as dto from '../dto';

/**
 * Mock data factories for testing
 */
export class TestDataFactory {
  /**
   * Creates a basic quiz attempt event for testing
   */
  static createQuizAttemptEvent(overrides: Partial<dto.Event> = {}): dto.Event {
    return {
      eventType: EventType.QUIZ_ATTEMPT,
      eventData: {
        userId: 'test-user-123',
        courseId: 'course-456',
        quizId: 'quiz-789',
        score: 85,
        completed: true,
        attemptDuration: 300,
        ...overrides.eventData,
      },
      metadata: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        sessionId: 'session-123',
        ipAddress: '192.168.1.1',
        ...overrides.metadata,
      },
      timestamp: new Date('2024-01-01T10:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Creates a video watch event for testing
   */
  static createVideoWatchEvent(overrides: Partial<dto.Event> = {}): dto.Event {
    return {
      eventType: EventType.VIDEO_WATCH,
      eventData: {
        userId: 'test-user-123',
        videoId: 'video-456',
        courseId: 'course-789',
        watchDuration: 120,
        totalDuration: 300,
        completed: false,
        watchPercentage: 40,
        ...overrides.eventData,
      },
      metadata: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        sessionId: 'session-456',
        playbackSpeed: 1.0,
        quality: '720p',
        ...overrides.metadata,
      },
      timestamp: new Date('2024-01-01T11:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Creates an AI tutor interaction event for testing
   */
  static createAITutorInteractionEvent(
    overrides: Partial<dto.Event> = {},
  ): dto.Event {
    return {
      eventType: EventType.AI_TUTOR_INTERACTION,
      eventData: {
        userId: 'test-user-123',
        interactionType: 'question',
        query: 'What is the capital of France?',
        response: 'The capital of France is Paris.',
        confidence: 0.95,
        responseTime: 1200,
        ...overrides.eventData,
      },
      metadata: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        sessionId: 'session-789',
        modelVersion: 'v2.1',
        ...overrides.metadata,
      },
      timestamp: new Date('2024-01-01T12:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Creates an event with minimal required fields
   */
  static createMinimalEvent(
    eventType: EventType = EventType.QUIZ_ATTEMPT,
    userId: string = 'test-user',
  ): dto.Event {
    return {
      eventType,
      eventData: { userId },
      timestamp: new Date(),
    };
  }

  /**
   * Creates an event without timestamp (for testing auto-timestamp functionality)
   */
  static createEventWithoutTimestamp(): Omit<dto.Event, 'timestamp'> {
    const event = this.createQuizAttemptEvent();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp, ...eventWithoutTimestamp } = event;
    return eventWithoutTimestamp;
  }

  /**
   * Creates multiple events for batch testing
   */
  static createEventBatch(
    count: number,
    baseEvent?: Partial<dto.Event>,
  ): dto.Event[] {
    return Array.from({ length: count }, (_, index) => ({
      ...this.createQuizAttemptEvent(baseEvent),
      eventData: {
        ...this.createQuizAttemptEvent(baseEvent).eventData,
        userId: `user-${index + 1}`,
      },
      timestamp: new Date(Date.now() + index * 1000), // Different timestamps
    }));
  }
}

/**
 * Mock response factories for service responses
 */
export class MockResponseFactory {
  /**
   * Creates a standard process event response
   */
  static createProcessEventResponse(queueId: string = 'queue-123'): {
    queueId: string;
    status: string;
    message: string;
    timestamp: Date;
  } {
    return {
      queueId,
      status: 'accepted',
      message: 'Event has been queued for processing',
      timestamp: new Date(),
    };
  }

  /**
   * Creates queue statistics response
   */
  static createQueueStatsResponse(overrides: Partial<any> = {}): any {
    return {
      total: 50,
      pending: 10,
      processing: 5,
      completed: 30,
      failed: 5,
      retrying: 0,
      ...overrides,
    };
  }

  /**
   * Creates a minimal queue stats response (matching actual service return type)
   */
  static createMinimalQueueStats(total: number = 0): { total: number } {
    return { total };
  }
}

/**
 * Common test scenarios and edge cases
 */
export class TestScenarios {
  /**
   * Creates events with various userId extraction patterns
   */
  static getUserIdExtractionScenarios(): Array<{
    description: string;
    eventData: any;
    expectedUserId: string;
  }> {
    return [
      {
        description: 'direct userId property',
        eventData: { userId: 'direct-user-123', otherData: 'value' },
        expectedUserId: 'direct-user-123',
      },
      {
        description: 'nested user.id property',
        eventData: { user: { id: 'nested-user-456' }, otherData: 'value' },
        expectedUserId: 'nested-user-456',
      },
      {
        description: 'no userId (should default to unknown)',
        eventData: { someData: 'value', otherData: 'value2' },
        expectedUserId: 'unknown',
      },
      {
        description: 'empty eventData',
        eventData: {},
        expectedUserId: 'unknown',
      },
      {
        description: 'null eventData',
        eventData: null,
        expectedUserId: 'unknown',
      },
      {
        description: 'prioritize direct userId over nested',
        eventData: { userId: 'direct-wins', user: { id: 'nested-loses' } },
        expectedUserId: 'direct-wins',
      },
    ];
  }

  /**
   * Creates error scenarios for testing error handling
   */
  static getErrorScenarios(): Array<{
    description: string;
    error: Error;
    expectedMessage: string;
  }> {
    return [
      {
        description: 'database connection error',
        error: new Error('Database connection failed'),
        expectedMessage: 'Database connection failed',
      },
      {
        description: 'validation error',
        error: new Error('Validation failed: Invalid event type'),
        expectedMessage: 'Validation failed: Invalid event type',
      },
      {
        description: 'service timeout',
        error: new Error('Service timeout after 30 seconds'),
        expectedMessage: 'Service timeout after 30 seconds',
      },
      {
        description: 'queue capacity exceeded',
        error: new Error('Queue capacity exceeded'),
        expectedMessage: 'Queue capacity exceeded',
      },
    ];
  }
}

/**
 * Common mock configurations for Jest
 */
export class MockConfigurations {
  /**
   * Standard PinoLogger mock
   */
  static createPinoLoggerMock(): jest.Mocked<any> {
    return {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
  }

  /**
   * Standard EventsService mock
   */
  static createEventsServiceMock(): jest.Mocked<any> {
    return {
      processEvent: jest.fn(),
      getProcessingStats: jest.fn(),
    };
  }

  /**
   * Standard EventQueueService mock
   */
  static createEventQueueServiceMock(): jest.Mocked<any> {
    return {
      enqueueEvent: jest.fn(),
      getQueueStats: jest.fn(),
      processEvent: jest.fn(),
    };
  }

  /**
   * MongoDB Model mock with common methods
   */
  static createMongoModelMock(): jest.Mocked<any> {
    const mockDocument = {
      _id: 'mock-id-123',
      save: jest.fn(),
      toObject: jest.fn(),
      toJSON: jest.fn(),
    };

    return {
      // Constructor mock
      ...jest.fn().mockImplementation(() => mockDocument),

      // Static methods
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      insertMany: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),

      // Document instance
      mockDocument,
    };
  }
}

/**
 * Test utilities for common assertions
 */
export class TestAssertions {
  /**
   * Asserts that a logger was called with specific parameters
   */
  static assertLoggerCalled(
    logger: jest.Mocked<any>,
    method: 'info' | 'error' | 'warn' | 'debug',
    expectedData: any,
    expectedMessage: string,
  ): void {
    expect(logger[method]).toHaveBeenCalledWith(expectedData, expectedMessage);
  }

  /**
   * Asserts that an event response has the correct structure
   */
  static assertEventResponse(response: any, expectedQueueId?: string): void {
    expect(response).toHaveProperty('queueId');
    expect(response).toHaveProperty('status', 'accepted');
    expect(response).toHaveProperty(
      'message',
      'Event has been queued for processing',
    );
    expect(response).toHaveProperty('timestamp');
    expect(response.timestamp).toBeInstanceOf(Date);

    if (expectedQueueId) {
      expect(response.queueId).toBe(expectedQueueId);
    }
  }

  /**
   * Asserts that queue stats have the correct structure
   */
  static assertQueueStats(stats: any, expectedTotal?: number): void {
    expect(stats).toHaveProperty('total');
    expect(typeof stats.total).toBe('number');

    if (expectedTotal !== undefined) {
      expect(stats.total).toBe(expectedTotal);
    }
  }

  /**
   * Asserts that a timestamp was automatically added and is recent
   */
  static assertTimestampAdded(event: dto.Event, maxAgeMs: number = 1000): void {
    expect(event.timestamp).toBeInstanceOf(Date);
    const now = new Date();
    const timeDiff = now.getTime() - event.timestamp!.getTime();
    expect(timeDiff).toBeLessThanOrEqual(maxAgeMs);
    expect(timeDiff).toBeGreaterThanOrEqual(0);
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measures execution time of an async function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    return { result, duration };
  }

  /**
   * Creates performance benchmarks for event processing
   */
  static createPerformanceBenchmark(maxDurationMs: number = 100) {
    return {
      assertPerformance: (duration: number) => {
        expect(duration).toBeLessThanOrEqual(maxDurationMs);
      },
      maxDuration: maxDurationMs,
    };
  }
}
