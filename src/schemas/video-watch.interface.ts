/**
 * Interface for video watch event data
 */
export interface VideoWatchEventData {
  /** Unique identifier for the video */
  videoId: string;
  
  /** Duration watched in seconds */
  watchedDuration: number;
  
  /** Total duration of the video in seconds */
  totalDuration: number;
  
  /** Optional: Percentage of video watched (0-100) */
  watchPercentage?: number;
  
  /** Optional: Current playback position when event was triggered */
  currentPosition?: number;
  
  /** Optional: Video quality setting used */
  quality?: string;
  
  /** Optional: Playback speed used (e.g., 1.0, 1.5, 2.0) */
  playbackSpeed?: number;
  
  /** Optional: Whether the video was completed */
  completed?: boolean;
}
