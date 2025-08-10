/**
 * API service for communicating with CharacterCut backend
 * Implements error handling, retry logic, and performance tracking
 */

import type { ProcessingResponse, ProcessingStatusResponse } from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://viben-apps.dwsstaging.net.au');

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIService {
  private static instance: APIService;
  
  private constructor() {}
  
  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  /**
   * Process image with background removal (simple version for immediate use)
   */
  async processImage(file: File): Promise<ProcessingResponse> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.processImageWithSession(file, sessionId);
  }

  /**
   * Process image with background removal
   * Implements retry logic and performance monitoring
   */
  async processImageWithSession(
    file: File, 
    sessionId: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<ProcessingResponse> {
    const startTime = Date.now();
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);
      
      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      onProgress?.(10, 'Uploading image...');
      
      // DEBUG: Log request details
      console.log('🔍 API DEBUG: === API REQUEST START ===');
      console.log('🔍 API DEBUG: URL:', `${API_BASE_URL}/simple-process`);
      console.log('🔍 API DEBUG: Method: POST');
      console.log('🔍 API DEBUG: FormData file:', file.name, file.type, file.size);
      console.log('🔍 API DEBUG: Session ID:', sessionId);
      
      const response = await fetch(`${API_BASE_URL}/simple-process`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for multipart
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('🔍 API DEBUG: === RESPONSE RECEIVED ===');
      console.log('🔍 API DEBUG: Status:', response.status);
      console.log('🔍 API DEBUG: Status text:', response.statusText);
      console.log('🔍 API DEBUG: Response OK:', response.ok);
      console.log('🔍 API DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
      
      // DEBUG: Log response details
      console.log('=== API RESPONSE RECEIVED ===');
      console.log('Status:', response.status, response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'));
      console.log('All headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('🔍 API DEBUG: === ERROR RESPONSE ===');
        console.log('🔍 API DEBUG: Response not OK, status:', response.status);
        const errorData = await response.json().catch((parseError) => {
          console.log('🔍 API DEBUG: Failed to parse error JSON:', parseError);
          return {};
        });
        console.log('🔍 API DEBUG: Parsed error data:', errorData);
        
        const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        console.log('🔍 API DEBUG: Throwing APIError with message:', errorMessage);
        
        throw new APIError(
          errorMessage,
          response.status,
          errorData
        );
      }
      
      onProgress?.(90, 'Finalizing...');
      
      // DEBUG: Check content type before parsing
      const contentType = response.headers.get('content-type');
      console.log('=== PARSING RESPONSE ===');
      console.log('Content-Type for parsing:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Unexpected response content type:', contentType);
        // Try to read as text to see what we got
        const responseText = await response.text();
        console.log('Response text (first 200 chars):', responseText.substring(0, 200));
        throw new APIError(`Unexpected response type: ${contentType}`, response.status);
      }
      
      console.log('🔍 API DEBUG: Parsing JSON response...');
      const result: ProcessingResponse = await response.json().catch((parseError) => {
        console.log('🔍 API DEBUG: JSON parsing failed:', parseError);
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      });
      console.log('🔍 API DEBUG: === JSON PARSED SUCCESSFULLY ===');
      console.log('🔍 API DEBUG: Parsed result:', result);
      
      // Track processing time
      const processingTime = Date.now() - startTime;
      this.trackProcessingMetrics(result.processing_id, processingTime, true);
      
      onProgress?.(100, 'Complete!');
      
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // DEBUG: Log catch block details
      console.log('=== API REQUEST FAILED ===');
      console.log('Error type:', error.constructor.name);
      console.log('Error message:', error instanceof Error ? error.message : error);
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.log('Processing time:', processingTime);
      
      if (error instanceof APIError) {
        console.log('APIError status:', error.status);
        console.log('APIError response:', error.response);
        this.trackProcessingMetrics('failed', processingTime, false, error.message);
        throw error;
      }
      
      // Handle network errors, timeouts, etc.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.trackProcessingMetrics('failed', processingTime, false, errorMessage);
      
      if (errorMessage.includes('abort')) {
        throw new APIError('Processing timeout. Please try again with a smaller image.', 408);
      }
      
      // Check if we're in production and getting connection refused
      if (API_BASE_URL.includes('localhost') && errorMessage.includes('Failed to fetch')) {
        throw new APIError(
          'Local backend server is not running. Please start the backend server with: npm run start:backend', 
          0
        );
      }
      
      // Production deployment message
      if (!API_BASE_URL.includes('localhost') && (errorMessage.includes('Failed to fetch') || errorMessage.includes('404'))) {
        throw new APIError(
          'Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.', 
          503
        );
      }
      
      throw new APIError(`Network error: ${errorMessage}`, 0);
    }
  }

  /**
   * Get processing status for real-time updates
   */
  async getProcessingStatus(processingId: string): Promise<ProcessingStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${processingId}`);
      
      if (!response.ok) {
        throw new APIError(
          `Failed to get status: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
      
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Status check failed: ${error}`, 0);
    }
  }

  /**
   * Download processed image
   */
  async downloadImage(processingId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/download/${processingId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new APIError('Image not found or has expired', 404);
        }
        throw new APIError(
          `Download failed: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.blob();
      
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Download error: ${error}`, 0);
    }
  }

  /**
   * Refine processed image with manual corrections
   */
  async refineImage(
    originalProcessingId: string,
    refinedImageData: string, // Base64 data URL from canvas
    onProgress?: (progress: number, message: string) => void
  ): Promise<ProcessingResponse> {
    const startTime = Date.now();
    
    try {
      // Convert base64 data URL to blob
      const response = await fetch(refinedImageData);
      const blob = await response.blob();
      
      // Create file from blob
      const refinedFile = new File([blob], 'refined_image.png', { type: 'image/png' });
      
      // Prepare form data
      const formData = new FormData();
      formData.append('refined_image', refinedFile);
      formData.append('original_processing_id', originalProcessingId);
      
      onProgress?.(10, 'Uploading refined image...');
      
      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      console.log('🔍 REFINE API DEBUG: Uploading refined image...');
      console.log('🔍 Original processing ID:', originalProcessingId);
      console.log('🔍 Refined file size:', refinedFile.size);
      
      const apiResponse = await fetch(`${API_BASE_URL}/refine`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP ${apiResponse.status}: ${apiResponse.statusText}`;
        
        throw new APIError(
          errorMessage,
          apiResponse.status,
          errorData
        );
      }
      
      onProgress?.(90, 'Finalizing refined image...');
      
      const result: ProcessingResponse = await apiResponse.json();
      
      // Track processing time
      const processingTime = Date.now() - startTime;
      this.trackProcessingMetrics(result.processing_id, processingTime, true);
      
      onProgress?.(100, 'Refinement complete!');
      
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.log('=== REFINE API REQUEST FAILED ===');
      console.log('Error:', error);
      
      if (error instanceof APIError) {
        this.trackProcessingMetrics('refine_failed', processingTime, false, error.message);
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.trackProcessingMetrics('refine_failed', processingTime, false, errorMessage);
      
      if (errorMessage.includes('abort')) {
        throw new APIError('Refinement timeout. Please try again.', 408);
      }
      
      throw new APIError(`Refinement failed: ${errorMessage}`, 0);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new APIError(`Health check failed: ${response.statusText}`, response.status);
      }
      
      return response.json();
      
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Health check error: ${error}`, 0);
    }
  }

  /**
   * Retry wrapper for API calls
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry client errors (4xx) except for 408 timeout
        if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 408) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Track processing metrics for analytics
   */
  private trackProcessingMetrics(
    processingId: string,
    processingTime: number,
    success: boolean,
    error?: string
  ) {
    // In production, this would send to analytics service
    const metrics = {
      processingId,
      processingTime,
      success,
      error,
      timestamp: new Date().toISOString(),
      under5Seconds: processingTime < 5000
    };
    
    console.log('Processing metrics:', metrics);
    
    // Could send to analytics endpoint or local storage for later batch sending
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('processing_metrics') || '[]');
      existingMetrics.push(metrics);
      
      // Keep only last 50 metrics
      if (existingMetrics.length > 50) {
        existingMetrics.splice(0, existingMetrics.length - 50);
      }
      
      localStorage.setItem('processing_metrics', JSON.stringify(existingMetrics));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

// Export singleton instance
export const apiService = APIService.getInstance();