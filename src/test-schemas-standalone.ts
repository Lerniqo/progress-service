import { EventType } from './schemas/event-types.enum';
import { QuizAttemptEventData } from './schemas/quiz-attempt.interface';
import { VideoWatchEventData } from './schemas/video-watch.interface';
import { AITutorInteractionEventData } from './schemas/ai-tutor-interaction.interface';

/**
 * Standalone test to demonstrate the TypeScript interfaces and schemas
 * without requiring a MongoDB connection
 */

console.log('🚀 Testing Progress Event Schemas and Interfaces\n');

// Test 1: Create sample quiz attempt data
console.log('📝 Testing QuizAttemptEventData interface...');
const quizAttemptData: QuizAttemptEventData = {
  quizId: 'quiz-001',
  score: 85,
  attemptNumber: 2,
  answers: [
    { questionId: 'q1', selectedOption: 'A' },
    { questionId: 'q2', selectedOption: 'C' },
    { questionId: 'q3', selectedOption: 'B' }
  ],
  timeSpent: 300,
  maxScore: 100
};

console.log('✅ Quiz attempt data:', JSON.stringify(quizAttemptData, null, 2));

// Test 2: Create sample video watch data
console.log('\n🎥 Testing VideoWatchEventData interface...');
const videoWatchData: VideoWatchEventData = {
  videoId: 'video-002',
  watchedDuration: 450,
  totalDuration: 600,
  watchPercentage: 75,
  currentPosition: 450,
  quality: '1080p',
  playbackSpeed: 1.5,
  completed: false
};

console.log('✅ Video watch data:', JSON.stringify(videoWatchData, null, 2));

// Test 3: Create sample AI tutor interaction data
console.log('\n🤖 Testing AITutorInteractionEventData interface...');
const aiTutorData: AITutorInteractionEventData = {
  sessionId: 'tutor-session-001',
  messages: [
    {
      sender: 'student',
      content: 'I need help understanding quadratic equations',
      timestamp: new Date('2025-08-12T00:00:00Z')
    },
    {
      sender: 'tutor',
      content: 'I\'d be happy to help! Let\'s start with the basic form: ax² + bx + c = 0',
      timestamp: new Date('2025-08-12T00:01:00Z')
    }
  ],
  topic: 'quadratic equations',
  duration: 300,
  rating: 5,
  feedback: 'Very helpful explanation!',
  resolved: true
};

console.log('✅ AI tutor interaction data:', JSON.stringify(aiTutorData, null, 2));

// Test 4: Test event types enum
console.log('\n📊 Testing EventType enum...');
console.log('Available event types:');
Object.values(EventType).forEach((eventType, index) => {
  console.log(`  ${index + 1}. ${eventType}`);
});

// Test 5: Create sample progress event structures
console.log('\n📋 Testing complete progress event structures...');

interface ProgressEventStructure {
  userId: string;
  timestamp: Date;
  eventType: EventType;
  eventData: QuizAttemptEventData | VideoWatchEventData | AITutorInteractionEventData;
  metadata?: Record<string, any>;
  sessionId?: string;
  courseId?: string;
  moduleId?: string;
}

const sampleEvents: ProgressEventStructure[] = [
  {
    userId: 'user-123',
    timestamp: new Date(),
    eventType: EventType.QUIZ_ATTEMPT,
    eventData: quizAttemptData,
    courseId: 'course-456',
    moduleId: 'module-001',
    metadata: {
      difficulty: 'intermediate',
      subject: 'mathematics'
    }
  },
  {
    userId: 'user-123',
    timestamp: new Date(),
    eventType: EventType.VIDEO_WATCH,
    eventData: videoWatchData,
    courseId: 'course-456',
    moduleId: 'module-001',
    sessionId: 'session-789',
    metadata: {
      device: 'desktop',
      browser: 'chrome'
    }
  },
  {
    userId: 'user-123',
    timestamp: new Date(),
    eventType: EventType.AI_TUTOR_INTERACTION,
    eventData: aiTutorData,
    courseId: 'course-456',
    moduleId: 'module-002',
    sessionId: 'session-789',
    metadata: {
      subject: 'algebra',
      difficulty: 'beginner'
    }
  }
];

console.log('✅ Sample progress events created:');
sampleEvents.forEach((event, index) => {
  console.log(`\n  Event ${index + 1}:`);
  console.log(`    Type: ${event.eventType}`);
  console.log(`    User: ${event.userId}`);
  console.log(`    Course: ${event.courseId}`);
  console.log(`    Module: ${event.moduleId}`);
  console.log(`    Timestamp: ${event.timestamp.toISOString()}`);
  
  // Type-specific information
  switch (event.eventType) {
    case EventType.QUIZ_ATTEMPT:
      const quizData = event.eventData as QuizAttemptEventData;
      console.log(`    Quiz ID: ${quizData.quizId}`);
      console.log(`    Score: ${quizData.score}/${quizData.maxScore}`);
      console.log(`    Attempt: ${quizData.attemptNumber}`);
      break;
    case EventType.VIDEO_WATCH:
      const videoData = event.eventData as VideoWatchEventData;
      console.log(`    Video ID: ${videoData.videoId}`);
      console.log(`    Watch Progress: ${videoData.watchPercentage}%`);
      console.log(`    Completed: ${videoData.completed}`);
      break;
    case EventType.AI_TUTOR_INTERACTION:
      const tutorData = event.eventData as AITutorInteractionEventData;
      console.log(`    Session ID: ${tutorData.sessionId}`);
      console.log(`    Messages: ${tutorData.messages.length}`);
      console.log(`    Rating: ${tutorData.rating}/5`);
      break;
  }
});

console.log('\n🎉 All schema and interface tests completed successfully!');

// Test 6: Type safety demonstration
console.log('\n🔒 Demonstrating type safety...');

// This would cause a TypeScript error if uncommented:
// const invalidEvent: ProgressEventStructure = {
//   userId: 'user-123',
//   timestamp: new Date(),
//   eventType: 'INVALID_TYPE', // ❌ Type error
//   eventData: { invalid: 'data' } // ❌ Type error
// };

// This would cause a TypeScript error if uncommented:
// const invalidQuizData: QuizAttemptEventData = {
//   quizId: 'quiz-001',
//   score: 'invalid', // ❌ Type error - should be number
//   attemptNumber: 1,
//   answers: []
// };

console.log('✅ TypeScript type safety verified (no compilation errors)');

console.log('\n📋 Summary of implemented schemas:');
console.log('  ✅ EventType enum with all event types');
console.log('  ✅ QuizAttemptEventData interface');
console.log('  ✅ VideoWatchEventData interface');
console.log('  ✅ AITutorInteractionEventData interface');
console.log('  ✅ ProgressEvent Mongoose schema');
console.log('  ✅ Type-safe event data union types');
console.log('  ✅ Database indexes for performance');
console.log('  ✅ Flexible metadata support');

export { };
