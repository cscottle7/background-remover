<!--
  Tutorial Overlay Component
  First-visit guided tutorial for new users of the refinement page
  Accessible and dismissible overlay with step-by-step guidance
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let show: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let currentStep = 0;
  let tutorialContainer: HTMLElement;
  
  const tutorialSteps = [
    {
      target: '.refinement-header',
      title: 'Welcome to Image Refinement',
      content: 'Use these precision tools to perfect your character image. You can save your work or cancel anytime.',
      position: 'bottom'
    },
    {
      target: '.canvas-container',
      title: 'Interactive Canvas',
      content: 'This is your editing canvas. Zoom, pan, and use tools directly on your image. Press Space to preview the original.',
      position: 'top'
    },
    {
      target: '.toolbar-container',
      title: 'Refinement Tools',
      content: 'Choose from precision tools: Smart Restore (B), Erase (E), Background Restore (R), and more. Use keyboard shortcuts for quick access.',
      position: 'left'
    },
    {
      target: '.refinement-footer',
      title: 'Help & Shortcuts',
      content: 'View keyboard shortcuts and current tool info here. Press H anytime to see all shortcuts.',
      position: 'top'
    }
  ];
  
  $: currentStepData = tutorialSteps[currentStep];
  
  function nextStep() {
    if (currentStep < tutorialSteps.length - 1) {
      currentStep++;
    } else {
      closeTutorial();
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }
  
  function closeTutorial() {
    if (browser) {
      localStorage.setItem('refinement_tutorial_completed', 'true');
    }
    dispatch('close');
  }
  
  function skipTutorial() {
    closeTutorial();
  }
  
  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!show) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeTutorial();
        break;
      case 'ArrowRight':
      case 'Enter':
        event.preventDefault();
        nextStep();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        prevStep();
        break;
    }
  }
  
  // Position tooltip relative to target element
  function getTooltipPosition(target: string) {
    if (!browser) return { top: '50%', left: '50%' };
    
    const element = document.querySelector(target);
    if (!element) return { top: '50%', left: '50%' };
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = '50%';
    let left = '50%';
    let transform = 'translate(-50%, -50%)';
    
    switch (currentStepData.position) {
      case 'bottom':
        top = `${rect.bottom + 20}px`;
        left = `${rect.left + rect.width / 2}px`;
        transform = 'translateX(-50%)';
        break;
      case 'top':
        top = `${rect.top - 20}px`;
        left = `${rect.left + rect.width / 2}px`;
        transform = 'translate(-50%, -100%)';
        break;
      case 'left':
        top = `${rect.top + rect.height / 2}px`;
        left = `${rect.left - 20}px`;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        top = `${rect.top + rect.height / 2}px`;
        left = `${rect.right + 20}px`;
        transform = 'translateY(-50%)';
        break;
    }
    
    return { top, left, transform };
  }
  
  onMount(() => {
    if (browser) {
      window.addEventListener('keydown', handleKeydown);
      return () => {
        window.removeEventListener('keydown', handleKeydown);
      };
    }
  });
</script>

