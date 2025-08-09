/**
 * Progressive Error Recovery Service
 * Implements auto-retry and format conversion without breaking user flow
 * Core requirement for maintaining Chloe's seamless experience
 */

import { apiService } from './api';
import { compressImageIfNeeded } from '../utils/imageValidation';
import { errorClassificationService } from './errorClassification';
import type { ProcessingResponse } from '../types/app';

export interface RecoveryAttempt {
  attemptNumber: number;
  strategy: RecoveryStrategy;
  timestamp: number;
  success: boolean;
  error?: string;
}

export type RecoveryStrategy = 
  | 'retry_original'
  | 'compress_image' 
  | 'convert_format'
  | 'reduce_quality'
  | 'fallback_api';

export interface RecoveryConfig {
  maxAttempts: number;
  strategies: RecoveryStrategy[];
  delayMs: number;
  enableLogging: boolean;
}

export interface RecoveryResult {
  success: boolean;
  result?: ProcessingResponse;
  error?: string;
  attempts: RecoveryAttempt[];
  totalTime: number;
  finalStrategy?: RecoveryStrategy;
}

export class ProgressiveErrorRecovery {
  private static instance: ProgressiveErrorRecovery;
  
  private config: RecoveryConfig = {
    maxAttempts: 4,
    strategies: ['retry_original', 'compress_image', 'convert_format', 'reduce_quality'],
    delayMs: 500,
    enableLogging: true
  };

  private constructor() {}

  static getInstance(): ProgressiveErrorRecovery {
    if (!ProgressiveErrorRecovery.instance) {
      ProgressiveErrorRecovery.instance = new ProgressiveErrorRecovery();
    }
    return ProgressiveErrorRecovery.instance;
  }

