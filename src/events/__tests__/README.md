# Events Module Unit Testing

This directory contains comprehensive unit tests for the Events module, following industry best practices for NestJS testing.

## Overview

The Events module handles the ingestion and processing of progress events in the learning management system. This testing suite covers:

- **EventsController**: HTTP endpoint handling and request/response validation
- **EventsService**: Business logic and orchestration
- **EventQueueService**: Database operations and queue management
- **Integration Tests**: End-to-end module behavior

## Test Structure

```
src/events/
├── __tests__/
│   ├── index.ts                     # Test utilities exports
│   ├── test-utils.ts               # Mock factories & test data
│   ├── test-setup.ts               # Jest configuration & custom matchers
│   └── events-integration.spec.ts  # Integration tests
├── events.controller.spec.ts       # Controller unit tests
├── events.service.spec.ts          # Service unit tests
├── event-queue.service.spec.ts     # Queue service unit tests
└── events.module.ts                # Module definition
```

## Test Categories

### Unit Tests
- **Purpose**: Test individual components in isolation
- **Coverage**: All public methods, error scenarios, edge cases
- **Mocking**: All external dependencies are mocked
- **Files**: `*.spec.ts` files alongside source code

### Integration Tests
- **Purpose**: Test component interactions and full request flow
- **Coverage**: Controller → Service → Queue Service → Database
- **Mocking**: Only external services (database models)
- **Files**: `__tests__/events-integration.spec.ts`

## Key Features

### 🧪 Comprehensive Test Coverage
- **Controller Tests**: HTTP endpoints, validation, error handling
- **Service Tests**: Business logic, error propagation, logging
- **Queue Tests**: Database operations, user ID extraction, event processing
- **Integration Tests**: Full request lifecycle, performance assertions

### 🏭 Test Factories & Utilities
```typescript
// Example usage of test factories
const event = TestDataFactory.createQuizAttemptEvent({
  eventData: { userId: 'custom-user', score: 95 }
});

const response = MockResponseFactory.createProcessEventResponse('queue-123');
```

### 🎭 Advanced Mocking
```typescript
// Proper MongoDB model mocking
const MockEventQueueModel = jest.fn().mockImplementation(() => mockDocument);
MockEventQueueModel.countDocuments = jest.fn();
MockEventQueueModel.findById = jest.fn();
```

### 📊 Performance Testing
```typescript
// Performance assertions included
const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
  return await service.processEvent(event);
});
benchmark.assertPerformance(duration);
```

### 🔍 Custom Jest Matchers
```typescript
// Custom matchers for common assertions
expect(response).toBeValidEventResponse();
expect(stats).toBeValidQueueStats();
expect(logger).toHaveBeenLoggedWith('info', data, message);
```

## Running Tests

### All Events Tests
```bash
npm test -- src/events
```

### Specific Test File
```bash
npm test -- src/events/events.service.spec.ts
```

### With Coverage
```bash
npm run test:cov -- src/events
```

### Watch Mode
```bash
npm run test:watch -- src/events
```

## Test Data Management

### Event Types Covered
- **Quiz Attempts**: Score tracking, completion status
- **Video Watching**: Progress tracking, duration analytics
- **AI Tutor Interactions**: Question/response pairs, confidence scoring

### User ID Extraction Scenarios
- Direct `userId` property
- Nested `user.id` property  
- Missing user ID (defaults to "unknown")
- Priority handling (direct over nested)

### Error Scenarios
- Database connection failures
- Validation errors
- Service timeouts
- Queue capacity issues

## Best Practices Implemented

### ✅ Test Organization
- Clear describe blocks for grouping
- Descriptive test names explaining scenarios
- Consistent setup/teardown patterns
- Proper mock lifecycle management

### ✅ Assertion Patterns
- AAA pattern (Arrange, Act, Assert)
- Specific error message validation
- Mock interaction verification
- Performance benchmarking

### ✅ Mock Management
- Typed mocks for better IntelliSense
- Consistent mock factories
- Proper constructor mocking for Mongoose
- Reset between tests

### ✅ Edge Case Coverage
- Empty/null data handling
- Concurrent processing scenarios
- Error propagation through layers
- Timestamp auto-generation

## Test Data Examples

### Quiz Attempt Event
```typescript
{
  eventType: EventType.QUIZ_ATTEMPT,
  eventData: {
    userId: 'user-123',
    courseId: 'course-456', 
    quizId: 'quiz-789',
    score: 85,
    completed: true,
    attemptDuration: 300
  },
  metaData: {
    userAgent: 'Mozilla/5.0',
    sessionId: 'session-123'
  },
  timestamp: new Date()
}
```

### Expected Response
```typescript
{
  queueId: 'queue-id-123',
  status: 'accepted',
  message: 'Event has been queued for processing',
  timestamp: Date
}
```

## Debugging Tests

### Common Issues
1. **Mock Constructor Errors**: Ensure Mongoose models are mocked as constructor functions
2. **Async/Await**: Always use async/await for database operations
3. **Mock Resets**: Clear mocks between tests to avoid state leakage
4. **Type Issues**: Use `as any` for complex mock scenarios

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- src/events/events.service.spec.ts --verbose

# Debug with Node inspector
npm run test:debug -- src/events
```

## Contributing

When adding new tests:

1. **Follow Naming Convention**: `describe('MethodName')` → `it('should do something when condition')`
2. **Use Test Utilities**: Leverage existing factories and mocks
3. **Cover Edge Cases**: Test both success and failure scenarios
4. **Update Documentation**: Add new scenarios to this README
5. **Performance Considerations**: Add performance assertions for critical paths

## Performance Benchmarks

- **Single Event Processing**: < 50ms
- **Concurrent Events (10)**: < 200ms
- **Database Operations**: < 100ms
- **Error Handling**: < 10ms

---

## Example Test Implementation

```typescript
describe('processEvent', () => {
  it('should successfully process quiz attempt with logging', async () => {
    // Arrange
    const event = TestDataFactory.createQuizAttemptEvent();
    const expectedQueueId = 'test-queue-123';
    eventQueueService.enqueueEvent.mockResolvedValue(expectedQueueId);

    // Act
    const result = await service.processEvent(event);

    // Assert
    expect(result).toBeValidEventResponse();
    expect(result.queueId).toBe(expectedQueueId);
    expect(logger).toHaveBeenLoggedWith('info', 
      { eventType: event.eventType, timestamp: event.timestamp },
      'Received event for processing'
    );
  });
});
```

This testing suite ensures the Events module is robust, reliable, and maintainable while providing excellent developer experience and debugging capabilities.