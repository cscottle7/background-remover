/**
 * Progress Indicator Service
 * Enhanced progress tracking with detailed user feedback and accessibility
 */

export interface ProgressState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentOperation: string;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  statusMessage: string;
  error?: string;
}

export interface ProgressStep {
  id: string;
  name: string;
  description: string;
  weight: number; // For weighted progress calculation
}

export interface ProgressOptions {
  showPercentage?: boolean;
  showTimeRemaining?: boolean;
  showDetailedSteps?: boolean;
  announceToScreenReader?: boolean;
}

export class ProgressIndicatorService {
  private state: ProgressState = {
    isActive: false,
    currentStep: 0,
    totalSteps: 0,
    currentOperation: '',
    percentComplete: 0,
    statusMessage: '',
  };
  
  private steps: ProgressStep[] = [];
  private options: ProgressOptions = {};
  private startTime: number = 0;
  private stepStartTime: number = 0;
  private onStateChange?: (state: ProgressState) => void;
  
  constructor(options: ProgressOptions = {}) {
    this.options = {
      showPercentage: true,
      showTimeRemaining: true,
      showDetailedSteps: false,
      announceToScreenReader: true,
      ...options
    };
  }
  
  /**
   * Set up progress tracking with defined steps
   */
  initialize(steps: ProgressStep[], onStateChange?: (state: ProgressState) => void): void {
    this.steps = steps;
    this.onStateChange = onStateChange;
    this.state = {
      isActive: false,
      currentStep: 0,
      totalSteps: steps.length,
      currentOperation: '',
      percentComplete: 0,
      statusMessage: 'Ready to begin',
    };
    this.notifyStateChange();
  }
  
