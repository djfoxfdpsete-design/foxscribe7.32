export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW'
}

export interface MeetingData {
  id: string;
  title: string;
  date: Date;
  duration: number; // in seconds
  audioBlob: Blob | null;
  transcript: string;
  summary: string;
  minutes: string; // Formal Ata document
  userNotes: string;
  assemblyType?: 'ORDINÁRIA' | 'EXTRAORDINÁRIA';
  assemblyNumber?: string;
}

export interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}