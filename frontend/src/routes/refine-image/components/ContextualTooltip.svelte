<!--
  Contextual Tooltip Component
  Context-sensitive help tooltips with accessibility support
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  
  export let content: string = '';
  export let title: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'auto';
  export let trigger: 'hover' | 'click' | 'focus' | 'manual' = 'hover';
  export let delay: number = 300;
  export let hideDelay: number = 100;
  export let maxWidth: string = '250px';
  export let show: boolean = false;
  export let disabled: boolean = false;
  export let shortcut: string = '';
  export let contextType: 'tool' | 'action' | 'info' | 'warning' = 'info';
  
  const dispatch = createEventDispatcher();
  
  let triggerElement: HTMLElement;
  let tooltipElement: HTMLElement;
  let isVisible = false;
  let showTimeout: number;
  let hideTimeout: number;
  let actualPosition: string = position || 'auto';
  
  // Reactive visibility
  $: if (show !== undefined) {
    isVisible = show && !disabled;
  }
  
  // Position the tooltip relative to trigger
  function calculatePosition() {
    if (!triggerElement || !tooltipElement) return;
    
    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const spacing = 8; // Gap between trigger and tooltip
    let finalPosition = position;
    
    // Auto-position logic
    if (position === 'auto') {
      // Prefer top, but check if there's space
      if (triggerRect.top - tooltipRect.height - spacing > 0) {
        finalPosition = 'top';
      } else if (triggerRect.bottom + tooltipRect.height + spacing < viewport.height) {
        finalPosition = 'bottom';
      } else if (triggerRect.left - tooltipRect.width - spacing > 0) {
        finalPosition = 'left';
      } else {
        finalPosition = 'right';
      }
    }
    
    let top = 0;
    let left = 0;
    
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + spacing;
        break;
    }
    
    // Keep tooltip within viewport
    left = Math.max(spacing, Math.min(left, viewport.width - tooltipRect.width - spacing));
    top = Math.max(spacing, Math.min(top, viewport.height - tooltipRect.height - spacing));
    
    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.left = `${left}px`;
    actualPosition = finalPosition;
  }
  
  function showTooltip() {
    if (disabled) return;
    
    clearTimeout(hideTimeout);
    
    if (delay > 0) {
      showTimeout = setTimeout(() => {
        isVisible = true;
        dispatch('show');
      }, delay);
    } else {
      isVisible = true;
      dispatch('show');
    }
  }
  
  function hideTooltip() {
    clearTimeout(showTimeout);
    
    if (hideDelay > 0) {
      hideTimeout = setTimeout(() => {
        isVisible = false;
        dispatch('hide');
      }, hideDelay);
    } else {
      isVisible = false;
      dispatch('hide');
    }
  }
  
  function handleTriggerEvent(event: Event) {
    if (disabled) return;
    
    switch (trigger) {
      case 'hover':
        if (event.type === 'mouseenter') {
          showTooltip();
        } else if (event.type === 'mouseleave') {
          hideTooltip();
        }
        break;
      case 'focus':
        if (event.type === 'focusin') {
          showTooltip();
        } else if (event.type === 'focusout') {
          hideTooltip();
        }
        break;
      case 'click':
        if (event.type === 'click') {
          if (isVisible) {
            hideTooltip();
          } else {
            showTooltip();
          }
        }
        break;
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isVisible) {
      hideTooltip();
    }
  }
  
  // Update position when tooltip becomes visible
  $: if (isVisible && tooltipElement) {
    // Use RAF to ensure DOM is updated
    requestAnimationFrame(calculatePosition);
  }
  
  onMount(() => {
    if (triggerElement) {
      // Add event listeners based on trigger type
      if (trigger === 'hover') {
        triggerElement.addEventListener('mouseenter', handleTriggerEvent);
        triggerElement.addEventListener('mouseleave', handleTriggerEvent);
      }
      if (trigger === 'focus' || trigger === 'hover') {
        triggerElement.addEventListener('focusin', handleTriggerEvent);
        triggerElement.addEventListener('focusout', handleTriggerEvent);
      }
      if (trigger === 'click') {
        triggerElement.addEventListener('click', handleTriggerEvent);
      }
    }
    
    // Global escape key handler
    document.addEventListener('keydown', handleKeyDown);
    
    // Handle window resize
    window.addEventListener('resize', calculatePosition);
  });
  
  onDestroy(() => {
    clearTimeout(showTimeout);
    clearTimeout(hideTimeout);
    
    if (triggerElement) {
      triggerElement.removeEventListener('mouseenter', handleTriggerEvent);
      triggerElement.removeEventListener('mouseleave', handleTriggerEvent);
      triggerElement.removeEventListener('focusin', handleTriggerEvent);
      triggerElement.removeEventListener('focusout', handleTriggerEvent);
      triggerElement.removeEventListener('click', handleTriggerEvent);
    }
    
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', calculatePosition);
  });
