/**
 * Real-Time Processing Status Service
 * Provides granular status updates and progress tracking
 * Enhances Chloe's awareness during processing workflow
 */

import { writable, derived, type Readable } from 'svelte/store';

export interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // milliseconds
  weight: number; // 0-1, contribution to overall progress
}

export interface StatusUpdate {
  timestamp: number;
  step: ProcessingStep;
  progress: number; // 0-100 for current step
  overallProgress: number; // 0-100 for entire process
  message: string;
  details?: string;
  attempt?: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export interface ProcessingSession {
  sessionId: string;
  startTime: number;
  fileName: string;
  fileSize: number;
  currentStep: ProcessingStep | null;
  steps: ProcessingStep[];
  updates: StatusUpdate[];
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export class RealTimeStatusService {
  private static instance: RealTimeStatusService;
  
  // Svelte stores for reactive updates
  private currentSessionStore = writable<ProcessingSession | null>(null);
  private latestUpdateStore = writable<StatusUpdate | null>(null);
  
  // Processing steps configuration
  private defaultSteps: ProcessingStep[] = [
    {
      id: 'upload',
      name: 'Upload',
      description: 'Preparing image for processing',
      estimatedDuration: 500,
      weight: 0.05
    },
    {
      id: 'validation',
      name: 'Validation',
      description: 'Validating image format and size',
      estimatedDuration: 300,
      weight: 0.05
    },
    {
      id: 'preprocessing',
      name: 'Preprocessing',
      description: 'Optimizing image for AI processing',
      estimatedDuration: 800,
      weight: 0.15
    },
    {
      id: 'ai_processing',
      name: 'AI Processing',
      description: 'Removing background with AI',
      estimatedDuration: 3000,
      weight: 0.65
    },
    {
      id: 'postprocessing',
      name: 'Postprocessing',
      description: 'Refining edges and transparency',
      estimatedDuration: 700,
      weight: 0.08
    },
    {
      id: 'finalization',
      name: 'Finalization',
      description: 'Preparing download and clipboard copy',
      estimatedDuration: 200,
      weight: 0.02
    }
  ];

  private constructor() {}

  static getInstance(): RealTimeStatusService {
    if (!RealTimeStatusService.instance) {
      RealTimeStatusService.instance = new RealTimeStatusService();
    }
    return RealTimeStatusService.instance;
  }

  /**
   * Get current session as readable store
   */
  get currentSession(): Readable<ProcessingSession | null> {
    return this.currentSessionStore;
  }

  /**
   * Get latest update as readable store
   */
  get latestUpdate(): Readable<StatusUpdate | null> {
    return this.latestUpdateStore;
  }

  /**
   * Get derived store for current progress percentage
   */
  get currentProgress(): Readable<number> {
    return derived(this.latestUpdateStore, ($update) => 
      $update?.overallProgress || 0
    );
  }

  /**
   * Get derived store for current step information
   */
  get currentStepInfo(): Readable<{ step: ProcessingStep | null; progress: number }> {
    return derived(this.currentSessionStore, ($session) => ({
      step: $session?.currentStep || null,
      progress: $session?.updates[$session.updates.length - 1]?.progress || 0
    }));
  }

  /**
   * Start a new processing session
   */
  startSession(sessionId: string, fileName: string, fileSize: number): void {
    const session: ProcessingSession = {
      sessionId,
      startTime: Date.now(),
      fileName,
      fileSize,
      currentStep: null,
      steps: [...this.defaultSteps],
      updates: [],
      isComplete: false,
      hasError: false
    };

    this.currentSessionStore.set(session);
    
    // Start with upload step
    this.updateStep('upload', 0, 'Starting upload...');
  }

  /**
   * Update current processing step
   */
  updateStep(
    stepId: string, 
    progress: number, 
    message: string, 
    details?: string,
    attempt?: number
  ): void {
    this.currentSessionStore.update(session => {
      if (!session) return session;

      const step = session.steps.find(s => s.id === stepId);
      if (!step) {
        console.warn(`Unknown step: ${stepId}`);
        return session;
      }

      // Calculate overall progress
      const overallProgress = this.calculateOverallProgress(session.steps, stepId, progress);
      
      // Calculate time estimates
      const timeElapsed = Date.now() - session.startTime;
      const estimatedTimeRemaining = this.estimateTimeRemaining(
        session.steps, 
        stepId, 
        progress, 
        timeElapsed
      );

      const update: StatusUpdate = {
        timestamp: Date.now(),
        step,
        progress: Math.min(100, Math.max(0, progress)),
        overallProgress,
        message,
        details,
        attempt,
        timeElapsed,
        estimatedTimeRemaining
      };

      // Update session
      const updatedSession: ProcessingSession = {
        ...session,
        currentStep: step,
        updates: [...session.updates, update]
      };

      // Update stores
      this.latestUpdateStore.set(update);
      
      return updatedSession;
    });
  }

  /**
   * Complete current session successfully
   */
  completeSession(finalMessage: string = 'Processing completed successfully'): void {
    this.currentSessionStore.update(session => {
      if (!session) return session;

      const finalUpdate: StatusUpdate = {
        timestamp: Date.now(),
        step: session.steps[session.steps.length - 1],
        progress: 100,
        overallProgress: 100,
        message: finalMessage,
        timeElapsed: Date.now() - session.startTime,
        estimatedTimeRemaining: 0
      };

      this.latestUpdateStore.set(finalUpdate);

      return {
        ...session,
        isComplete: true,
        updates: [...session.updates, finalUpdate]
      };
    });
  }

  /**
   * Mark session as failed with error
   */
  failSession(errorMessage: string, details?: string): void {
    this.currentSessionStore.update(session => {
      if (!session) return session;

      const errorUpdate: StatusUpdate = {
        timestamp: Date.now(),
        step: session.currentStep || session.steps[0],
        progress: 0,
        overallProgress: 0,
        message: 'Processing failed',
        details: errorMessage,
        timeElapsed: Date.now() - session.startTime,
        estimatedTimeRemaining: 0
      };

      this.latestUpdateStore.set(errorUpdate);

      return {
        ...session,
        hasError: true,
        errorMessage,
        updates: [...session.updates, errorUpdate]
      };
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalTime: number;
    averageStepTime: number;
    stepTimes: { [stepId: string]: number };
    updateCount: number;
  } | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    const updates = session.updates;
    if (updates.length === 0) return null;

    const stepTimes: { [stepId: string]: number } = {};
    let lastUpdateTime = session.startTime;

    // Calculate time spent in each step
    for (const update of updates) {
      const stepId = update.step.id;
      const stepTime = update.timestamp - lastUpdateTime;
      
      if (!stepTimes[stepId]) {
        stepTimes[stepId] = 0;
      }
      stepTimes[stepId] += stepTime;
      lastUpdateTime = update.timestamp;
    }

    const totalTime = Date.now() - session.startTime;
    const completedSteps = Object.keys(stepTimes).length;
    const averageStepTime = completedSteps > 0 ? totalTime / completedSteps : 0;

    return {
      totalTime,
      averageStepTime,
      stepTimes,
      updateCount: updates.length
    };
  }

  /**
   * Calculate overall progress based on step weights
   */
  private calculateOverallProgress(
    steps: ProcessingStep[], 
    currentStepId: string, 
    currentStepProgress: number
  ): number {
    let totalProgress = 0;
    let reachedCurrentStep = false;

    for (const step of steps) {
      if (step.id === currentStepId) {
        // Add partial progress for current step
        totalProgress += (currentStepProgress / 100) * step.weight;
        reachedCurrentStep = true;
        break;
      } else {
        // Add full progress for completed steps
        totalProgress += step.weight;
      }
    }

    return Math.min(100, Math.max(0, totalProgress * 100));
  }

  /**
   * Estimate remaining time based on current progress
   */
  private estimateTimeRemaining(
    steps: ProcessingStep[],
    currentStepId: string,
    currentStepProgress: number,
    timeElapsed: number
  ): number {
    const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
    if (currentStepIndex === -1) return 0;

    let remainingDuration = 0;

    // Add remaining time for current step
    const currentStep = steps[currentStepIndex];
    const currentStepRemaining = currentStep.estimatedDuration * (1 - currentStepProgress / 100);
    remainingDuration += currentStepRemaining;

    // Add estimated time for remaining steps
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      remainingDuration += steps[i].estimatedDuration;
    }

    // Adjust based on actual performance vs estimates
    const completedWeight = this.calculateOverallProgress(steps, currentStepId, currentStepProgress) / 100;
    if (completedWeight > 0) {
      const actualVsEstimated = timeElapsed / (this.getTotalEstimatedDuration() * completedWeight);
      remainingDuration *= actualVsEstimated;
    }

    return Math.max(0, remainingDuration);
  }

  /**
   * Get total estimated duration for all steps
   */
  private getTotalEstimatedDuration(): number {
    return this.defaultSteps.reduce((total, step) => total + step.estimatedDuration, 0);
  }

  /**
   * Get current session (non-reactive)
   */
  private getCurrentSession(): ProcessingSession | null {
    let session: ProcessingSession | null = null;
    this.currentSessionStore.subscribe(s => session = s)();
    return session;
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.currentSessionStore.set(null);
    this.latestUpdateStore.set(null);
  }

  /**
   * Create a progress callback function for integration with existing systems
   */
  createProgressCallback(sessionId: string): (progress: number, message: string, attempt?: number) => void {
    return (progress: number, message: string, attempt?: number) => {
      // Map generic progress to appropriate step
      const stepId = this.mapProgressToStep(progress);
      const stepProgress = this.mapProgressToStepProgress(progress, stepId);
      
      this.updateStep(stepId, stepProgress, message, undefined, attempt);
    };
  }

  /**
   * Map overall progress to current step
   */
  private mapProgressToStep(overallProgress: number): string {
    if (overallProgress <= 5) return 'upload';
    if (overallProgress <= 10) return 'validation';
    if (overallProgress <= 25) return 'preprocessing';
    if (overallProgress <= 90) return 'ai_processing';
    if (overallProgress <= 98) return 'postprocessing';
    return 'finalization';
  }

  /**
   * Map overall progress to step-specific progress
   */
  private mapProgressToStepProgress(overallProgress: number, stepId: string): number {
    switch (stepId) {
      case 'upload':
        return Math.min(100, (overallProgress / 5) * 100);
      case 'validation':
        return Math.min(100, ((overallProgress - 5) / 5) * 100);
      case 'preprocessing':
        return Math.min(100, ((overallProgress - 10) / 15) * 100);
      case 'ai_processing':
        return Math.min(100, ((overallProgress - 25) / 65) * 100);
      case 'postprocessing':
        return Math.min(100, ((overallProgress - 90) / 8) * 100);
      case 'finalization':
        return Math.min(100, ((overallProgress - 98) / 2) * 100);
      default:
        return overallProgress;
    }
  }

  /**
   * Export processing session data for analytics
   */
  exportSessionData(): any {
    const session = this.getCurrentSession();
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      startTime: session.startTime,
      totalTime: Date.now() - session.startTime,
      isComplete: session.isComplete,
      hasError: session.hasError,
      errorMessage: session.errorMessage,
      steps: session.steps.map(step => ({
        id: step.id,
        name: step.name,
        estimatedDuration: step.estimatedDuration,
        weight: step.weight
      })),
      updates: session.updates.map(update => ({
        timestamp: update.timestamp,
        stepId: update.step.id,
        progress: update.progress,
        overallProgress: update.overallProgress,
        message: update.message,
        timeElapsed: update.timeElapsed
      })),
      stats: this.getSessionStats()
    };
  }
}

// Export singleton instance
export const realTimeStatusService = RealTimeStatusService.getInstance();