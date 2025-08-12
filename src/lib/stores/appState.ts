/**
 * Central application state management
 * Implements session continuity and workflow state tracking
 */

import { writable, derived } from 'svelte/store';
import type { ProcessingState, SessionData, ImageData } from '../types/app';

// Session management
export const sessionId = writable<string>(generateSessionId());
export const sessionData = writable<SessionData>({
  imagesProcessed: 0,
  startTime: new Date(),
  lastActivity: new Date()
});

// Processing state management
export const processingState = writable<ProcessingState>({
  status: 'idle', // 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: 0,
  message: '',
  processingId: null,
  error: null
});

// Image data management
export const currentImage = writable<ImageData | null>(null);
export const processedImage = writable<ImageData | null>(null);

// UI state
export const showPreview = writable<boolean>(false);
export const isDropzoneActive = writable<boolean>(false);
export const clipboardSupported = writable<boolean>(false);

// Session continuity derived store
export const sessionContinuity = derived(
  [sessionData, processingState],
  ([$sessionData, $processingState]) => ({
    shouldShowProcessAnother: $sessionData.imagesProcessed > 0 && $processingState.status === 'completed',
    meetsTarget: $sessionData.imagesProcessed >= 2,
    sessionDuration: Date.now() - $sessionData.startTime.getTime()
  })
);

// Processing analytics derived store
export const processingAnalytics = derived(
  [processingState, sessionData],
  ([$processingState, $sessionData]) => ({
    isUnder5Seconds: $processingState.processingTime ? $processingState.processingTime < 5000 : null,
    averageProcessingTime: $sessionData.totalProcessingTime ? 
      $sessionData.totalProcessingTime / $sessionData.imagesProcessed : null,
    successRate: $sessionData.imagesProcessed > 0 ? 
      ($sessionData.successfulProcesses || 0) / $sessionData.imagesProcessed : null
  })
);

// Combined app state for easy access
export const appState = derived(
  [processingState, currentImage, processedImage, isDropzoneActive, clipboardSupported],
  ([$processingState, $currentImage, $processedImage, $isDropzoneActive, $clipboardSupported]) => ({
    processingState: $processingState,
    currentImage: $currentImage,
    processedImage: $processedImage,
    isDropzoneActive: $isDropzoneActive,
    clipboardSupported: $clipboardSupported
  })
);

// Actions for state management
export const appActions = {
  // Session management
  updateSessionActivity() {
    sessionData.update(data => ({
      ...data,
      lastActivity: new Date()
    }));
  },

  incrementImagesProcessed(processingTime: number, success: boolean = true) {
    sessionData.update(data => ({
      ...data,
      imagesProcessed: data.imagesProcessed + 1,
      totalProcessingTime: (data.totalProcessingTime || 0) + processingTime,
      successfulProcesses: success ? (data.successfulProcesses || 0) + 1 : (data.successfulProcesses || 0),
      lastActivity: new Date()
    }));
  },

  // Processing state management
  setProcessingState(updates: Partial<ProcessingState>) {
    processingState.update(state => ({ ...state, ...updates }));
  },

  setProcessingStatus(status: ProcessingState['status']) {
    processingState.update(state => ({ ...state, status }));
  },

  // Complete reset for session continuity
  reset() {
    appActions.resetProcessing();
    sessionId.set(generateSessionId());
  },

  startProcessing(processingId: string) {
    processingState.set({
      status: 'processing',
      progress: 0,
      message: 'Initializing background removal...',
      processingId,
      error: null,
      startTime: Date.now()
    });
  },

  updateProgress(progress: number, message: string) {
    processingState.update(state => ({
      ...state,
      progress,
      message
    }));
  },

  completeProcessing(downloadUrl: string, processingTime: number) {
    processingState.update(state => ({
      ...state,
      status: 'completed',
      progress: 100,
      message: 'Processing complete!',
      downloadUrl,
      processingTime
    }));
    
    // Update session data
    appActions.incrementImagesProcessed(processingTime, true);
  },

  setError(error: string) {
    processingState.update(state => ({
      ...state,
      status: 'error',
      error,
      message: 'Processing failed'
    }));
    
    // Update session data for failure
    appActions.incrementImagesProcessed(0, false);
  },

  resetProcessing() {
    processingState.set({
      status: 'idle',
      progress: 0,
      message: '',
      processingId: null,
      error: null
    });
    currentImage.set(null);
    processedImage.set(null);
    showPreview.set(false);
  },

  // Image management
  setCurrentImage(image: ImageData) {
    currentImage.set(image);
    appActions.updateSessionActivity();
  },

  setProcessedImage(image: ImageData) {
    processedImage.set(image);
  },

  // UI state management
  setDropzoneActive(active: boolean) {
    isDropzoneActive.set(active);
  },

  setClipboardSupported(supported: boolean) {
    clipboardSupported.set(supported);
  },

  togglePreview() {
    showPreview.update(show => !show);
  }
};

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Browser clipboard support detection
export function detectClipboardSupport(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.read);
}

// Initialize clipboard support detection
if (typeof window !== 'undefined') {
  appActions.setClipboardSupported(detectClipboardSupport());
}