</script>

<!-- Trigger element wrapper -->
<div class="tooltip-trigger" bind:this={triggerElement}>
  <slot />
</div>

<!-- Tooltip portal -->
{#if isVisible}
  <div 
    bind:this={tooltipElement}
    role="tooltip"
    aria-describedby="tooltip-content"
    class="tooltip-portal {isVisible ? 'visible' : ''} position-{actualPosition} context-{contextType}"
    style="max-width: {maxWidth};"
  >
    
    <!-- Tooltip arrow -->
    <div class="tooltip-arrow"></div>
    
    <!-- Tooltip content -->
    <div class="tooltip-content">
      {#if title}
        <div class="tooltip-title">{title}</div>
      {/if}
      
      <div id="tooltip-content" class="tooltip-text">
        {content}
      </div>
      
      {#if shortcut}
        <div class="tooltip-shortcut">
          <kbd>{shortcut}</kbd>
        </div>
      {/if}
    </div>
    
  </div>
{/if}

<style>
  .tooltip-trigger {
    display: inline-block;
  }
  
  .tooltip-portal {
    position: fixed;
    z-index: 10001;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.15s ease, transform 0.15s ease;
    pointer-events: none;
    backdrop-filter: blur(8px);
  }
  
  .tooltip-portal.visible {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }
  
  .tooltip-content {
    padding: 0.75rem;
  }
  
  .tooltip-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-dark-text);
    margin-bottom: 0.25rem;
  }
  
  .tooltip-text {
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--color-dark-text-secondary);
    margin: 0;
  }
  
  .tooltip-shortcut {
    margin-top: 0.5rem;
    text-align: center;
  }
  
  .tooltip-shortcut kbd {
    background: var(--color-dark-bg);
    border: 1px solid var(--color-dark-border);
    color: var(--color-dark-text);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.7rem;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* Context-specific styling */
  .context-tool {
    border-color: var(--color-magic-400);
  }
  
  .context-tool .tooltip-title {
    color: var(--color-magic-400);
  }
  
  .context-action {
    border-color: var(--color-magic-300);
  }
  
  .context-warning {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }
  
  .context-warning .tooltip-title {
    color: #f59e0b;
  }
  
  /* Tooltip arrow */
  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    transform: rotate(45deg);
  }
  
  /* Arrow positioning */
  .position-top .tooltip-arrow {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
  }
  
  .position-bottom .tooltip-arrow {
    top: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
  }
  
  .position-left .tooltip-arrow {
    right: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-left: none;
    border-bottom: none;
  }
  
  .position-right .tooltip-arrow {
    left: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-right: none;
    border-top: none;
  }
  
  /* Context arrow colors */
  .context-tool .tooltip-arrow {
    border-color: var(--color-magic-400);
    background: var(--color-dark-surface);
  }
  
  .context-warning .tooltip-arrow {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .tooltip-portal {
      max-width: calc(100vw - 2rem) !important;
      font-size: 0.875rem;
    }
    
    .tooltip-content {
      padding: 0.625rem;
    }
    
    .tooltip-title {
      font-size: 0.8rem;
    }
    
    .tooltip-text {
      font-size: 0.75rem;
    }
  }
  
  /* Accessibility: Reduce motion */
  @media (prefers-reduced-motion: reduce) {
    .tooltip-portal {
      transition: opacity 0.1s ease;
      transform: none !important;
    }
    
    .tooltip-portal.visible {
      transform: none !important;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .tooltip-portal {
      border-width: 2px;
      background: var(--color-dark-bg);
    }
    
    .tooltip-arrow {
      border-width: 2px;
      background: var(--color-dark-bg);
    }
    
    .tooltip-shortcut kbd {
      border-width: 2px;
    }
  }
</style>