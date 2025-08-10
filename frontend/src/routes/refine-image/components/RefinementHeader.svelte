<!--
  Refinement Header Component
  Navigation controls and save/cancel actions for the refinement page
-->

<script lang="ts">
  import { createEventDispatcher, onMount, getContext } from 'svelte';
  import type { FocusManagementService } from '$lib/services/focusManagementService';
  
  export let hasUnsavedChanges: boolean = false;
  export let isProcessing: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function handleSave() {
    dispatch('save');
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
  
  function handleKeyboard(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          handleSave();
          break;
        case 'w':
          event.preventDefault();
          handleCancel();
          break;
      }
    }
    
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeyboard} />

<header class="refinement-header">
  <div class="header-content">
    
    <!-- Enhanced Breadcrumb Navigation -->
    <div class="header-left">
      <nav class="breadcrumb-nav" aria-label="Breadcrumb navigation">
        <ol class="breadcrumb-list" role="list">
          <!-- Home/Main step -->
          <li class="breadcrumb-item" role="listitem">
            <button
              on:click={handleCancel}
              class="breadcrumb-link"
              title="Return to main page"
              disabled={isProcessing}
              aria-label="Go back to main page - Background removal tool"
              tabindex="0"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span class="breadcrumb-text">CharacterCut</span>
            </button>
          </li>
          
          <!-- Separator -->
          <li class="breadcrumb-separator" role="presentation" aria-hidden="true">
            <svg class="w-4 h-4 text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </li>
          
          <!-- Current step -->
          <li class="breadcrumb-item breadcrumb-current" role="listitem">
            <span class="breadcrumb-current-text" aria-current="page">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              <span>Refine Image</span>
            </span>
          </li>
        </ol>
        
        <!-- Status indicators -->
        <div class="status-indicators">
          {#if hasUnsavedChanges}
            <div class="unsaved-indicator" role="status" aria-live="polite">
              <div class="unsaved-dot" aria-hidden="true"></div>
              <span class="unsaved-text">Unsaved changes</span>
            </div>
          {/if}
          
          {#if isProcessing}
            <div class="processing-indicator" role="status" aria-live="polite">
              <div class="processing-spinner" aria-hidden="true"></div>
              <span class="processing-text">Processing...</span>
            </div>
          {/if}
        </div>
      </nav>
    </div>
    
    <!-- Action buttons -->
    <div class="header-right">
      <button
        on:click={handleCancel}
        class="btn btn-outline border-dark-border text-dark-text-secondary hover:bg-dark-border hover:text-white px-6 py-3 rounded-lg font-medium"
        disabled={isProcessing}
        aria-label="Cancel editing and return to main page"
        tabindex="0"
      >
        Cancel
      </button>
      
      <button
        on:click={handleSave}
        class="btn btn-magic px-6 py-3 rounded-lg font-medium"
        disabled={isProcessing}
        class:loading={isProcessing}
        aria-label={isProcessing ? "Processing image, please wait" : "Save changes and return to main page"}
        aria-live="polite"
        tabindex="0"
      >
        {#if isProcessing}
          <div class="loading-spinner"></div>
          Processing...
        {:else}
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save & Return
        {/if}
      </button>
    </div>
    
  </div>
  
  <!-- Mobile progress indicator -->
  {#if isProcessing}
    <div class="progress-bar" role="progressbar" aria-label="Processing image" aria-valuetext="Processing">
      <div class="progress-fill"></div>
    </div>
  {/if}
</header>

<style>
  .refinement-header {
    background: rgba(21, 21, 21, 0.8);
    border-bottom: 1px solid rgba(51, 51, 51, 0.5);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    height: 64px;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    max-width: 100%;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }
  
  /* Breadcrumb Navigation Styles */
  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }
  
  .breadcrumb-list {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.5rem;
  }
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
  }
  
  .breadcrumb-link {
    display: flex;
    align-items: center;
    color: var(--color-dark-text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
  }
  
  .breadcrumb-link:hover:not(:disabled) {
    color: var(--color-magic-400);
    background: var(--color-dark-hover);
  }
  
  .breadcrumb-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .breadcrumb-text {
    margin-left: 0.25rem;
  }
  
  .breadcrumb-separator {
    color: var(--color-dark-text-muted);
    margin: 0 0.25rem;
  }
  
  .breadcrumb-current {
    display: flex;
    align-items: center;
  }
  
  .breadcrumb-current-text {
    display: flex;
    align-items: center;
    color: var(--color-dark-text);
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .status-indicators {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: 1rem;
  }
  
  .unsaved-indicator,
  .processing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    white-space: nowrap;
  }
  
  .unsaved-indicator {
    color: var(--color-warning);
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  
  .processing-indicator {
    color: var(--color-magic-400);
    background: rgba(30, 64, 175, 0.1);
    border: 1px solid rgba(30, 64, 175, 0.2);
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .unsaved-dot {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  .processing-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .unsaved-text,
  .processing-text {
    white-space: nowrap;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
  
  /* Button styles now handled by global design system */
  
  .btn-save.loading {
    pointer-events: none;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  .progress-bar {
    height: 2px;
    background: var(--color-dark-border);
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-magic-400);
    animation: progress 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .header-content {
      padding: 0.75rem 1rem;
    }
    
    /* Simplify breadcrumb on mobile */
    .breadcrumb-text {
      display: none;
    }
    
    .breadcrumb-current-text span {
      display: none;
    }
    
    .status-indicators {
      margin-left: 0.5rem;
    }
    
    .unsaved-text,
    .processing-text {
      display: none;
    }
    
    .btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
    
    .header-right {
      gap: 0.5rem;
    }
  }
  
  /* Extra small screens */
  @media (max-width: 480px) {
    .breadcrumb-nav {
      gap: 0.5rem;
    }
    
    .breadcrumb-list {
      gap: 0.25rem;
    }
    
    .breadcrumb-link {
      padding: 0.25rem 0.5rem;
    }
    
    .status-indicators {
      display: none;
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .unsaved-dot,
    .loading-spinner,
    .progress-fill {
      animation: none;
    }
    
    .unsaved-dot {
      opacity: 1;
    }
  }
</style>