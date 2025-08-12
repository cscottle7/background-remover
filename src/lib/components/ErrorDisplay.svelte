<!--
  Enhanced Error Display Component
  Shows user-friendly error messages based on error classification
  Implements Chloe's need for clear, actionable feedback
-->

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { quintOut } from 'svelte/easing';
  import { errorClassificationService, type ErrorClassification } from '../services/errorClassification';
  
  export let error: Error | string;
  export let context: {
    fileSize?: number;
    fileName?: string;
    attempt?: number;
    userAgent?: string;
  } = {};
  export let showTechnicalDetails: boolean = false;
  export let allowRetry: boolean = true;
  export let autoHide: boolean = true;
  
  const dispatch = createEventDispatcher<{
    retry: void;
    dismiss: void;
    showTechnical: void;
  }>();
  
  // Animation state
  let slideIn = tweened(0, { duration: 400, easing: quintOut });
  let fadeOut = tweened(1, { duration: 300, easing: quintOut });
  
  // Component state
  let classification: ErrorClassification;
  let showDetails = false;
  let autoHideTimer: ReturnType<typeof setTimeout>;
  let isVisible = true;
  
  // Reactive classification
  $: {
    classification = errorClassificationService.classifyError(error, context);
    resetAutoHide();
  }
  
  onMount(() => {
    slideIn.set(1);
    resetAutoHide();
  });
  
  function resetAutoHide() {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    
    if (autoHide && classification?.displayDuration && classification.severity !== 'critical') {
      autoHideTimer = setTimeout(() => {
        handleDismiss();
      }, classification.displayDuration);
    }
  }
  
  function handleRetry() {
    dispatch('retry');
  }
  
  function handleDismiss() {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    
    fadeOut.set(0).then(() => {
      isVisible = false;
      dispatch('dismiss');
    });
  }
  
  function toggleDetails() {
    showDetails = !showDetails;
    if (showDetails) {
      dispatch('showTechnical');
    }
  }
  
  // Get icon based on error category
  function getErrorIcon(category: string): string {
    const icons = {
      network: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
      file_validation: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      processing_failure: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      browser_compatibility: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      quota_exceeded: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      server_error: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
      unknown: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[category as keyof typeof icons] || icons.unknown;
  }
  
  // Format error category for display
  function formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

{#if isVisible && classification}
  <div 
    class="error-display {errorClassificationService.getErrorBackgroundColor(classification.severity)} {errorClassificationService.getErrorBorderColor(classification.severity)} border rounded-xl p-6 max-w-2xl mx-auto"
    style="opacity: {$fadeOut}; transform: translateY({(1 - $slideIn) * 20}px)"
  >
    
    <!-- Error Header -->
    <div class="flex items-start space-x-4">
      
      <!-- Error Icon -->
      <div class="flex-shrink-0">
        <div class="w-12 h-12 rounded-full {errorClassificationService.getErrorBackgroundColor(classification.severity)} flex items-center justify-center">
          <svg 
            class="w-6 h-6 {errorClassificationService.getErrorColor(classification.severity)}" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d={getErrorIcon(classification.category)}
            />
          </svg>
        </div>
      </div>
      
      <!-- Error Content -->
      <div class="flex-grow">
        
        <!-- Error Message -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold {errorClassificationService.getErrorColor(classification.severity)} mb-2">
            {formatCategory(classification.category)} Error
          </h3>
          <p class="text-dark-text mb-3 leading-relaxed">
            {classification.userMessage}
          </p>
          
          <!-- Error Context Info -->
          {#if context.fileName || (context.attempt && context.attempt > 1)}
            <div class="text-sm text-dark-text-muted space-y-1">
              {#if context.fileName}
                <div class="flex items-center space-x-2">
                  <span>File:</span>
                  <span class="font-mono bg-dark-elevated px-2 py-1 rounded text-xs">
                    {context.fileName}
                  </span>
                </div>
              {/if}
              {#if context.attempt && context.attempt > 1}
                <div class="flex items-center space-x-2">
                  <span>Attempt:</span>
                  <span class="font-mono bg-dark-elevated px-2 py-1 rounded text-xs">
                    {context.attempt}
                  </span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
        
        <!-- Suggested Actions -->
        {#if classification.suggestedActions.length > 0}
          <div class="mb-4">
            <h4 class="text-sm font-medium text-dark-text mb-2">What you can do:</h4>
            <ul class="space-y-1">
              {#each classification.suggestedActions as action}
                <li class="flex items-start space-x-2 text-sm text-dark-text-secondary">
                  <svg class="w-4 h-4 text-magic-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{action}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3">
          
          {#if allowRetry && classification.recoverable}
            <button
              on:click={handleRetry}
              class="btn btn-outline {errorClassificationService.getErrorBorderColor(classification.severity)} {errorClassificationService.getErrorColor(classification.severity)} hover:{errorClassificationService.getErrorBackgroundColor(classification.severity)} px-4 py-2 rounded-lg text-sm font-medium"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Try Again
            </button>
          {/if}
          
          <button
            on:click={handleDismiss}
            class="btn btn-outline border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Dismiss
          </button>
          
          {#if showTechnicalDetails}
            <button
              on:click={toggleDetails}
              class="btn btn-text text-dark-text-muted hover:text-dark-text px-4 py-2 rounded-lg text-sm"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          {/if}
          
        </div>
        
      </div>
      
      <!-- Close Button -->
      <div class="flex-shrink-0">
        <button
          on:click={handleDismiss}
          class="text-dark-text-muted hover:text-dark-text p-1 rounded"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
    </div>
    
    <!-- Technical Details (Collapsible) -->
    {#if showTechnicalDetails && showDetails}
      <div class="mt-6 pt-4 border-t border-gray-600">
        <details class="space-y-3">
          <summary class="text-sm font-medium text-dark-text cursor-pointer hover:text-magic-400">
            Technical Information
          </summary>
          
          <div class="mt-3 space-y-2 text-xs text-dark-text-muted">
            <div>
              <strong>Category:</strong> {classification.category}
            </div>
            <div>
              <strong>Severity:</strong> {classification.severity}
            </div>
            <div>
              <strong>Recoverable:</strong> {classification.recoverable ? 'Yes' : 'No'}
            </div>
            {#if classification.recommendedStrategy}
              <div>
                <strong>Recommended Strategy:</strong> {classification.recommendedStrategy}
              </div>
            {/if}
            <div>
              <strong>Technical Message:</strong>
              <pre class="mt-1 p-2 bg-dark-base rounded text-xs overflow-x-auto">{classification.technicalMessage}</pre>
            </div>
          </div>
        </details>
      </div>
    {/if}
    
    <!-- Auto-hide Progress Bar -->
    {#if autoHide && classification.displayDuration && classification.severity !== 'critical'}
      <div class="mt-4 h-1 bg-dark-base rounded-full overflow-hidden">
        <div 
          class="h-full {errorClassificationService.getErrorBackgroundColor(classification.severity)} transition-all ease-linear"
          style="width: 100%; animation: countdown {classification.displayDuration}ms linear;"
        />
      </div>
    {/if}
    
  </div>
{/if}

<style>
  .error-display {
    backdrop-filter: blur(10px);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  @keyframes countdown {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  /* Smooth transitions for all interactive elements */
  .error-display button {
    transition: all 0.2s ease;
  }
  
  .error-display button:hover {
    transform: translateY(-1px);
  }
  
  /* Technical details styling */
  details[open] summary {
    color: rgba(0, 255, 136, 1);
  }
  
  pre {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .error-display {
      animation: none;
      transition: none;
    }
    
    .error-display button:hover {
      transform: none;
    }
  }
  
  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .error-display {
      padding: 1rem;
      margin: 0 1rem;
    }
    
    .flex.flex-wrap.gap-3 {
      flex-direction: column;
    }
    
    .flex.flex-wrap.gap-3 button {
      width: 100%;
      justify-content: center;
    }
  }
</style>