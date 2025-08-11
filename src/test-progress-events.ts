import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { 
  ProgressEvent, 
  ProgressEventDocument, 
  EventType,
  QuizAttemptEventData,
  VideoWatchEventData,
  AITutorInteractionEventData
} from './schemas/progress.schema';

/**
 * Test script to insert sample progress events into MongoDB
 * and demonstrate the schema functionality
 */
async function testProgressEvents() {
  console.log('🚀 Starting progress events test...\n');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the ProgressEvent model
    const progressEventModel = app.get<Model<ProgressEventDocument>>(
      getModelToken(ProgressEvent.name)
    );

    const userId = 'test-user-123';
    const courseId = 'course-456';
    const sessionId = 'session-789';

    // Test 1: Quiz Attempt Event
    console.log('📝 Testing QUIZ_ATTEMPT event...');
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

    const quizEvent = new progressEventModel({
      userId,
      timestamp: new Date(),
      eventType: EventType.QUIZ_ATTEMPT,
      eventData: quizAttemptData,
      courseId,
      moduleId: 'module-001',
      metadata: {
        difficulty: 'intermediate',
        subject: 'mathematics'
      }
    });

    const savedQuizEvent = await quizEvent.save();
    console.log('✅ Quiz attempt event saved:', {
      id: savedQuizEvent._id,
      eventType: savedQuizEvent.eventType,
      score: (savedQuizEvent.eventData as QuizAttemptEventData).score
    });

    // Test 2: Video Watch Event
    console.log('\n🎥 Testing VIDEO_WATCH event...');
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

    const videoEvent = new progressEventModel({
      userId,
      timestamp: new Date(),
      eventType: EventType.VIDEO_WATCH,
      eventData: videoWatchData,
      courseId,
      moduleId: 'module-001',
      sessionId,
      metadata: {
        device: 'desktop',
        browser: 'chrome'
      }
    });

    const savedVideoEvent = await videoEvent.save();
    console.log('✅ Video watch event saved:', {
      id: savedVideoEvent._id,
      eventType: savedVideoEvent.eventType,
      watchPercentage: (savedVideoEvent.eventData as VideoWatchEventData).watchPercentage
    });

    // Test 3: AI Tutor Interaction Event
    console.log('\n🤖 Testing AI_TUTOR_INTERACTION event...');
    const aiTutorData: AITutorInteractionEventData = {
      sessionId: 'tutor-session-001',
      messages: [
        {
          sender: 'student',
          content: 'I need help understanding quadratic equations',
          timestamp: new Date(Date.now() - 120000) // 2 minutes ago
        },
        {
          sender: 'tutor',
          content: 'I\'d be happy to help! Let\'s start with the basic form: ax² + bx + c = 0',
          timestamp: new Date(Date.now() - 110000)
        },
        {
          sender: 'student',
          content: 'Can you give me an example?',
          timestamp: new Date(Date.now() - 90000)
        },
        {
          sender: 'tutor',
          content: 'Sure! Let\'s solve x² - 5x + 6 = 0 using factoring.',
          timestamp: new Date(Date.now() - 60000)
        }
      ],
      topic: 'quadratic equations',
      duration: 300,
      rating: 5,
      feedback: 'Very helpful explanation!',
      resolved: true
    };

    const aiTutorEvent = new progressEventModel({
      userId,
      timestamp: new Date(),
      eventType: EventType.AI_TUTOR_INTERACTION,
      eventData: aiTutorData,
      courseId,
      moduleId: 'module-002',
      sessionId,
      metadata: {
        subject: 'algebra',
        difficulty: 'beginner'
      }
    });

    const savedAIEvent = await aiTutorEvent.save();
    console.log('✅ AI tutor interaction event saved:', {
      id: savedAIEvent._id,
      eventType: savedAIEvent.eventType,
      messagesCount: (savedAIEvent.eventData as AITutorInteractionEventData).messages.length,
      rating: (savedAIEvent.eventData as AITutorInteractionEventData).rating
    });

    // Test 4: Query events by user
    console.log('\n🔍 Querying events for user:', userId);
    const userEvents = await progressEventModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .exec();

    console.log(`Found ${userEvents.length} events for user ${userId}:`);
    userEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.eventType} at ${event.timestamp.toISOString()}`);
    });

    // Test 5: Query events by type
    console.log('\n📊 Querying QUIZ_ATTEMPT events...');
    const quizEvents = await progressEventModel
      .find({ eventType: EventType.QUIZ_ATTEMPT })
      .sort({ timestamp: -1 })
      .exec();

    console.log(`Found ${quizEvents.length} quiz attempt events:`);
    quizEvents.forEach((event, index) => {
      const eventData = event.eventData as QuizAttemptEventData;
      console.log(`  ${index + 1}. Quiz ${eventData.quizId} - Score: ${eventData.score}/${eventData.maxScore || 100}`);
    });

    console.log('\n🎉 All tests completed successfully!');

    // Clean up test data (optional)
    console.log('\n🧹 Cleaning up test data...');
    await progressEventModel.deleteMany({ userId });
    console.log('✅ Test data cleaned up');

    await app.close();

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testProgressEvents()
    .then(() => {
      console.log('\n✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}
