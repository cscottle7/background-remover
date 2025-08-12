/**
 * Privacy-compliant frontend analytics service
 * Implements Phase 5 requirements for success metrics tracking
 */

import type { ImageData, ProcessingResponse } from '../types/app';

export interface AnalyticsEvent {
  event_type: string;
  session_hash: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface UserJourneyEvent {
  session_hash: string;
  event_type: 'session_start' | 'image_upload' | 'processing_start' | 'processing_complete' | 'download' | 'process_another' | 'session_end';
  input_method?: 'drag' | 'paste' | 'upload';
  additional_data?: Record<string, any>;
}

export interface SessionMetrics {
  session_hash: string;
  start_time: number;
  images_processed: number;
  total_processing_time: number;
  successful_completions: number;
  failed_attempts: number;
  meets_continuity_target: boolean;
  session_duration: number;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private sessionHash: string;
  private sessionStartTime: number;
  private sessionMetrics: SessionMetrics;

  constructor() {
    // Generate anonymous session hash for privacy
    this.sessionHash = this.generateSessionHash();
    this.sessionStartTime = Date.now();
    
    this.sessionMetrics = {
      session_hash: this.sessionHash,
      start_time: this.sessionStartTime,
      images_processed: 0,
      total_processing_time: 0,
      successful_completions: 0,
      failed_attempts: 0,
      meets_continuity_target: false,
      session_duration: 0
    };
    
    this.initializeSession();
  }

  private generateSessionHash(): string {
    // Generate privacy-compliant session identifier
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const combined = `${timestamp}_${random}`;
    
    // Simple hash to anonymize
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `session_${Math.abs(hash).toString(36)}`;
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // In a real implementation, this would send to analytics endpoint
      console.log('📊 Analytics Event:', event);
      
      // For MVP, we could send to a simple analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
      
    } catch (error) {
      console.warn('Analytics event failed:', error);
      // Silently fail to avoid disrupting user experience
    }
  }

  private async initializeSession(): Promise<void> {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;
    
    await this.trackEvent('session_start', {
      user_agent: navigator.userAgent.substring(0, 100), // Truncated for privacy
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      referrer: (typeof document !== 'undefined' ? document.referrer : '') || 'direct',
      timestamp: new Date().toISOString()
    });
  }