  /**
   * Start progress tracking
   */
  start(initialMessage: string = 'Starting...'): void {
    this.startTime = Date.now();
    this.stepStartTime = Date.now();
    this.state = {
      ...this.state,
      isActive: true,
      currentStep: 0,
      percentComplete: 0,
      statusMessage: initialMessage,
      error: undefined
    };
    
    if (this.options.announceToScreenReader) {
      this.announceToScreenReader(initialMessage);
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Advance to the next step
   */
  nextStep(stepMessage?: string): void {
    if (!this.state.isActive) return;
    
    const nextStepIndex = this.state.currentStep + 1;
    if (nextStepIndex >= this.steps.length) {
      this.complete('All steps completed');
      return;
    }
    
    const nextStep = this.steps[nextStepIndex];
    const percentComplete = this.calculateWeightedProgress(nextStepIndex);
    const estimatedTimeRemaining = this.calculateEstimatedTime(percentComplete);
    
    this.stepStartTime = Date.now();
    this.state = {
      ...this.state,
      currentStep: nextStepIndex,
      currentOperation: nextStep.name,
      percentComplete,
      estimatedTimeRemaining,
      statusMessage: stepMessage || nextStep.description
    };
    
    if (this.options.announceToScreenReader) {
      this.announceToScreenReader(`${nextStep.name}: ${this.state.statusMessage}`);
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Update progress within current step
   */
  updateStepProgress(percentage: number, message?: string): void {
    if (!this.state.isActive) return;
    
    const currentStep = this.steps[this.state.currentStep];
    if (!currentStep) return;
    
    // Calculate overall progress including current step progress
    const baseProgress = this.calculateWeightedProgress(this.state.currentStep);
    const stepWeight = currentStep.weight / this.getTotalWeight();
    const stepProgress = (percentage / 100) * stepWeight * 100;
    const totalProgress = Math.min(100, baseProgress + stepProgress);
    
    const estimatedTimeRemaining = this.calculateEstimatedTime(totalProgress);
    
    this.state = {
      ...this.state,
      percentComplete: totalProgress,
      estimatedTimeRemaining,
      statusMessage: message || this.state.statusMessage
    };
    
    this.notifyStateChange();
  }
  
  /**
   * Complete progress tracking
   */
  complete(finalMessage: string = 'Completed successfully'): void {
    this.state = {
      ...this.state,
      isActive: false,
      currentStep: this.steps.length,
      percentComplete: 100,
      estimatedTimeRemaining: 0,
      statusMessage: finalMessage
    };
    
    if (this.options.announceToScreenReader) {
      this.announceToScreenReader(finalMessage);
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Handle error state
   */
  error(errorMessage: string): void {
    this.state = {
      ...this.state,
      isActive: false,
      error: errorMessage,
      statusMessage: `Error: ${errorMessage}`
    };
    
    if (this.options.announceToScreenReader) {
      this.announceToScreenReader(`Error occurred: ${errorMessage}`);
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Reset progress state
   */
  reset(): void {
    this.state = {
      isActive: false,
      currentStep: 0,
      totalSteps: this.steps.length,
      currentOperation: '',
      percentComplete: 0,
      statusMessage: 'Ready to begin',
      error: undefined
    };
    this.notifyStateChange();
  }
  
  /**
   * Get current progress state
   */
  getState(): ProgressState {
    return { ...this.state };
  }
  
  /**
   * Get formatted progress message
   */
  getFormattedMessage(): string {
    if (this.state.error) {
      return this.state.statusMessage;
    }
    
    if (!this.state.isActive) {
      return this.state.statusMessage;
    }
    
    let message = this.state.statusMessage;
    
    if (this.options.showPercentage) {
      message += ` (${Math.round(this.state.percentComplete)}%)`;
    }
    
    if (this.options.showTimeRemaining && this.state.estimatedTimeRemaining) {
      const timeRemaining = this.formatTime(this.state.estimatedTimeRemaining);
      message += ` • ${timeRemaining} remaining`;
    }
    
    return message;
  }
  
  // Private methods
  
  private calculateWeightedProgress(stepIndex: number): number {
    if (stepIndex === 0) return 0;
    
    const completedWeight = this.steps
      .slice(0, stepIndex)
      .reduce((sum, step) => sum + step.weight, 0);
    
    const totalWeight = this.getTotalWeight();
    return (completedWeight / totalWeight) * 100;
  }
  
  private getTotalWeight(): number {
    return this.steps.reduce((sum, step) => sum + step.weight, 0);
  }
  
  private calculateEstimatedTime(percentComplete: number): number {
    if (percentComplete === 0) return 0;
    
    const elapsed = Date.now() - this.startTime;
    const rate = percentComplete / elapsed;
    const remaining = (100 - percentComplete) / rate;
    
    return Math.max(0, remaining);
  }
  
  private formatTime(milliseconds: number): string {
    const seconds = Math.ceil(milliseconds / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }
  
  private announceToScreenReader(message: string): void {
    // Create a live region announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Predefined progress step templates
export const ProgressStepTemplates = {
  IMAGE_PROCESSING: [
    {
      id: 'upload',
      name: 'Upload',
      description: 'Uploading image...',
      weight: 1
    },
    {
      id: 'preprocess',
      name: 'Preprocessing',
      description: 'Preparing image for processing...',
      weight: 2
    },
    {
      id: 'background-removal',
      name: 'Background Removal',
      description: 'Removing background...',
      weight: 5
    },
    {
      id: 'edge-refinement',
      name: 'Edge Refinement',
      description: 'Refining edges...',
      weight: 3
    },
    {
      id: 'finalization',
      name: 'Finalization',
      description: 'Finalizing result...',
      weight: 1
    }
  ],
  
  BATCH_PROCESSING: [
    {
      id: 'validation',
      name: 'Validation',
      description: 'Validating images...',
      weight: 1
    },
    {
      id: 'queue-setup',
      name: 'Queue Setup',
      description: 'Setting up processing queue...',
      weight: 1
    },
    {
      id: 'processing',
      name: 'Processing',
      description: 'Processing images...',
      weight: 8
    },
    {
      id: 'packaging',
      name: 'Packaging',
      description: 'Packaging results...',
      weight: 1
    }
  ],
  
  REFINEMENT_SAVE: [
    {
      id: 'collect-changes',
      name: 'Collecting Changes',
      description: 'Collecting your edits...',
      weight: 1
    },
    {
      id: 'apply-refinements',
      name: 'Applying Refinements',
      description: 'Applying your refinements...',
      weight: 3
    },
    {
      id: 'optimize',
      name: 'Optimizing',
      description: 'Optimizing final image...',
      weight: 2
    },
    {
      id: 'save',
      name: 'Saving',
      description: 'Saving your refined image...',
      weight: 1
    }
  ]
};