import { Schema } from 'mongoose';
import {
  ProgressEvent,
  ProgressEventSchema,
  EventType,
  QuizAttemptEventData,
  VideoWatchEventData,
  AiTutorInteractionEventData,
} from './progress-events.schema';

describe('ProgressEventSchema', () => {
  describe('Schema Structure', () => {
    it('should have correct schema definition', () => {
      expect(ProgressEventSchema).toBeInstanceOf(Schema);
      expect(ProgressEventSchema.paths).toBeDefined();

      // Check required fields exist in schema
      expect(ProgressEventSchema.paths.userId).toBeDefined();
      expect(ProgressEventSchema.paths.eventType).toBeDefined();
      expect(ProgressEventSchema.paths.eventData).toBeDefined();
      expect(ProgressEventSchema.paths.timestamp).toBeDefined();

      // Check field requirements
      expect(ProgressEventSchema.paths.userId.isRequired).toBe(true);
      expect(ProgressEventSchema.paths.eventType.isRequired).toBe(true);
      expect(ProgressEventSchema.paths.eventData.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      expect(ProgressEventSchema.options.timestamps).toBe(true);
    });

    it('should use correct collection name', () => {
      expect(ProgressEventSchema.options.collection).toBe('progress_events');
    });

    it('should validate eventType enum values', () => {
      const eventTypePath = ProgressEventSchema.paths.eventType;
      expect(eventTypePath.enumValues).toContain(EventType.QUIZ_ATTEMPT);
      expect(eventTypePath.enumValues).toContain(EventType.VIDEO_WATCH);
      expect(eventTypePath.enumValues).toContain(
        EventType.AI_TUTOR_INTERACTION,
      );
    });
  });

  describe('EventType Enum', () => {
    it('should have correct event type values', () => {
      expect(EventType.QUIZ_ATTEMPT).toBe('QUIZ_ATTEMPT');
      expect(EventType.VIDEO_WATCH).toBe('VIDEO_WATCH');
      expect(EventType.AI_TUTOR_INTERACTION).toBe('AI_TUTOR_INTERACTION');
    });
  });

  describe('TypeScript Interfaces', () => {
    it('should validate QuizAttemptEventData structure', () => {
      const quizData: QuizAttemptEventData = {
        quizId: 'quiz123',
        score: 85,
        totalQuestions: 10,
        correctAnswers: 8,
        timeSpent: 300,
        answers: [
          {
            questionId: 'q1',
            selectedAnswer: 'A',
            correct: true,
            timeSpent: 30,
          },
        ],
        completedAt: new Date(),
        isRetake: false,
      };

      // This test passes if TypeScript compilation succeeds
      expect(quizData.quizId).toBe('quiz123');
      expect(quizData.score).toBe(85);
      expect(quizData.answers).toHaveLength(1);
    });

    it('should validate VideoWatchEventData structure', () => {
      const videoData: VideoWatchEventData = {
        videoId: 'video123',
        videoDuration: 600,
        watchedDuration: 450,
        watchProgress: 75,
        playbackSpeed: 1.5,
        watchSessions: [
          {
            startTime: 0,
            endTime: 300,
            watchedAt: new Date(),
          },
        ],
        completed: false,
        lastPosition: 450,
      };

      // This test passes if TypeScript compilation succeeds
      expect(videoData.videoId).toBe('video123');
      expect(videoData.watchProgress).toBe(75);
      expect(videoData.watchSessions).toHaveLength(1);
    });

    it('should validate AiTutorInteractionEventData structure', () => {
      const aiData: AiTutorInteractionEventData = {
        sessionId: 'session123',
        messageCount: 5,
        totalTokens: 250,
        interactionDuration: 180,
        topics: ['algebra', 'equations'],
        messages: [
          {
            role: 'user',
            content: 'Help me solve this equation',
            timestamp: new Date(),
            tokens: 50,
          },
        ],
        resolved: true,
        category: 'math',
      };

      // This test passes if TypeScript compilation succeeds
      expect(aiData.sessionId).toBe('session123');
      expect(aiData.topics).toContain('algebra');
      expect(aiData.messages).toHaveLength(1);
      expect(aiData.messages[0].role).toBe('user');
    });
  });
});
