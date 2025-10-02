/**
 * Index file for events module testing utilities
 * Exports all test helpers, mocks, and utilities for easy importing
 */

// Test utilities and factories
export {
  TestDataFactory,
  MockResponseFactory,
  TestScenarios,
  MockConfigurations,
  TestAssertions,
  PerformanceTestUtils,
} from './test-utils';

// Test setup and configuration
export {
  TestSetup,
  TestDatabase,
  TestValidation,
  TEST_CONFIG,
} from './test-setup';

// Re-export common testing dependencies for convenience
export { Test, TestingModule } from '@nestjs/testing';
export { getModelToken } from '@nestjs/mongoose';
export type { Model } from 'mongoose';

/**
 * Common test patterns and examples
 */
export const CommonTestPatterns = {
  /**
   * Standard beforeEach setup for unit tests
   */
  standardUnitTestSetup: `
    let service: YourService;
    let mockDependency: jest.Mocked<Dependency>;
    
    beforeEach(async () => {
      const mockDep = MockConfigurations.createYourMock();
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          YourService,
          { provide: Dependency, useValue: mockDep },
        ],
      }).compile();
      
      service = module.get<YourService>(YourService);
      mockDependency = module.get(Dependency);
    });
    
    afterEach(() => {
      jest.clearAllMocks();
    });
  `,

  /**
   * Standard integration test setup with all dependencies
   */
  standardIntegrationTestSetup: `
    let module: TestingModule;
    let controller: EventsController;
    let service: EventsService;
    
    beforeEach(async () => {
      module = await Test.createTestingModule({
        controllers: [EventsController],
        providers: [
          EventsService,
          EventQueueService,
          { provide: PinoLogger, useValue: MockConfigurations.createPinoLoggerMock() },
          { provide: getModelToken('EventQueue'), useValue: MockConfigurations.createMongoModelMock() },
          { provide: getModelToken('Event'), useValue: MockConfigurations.createMongoModelMock() },
        ],
      }).compile();
      
      controller = module.get<EventsController>(EventsController);
      service = module.get<EventsService>(EventsService);
    });
    
    afterEach(async () => {
      jest.clearAllMocks();
      await module.close();
    });
  `,

  /**
   * Performance test pattern
   */
  performanceTestPattern: `
    it('should process within acceptable time limits', async () => {
      const benchmark = PerformanceTestUtils.createPerformanceBenchmark(100);
      
      const { duration } = await PerformanceTestUtils.measureExecutionTime(async () => {
        return await service.performOperation();
      });
      
      benchmark.assertPerformance(duration);
    });
  `,

  /**
   * Error handling test pattern
   */
  errorHandlingTestPattern: `
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable');
      mockService.method.mockRejectedValue(error);
      
      await expect(service.performOperation()).rejects.toThrow(error);
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: error.message }),
        'Expected error message'
      );
    });
  `,
} as const;

/**
 * Testing best practices documentation
 */
export const TestingBestPractices = {
  unitTests: [
    '✅ Test one unit of functionality in isolation',
    '✅ Mock all external dependencies',
    '✅ Use descriptive test names that explain what is being tested',
    '✅ Follow AAA pattern: Arrange, Act, Assert',
    '✅ Test both success and error scenarios',
    '✅ Use beforeEach/afterEach for setup and cleanup',
    '✅ Keep tests independent and deterministic',
  ],
  
  integrationTests: [
    '✅ Test the interaction between multiple components',
    '✅ Use real implementations where possible',
    '✅ Test the full request/response cycle',
    '✅ Verify logging and side effects',
    '✅ Test error propagation between layers',
    '✅ Include performance assertions for critical paths',
  ],
  
  mockingGuidelines: [
    '✅ Mock external services and databases',
    '✅ Use typed mocks for better IntelliSense',
    '✅ Reset mocks between tests',
    '✅ Verify mock interactions when relevant',
    '✅ Use factory functions for consistent mock data',
    '✅ Mock at the boundary of your system',
  ],
  
  testStructure: [
    '✅ Group related tests with describe blocks',
    '✅ Use nested describe blocks for different scenarios',
    '✅ Write clear, descriptive test names',
    '✅ Keep test files close to the code they test',
    '✅ Use shared test utilities for common operations',
    '✅ Document complex test scenarios',
  ],
} as const;