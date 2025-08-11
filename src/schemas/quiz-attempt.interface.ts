/**
 * Interface for quiz attempt event data
 */
export interface QuizAttemptEventData {
  /** Unique identifier for the quiz */
  quizId: string;
  
  /** Score achieved in the quiz (0-100) */
  score: number;
  
  /** Number of attempts made by the user */
  attemptNumber: number;
  
  /** Array of answers provided by the user */
  answers: {
    /** Unique identifier for the question */
    questionId: string;
    
    /** Selected option by the user */
    selectedOption: string;
  }[];
  
  /** Optional: Time taken to complete the quiz in seconds */
  timeSpent?: number;
  
  /** Optional: Maximum possible score */
  maxScore?: number;
}