  /**
   * Process image with progressive error recovery
   */
  async processWithRecovery(
    originalFile: File,
    sessionId: string,
    onProgress?: (progress: number, message: string, attempt?: number) => void
  ): Promise<RecoveryResult> {
    console.log('🔍 ERROR RECOVERY DEBUG: processWithRecovery started');
    console.log('🔍 ERROR RECOVERY DEBUG: File:', originalFile.name, originalFile.size, originalFile.type);
    console.log('🔍 ERROR RECOVERY DEBUG: Session ID:', sessionId);
    
    const startTime = Date.now();
    const attempts: RecoveryAttempt[] = [];
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      const strategy = this.getStrategyForAttempt(attempt, lastError);
      
      onProgress?.(
        10 + (attempt - 1) * 20, 
        this.getProgressMessage(strategy, attempt),
        attempt
      );

      try {
        console.log(`🔍 ERROR RECOVERY DEBUG: Attempt ${attempt} using strategy: ${strategy}`);
        const processedFile = await this.applyRecoveryStrategy(originalFile, strategy);
        console.log(`🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: ${processedFile.size}`);
        
        const attemptStart = Date.now();
        console.log(`🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...`);
        const result = await apiService.processImageWithSession(
          processedFile, 
          sessionId,
          (progress, message) => onProgress?.(
            10 + (attempt - 1) * 20 + progress * 0.6, 
            message,
            attempt
          )
        );
        
        console.log(`🔍 ERROR RECOVERY DEBUG: API call succeeded on attempt ${attempt}:`, result);

        // Success!
        const successAttempt: RecoveryAttempt = {
          attemptNumber: attempt,
          strategy,
          timestamp: attemptStart,
          success: true
        };
        attempts.push(successAttempt);

        if (this.config.enableLogging) {
          console.log(`Recovery success on attempt ${attempt} with strategy: ${strategy}`);
        }

        return {
          success: true,
          result,
          attempts,
          totalTime: Date.now() - startTime,
          finalStrategy: strategy
        };

      } catch (error) {
        console.log(`🔍 ERROR RECOVERY DEBUG: Attempt ${attempt} failed with error:`, error);
        console.log(`🔍 ERROR RECOVERY DEBUG: Error type:`, typeof error);
        console.log(`🔍 ERROR RECOVERY DEBUG: Error instanceof Error:`, error instanceof Error);
        if (error instanceof Error) {
          console.log(`🔍 ERROR RECOVERY DEBUG: Error message:`, error.message);
          console.log(`🔍 ERROR RECOVERY DEBUG: Error stack:`, error.stack);
        }
        
        // Classify the error to determine if we should continue recovery
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`🔍 ERROR RECOVERY DEBUG: Classifying error message:`, errorMessage);
        
        const classification = errorClassificationService.classifyError(errorMessage, {
          fileSize: originalFile.size,
          fileName: originalFile.name,
          attempt
        });
        
        console.log(`🔍 ERROR RECOVERY DEBUG: Error classification:`, classification);
        
        const failedAttempt: RecoveryAttempt = {
          attemptNumber: attempt,
          strategy,
          timestamp: Date.now(),
          success: false,
          error: errorMessage
        };
        attempts.push(failedAttempt);
        lastError = errorMessage; // Store for next attempt's strategy selection

        if (this.config.enableLogging) {
          console.warn(`Recovery attempt ${attempt} failed with strategy ${strategy}:`, errorMessage);
          console.log('Error classification:', classification);
        }

        // Check if we should stop recovery based on error classification
        if (!classification.recoverable || classification.severity === 'critical') {
          return {
            success: false,
            error: classification.userMessage,
            attempts,
            totalTime: Date.now() - startTime
          };
        }

        // If this is the last attempt, return failure
        if (attempt === this.config.maxAttempts) {
          return {
            success: false,
            error: this.getFinalErrorMessage(attempts),
            attempts,
            totalTime: Date.now() - startTime
          };
        }

        // Wait before next attempt using smart delay
        const delay = errorClassificationService.getRetryDelay(classification, attempt);
        await this.delay(delay);
      }
    }

    // Should never reach here, but just in case
    return {
      success: false,
      error: 'Maximum recovery attempts exceeded',
      attempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Get recovery strategy for attempt number
   */
  private getStrategyForAttempt(attempt: number, lastError?: string): RecoveryStrategy {
    // If we have a last error, use smart strategy selection
    if (lastError && attempt > 1) {
      const classification = errorClassificationService.classifyError(lastError);
      if (classification.recommendedStrategy) {
        return classification.recommendedStrategy as RecoveryStrategy;
      }
    }
    
    // Default to sequential strategy selection
    const strategyIndex = Math.min(attempt - 1, this.config.strategies.length - 1);
    return this.config.strategies[strategyIndex];
  }

  /**
   * Apply recovery strategy to file
   */
  private async applyRecoveryStrategy(file: File, strategy: RecoveryStrategy): Promise<File> {
    switch (strategy) {
      case 'retry_original':
        return file;

      case 'compress_image':
        return await this.compressImage(file, 0.8);

      case 'convert_format':
        return await this.convertToJpeg(file);

      case 'reduce_quality':
        return await this.compressImage(file, 0.6);

      default:
        return file;
    }
  }

  /**
   * Compress image with specified quality
   */
  private async compressImage(file: File, quality: number): Promise<File> {
    try {
      // Use existing compression utility, but with custom quality
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate new dimensions (reduce size if very large)
          let { width, height } = img;
          const maxDimension = 2048;
          
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file); // Fallback to original
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => resolve(file); // Fallback to original
        img.src = URL.createObjectURL(file);
      });

    } catch (error) {
      return file; // Fallback to original on any error
    }
  }

  /**
   * Convert image to JPEG format
   */
  private async convertToJpeg(file: File): Promise<File> {
    if (file.type === 'image/jpeg') {
      return file; // Already JPEG
    }

    return this.compressImage(file, 0.9); // High quality JPEG conversion
  }

  /**
   * Get progress message for recovery strategy
   */
  private getProgressMessage(strategy: RecoveryStrategy, attempt: number): string {
    const messages = {
      retry_original: attempt === 1 ? 'Processing your image...' : 'Retrying original image...',
      compress_image: 'Optimizing image size...',
      convert_format: 'Converting to compatible format...',
      reduce_quality: 'Reducing image complexity...',
      fallback_api: 'Trying alternative processing method...'
    };

    return messages[strategy] || 'Attempting recovery...';
  }

  /**
   * Get final error message based on all attempts
   */
  private getFinalErrorMessage(attempts: RecoveryAttempt[]): string {
    const lastError = attempts[attempts.length - 1]?.error;
    const strategyNames = attempts.map(a => a.strategy).join(', ');

    return `Processing failed after ${attempts.length} attempts (${strategyNames}). ${lastError || 'Please try a different image.'}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /too large/i,
      /file size/i,
      /format/i,
      /temporary/i,
      /server error/i,
      /5\d\d/  // 5xx HTTP errors
    ];

    return recoverablePatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Get recommended recovery strategy for specific error
   */
  getRecommendedStrategy(error: Error | string): RecoveryStrategy {
    const errorMessage = typeof error === 'string' ? error : error.message;

    if (/too large|file size/i.test(errorMessage)) {
      return 'compress_image';
    }
    
    if (/format|unsupported/i.test(errorMessage)) {
      return 'convert_format';
    }
    
    if (/quality|complex/i.test(errorMessage)) {
      return 'reduce_quality';
    }

    return 'retry_original';
  }

  /**
   * Configure recovery behavior
   */
  configure(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RecoveryConfig {
    return { ...this.config };
  }

  /**
   * Reset to default configuration
   */
  resetConfig(): void {
    this.config = {
      maxAttempts: 4,
      strategies: ['retry_original', 'compress_image', 'convert_format', 'reduce_quality'],
      delayMs: 500,
      enableLogging: true
    };
  }

  /**
   * Simplified retry for specific error types
   */
  async retryWithErrorClassification(
    originalFile: File,
    sessionId: string,
    error: Error | string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<RecoveryResult> {
    const classification = errorClassificationService.classifyError(error, {
      fileSize: originalFile.size,
      fileName: originalFile.name,
      attempt: 1
    });

    // If not recoverable, return immediately
    if (!classification.recoverable) {
      return {
        success: false,
        error: classification.userMessage,
        attempts: [],
        totalTime: 0
      };
    }

    // Use recommended strategy if available
    if (classification.recommendedStrategy) {
      const strategy = classification.recommendedStrategy as RecoveryStrategy;
      return this.retrySingleStrategy(originalFile, sessionId, strategy, onProgress);
    }

    // Fall back to full recovery process
    return this.processWithRecovery(originalFile, sessionId, onProgress);
  }

  /**
   * Retry with a single specific strategy
   */
  private async retrySingleStrategy(
    originalFile: File,
    sessionId: string,
    strategy: RecoveryStrategy,
    onProgress?: (progress: number, message: string) => void
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    onProgress?.(10, this.getProgressMessage(strategy, 1));
    
    try {
      const processedFile = await this.applyRecoveryStrategy(originalFile, strategy);
      
      const result = await apiService.processImageWithSession(
        processedFile,
        sessionId,
        (progress, message) => onProgress?.(10 + progress * 0.8, message)
      );

      return {
        success: true,
        result,
        attempts: [{
          attemptNumber: 1,
          strategy,
          timestamp: startTime,
          success: true
        }],
        totalTime: Date.now() - startTime,
        finalStrategy: strategy
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
        attempts: [{
          attemptNumber: 1,
          strategy,
          timestamp: startTime,
          success: false,
          error: errorMessage
        }],
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check if retry is recommended for this error
   */
  shouldRetry(error: Error | string, context?: any): boolean {
    const classification = errorClassificationService.classifyError(error, context);
    return errorClassificationService.shouldAutoRetry(classification);
  }

  /**
   * Get estimated retry delay for an error
   */
  getEstimatedRetryDelay(error: Error | string, attemptNumber: number = 1): number {
    const classification = errorClassificationService.classifyError(error);
    return errorClassificationService.getRetryDelay(classification, attemptNumber);
  }
}

// Export singleton instance
export const progressiveErrorRecovery = ProgressiveErrorRecovery.getInstance();