<!--
  Enhanced Progress Indicator Component
  Comprehensive progress feedback with accessibility features
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProgressState } from '$lib/services/progressIndicatorService';
  
  export let progressState: ProgressState;
  export let variant: 'inline' | 'overlay' | 'minimal' = 'inline';
  export let showSteps: boolean = true;
  export let showTimeRemaining: boolean = true;
  export let showPercentage: boolean = true;
  
  // Animation state
  let progressBarElement: HTMLElement;
  let animationFrame: number;
  
  // Reactive values
  $: isActive = progressState.isActive;
  $: hasError = !!progressState.error;
  $: percentComplete = progressState.percentComplete;
  $: formattedMessage = getFormattedMessage();
  
  function getFormattedMessage(): string {
    if (hasError) {
      return progressState.statusMessage;
    }
    
    if (!isActive) {
      return progressState.statusMessage;
    }
    
    let message = progressState.statusMessage;
    
    if (showPercentage && progressState.percentComplete > 0) {
      message += ` (${Math.round(progressState.percentComplete)}%)`;
    }
    
    if (showTimeRemaining && progressState.estimatedTimeRemaining) {
      const timeRemaining = formatTime(progressState.estimatedTimeRemaining);
      message += ` • ${timeRemaining} remaining`;
    }
    
    return message;
  }
  
  function formatTime(milliseconds: number): string {
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
  
  // Smooth progress bar animation
  function animateProgressBar(targetPercent: number) {
    if (!progressBarElement) return;
    
    const currentPercent = parseFloat(progressBarElement.style.width || '0');
    const diff = targetPercent - currentPercent;
    const duration = 300; // ms
    const steps = 60; // 60fps
    const increment = diff / steps;
    
    let step = 0;
    
    function animate() {
      if (step < steps) {
        const newPercent = currentPercent + (increment * step);
        progressBarElement.style.width = `${Math.min(100, Math.max(0, newPercent))}%`;
        step++;
        animationFrame = requestAnimationFrame(animate);
      } else {
        progressBarElement.style.width = `${targetPercent}%`;
      }
    }
    
    animate();
  }
  
  // React to progress changes
  $: if (progressBarElement && typeof percentComplete === 'number') {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    animateProgressBar(percentComplete);
  }
  
  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
</script>

{#if isActive || hasError}
  <div 
    class="progress-indicator variant-{variant}"
    class:error={hasError}
    role="progressbar"
    aria-valuenow={Math.round(percentComplete)}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label={progressState.currentOperation || 'Processing'}
    aria-describedby="progress-message"
  >
    
    {#if variant === 'overlay'}
      <!-- Full overlay variant -->
      <div class="progress-overlay">
        <div class="progress-modal">
          
          <!-- Progress header -->
          <div class="progress-header">
            {#if hasError}
              <div class="error-icon">
                <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
            {:else}
              <div class="progress-spinner">
                <div class="spinner"></div>
              </div>
            {/if}
            
            <h3 class="progress-title">
              {hasError ? 'Error Occurred' : progressState.currentOperation || 'Processing'}
            </h3>
          </div>
          
          <!-- Progress content -->
          <div class="progress-content">
            {#if !hasError}
              <!-- Progress bar -->
              <div class="progress-track">
                <div 
                  class="progress-fill"
                  bind:this={progressBarElement}
                  style="width: 0%"
                ></div>
              </div>
              
              <!-- Step indicators -->
              {#if showSteps && progressState.totalSteps > 1}
                <div class="step-indicators">
                  {#each Array(progressState.totalSteps) as _, index}
                    <div 
                      class="step-dot"
                      class:completed={index < progressState.currentStep}
                      class:active={index === progressState.currentStep}
                      aria-hidden="true"
                    ></div>
                  {/each}
                </div>
              {/if}
            {/if}
            
            <!-- Status message -->
            <p id="progress-message" class="progress-message">
              {formattedMessage}
            </p>
          </div>
          
        </div>
      </div>
      
    {:else if variant === 'minimal'}
      <!-- Minimal variant -->
      <div class="progress-minimal">
        <div class="minimal-spinner"></div>
        <span class="minimal-text">{progressState.statusMessage}</span>
      </div>
      
    {:else}
      <!-- Default inline variant -->
      <div class="progress-inline">
        
        <!-- Status and icon -->
        <div class="progress-status">
          {#if hasError}
            <svg class="status-icon error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/>
            </svg>
          {:else}
            <div class="status-spinner">
              <div class="inline-spinner"></div>
            </div>
          {/if}
          
          <span class="status-text">
            {progressState.currentOperation || 'Processing'}
          </span>
        </div>
        
        <!-- Progress bar -->
        {#if !hasError}
          <div class="progress-track">
            <div 
              class="progress-fill"
              bind:this={progressBarElement}
              style="width: 0%"
            ></div>
          </div>
        {/if}
        
        <!-- Progress message -->
        <p id="progress-message" class="progress-message">
          {formattedMessage}
        </p>
        
      </div>
    {/if}
    
  </div>
{/if}

<style>
  .progress-indicator {
    --progress-color: var(--color-magic-400);
    --progress-bg: var(--color-dark-border);
    --progress-text: var(--color-dark-text-secondary);
    --error-color: #ef4444;
  }
  
  .progress-indicator.error {
    --progress-color: var(--error-color);
  }
  
  /* Overlay variant */
  .variant-overlay .progress-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    backdrop-filter: blur(4px);
  }
  
  .progress-modal {
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 12px;
    padding: 2rem;
    max-width: 400px;
    width: 90vw;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }
  
  .progress-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .progress-spinner,
  .error-icon {
    margin-bottom: 1rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--progress-bg);
    border-top: 3px solid var(--progress-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .progress-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-dark-text);
    margin: 0;
  }
  
  .progress-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  /* Inline variant */
  .progress-inline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 8px;
  }
  
  .progress-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .status-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  .status-icon.error {
    color: var(--error-color);
  }
  
  .status-spinner {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  .inline-spinner {
    width: 100%;
    height: 100%;
    border: 2px solid var(--progress-bg);
    border-top: 2px solid var(--progress-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .status-text {
    font-weight: 500;
    color: var(--color-dark-text);
  }
  
  /* Minimal variant */
  .progress-minimal {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .minimal-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--progress-bg);
    border-top: 2px solid var(--progress-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .minimal-text {
    font-size: 0.875rem;
    color: var(--progress-text);
  }
  
  /* Progress track and fill */
  .progress-track {
    width: 100%;
    height: 8px;
    background: var(--progress-bg);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: 4px;
    transition: width 0.3s ease;
    background-image: linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%);
    background-size: 20px 20px;
    animation: progress-animation 1s linear infinite;
  }
  
  /* Step indicators */
  .step-indicators {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
  }
  
  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--progress-bg);
    transition: all 0.2s ease;
  }
  
  .step-dot.completed {
    background: var(--progress-color);
  }
  
  .step-dot.active {
    background: var(--progress-color);
    transform: scale(1.3);
    box-shadow: 0 0 8px rgba(138, 43, 226, 0.4);
  }
  
  /* Progress message */
  .progress-message {
    font-size: 0.875rem;
    color: var(--progress-text);
    margin: 0;
    line-height: 1.4;
  }
  
  /* Animations */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progress-animation {
    0% { background-position: 0 0; }
    100% { background-position: 20px 0; }
  }
  
  /* Mobile responsiveness */
  @media (max-width: 767px) {
    .progress-modal {
      padding: 1.5rem;
      margin: 1rem;
    }
    
    .progress-inline {
      padding: 0.75rem;
      gap: 0.5rem;
    }
    
    .progress-status {
      gap: 0.5rem;
    }
    
    .status-text {
      font-size: 0.875rem;
    }
  }
  
  /* Accessibility: Reduce motion */
  @media (prefers-reduced-motion: reduce) {
    .spinner,
    .inline-spinner,
    .minimal-spinner {
      animation: none;
    }
    
    .progress-fill {
      animation: none;
      background-image: none;
    }
    
    .step-dot {
      transition: none;
    }
    
    .step-dot.active {
      transform: none;
      box-shadow: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .progress-indicator {
      --progress-color: #ffffff;
      --progress-bg: #000000;
      --progress-text: #ffffff;
    }
    
    .progress-modal,
    .progress-inline {
      border-width: 2px;
    }
  }
</style>