{#if show}
  <!-- Tutorial overlay backdrop -->
  <div 
    class="tutorial-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tutorial-title"
    aria-describedby="tutorial-content"
    bind:this={tutorialContainer}
  >
    
    <!-- Spotlight highlight for current target -->
    <div class="tutorial-spotlight" style="--target-selector: '{currentStepData.target}'"></div>
    
    <!-- Tutorial tooltip -->
    <div 
      class="tutorial-tooltip"
      style="top: {getTooltipPosition(currentStepData.target).top}; left: {getTooltipPosition(currentStepData.target).left}; transform: {getTooltipPosition(currentStepData.target).transform};"
    >
      
      <!-- Tooltip header -->
      <div class="tooltip-header">
        <h2 id="tutorial-title" class="tooltip-title">{currentStepData.title}</h2>
        <button 
          on:click={closeTutorial}
          class="close-button"
          aria-label="Close tutorial"
          title="Close tutorial (Esc)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Tooltip content -->
      <div class="tooltip-content">
        <p id="tutorial-content" class="content-text">{currentStepData.content}</p>
      </div>
      
      <!-- Tooltip navigation -->
      <div class="tooltip-navigation">
        
        <!-- Step indicator -->
        <div class="step-indicator">
          {#each tutorialSteps as _, index}
            <div 
              class="step-dot"
              class:active={index === currentStep}
              class:completed={index < currentStep}
              aria-hidden="true"
            ></div>
          {/each}
        </div>
        
        <!-- Navigation buttons -->
        <div class="nav-buttons">
          <button 
            on:click={skipTutorial}
            class="btn btn-text"
          >
            Skip Tutorial
          </button>
          
          <div class="step-buttons">
            {#if currentStep > 0}
              <button 
                on:click={prevStep}
                class="btn btn-outline"
                aria-label="Previous step"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>
            {/if}
            
            <button 
              on:click={nextStep}
              class="btn btn-magic"
              aria-label={currentStep === tutorialSteps.length - 1 ? 'Finish tutorial' : 'Next step'}
            >
              {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
              {#if currentStep < tutorialSteps.length - 1}
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              {/if}
            </button>
          </div>
        </div>
        
      </div>
    </div>
    
  </div>
{/if}

<style>
  .tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  }
  
  .tutorial-spotlight {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    /* Spotlight effect would be implemented with complex CSS or JS */
  }
  
  .tutorial-tooltip {
    position: absolute;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 90vw;
    z-index: 10000;
    animation: tooltipEnter 0.3s ease-out;
  }
  
  .tooltip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-dark-border);
  }
  
  .tooltip-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-dark-text);
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    color: var(--color-dark-text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background: var(--color-dark-hover);
    color: var(--color-dark-text);
  }
  
  .tooltip-content {
    padding: 1rem 1.5rem;
  }
  
  .content-text {
    color: var(--color-dark-text-secondary);
    line-height: 1.6;
    margin: 0;
    font-size: 0.875rem;
  }
  
  .tooltip-navigation {
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid var(--color-dark-border);
  }
  
  .step-indicator {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-dark-border);
    transition: all 0.2s ease;
  }
  
  .step-dot.active {
    background: var(--color-magic-400);
    transform: scale(1.2);
  }
  
  .step-dot.completed {
    background: var(--color-magic-300);
  }
  
  .nav-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .step-buttons {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
  }
  
  .btn-text {
    background: none;
    color: var(--color-dark-text-muted);
    border: none;
    padding: 0.5rem 0;
  }
  
  .btn-text:hover {
    color: var(--color-dark-text-secondary);
  }
  
  .btn-outline {
    color: var(--color-dark-text-secondary);
    border-color: var(--color-dark-border);
    background: transparent;
  }
  
  .btn-outline:hover {
    color: var(--color-dark-text);
    border-color: var(--color-dark-text-secondary);
    background: var(--color-dark-hover);
  }
  
  .btn-magic {
    background: var(--color-magic-400);
    color: white;
    border-color: var(--color-magic-400);
  }
  
  .btn-magic:hover {
    background: var(--color-magic-500);
    border-color: var(--color-magic-500);
  }
  
  @keyframes tooltipEnter {
    from {
      opacity: 0;
      transform: scale(0.9) translate(-50%, -50%);
    }
    to {
      opacity: 1;
      transform: scale(1) translate(-50%, -50%);
    }
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .tutorial-tooltip {
      position: fixed;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      max-width: calc(100vw - 2rem);
    }
    
    .tooltip-header {
      padding: 1rem;
    }
    
    .tooltip-content {
      padding: 0.75rem 1rem;
    }
    
    .tooltip-navigation {
      padding: 0.75rem 1rem 1rem;
    }
    
    .nav-buttons {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .step-buttons {
      width: 100%;
      justify-content: space-between;
    }
    
    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
    }
    
    .btn-text {
      text-align: center;
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .tutorial-tooltip {
      animation: none;
    }
    
    .step-dot {
      transition: none;
    }
    
    .step-dot.active {
      transform: none;
    }
    
    .btn {
      transition: none;
    }
  }
</style>