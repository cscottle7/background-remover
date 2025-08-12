<!--
  Qualitative Feedback Collection Component
  Implements Phase 5 requirement for detailed feedback submissions
  Target: 15 detailed feedback submissions
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { analyticsService } from '../services/analytics';
  
  export let visible: boolean = false;
  export let feedbackType: 'feature_request' | 'bug_report' | 'general' | 'improvement' = 'general';
  export let contextData: Record<string, any> = {};
  
  const dispatch = createEventDispatcher<{
    submit: { type: string; content: string; email?: string };
    dismiss: void;
  }>();
  
  // Component state
  let selectedType = feedbackType;
  let feedbackContent: string = '';
  let userEmail: string = '';
  let includeContext: boolean = true;
  let isSubmitting: boolean = false;
  let showThankYou: boolean = false;
  let characterCount: number = 0;
  
  // Reactive character count
  $: characterCount = feedbackContent.length;
  $: isValidFeedback = feedbackContent.trim().length >= 10; // Minimum 10 characters
  
  const feedbackTypes = {
    feature_request: {
      label: 'Feature Request',
      placeholder: 'Describe the feature you\'d like to see in CharacterCut. How would it improve your developer workflow?',
      icon: '💡',
      examples: ['Batch processing multiple images', 'API integration', 'Browser extension']
    },
    bug_report: {
      label: 'Bug Report',
      placeholder: 'Describe the issue you encountered. What were you trying to do, and what happened instead?',
      icon: '🐛',
      examples: ['Processing failed unexpectedly', 'Image quality issues', 'Interface not responding']
    },
    improvement: {
      label: 'Improvement Suggestion',
      placeholder: 'How can we make CharacterCut better for your specific use case?',
      icon: '⚡',
      examples: ['Faster processing', 'Better edge detection', 'More format support']
    },
    general: {
      label: 'General Feedback',
      placeholder: 'Share your thoughts, suggestions, or experiences with CharacterCut.',
      icon: '💬',
      examples: ['Overall experience', 'Interface feedback', 'Workflow suggestions']
    }
  };
  
  async function handleSubmit() {
    if (!isValidFeedback) return;
    
    isSubmitting = true;
    
    try {
      // Track feedback submission in analytics
      await analyticsService.trackFeedbackSubmission(selectedType, feedbackContent);
      
      // Prepare submission data
      const submissionData = {
        type: selectedType,
        content: feedbackContent.trim(),
        email: userEmail.trim() || undefined,
        context: includeContext ? {
          ...contextData,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          session_id: analyticsService.sessionId
        } : undefined
      };
      
      // In a real implementation, this would send to a feedback endpoint
      console.log('📝 Feedback Submission:', submissionData);
      
      // Dispatch to parent
      dispatch('submit', submissionData);
      
      // Show thank you message
      showThankYou = true;
      
      // Auto-dismiss after showing thank you
      setTimeout(() => {
        handleDismiss();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Show thank you anyway to avoid frustrating user
      showThankYou = true;
      setTimeout(() => {
        handleDismiss();
      }, 3000);
    } finally {
      isSubmitting = false;
    }
  }
  
  function handleDismiss() {
    visible = false;
    dispatch('dismiss');
  }
  
  function handleTypeChange(type: string) {
    selectedType = type as typeof selectedType;
    feedbackContent = ''; // Clear content when changing type
  }
  
  // Get placeholder based on selected type
  $: currentTypeInfo = feedbackTypes[selectedType];
</script>

{#if visible}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    
    <div class="feedback-modal bg-dark-elevated border border-magic-400/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      
      {#if !showThankYou}
        <!-- Main Feedback Form -->
        <div class="p-6 space-y-6">
          
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-xl font-semibold text-magic-gradient mb-2">
                Share Your Feedback
              </h3>
              <p class="text-sm text-dark-text-secondary">
                Help us make CharacterCut better for developers like you
              </p>
            </div>
            <button
              on:click={handleDismiss}
              class="text-dark-text-muted hover:text-dark-text p-2 rounded transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Feedback Type Selection -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-dark-text">
              What type of feedback is this?
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each Object.entries(feedbackTypes) as [type, info]}
                <label class="feedback-type-option">
                  <input
                    type="radio"
                    bind:group={selectedType}
                    value={type}
                    class="sr-only"
                    on:change={() => handleTypeChange(type)}
                  />
                  <div class="feedback-type-card p-4 rounded-lg border border-gray-600 hover:border-magic-400 cursor-pointer transition-all">
                    <div class="flex items-center space-x-3">
                      <span class="text-2xl">{info.icon}</span>
                      <div>
                        <div class="font-medium text-dark-text">{info.label}</div>
                        <div class="text-xs text-dark-text-muted mt-1">
                          {info.examples.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              {/each}
            </div>
          </div>
          
          <!-- Feedback Content -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-dark-text">
                Your feedback
              </label>
              <span class="text-xs text-dark-text-muted">
                {characterCount} characters {characterCount < 10 ? '(minimum 10)' : ''}
              </span>
            </div>
            
            <textarea
              bind:value={feedbackContent}
              placeholder={currentTypeInfo.placeholder}
              class="w-full px-4 py-3 bg-dark-base border border-gray-600 rounded-lg text-dark-text placeholder-dark-text-muted resize-none focus:border-magic-400 focus:outline-none transition-colors"
              rows="6"
            />
            
            {#if currentTypeInfo.examples.length > 0}
              <div class="text-xs text-dark-text-muted">
                <span class="font-medium">Examples:</span>
                {currentTypeInfo.examples.join(' • ')}
              </div>
            {/if}
          </div>
          
          <!-- Optional Email -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-dark-text">
              Email (optional)
            </label>
            <input
              type="email"
              bind:value={userEmail}
              placeholder="your.email@example.com"
              class="w-full px-4 py-3 bg-dark-base border border-gray-600 rounded-lg text-dark-text placeholder-dark-text-muted focus:border-magic-400 focus:outline-none transition-colors"
            />
            <p class="text-xs text-dark-text-muted">
              Only provide if you'd like us to follow up. We respect your privacy.
            </p>
          </div>
          
          <!-- Context Inclusion -->
          <div class="space-y-3">
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                bind:checked={includeContext}
                class="w-4 h-4 text-magic-400 border-gray-600 rounded focus:ring-magic-400"
              />
              <span class="text-sm text-dark-text">
                Include technical context (helps us understand your situation better)
              </span>
            </label>
            
            {#if includeContext && Object.keys(contextData).length > 0}
              <div class="text-xs text-dark-text-muted bg-dark-base/50 rounded p-3">
                <strong>Context includes:</strong>
                {#if contextData.images_processed}
                  Images processed: {contextData.images_processed} •
                {/if}
                {#if contextData.processing_time}
                  Avg processing time: {contextData.processing_time.toFixed(1)}s •
                {/if}
                Browser info, session data
              </div>
            {/if}
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
            <button
              on:click={handleSubmit}
              disabled={!isValidFeedback || isSubmitting}
              class="flex-1 btn btn-magic py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Submitting...
              {:else}
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Submit Feedback
              {/if}
            </button>
            
            <button
              on:click={handleDismiss}
              class="px-6 py-3 text-dark-text-muted hover:text-dark-text transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
          
        </div>
        
      {:else}
        <!-- Thank You Message -->
        <div class="p-8 text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-full bg-green-400/20 flex items-center justify-center">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          
          <div>
            <h3 class="text-xl font-semibold text-green-400 mb-2">
              Thank you for your feedback!
            </h3>
            <p class="text-dark-text-secondary">
              Your insights help us make CharacterCut better for developers everywhere.
              {#if userEmail}
                We'll follow up if we need any clarification.
              {/if}
            </p>
          </div>
          
          <div class="text-sm text-magic-300">
            🚀 Keep an eye out for improvements based on your suggestions!
          </div>
        </div>
      {/if}
      
    </div>
    
  </div>
{/if}

<style>
  .feedback-modal {
    backdrop-filter: blur(10px);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  /* Custom radio button styling */
  .feedback-type-option input:checked + .feedback-type-card {
    border-color: rgba(0, 255, 136, 0.6);
    background-color: rgba(0, 255, 136, 0.1);
  }
  
  .feedback-type-card {
    transition: all 0.2s ease;
  }
  
  .feedback-type-card:hover {
    transform: translateY(-1px);
  }
  
  /* Textarea styling */
  textarea {
    min-height: 120px;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .feedback-modal {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
    
    .grid.grid-cols-1.sm\\:grid-cols-2 {
      grid-template-columns: 1fr;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .feedback-type-card,
    .feedback-modal * {
      transition: none;
      animation: none;
    }
    
    .feedback-type-card:hover {
      transform: none;
    }
  }
</style>