  async trackEvent(eventType: string, data?: Record<string, any>): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: eventType,
      session_hash: this.sessionHash,
      timestamp: new Date().toISOString(),
      data: data || {}
    };

    await this.sendEvent(event);
  }

  // KPI Tracking Methods (Phase 5 requirements)

  /**
   * Track unique active users (KPI requirement: 250 users)
   */
  async trackUniqueUser(referrer?: string): Promise<void> {
    await this.trackEvent('unique_session', {
      referrer: referrer || (typeof document !== 'undefined' ? document.referrer : '') || 'direct',
      is_return_user: this.isReturnUser()
    });
  }

  /**
   * Track image processing start
   */
  async trackProcessingStart(image: ImageData, inputMethod: 'drag' | 'paste' | 'upload'): Promise<void> {
    this.sessionMetrics.images_processed++;
    
    await this.trackEvent('processing_start', {
      input_method: inputMethod,
      file_size: image.file.size,
      file_type: image.file.type,
      image_dimensions: image.dimensions
    });
  }

  /**
   * Track task completion rate (KPI requirement: 95%)
   */
  async trackTaskCompletion(success: boolean, processingTime: number, error?: string): Promise<void> {
    this.sessionMetrics.total_processing_time += processingTime;
    
    if (success) {
      this.sessionMetrics.successful_completions++;
    } else {
      this.sessionMetrics.failed_attempts++;
    }

    await this.trackEvent('task_completion', {
      success,
      processing_time_seconds: processingTime,
      under_5_seconds: processingTime < 5.0, // Key performance metric
      error_type: error ? this.classifyError(error) : undefined
    });
  }

  /**
   * Track batch processing completion
   */
  async trackBatchCompletion(successfulCount: number, totalImages: number): Promise<void> {
    const success = successfulCount > 0;
    const completionRate = totalImages > 0 ? (successfulCount / totalImages) * 100 : 0;
    
    this.sessionMetrics.images_processed += totalImages;
    this.sessionMetrics.successful_completions += successfulCount;
    this.sessionMetrics.failed_attempts += (totalImages - successfulCount);
    
    await this.trackEvent('batch_completion', {
      successful_count: successfulCount,
      total_images: totalImages,
      completion_rate: completionRate,
      success: success,
      batch_size: totalImages
    });
  }

  /**
   * Track session continuity (KPI requirement: 2+ images per session)
   */
  async trackSessionContinuity(): Promise<void> {
    this.sessionMetrics.meets_continuity_target = this.sessionMetrics.images_processed >= 2;
    
    await this.trackEvent('session_continuity', {
      images_processed: this.sessionMetrics.images_processed,
      meets_target: this.sessionMetrics.meets_continuity_target,
      avg_processing_time: this.sessionMetrics.total_processing_time / Math.max(1, this.sessionMetrics.successful_completions)
    });
  }

  /**
   * Track download event
   */
  async trackDownload(format: string, fileSize?: number): Promise<void> {
    await this.trackEvent('download', {
      format,
      file_size: fileSize,
      time_to_download: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track user choosing to process another image
   */
  async trackProcessAnother(): Promise<void> {
    await this.trackEvent('process_another', {
      session_images_count: this.sessionMetrics.images_processed,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track NPS survey response
   */
  async trackNPSResponse(score: number, feedback?: string): Promise<void> {
    await this.trackEvent('nps_response', {
      score,
      has_feedback: !!feedback,
      feedback_length: feedback?.length || 0,
      session_images_processed: this.sessionMetrics.images_processed
    });
  }

  /**
   * Track qualitative feedback submission
   */
  async trackFeedbackSubmission(feedbackType: string, content: string): Promise<void> {
    await this.trackEvent('feedback_submission', {
      feedback_type: feedbackType,
      content_length: content.length,
      session_context: {
        images_processed: this.sessionMetrics.images_processed,
        successful_completions: this.sessionMetrics.successful_completions,
        failed_attempts: this.sessionMetrics.failed_attempts
      }
    });
  }

  /**
   * End session tracking
   */
  async endSession(): Promise<void> {
    this.sessionMetrics.session_duration = Date.now() - this.sessionStartTime;
    
    await this.trackEvent('session_end', {
      session_summary: this.sessionMetrics,
      completion_rate: this.sessionMetrics.successful_completions / Math.max(1, this.sessionMetrics.images_processed),
      avg_processing_time: this.sessionMetrics.total_processing_time / Math.max(1, this.sessionMetrics.successful_completions)
    });
  }

  // Utility methods

  private isReturnUser(): boolean {
    // Check if user has visited before using localStorage
    if (typeof window === 'undefined') return false;
    
    const hasVisited = localStorage.getItem('charactercut_visited');
    if (!hasVisited) {
      localStorage.setItem('charactercut_visited', '1');
      return false;
    }
    return true;
  }

  private classifyError(error: string): string {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('network') || errorLower.includes('fetch')) {
      return 'network';
    } else if (errorLower.includes('size') || errorLower.includes('large')) {
      return 'file_size';
    } else if (errorLower.includes('format') || errorLower.includes('type')) {
      return 'file_format';
    } else if (errorLower.includes('timeout')) {
      return 'timeout';
    } else {
      return 'unknown';
    }
  }

  // Getters for external access
  get sessionId(): string {
    return this.sessionHash;
  }

  get metrics(): SessionMetrics {
    return { ...this.sessionMetrics };
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Global analytics instance
export const analyticsService = new AnalyticsService();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsService.endSession();
  });
}