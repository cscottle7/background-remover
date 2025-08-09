<!--
  Net Promoter Score Survey Component
  Implements Phase 5 requirement for NPS measurement
  Shows after successful processing for positive experience capture
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { quintOut } from 'svelte/easing';
  import { analyticsService } from '../services/analytics';
  
  export let visible: boolean = false;
  export let imagesProcessed: number = 0;
  export let autoShowDelay: number = 5000; // Show after 5 seconds
  
  const dispatch = createEventDispatcher<{
    submit: { score: number; feedback?: string };
    dismiss: void;
  }>();
  
  // Component state
  let selectedScore: number | null = null;
  let feedback: string = '';
  let showFeedback: boolean = false;
  let isSubmitting: boolean = false;
  let showThankYou: boolean = false;
  let hasInteracted: boolean = false;
  
  // Animation state
  let slideIn = tweened(0, { duration: 400, easing: quintOut });
  let fadeOut = tweened(1, { duration: 300, easing: quintOut });
  
  // NPS categories
  $: npsCategory = selectedScore !== null ? getNPSCategory(selectedScore) : null;
  
  onMount(() => {
    if (visible) {
      slideIn.set(1);
    }
  });
  
  // Reactive visibility handling
  $: if (visible) {
    slideIn.set(1);
  }
  
  function getNPSCategory(score: number): 'promoter' | 'passive' | 'detractor' {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  }
  
  function handleScoreSelect(score: number) {
    selectedScore = score;
    hasInteracted = true;
    
    // Show feedback input for all responses to gather insights
    showFeedback = true;
  }
  
  async function handleSubmit() {
    if (selectedScore === null) return;
    
    isSubmitting = true;
    
    try {
      // Track NPS response in analytics
      await analyticsService.trackNPSResponse(selectedScore, feedback);
      
      // Dispatch to parent component
      dispatch('submit', { 
        score: selectedScore, 
        feedback: feedback.trim() || undefined 
      });
      
      // Show thank you message
      showThankYou = true;
      
      // Auto-dismiss after showing thank you
      setTimeout(() => {
        handleDismiss();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit NPS:', error);
      // Continue with UI flow even if tracking fails
      showThankYou = true;
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleDismiss() {
    fadeOut.set(0).then(() => {
      visible = false;
      dispatch('dismiss');
    });
  }
  
  // Score labels for better UX
  const scoreLabels = {
    0: 'Not at all likely',
    5: 'Neutral',
    10: 'Extremely likely'
  };
  
  // Dynamic feedback prompts based on score
  function getFeedbackPrompt(score: number): string {
    if (score >= 9) {
      return "What did you love most about CharacterCut?";
    } else if (score >= 7) {
      return "What would make CharacterCut even better?";
    } else {
      return "What can we improve to make this more useful for you?";
    }
  }
  
  // Category-specific styling
  const categoryStyles = {
    promoter: 'text-green-400 border-green-400/30',
    passive: 'text-yellow-400 border-yellow-400/30', 
    detractor: 'text-red-400 border-red-400/30'
  };
</script>

{#if visible}
  <div 
    class="nps-survey fixed bottom-6 right-6 max-w-sm bg-dark-elevated border border-magic-400/20 rounded-xl p-6 shadow-2xl z-50"
    style="opacity: {$fadeOut}; transform: translateY({(1 - $slideIn) * 20}px)"
  >
    
    {#if !showThankYou}
      <!-- Main Survey -->
      <div class="space-y-4">
        
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-magic-gradient mb-1">
              Quick feedback?
            </h3>
            <p class="text-sm text-dark-text-secondary">
              Help us improve CharacterCut for developers like you
            </p>
          </div>
          <button
            on:click={handleDismiss}
            class="text-dark-text-muted hover:text-dark-text p-1 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- NPS Question -->
        <div class="space-y-3">
          <p class="text-sm text-dark-text">
            How likely are you to recommend CharacterCut to other developers?
          </p>
          
          <!-- Score Selection -->
          <div class="space-y-2">
            <div class="grid grid-cols-11 gap-1">
              {#each Array(11) as _, i}
                <button
                  on:click={() => handleScoreSelect(i)}
                  class="score-button w-8 h-8 rounded-md border text-xs font-medium transition-all"
                  class:selected={selectedScore === i}
                  class:hover-effect={selectedScore !== i}
                  class:border-magic-400={selectedScore === i}
                  class:bg-magic-400={selectedScore === i}
                  class:text-white={selectedScore === i}
                  class:border-gray-600={selectedScore !== i}
                  class:text-dark-text-muted={selectedScore !== i}
                  class:hover:border-magic-400={selectedScore !== i}
                  class:hover:text-magic-400={selectedScore !== i}
                >
                  {i}
                </button>
              {/each}
            </div>
            
            <!-- Score Labels -->
            <div class="flex justify-between text-xs text-dark-text-muted">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>
        </div>
        
        <!-- Feedback Input (shown after score selection) -->
        {#if showFeedback && selectedScore !== null}
          <div class="space-y-3 pt-2 border-t border-gray-700">
            
            <!-- Category Indicator -->
            {#if npsCategory}
              <div class="text-xs {categoryStyles[npsCategory]} px-2 py-1 border rounded text-center">
                {npsCategory === 'promoter' ? '🎉 Promoter' : npsCategory === 'passive' ? '😐 Passive' : '😟 Detractor'}
              </div>
            {/if}
            
            <div>
              <label class="block text-sm text-dark-text mb-2">
                {getFeedbackPrompt(selectedScore)}
              </label>
              <textarea
                bind:value={feedback}
                placeholder="Your thoughts help us improve..."
                class="w-full px-3 py-2 bg-dark-base border border-gray-600 rounded-lg text-dark-text placeholder-dark-text-muted text-sm resize-none focus:border-magic-400 focus:outline-none"
                rows="3"
              />
            </div>
          </div>
        {/if}
        
        <!-- Actions -->
        {#if selectedScore !== null}
          <div class="flex space-x-2 pt-2">
            <button
              on:click={handleSubmit}
              disabled={isSubmitting}
              class="flex-1 btn btn-magic py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {#if isSubmitting}
                <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Submitting...
              {:else}
                Submit
              {/if}
            </button>
            <button
              on:click={handleDismiss}
              class="px-4 py-2 text-dark-text-muted hover:text-dark-text transition-colors text-sm"
            >
              Skip
            </button>
          </div>
        {/if}
        
      </div>
      
    {:else}
      <!-- Thank You Message -->
      <div class="text-center space-y-3">
        <div class="w-12 h-12 mx-auto rounded-full bg-green-400/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        
        <div>
          <h3 class="text-lg font-semibold text-green-400 mb-1">Thank you!</h3>
          <p class="text-sm text-dark-text-secondary">
            Your feedback helps us make CharacterCut better for all developers.
          </p>
        </div>
        
        {#if selectedScore !== null && selectedScore >= 9}
          <div class="text-xs text-magic-300">
            🚀 Consider sharing CharacterCut with your developer community!
          </div>
        {/if}
      </div>
    {/if}
    
  </div>
{/if}

<style>
  .nps-survey {
    backdrop-filter: blur(10px);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  .score-button {
    transition: all 0.2s ease;
  }
  
  .score-button.selected {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 255, 136, 0.3);
  }
  
  .score-button.hover-effect:hover {
    transform: scale(1.05);
  }
  
  /* Smooth animations */
  .nps-survey * {
    transition: all 0.2s ease;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .nps-survey {
      bottom: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }
    
    .grid.grid-cols-11 {
      grid-template-columns: repeat(11, minmax(0, 1fr));
      gap: 0.25rem;
    }
    
    .score-button {
      width: 1.75rem;
      height: 1.75rem;
      font-size: 0.75rem;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .nps-survey,
    .score-button {
      transition: none;
      animation: none;
    }
    
    .score-button.selected {
      transform: none;
    }
    
    .score-button.hover-effect:hover {
      transform: none;
    }
  }
</style>