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
  audioBlob: Blob | null; // Blob is not stored in DB text columns, needs Storage logic or separate handling
  transcript: string;
  summary: string;
  minutes: string; // Formal Ata document
  userNotes: string;
  assemblyType?: 'ORDINÁRIA' | 'EXTRAORDINÁRIA';
  assemblyNumber?: string;
  audioUrl?: string; // Path in Supabase Storage
}

export interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export interface StoredDocument {
  id: string;
  name: string;
  url: string; // We will use this for the path, relying on signed URLs for access
  created_at: string;
  user_id: string;
  type: string;
  size: number;
}

export interface MeetingRecord {
  id: string;
  user_id: string;
  title: string;
  date: string;
  duration: number;
  summary: string;
  transcript: string;
  minutes: string;
  assembly_type: string;
  assembly_number: string;
  created_at: string;
  audio_url?: string;
}