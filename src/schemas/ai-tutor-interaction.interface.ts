/**
 * Interface for AI tutor interaction event data
 */
export interface AITutorInteractionEventData {
  /** Unique identifier for the tutoring session */
  sessionId: string;
  
  /** Array of messages exchanged in the session */
  messages: {
    /** Who sent the message */
    sender: 'student' | 'tutor';
    
    /** Content of the message */
    content: string;
    
    /** Timestamp when the message was sent */
    timestamp: Date;
  }[];
  
  /** Optional: Subject or topic of the interaction */
  topic?: string;
  
  /** Optional: Duration of the interaction in seconds */
  duration?: number;
  
  /** Optional: Rating given by student (1-5) */
  rating?: number;
  
  /** Optional: Feedback provided by student */
  feedback?: string;
  
  /** Optional: Whether the session was resolved */
  resolved?: boolean;
}
