/**
 * Error Classification System
 * Categorizes errors for user-friendly messaging and appropriate recovery strategies
 * Core to maintaining Chloe's seamless workflow experience
 */

export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  recoverable: boolean;
  suggestedActions: string[];
  recommendedStrategy?: RecoveryStrategy;
  displayDuration?: number; // milliseconds
}

export type ErrorCategory = 
  | 'network'
  | 'file_validation'
  | 'processing_failure'
  | 'browser_compatibility'
  | 'quota_exceeded'
  | 'server_error'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RecoveryStrategy = 
  | 'retry_original'
  | 'compress_image'
  | 'convert_format'
  | 'reduce_quality'
  | 'reload_page'
  | 'try_different_browser'
  | 'contact_support';

export class ErrorClassificationService {
  private static instance: ErrorClassificationService;

  private constructor() {}

  static getInstance(): ErrorClassificationService {
    if (!ErrorClassificationService.instance) {
      ErrorClassificationService.instance = new ErrorClassificationService();
    }
    return ErrorClassificationService.instance;
  }

  /**
   * Classify error and return appropriate user messaging
   */
  classifyError(error: Error | string, context?: { 
    fileSize?: number; 
    fileName?: string; 
    attempt?: number;
    userAgent?: string;
  }): ErrorClassification {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? '' : error.stack || '';

    // Network errors
    if (this.isNetworkError(errorMessage, errorStack)) {
      return this.createNetworkErrorClassification(errorMessage, context);
    }

    // File validation errors
    if (this.isFileValidationError(errorMessage)) {
      return this.createFileValidationErrorClassification(errorMessage, context);
    }

    // Processing failures
    if (this.isProcessingFailure(errorMessage)) {
      return this.createProcessingFailureClassification(errorMessage, context);
    }

    // Browser compatibility issues
    if (this.isBrowserCompatibilityError(errorMessage, context?.userAgent)) {
      return this.createBrowserCompatibilityClassification(errorMessage, context);
    }

    // Quota exceeded
    if (this.isQuotaError(errorMessage)) {
      return this.createQuotaErrorClassification(errorMessage, context);
    }

    // Server errors
    if (this.isServerError(errorMessage)) {
      return this.createServerErrorClassification(errorMessage, context);
    }

    // Unknown errors
    return this.createUnknownErrorClassification(errorMessage, context);
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(message: string, stack: string): boolean {
    const networkPatterns = [
      /network/i,
      /connection/i,
      /timeout/i,
      /fetch.*failed/i,
      /cors/i,
      /net::/i,
      /ERR_INTERNET_DISCONNECTED/i,
      /ERR_NETWORK_CHANGED/i
    ];

    return networkPatterns.some(pattern => 
      pattern.test(message) || pattern.test(stack)
    );
  }

  /**
   * Check if error is file validation related
   */
  private isFileValidationError(message: string): boolean {
    const validationPatterns = [
      /invalid.*file/i,
      /unsupported.*format/i,
      /file.*too.*large/i,
      /file.*size/i,
      /corrupted.*file/i,
      /invalid.*image/i
    ];

    return validationPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if error is processing failure
   */
  private isProcessingFailure(message: string): boolean {
    const processingPatterns = [
      /processing.*failed/i,
      /background.*removal.*failed/i,
      /model.*error/i,
      /segmentation.*failed/i,
      /rembg.*error/i
    ];

    return processingPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if error is browser compatibility issue
   */
  private isBrowserCompatibilityError(message: string, userAgent?: string): boolean {
    const compatibilityPatterns = [
      /clipboard.*not.*supported/i,
      /file.*api.*not.*supported/i,
      /canvas.*not.*supported/i,
      /webp.*not.*supported/i,
      /drag.*drop.*not.*supported/i
    ];

    const isCompatibilityMessage = compatibilityPatterns.some(pattern => 
      pattern.test(message)
    );

    // Check for old browser versions
    const isOldBrowser = userAgent && (
      /MSIE|Trident/i.test(userAgent) ||
      /Chrome\/[4-6]\d/i.test(userAgent) ||
      /Firefox\/[3-5]\d/i.test(userAgent)
    );

    return isCompatibilityMessage || !!isOldBrowser;
  }

  /**
   * Check if error is quota related
   */
  private isQuotaError(message: string): boolean {
    const quotaPatterns = [
      /quota.*exceeded/i,
      /rate.*limit/i,
      /too.*many.*requests/i,
      /429/,
      /storage.*full/i
    ];

    return quotaPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if error is server-side
   */
  private isServerError(message: string): boolean {
    const serverPatterns = [
      /5\d\d/,
      /server.*error/i,
      /internal.*error/i,
      /service.*unavailable/i,
      /gateway.*timeout/i
    ];

    return serverPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Create network error classification
   */
  private createNetworkErrorClassification(
    message: string, 
    context?: any
  ): ErrorClassification {
    return {
      category: 'network',
      severity: 'medium',
      userMessage: 'Connection issue detected. Please check your internet connection.',
      technicalMessage: message,
      recoverable: true,
      suggestedActions: [
        'Check your internet connection',
        'Try again in a moment',
        'Reload the page if the issue persists'
      ],
      recommendedStrategy: 'retry_original',
      displayDuration: 5000
    };
  }

  /**
   * Create file validation error classification
   */
  private createFileValidationErrorClassification(
    message: string,
    context?: any
  ): ErrorClassification {
    const isLargeFile = context?.fileSize && context.fileSize > 10 * 1024 * 1024;
    
    return {
      category: 'file_validation',
      severity: 'low',
      userMessage: isLargeFile 
        ? 'Image file is too large. Please use a smaller image (under 10MB).'
        : 'This image format isn\'t supported. Please try a different image.',
      technicalMessage: message,
      recoverable: true,
      suggestedActions: isLargeFile 
        ? ['Use an image under 10MB', 'Try compressing your image first']
        : ['Use JPG, PNG, or WebP format', 'Try a different image'],
      recommendedStrategy: isLargeFile ? 'compress_image' : 'convert_format',
      displayDuration: 6000
    };
  }

  /**
   * Create processing failure classification
   */
  private createProcessingFailureClassification(
    message: string,
    context?: any
  ): ErrorClassification {
    const isRetryAttempt = context?.attempt && context.attempt > 1;
    
    return {
      category: 'processing_failure',
      severity: isRetryAttempt ? 'high' : 'medium',
      userMessage: isRetryAttempt
        ? 'We\'re having trouble processing this image. The AI model might be struggling with this particular image.'
        : 'Processing failed. This sometimes happens with complex images.',
      technicalMessage: message,
      recoverable: !isRetryAttempt,
      suggestedActions: isRetryAttempt
        ? ['Try a different image', 'Simplify the background if possible']
        : ['We\'ll try different processing methods', 'Please wait while we attempt recovery'],
      recommendedStrategy: isRetryAttempt ? 'contact_support' : 'compress_image',
      displayDuration: isRetryAttempt ? 8000 : 4000
    };
  }

  /**
   * Create browser compatibility classification
   */
  private createBrowserCompatibilityClassification(
    message: string,
    context?: any
  ): ErrorClassification {
    return {
      category: 'browser_compatibility',
      severity: 'medium',
      userMessage: 'Your browser doesn\'t support all the features needed. Please update your browser or try a different one.',
      technicalMessage: message,
      recoverable: false,
      suggestedActions: [
        'Update to the latest version of your browser',
        'Try Chrome, Firefox, Safari, or Edge',
        'Enable JavaScript if disabled'
      ],
      recommendedStrategy: 'try_different_browser',
      displayDuration: 10000
    };
  }

  /**
   * Create quota error classification
   */
  private createQuotaErrorClassification(
    message: string,
    context?: any
  ): ErrorClassification {
    return {
      category: 'quota_exceeded',
      severity: 'medium',
      userMessage: 'Service is temporarily busy. Please wait a moment and try again.',
      technicalMessage: message,
      recoverable: true,
      suggestedActions: [
        'Wait a few minutes and try again',
        'Avoid processing multiple images simultaneously'
      ],
      recommendedStrategy: 'retry_original',
      displayDuration: 7000
    };
  }

  /**
   * Create server error classification
   */
  private createServerErrorClassification(
    message: string,
    context?: any
  ): ErrorClassification {
    return {
      category: 'server_error',
      severity: 'high',
      userMessage: 'Our servers are experiencing issues. We\'re working to fix this.',
      technicalMessage: message,
      recoverable: true,
      suggestedActions: [
        'Try again in a few minutes',
        'Reload the page if the issue persists'
      ],
      recommendedStrategy: 'retry_original',
      displayDuration: 6000
    };
  }

  /**
   * Create unknown error classification
   */
  private createUnknownErrorClassification(
    message: string,
    context?: any
  ): ErrorClassification {
    return {
      category: 'unknown',
      severity: 'medium',
      userMessage: 'Something unexpected happened. Please try again.',
      technicalMessage: message,
      recoverable: true,
      suggestedActions: [
        'Try again with the same image',
        'Try a different image',
        'Reload the page if issues continue'
      ],
      recommendedStrategy: 'retry_original',
      displayDuration: 5000
    };
  }

  /**
   * Get error severity color for UI
   */
  getErrorColor(severity: ErrorSeverity): string {
    const colors = {
      low: 'text-yellow-400',
      medium: 'text-orange-400', 
      high: 'text-red-400',
      critical: 'text-red-500'
    };
    return colors[severity];
  }

  /**
   * Get error background color for UI
   */
  getErrorBackgroundColor(severity: ErrorSeverity): string {
    const colors = {
      low: 'bg-yellow-400/10',
      medium: 'bg-orange-400/10',
      high: 'bg-red-400/10', 
      critical: 'bg-red-500/10'
    };
    return colors[severity];
  }

  /**
   * Get error border color for UI
   */
  getErrorBorderColor(severity: ErrorSeverity): string {
    const colors = {
      low: 'border-yellow-400/30',
      medium: 'border-orange-400/30',
      high: 'border-red-400/30',
      critical: 'border-red-500/30'
    };
    return colors[severity];
  }

  /**
   * Check if error should auto-retry
   */
  shouldAutoRetry(classification: ErrorClassification): boolean {
    return classification.recoverable && 
           classification.severity !== 'critical' &&
           ['network', 'quota_exceeded', 'server_error'].includes(classification.category);
  }

  /**
   * Get retry delay based on error type
   */
  getRetryDelay(classification: ErrorClassification, attemptNumber: number): number {
    const baseDelay = {
      network: 1000,
      quota_exceeded: 3000,
      server_error: 2000,
      processing_failure: 1500
    };

    const delay = baseDelay[classification.category as keyof typeof baseDelay] || 1000;
    
    // Exponential backoff with jitter
    return delay * Math.pow(1.5, attemptNumber - 1) + Math.random() * 1000;
  }
}

// Export singleton instance
export const errorClassificationService = ErrorClassificationService.getInstance();