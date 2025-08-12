<!--
  Real-Time Status Display Component
  Shows detailed processing progress with step-by-step updates
  Enhances user awareness during Chloe's workflow
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { quintOut } from 'svelte/easing';
  import { realTimeStatusService, type StatusUpdate, type ProcessingStep } from '../services/realTimeStatus';
  
  export let showDetails: boolean = true;
  export let showTimeEstimates: boolean = true;
  export let showStepProgress: boolean = true;
  export let compact: boolean = false;
  
  // Animation state
  let progressTween = tweened(0, { duration: 300, easing: quintOut });
  let stepProgressTween = tweened(0, { duration: 200, easing: quintOut });
  
  // Component state
  let currentUpdate: StatusUpdate | null = null;
  let currentProgress = 0;
  let currentStep: ProcessingStep | null = null;
  let stepProgress = 0;
  let sessionStats: any = null;
  
  // Subscriptions
  let unsubscribeUpdate: () => void;
  let unsubscribeProgress: () => void;
  let unsubscribeStepInfo: () => void;
  
  onMount(() => {
    // Subscribe to real-time updates
    unsubscribeUpdate = realTimeStatusService.latestUpdate.subscribe(update => {
      currentUpdate = update;
      if (update) {
        progressTween.set(update.overallProgress);
      }
    });
    
    unsubscribeProgress = realTimeStatusService.currentProgress.subscribe(progress => {
      currentProgress = progress;
    });
    
    unsubscribeStepInfo = realTimeStatusService.currentStepInfo.subscribe(info => {
      currentStep = info.step;
      stepProgress = info.progress;
      stepProgressTween.set(info.progress);
    });
    
    // Update session stats periodically
    const statsInterval = setInterval(() => {
      sessionStats = realTimeStatusService.getSessionStats();
    }, 1000);
    
    return () => clearInterval(statsInterval);
  });
  
  onDestroy(() => {
    if (unsubscribeUpdate) unsubscribeUpdate();
    if (unsubscribeProgress) unsubscribeProgress();
    if (unsubscribeStepInfo) unsubscribeStepInfo();
  });
  
  // Format time in human-readable form
  function formatTime(milliseconds: number): string {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`;
  }
  
  // Get step status icon
  function getStepIcon(step: ProcessingStep | null, isActive: boolean, isComplete: boolean): string {
    if (!step) return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    
    if (isComplete) {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    
    if (isActive) {
      const icons = {
        upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
        validation: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        preprocessing: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        ai_processing: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        postprocessing: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4',
        finalization: 'M5 13l4 4L19 7'
      };
      return icons[step.id as keyof typeof icons] || icons.ai_processing;
    }
    
    return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
  
  // Get step color based on status
  function getStepColor(step: ProcessingStep | null, isActive: boolean, isComplete: boolean): string {
    if (isComplete) return 'text-green-400';
    if (isActive) return 'text-magic-400';
    return 'text-dark-text-muted';
  }
  
  // Get all steps from service for progress display
  let allSteps: ProcessingStep[] = [];
  realTimeStatusService.currentSession.subscribe(session => {
    if (session) {
      allSteps = session.steps;
    }
  });
</script>

{#if currentUpdate}
  <div class="real-time-status" class:compact>
    
    <!-- Main Progress Display -->
    <div class="progress-header mb-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-3">
          {#if currentStep}
            <div class="w-8 h-8 rounded-full bg-magic-400/20 flex items-center justify-center">
              <svg 
                class="w-4 h-4 {getStepColor(currentStep, true, false)}" 
                class:animate-spin={currentStep.id === 'ai_processing'}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d={getStepIcon(currentStep, true, false)}
                />
              </svg>
            </div>
          {/if}
          
          <div>
            <h4 class="text-sm font-medium text-magic-400">
              {currentStep?.name || 'Processing'}
            </h4>
            <p class="text-xs text-dark-text-muted">
              {currentUpdate.message}
            </p>
          </div>
        </div>
        
        <div class="text-right">
          <div class="text-lg font-semibold text-magic-400">
            {Math.round($progressTween)}%
          </div>
          {#if showTimeEstimates && currentUpdate.estimatedTimeRemaining > 0}
            <div class="text-xs text-dark-text-muted">
              ~{formatTime(currentUpdate.estimatedTimeRemaining)} left
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Overall Progress Bar -->
      <div class="progress-bar h-2 bg-dark-base rounded-full overflow-hidden mb-3">
        <div 
          class="h-full bg-gradient-to-r from-magic-400 to-magic-300 transition-all duration-300 ease-out relative"
          style="width: {$progressTween}%"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      
      <!-- Step Progress Bar (if enabled) -->
      {#if showStepProgress && currentStep}
        <div class="step-progress mb-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-dark-text-muted">
              {currentStep.description}
            </span>
            <span class="text-xs text-magic-400">
              {Math.round($stepProgressTween)}%
            </span>
          </div>
          <div class="h-1 bg-dark-elevated rounded-full overflow-hidden">
            <div 
              class="h-full bg-magic-400 transition-all duration-200 ease-out"
              style="width: {$stepProgressTween}%"
            />
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Detailed Step Timeline (if enabled) -->
    {#if showDetails && !compact && allSteps.length > 0}
      <div class="steps-timeline">
        <div class="text-xs font-medium text-dark-text mb-3">Processing Steps</div>
        <div class="space-y-2">
          {#each allSteps as step, index}
            {@const isActive = currentStep?.id === step.id}
            {@const isComplete = allSteps.findIndex(s => s.id === currentStep?.id) > index}
            {@const isPending = !isActive && !isComplete}
            
            <div 
              class="step-item flex items-center space-x-3 p-2 rounded-lg transition-all duration-200"
              class:active={isActive}
              class:complete={isComplete}
            >
              <!-- Step Icon -->
              <div 
                class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                class:icon-active={isActive}
                class:icon-complete={isComplete}
                class:bg-dark-elevated={isPending}
              >
                <svg 
                  class="w-3 h-3 {getStepColor(step, isActive, isComplete)}"
                  class:animate-spin={isActive && step.id === 'ai_processing'}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d={getStepIcon(step, isActive, isComplete)}
                  />
                </svg>
              </div>
              
              <!-- Step Info -->
              <div class="flex-grow min-w-0">
                <div class="flex items-center justify-between">
                  <span 
                    class="text-sm font-medium truncate"
                    class:text-magic-400={isActive}
                    class:text-green-400={isComplete}
                    class:text-dark-text-muted={isPending}
                  >
                    {step.name}
                  </span>
                  
                  {#if isActive && sessionStats}
                    <span class="text-xs text-dark-text-muted">
                      {formatTime(currentUpdate.timeElapsed)}
                    </span>
                  {/if}
                </div>
                
                {#if !compact}
                  <div class="text-xs text-dark-text-muted">
                    {step.description}
                  </div>
                {/if}
                
                <!-- Step Progress Bar -->
                {#if isActive && showStepProgress}
                  <div class="mt-1 h-1 bg-dark-base rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-magic-400 transition-all duration-200"
                      style="width: {stepProgress}%"
                    />
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Session Stats (if available) -->
    {#if showDetails && sessionStats && !compact}
      <div class="session-stats mt-4 pt-3 border-t border-dark-elevated">
        <div class="text-xs font-medium text-dark-text mb-2">Session Info</div>
        <div class="grid grid-cols-2 gap-4 text-xs text-dark-text-muted">
          <div>
            <span>Total Time:</span>
            <span class="text-dark-text ml-1">{formatTime(sessionStats.totalTime)}</span>
          </div>
          <div>
            <span>Updates:</span>
            <span class="text-dark-text ml-1">{sessionStats.updateCount}</span>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Retry Attempt Indicator -->
    {#if currentUpdate.attempt && currentUpdate.attempt > 1}
      <div class="retry-indicator mt-3 p-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          </div>
          <span class="text-xs text-yellow-400 font-medium">
            Recovery Attempt {currentUpdate.attempt}
          </span>
        </div>
        <p class="text-xs text-yellow-300 mt-1">
          Using advanced methods for optimal results
        </p>
      </div>
    {/if}
    
  </div>
{/if}

<style>
  .real-time-status {
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 12px;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }
  
  .real-time-status.compact {
    padding: 0.75rem;
  }
  
  .real-time-status.compact .progress-header {
    margin-bottom: 0.5rem;
  }
  
  /* Shimmer animation for progress bar */
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
  
  /* Step timeline animations */
  .step-item {
    opacity: 0.7;
  }
  
  .step-item:has(.text-magic-400),
  .step-item:has(.text-green-400) {
    opacity: 1;
  }
  
  /* Smooth transitions */
  .progress-bar div,
  .step-item,
  .step-item > div {
    transition: all 0.3s ease;
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .real-time-status {
      padding: 0.75rem;
    }
    
    .session-stats .grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }
  
  /* Step item states */
  .step-item.active {
    background-color: rgba(0, 255, 136, 0.1);
  }
  
  .step-item.complete {
    background-color: rgba(34, 197, 94, 0.05);
  }
  
  .icon-active {
    background-color: rgba(0, 255, 136, 0.2);
  }
  
  .icon-complete {
    background-color: rgba(34, 197, 94, 0.2);
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .animate-shimmer,
    .animate-spin {
      animation: none;
    }
    
    .progress-bar div,
    .step-item {
      transition: none;
    }
  }
</style>