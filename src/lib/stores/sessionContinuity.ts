/**
 * Session Continuity Management
 * Handles "Process Another" workflow and maintains user engagement
 * Core requirement for meeting 2+ images per session target
 */

import { writable, derived } from 'svelte/store';
import type { ProcessingResponse } from '../types/app';

export interface ProcessingHistory {
  id: string;
  timestamp: number;
  filename: string;
  processingTime: number;
  success: boolean;
  inputMethod: 'drag' | 'paste' | 'upload';
  recoveryAttempts?: number;
}

export interface SessionContinuityState {
  sessionId: string;
  startTime: number;
  imagesProcessed: number;
  successfulImages: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  sessionDuration: number;
  meetsTarget: boolean;
  showProcessAnotherPrompt: boolean;
  history: ProcessingHistory[];
}

// Session continuity store
export const sessionContinuity = writable<SessionContinuityState>({
  sessionId: generateSessionId(),
  startTime: Date.now(),
  imagesProcessed: 0,
  successfulImages: 0,
  totalProcessingTime: 0,
  averageProcessingTime: 0,
  sessionDuration: 0,
  meetsTarget: false,
  showProcessAnotherPrompt: false,
  history: []
});

// Derived store for UI components
export const continuityStatus = derived(sessionContinuity, ($session) => ({
  isFirstImage: $session.imagesProcessed === 0,
  hasProcessedImages: $session.imagesProcessed > 0,
  meetsTarget: $session.imagesProcessed >= 2,
  shouldShowProcessAnother: $session.successfulImages > 0,
  successRate: $session.imagesProcessed > 0 ? 
    ($session.successfulImages / $session.imagesProcessed) * 100 : 0,
  isActiveSession: $session.sessionDuration < 30 * 60 * 1000, // 30 minutes
  performanceGood: $session.averageProcessingTime < 5000 // < 5 seconds
}));

// Session analytics for success metrics tracking
export const sessionAnalytics = derived(sessionContinuity, ($session) => ({
  sessionDuration: formatDuration($session.sessionDuration),
  imagesPerMinute: $session.sessionDuration > 0 ? 
    ($session.imagesProcessed / ($session.sessionDuration / 60000)).toFixed(1) : '0',
  averageProcessingTime: formatDuration($session.averageProcessingTime),
  mostUsedInputMethod: getMostUsedInputMethod($session.history),
  quickestProcessingTime: getQuickestProcessingTime($session.history),
  sessionScore: calculateSessionScore($session)
}));

/**
 * Session Continuity Actions
 */
