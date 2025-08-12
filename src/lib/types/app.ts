/**
 * Type definitions for CharacterCut application
 */

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  processingId: string | null;
  error: string | null;
  startTime?: number;
  processingTime?: number;
  downloadUrl?: string;
}

export interface SessionData {
  imagesProcessed: number;
  startTime: Date;
  lastActivity: Date;
  totalProcessingTime?: number;
  successfulProcesses?: number;
}

export interface ImageData {
  file: File;
  preview: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format: string;
}

export interface ProcessingResponse {
  processing_id: string;
  session_id: string;
  download_url: string;
  processing_time: number;
  expires_at: string;
}

// Alias for easier use in components
export type ProcessingResult = ProcessingResponse;

export interface ProcessingStatusResponse {
  processing_id: string;
  status: string;
  progress: number;
  message?: string;
  estimated_completion?: string;
}

export interface AnalyticsEvent {
  event_type: string;
  session_hash: string;
  timestamp: string;
  additional_data?: Record<string, any>;
}

export interface ClipboardReadResult {
  success: boolean;
  file?: File;
  error?: string;
}

export interface DropzoneEvent {
  type: 'drag-enter' | 'drag-leave' | 'drag-over' | 'drop';
  files?: FileList;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface BatchProcessingResult {
  index: number;
  processing_id: string;
  success: boolean;
  download_url?: string;
  filename: string;
  expires_at?: string;
  error?: string;
}

export interface BatchProcessingResponse {
  batch_id: string;
  session_id: string;
  total_images: number;
  successful_count: number;
  failed_count: number;
  processing_time: number;
  results: BatchProcessingResult[];
}