export const continuityActions = {
  // Start new session
  startNewSession() {
    sessionContinuity.set({
      sessionId: generateSessionId(),
      startTime: Date.now(),
      imagesProcessed: 0,
      successfulImages: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      sessionDuration: 0,
      meetsTarget: false,
      showProcessAnotherPrompt: false,
      history: []
    });
  },

  // Record successful processing
  recordProcessing(
    filename: string,
    processingTime: number,
    inputMethod: 'drag' | 'paste' | 'upload',
    recoveryAttempts: number = 0
  ) {
    sessionContinuity.update(session => {
      const newEntry: ProcessingHistory = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        filename,
        processingTime,
        success: true,
        inputMethod,
        recoveryAttempts
      };

      const updatedHistory = [...session.history, newEntry];
      const imagesProcessed = session.imagesProcessed + 1;
      const successfulImages = session.successfulImages + 1;
      const totalProcessingTime = session.totalProcessingTime + processingTime;
      const sessionDuration = Date.now() - session.startTime;

      return {
        ...session,
        imagesProcessed,
        successfulImages,
        totalProcessingTime,
        averageProcessingTime: totalProcessingTime / imagesProcessed,
        sessionDuration,
        meetsTarget: imagesProcessed >= 2,
        showProcessAnotherPrompt: true,
        history: updatedHistory
      };
    });

    // Track session continuity analytics
    this.trackContinuityEvent('image_processed', {
      processingTime,
      inputMethod,
      recoveryAttempts
    });
  },

  // Record failed processing
  recordFailure(
    filename: string,
    inputMethod: 'drag' | 'paste' | 'upload',
    recoveryAttempts: number = 0
  ) {
    sessionContinuity.update(session => {
      const newEntry: ProcessingHistory = {
        id: `fail_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        filename,
        processingTime: 0,
        success: false,
        inputMethod,
        recoveryAttempts
      };

      const updatedHistory = [...session.history, newEntry];
      const imagesProcessed = session.imagesProcessed + 1;
      const sessionDuration = Date.now() - session.startTime;

      return {
        ...session,
        imagesProcessed,
        sessionDuration,
        history: updatedHistory
      };
    });

    this.trackContinuityEvent('image_failed', {
      inputMethod,
      recoveryAttempts
    });
  },

  // Handle "Process Another" action
  processAnother() {
    sessionContinuity.update(session => ({
      ...session,
      showProcessAnotherPrompt: false,
      sessionDuration: Date.now() - session.startTime
    }));

    this.trackContinuityEvent('process_another_clicked');
  },

  // End current session
  endSession() {
    sessionContinuity.update(session => {
      const finalDuration = Date.now() - session.startTime;
      
      // Track final session metrics
      this.trackContinuityEvent('session_ended', {
        imagesProcessed: session.imagesProcessed,
        successfulImages: session.successfulImages,
        sessionDuration: finalDuration,
        meetsTarget: session.imagesProcessed >= 2
      });

      return {
        ...session,
        sessionDuration: finalDuration
      };
    });
  },

  // Update session duration (call periodically)
  updateSessionDuration() {
    sessionContinuity.update(session => ({
      ...session,
      sessionDuration: Date.now() - session.startTime
    }));
  },

  // Get session summary for analytics
  getSessionSummary(): Promise<SessionContinuityState & { analytics: any }> {
    return new Promise(resolve => {
      const unsubscribe = sessionContinuity.subscribe(session => {
        unsubscribe();
        
        const analyticsUnsubscribe = sessionAnalytics.subscribe(analytics => {
          analyticsUnsubscribe();
          resolve({ ...session, analytics });
        });
      });
    });
  },

  // Track continuity events for analytics
  trackContinuityEvent(eventType: string, data?: Record<string, any>) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: null, // Will be set by session store
      data: data || {}
    };

    // In production, send to analytics service
    console.log('Session continuity event:', event);

    // Store in localStorage for now
    try {
      const existing = JSON.parse(localStorage.getItem('session_events') || '[]');
      existing.push(event);
      
      // Keep only last 100 events
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem('session_events', JSON.stringify(existing));
    } catch (e) {
      // Ignore localStorage errors
    }
  },

  // Clear session data
  clearSession() {
    continuityActions.startNewSession();
  }
};

/**
 * Utility Functions
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
  return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`;
}

function getMostUsedInputMethod(history: ProcessingHistory[]): string {
  if (history.length === 0) return 'none';
  
  const counts = history.reduce((acc, entry) => {
    acc[entry.inputMethod] = (acc[entry.inputMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
}

function getQuickestProcessingTime(history: ProcessingHistory[]): number {
  const successfulTimes = history
    .filter(entry => entry.success && entry.processingTime > 0)
    .map(entry => entry.processingTime);
  
  return successfulTimes.length > 0 ? Math.min(...successfulTimes) : 0;
}

function calculateSessionScore(session: SessionContinuityState): number {
  let score = 0;
  
  // Base score for processing images
  score += session.imagesProcessed * 20;
  
  // Bonus for successful processing
  score += session.successfulImages * 10;
  
  // Bonus for meeting target (2+ images)
  if (session.meetsTarget) score += 50;
  
  // Performance bonus (under 5s average)
  if (session.averageProcessingTime < 5000) score += 20;
  
  // Engagement bonus for extended sessions
  if (session.sessionDuration > 5 * 60 * 1000) score += 30; // 5+ minutes
  
  return Math.min(score, 100); // Cap at 100
}

// Initialize session on module load
if (typeof window !== 'undefined') {
  // Update session duration every 30 seconds
  setInterval(() => {
    continuityActions.updateSessionDuration();
  }, 30000);
  
  // End session when page is about to unload
  window.addEventListener('beforeunload', () => {
    continuityActions.endSession();
  });
}