<!--
  CharacterCut Main Page
  Implements Chloe's seamless workflow with Place Character Here interface
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import UnifiedInput from '$lib/components/UnifiedInput.svelte';
  import ScanlineProcessor from '$lib/components/ScanlineProcessor.svelte';
  import BeforeAfterPreview from '$lib/components/BeforeAfterPreview.svelte';
  import ProcessingFeedback from '$lib/components/ProcessingFeedback.svelte';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import NPSSurvey from '$lib/components/NPSSurvey.svelte';
  import FeedbackCollection from '$lib/components/FeedbackCollection.svelte';
  import AnalyticsDashboard from '$lib/components/AnalyticsDashboard.svelte';
  import ModelSelector from '$lib/components/ModelSelector.svelte';
  import ImageRefinementEditor from '$lib/components/ImageRefinementEditor.svelte';
  import BatchProcessor from '$lib/components/BatchProcessor.svelte';
  import { appState, appActions } from '$lib/stores/appState.js';
  import { realTimeStatusService } from '$lib/services/realTimeStatus';
  import { inputActions } from '$lib/stores/inputState.js';
  import { continuityActions, continuityStatus } from '$lib/stores/sessionContinuity.js';
  import { apiService } from '$lib/services/api';
  import { progressiveErrorRecovery } from '$lib/services/errorRecovery';
  import { clipboardService } from '$lib/services/clipboard';
  import { downloadService } from '$lib/services/downloadService';
  import { analyticsService } from '$lib/services/analytics';
  import type { ProcessingResponse, ImageData } from '$lib/types/app';
  
  // Component state
  let processing = false;
  let result: ProcessingResponse | null = null;
  let error: string | null = null;
  let showSuccess = false;
  let showPreview = false;
  let processingMessage = '';
  let processingProgress = 0;
  let attemptNumber = 1;
  let currentImageData: ImageData | null = null;
  let processedImageUrl: string | null = null;
  let errorContext: any = {};
  let selectedModel: string = 'isnet-general-use';
  
  // Analytics component state
  let showNPSSurvey = false;
  let showFeedbackCollection = false;
  let showAnalyticsDashboard = false;
  let npsShownForSession = false;
  
  // Refinement state
  let showRefinementEditor = false;
  let isRefining = false;
  let refinementMessage = '';
  let refinementProgress = 0;
  
  // Batch processing state
  let showBatchProcessor = false;
  
  // Reactive state
  $: currentImage = $appState.currentImage;
  $: processingStatus = $appState.processingState.status;
  $: sessionStatus = $continuityStatus;
  
  onMount(() => {
    // Reset state on mount
    appActions.reset();
    
    // Track unique user session
    analyticsService.trackUniqueUser();
    
    // Show analytics dashboard in dev mode (triggered by keyboard shortcut)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        showAnalyticsDashboard = true;
      }
    });
  });
  
  /**
   * Handle image selection with progressive error recovery
   */
  async function handleImageSelected(event: CustomEvent) {
    console.log('🔍 FRONTEND DEBUG: handleImageSelected called');
    const { image } = event.detail;
    console.log('🔍 File details:', image.file.name, image.file.size, image.file.type);
    
    // Store current image for scanline processor
    currentImageData = image;
    
    // Clear previous results
    error = null;
    result = null;
    showSuccess = false;
    showPreview = false;
    processingMessage = '';
    processingProgress = 0;
    attemptNumber = 1;
    processedImageUrl = null;
    
    try {
      processing = true;
      appActions.setProcessingStatus('processing');
      inputActions.startProcessing();
      
      // Track processing start
      await analyticsService.trackProcessingStart(image, getCurrentInputMethod());
      
      // Generate session ID for tracking
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Process image with progressive error recovery
      console.log('🔍 FRONTEND DEBUG: About to call processWithRecovery');
      console.log('🔍 Session ID:', sessionId);
      
      const recoveryResult = await progressiveErrorRecovery.processWithRecovery(
        image.file,
        sessionId,
        (progress, message, attempt) => {
          console.log('🔍 Progress update:', progress, message, attempt);
          processingProgress = progress;
          processingMessage = message;
          attemptNumber = attempt || 1;
          
          // Update app state progress
          appActions.updateProgress(progress, message);
        }
      );
      
      console.log('🔍 FRONTEND DEBUG: processWithRecovery completed');
      console.log('🔍 Recovery result:', recoveryResult);
      
      if (recoveryResult.success && recoveryResult.result) {
        // Success!
        result = recoveryResult.result;
        processedImageUrl = recoveryResult.result.download_url;
        
        appActions.completeProcessing(
          recoveryResult.result.download_url, 
          recoveryResult.totalTime
        );
        inputActions.completeProcessing('Background removed successfully!');
        
        // Record successful processing for session continuity
        continuityActions.recordProcessing(
          image.file.name,
          recoveryResult.totalTime,
          getCurrentInputMethod(),
          recoveryResult.attempts?.length || 0
        );
        
        showPreview = true;
        
        // Track successful task completion
        await analyticsService.trackTaskCompletion(true, recoveryResult.totalTime);
        
        // Track session continuity
        await analyticsService.trackSessionContinuity();
        
        // Auto-copy to clipboard for seamless workflow
        await copyResultToClipboard(recoveryResult.result.download_url);
        
        // Show NPS survey after successful processing (but only once per session)
        // Disabled for now to reduce annoyance during development
        if (false && !npsShownForSession && analyticsService.metrics.successful_completions >= 3) {
          setTimeout(() => {
            showNPSSurvey = true;
            npsShownForSession = true;
          }, 10000); // Show after 10 seconds of success, and only after 3 completions
        }
        
      } else {
        // All recovery attempts failed
        throw new Error(recoveryResult.error || 'Processing failed after all recovery attempts');
      }
      
    } catch (err) {
      console.log('🔍 FRONTEND DEBUG: Caught error in handleImageSelected');
      console.log('🔍 Error object:', err);
      console.log('🔍 Error type:', typeof err);
      console.log('🔍 Error instanceof Error:', err instanceof Error);
      if (err instanceof Error) {
        console.log('🔍 Error message:', err.message);
        console.log('🔍 Error stack:', err.stack);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      console.log('🔍 Final error message set to:', errorMessage);
      error = errorMessage;
      
      // Set error context for better classification
      errorContext = {
        fileSize: image.file.size,
        fileName: image.file.name,
        attempt: attemptNumber,
        userAgent: navigator.userAgent
      };
      
      appActions.setError(errorMessage);
      inputActions.errorProcessing(errorMessage);
      
      // Track failed task completion
      await analyticsService.trackTaskCompletion(false, 0, errorMessage);
      
      // Record failed processing for session continuity
      continuityActions.recordFailure(
        image.file.name,
        getCurrentInputMethod(),
        attemptNumber
      );
    } finally {
      processing = false;
    }
  }
  
  /**
   * Get current input method for session tracking
   */
  function getCurrentInputMethod(): 'drag' | 'paste' | 'upload' {
    // This would ideally come from the input state machine
    // For now, return a default
    return 'upload';
  }
  
  /**
   * Handle input errors
   */
  function handleInputError(event: CustomEvent) {
    error = event.detail.message;
    
    // Set basic error context for input errors
    errorContext = {
      userAgent: navigator.userAgent,
      attempt: 1
    };
    
    appActions.setProcessingStatus('error');
  }
  
  /**
   * Copy result to clipboard for Chloe's seamless workflow
   */
  async function copyResultToClipboard(downloadUrl: string) {
    try {
      // Fetch the processed image
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch processed image');
      }
      
      const blob = await response.blob();
      
      // Use enhanced clipboard service
      const copySuccess = await clipboardService.copyImage(blob);
      
      if (copySuccess) {
        showCopyFeedback();
        console.log('Image automatically copied to clipboard for immediate use');
      } else {
        console.warn('Clipboard copy failed, download option available');
      }
      
    } catch (clipboardError) {
      console.warn('Failed to copy to clipboard:', clipboardError);
      // Silently fail - user can still download manually
    }
  }
  
  /**
   * Show copy feedback animation
   */
  function showCopyFeedback() {
    // This would trigger a subtle animation
    console.log('Image copied to clipboard for immediate use');
  }
  
  /**
   * Process another image (session continuity)
   */
  async function processAnother() {
    // Track process another action
    await analyticsService.trackProcessAnother();
    
    // Reset all states for session continuity
    appActions.resetProcessing();
    inputActions.processAnother();
    continuityActions.processAnother();
    
    // Clear component state
    error = null;
    result = null;
    showSuccess = false;
    showPreview = false;
    processing = false;
    processingMessage = '';
    processingProgress = 0;
    attemptNumber = 1;
    currentImageData = null;
    processedImageUrl = null;
    errorContext = {};
  }
  
  /**
   * Handle preview actions (download, continue, or refine)
   */
  function handlePreviewAction(event: CustomEvent) {
    const { action } = event.detail;
    
    if (action === 'download') {
      downloadResult();
    } else if (action === 'continue') {
      processAnother();
    } else if (action === 'refine') {
      showRefinementEditor = true;
    }
  }
  
  /**
   * Handle refinement editor events
   */
  async function handleRefinementRefined(event: CustomEvent) {
    const { refinedImage } = event.detail;
    
    console.log('=== REFINEMENT HANDLER ===');
    console.log('Received refined image:', refinedImage ? 'YES' : 'NO');
    console.log('Current result:', result);
    
    if (!result?.processing_id) {
      console.error('No processing ID available for refinement');
      return;
    }
    
    try {
      isRefining = true;
      showRefinementEditor = false;
      refinementProgress = 0;
      refinementMessage = 'Processing refined image...';
      
      console.log('Starting API refinement with processing ID:', result.processing_id);
      
      // Use API service to upload refined image
      const refinedResult = await apiService.refineImage(
        result.processing_id,
        refinedImage,
        (progress, message) => {
          console.log('Refinement progress:', progress, message);
          refinementProgress = progress;
          refinementMessage = message;
          appActions.updateProgress(progress, message);
        }
      );
      
      console.log('API refinement successful:', refinedResult);
      
      // Update result with refined version
      result = refinedResult;
      processedImageUrl = refinedResult.download_url;
      
      // Update app state
      appActions.completeProcessing(
        refinedResult.download_url,
        refinedResult.processing_time
      );
      
      // Auto-copy refined result to clipboard
      await copyResultToClipboard(refinedResult.download_url);
      
      // Track successful refinement
      await analyticsService.trackTaskCompletion(true, refinedResult.processing_time);
      
      console.log('Refinement completed successfully');
      
    } catch (err) {
      console.error('=== REFINEMENT HANDLER ERROR ===');
      console.error('Error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error instanceof Error:', err instanceof Error);
      
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Refinement failed';
      error = errorMessage;
      appActions.setError(errorMessage);
      
      // Track failed refinement
      await analyticsService.trackTaskCompletion(false, 0, errorMessage);
      
    } finally {
      isRefining = false;
      refinementProgress = 0;
      refinementMessage = '';
    }
  }
  
  function handleRefinementCancel() {
    showRefinementEditor = false;
  }
  
  function handleRefinementError(event: CustomEvent) {
    const { message } = event.detail;
    error = message;
    showRefinementEditor = false;
    appActions.setError(message);
  }
  
  /**
   * Handle error retry with intelligent recovery
   */
  async function handleErrorRetry() {
    if (currentImageData) {
      // Clear error and retry with intelligent recovery
      error = null;
      const previousError = error;
      errorContext = {};
      
      try {
        processing = true;
        appActions.setProcessingStatus('processing');
        inputActions.startProcessing();
        
        // Generate session ID for tracking
        const sessionId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Use error-specific recovery if we have a previous error
        let recoveryResult;
        if (previousError) {
          recoveryResult = await progressiveErrorRecovery.retryWithErrorClassification(
            currentImageData.file,
            sessionId,
            previousError,
            (progress, message) => {
              processingProgress = progress;
              processingMessage = message;
              appActions.updateProgress(progress, message);
            }
          );
        } else {
          // Fall back to standard recovery
          recoveryResult = await progressiveErrorRecovery.processWithRecovery(
            currentImageData.file,
            sessionId,
            (progress, message, attempt) => {
              processingProgress = progress;
              processingMessage = message;
              attemptNumber = attempt || 1;
              appActions.updateProgress(progress, message);
            }
          );
        }
        
        if (recoveryResult.success && recoveryResult.result) {
          // Success!
          result = recoveryResult.result;
          processedImageUrl = recoveryResult.result.download_url;
          
          appActions.completeProcessing(
            recoveryResult.result.download_url, 
            recoveryResult.totalTime
          );
          inputActions.completeProcessing('Background removed successfully!');
          
          // Record successful processing for session continuity
          continuityActions.recordProcessing(
            currentImageData.file.name,
            recoveryResult.totalTime,
            getCurrentInputMethod(),
            recoveryResult.attempts?.length || 0
          );
          
          showPreview = true;
          
          // Auto-copy to clipboard for seamless workflow
          await copyResultToClipboard(recoveryResult.result.download_url);
          
        } else {
          throw new Error(recoveryResult.error || 'Retry failed after all recovery attempts');
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Retry failed';
        error = errorMessage;
        
        // Update error context for retry attempt
        errorContext = {
          fileSize: currentImageData.file.size,
          fileName: currentImageData.file.name,
          attempt: attemptNumber + 1,
          userAgent: navigator.userAgent,
          isRetry: true
        };
        
        appActions.setError(errorMessage);
        inputActions.errorProcessing(errorMessage);
      } finally {
        processing = false;
      }
    } else {
      // Just clear error and let user select new image
      error = null;
      errorContext = {};
    }
  }
  
  /**
   * Handle error dismissal
   */
  function handleErrorDismiss() {
    error = null;
    errorContext = {};
  }
  
  /**
   * Handle user choosing to stay on preview
   */
  function handlePreviewStay() {
    showSuccess = true;
    showPreview = false;
  }
  
  /**
   * Download result with enhanced options
   */
  async function downloadResult() {
    if (!result?.download_url) return;
    
    try {
      const success = await downloadService.downloadImage(
        result.download_url,
        { format: 'png' }, // Default PNG for immediate download
        {
          processingId: result.processing_id,
          processingTime: result.processing_time,
          timestamp: new Date().toISOString(),
          format: 'png'
        }
      );
      
      if (!success) {
        throw new Error('Download service failed');
      }
      
      // Track download event
      await analyticsService.trackDownload('png');
      
    } catch (downloadError) {
      error = 'Download failed. Please try again.';
      console.error('Download error:', downloadError);
    }
  }
  
  // Analytics component handlers
  
  function handleNPSSubmit(event: CustomEvent) {
    const { score, feedback } = event.detail;
    console.log('NPS submitted:', { score, feedback });
    showNPSSurvey = false;
  }
  
  function handleNPSDismiss() {
    showNPSSurvey = false;
  }
  
  function handleFeedbackSubmit(event: CustomEvent) {
    const { type, content, email } = event.detail;
    console.log('Feedback submitted:', { type, content, email });
    showFeedbackCollection = false;
  }
  
  function handleFeedbackDismiss() {
    showFeedbackCollection = false;
  }
  
  function showFeedbackModal() {
    showFeedbackCollection = true;
  }
  
  function handleAnalyticsDashboardClose() {
    showAnalyticsDashboard = false;
  }
  
  // Batch processing handlers
  function handleBatchCompleted(event: CustomEvent) {
    const { batchResults } = event.detail;
    console.log('Batch processing completed:', batchResults);
    // Track batch completion
    analyticsService.trackBatchCompletion(batchResults.successful_count, batchResults.total_images);
  }
  
  function handleBatchError(event: CustomEvent) {
    const { message } = event.detail;
    console.error('Batch processing error:', message);
    error = message;
  }
  
  function handleBatchClose() {
    showBatchProcessor = false;
  }
</script>

<svelte:head>
  <title>CharacterCut - Transform Your Characters with Magic</title>
  <meta name="description" content="Remove backgrounds from AI-generated characters instantly. Drag, drop, or paste - watch backgrounds disappear like magic." />
</svelte:head>

<div class="page-container">
  
  <!-- Hero Section -->
  <section class="hero py-12 sm:py-20">
    <div class="container text-center">
      
      <!-- Main heading -->
      <div class="mb-8">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          <span class="text-magic-gradient">Transform Characters</span>
          <br />
          <span class="text-dark-text">with Magic</span>
        </h1>
        <p class="text-xl sm:text-2xl text-dark-text-secondary max-w-2xl mx-auto leading-relaxed">
          Watch backgrounds disappear effortlessly. Perfect for 
          <span class="text-magic-400 font-medium">AI-generated character assets</span>.
        </p>
      </div>
      
      <!-- Processing time promise -->
      <div class="flex items-center justify-center space-x-2 mb-12 text-dark-text-muted">
        <svg class="w-5 h-5 text-magic-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm">Average processing time: &lt;5 seconds</span>
      </div>
      
    </div>
  </section>
  
  <!-- Main Interface -->
  <section class="interface py-8">
    <div class="container">
      
      {#if !processing && !result}
        <!-- Input Interface -->
        <div class="max-w-2xl mx-auto">
          <UnifiedInput
            on:imageSelected={handleImageSelected}
            on:error={handleInputError}
            disabled={processing}
          />
          
          <!-- Batch Processing Button -->
          <div class="text-center batch-button-container mt-6">
            <button
              on:click={() => showBatchProcessor = true}
              class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white py-2 px-4 rounded-lg font-medium text-sm"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Process Multiple Images
            </button>
          </div>
        </div>
      {/if}
      
      {#if (processing || isRefining) && currentImageData}
        <!-- Processing State with Magic Scanline -->
        <div class="processing-section">
          <div class="processing-container">
            
            <!-- Enhanced Scanline Processor Component -->
            <ScanlineProcessor
              image={currentImageData}
              isProcessing={processing || isRefining}
              processingProgress={isRefining ? refinementProgress : processingProgress}
              processingMessage={isRefining ? refinementMessage : (processingMessage || 'Processing your character...')}
              processedResult={processedImageUrl}
              on:animationComplete={() => {
                console.log('Scanline animation completed');
              }}
              on:scanlineComplete={() => {
                console.log('Scanline processing phase completed');
              }}
            />
            
            <!-- Enhanced Processing Feedback -->
            <div class="absolute bottom-4 left-4 right-4 z-50">
              <ProcessingFeedback
                status="processing"
                progress={isRefining ? refinementProgress : processingProgress}
                message={isRefining ? refinementMessage : (processingMessage || 'Processing your character...')}
                attemptNumber={attemptNumber}
                showDetails={attemptNumber > 1}
              />
            </div>
            
          </div>
        </div>
      {/if}
      
      {#if result && showSuccess}
        <!-- Success State -->
        <div class="max-w-2xl mx-auto">
          <div class="success-card glass-card rounded-xl p-8 text-center magic-reveal">
            
            <div class="space-y-6">
              
              <!-- Success icon -->
              <div class="w-16 h-16 mx-auto rounded-full bg-green-400/20 flex items-center justify-center">
                <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              
              <!-- Success message -->
              <div>
                <h3 class="text-2xl font-semibold text-magic-gradient mb-2">Magic Complete!</h3>
                <p class="text-dark-text-secondary mb-1">
                  Background removed in {result.processing_time?.toFixed(2)}s
                </p>
                <p class="text-sm text-dark-text-muted mb-2">
                  Image automatically copied to clipboard
                </p>
                
                <!-- Session continuity info -->
                {#if sessionStatus.hasProcessedImages}
                  <div class="text-xs text-magic-300">
                    {#if sessionStatus.meetsTarget}
                      🎯 Session target achieved! ({sessionStatus.hasProcessedImages ? sessionStatus.hasProcessedImages : 0} images processed)
                    {:else}
                      📈 Session progress: {sessionStatus.hasProcessedImages ? sessionStatus.hasProcessedImages : 0}/2 images
                    {/if}
                  </div>
                {/if}
              </div>
              
              <!-- Action buttons -->
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                
                <button
                  on:click={downloadResult}
                  class="btn btn-magic py-3 px-6 rounded-lg font-medium"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3"/>
                  </svg>
                  Download PNG
                </button>
                
                <button
                  on:click={processAnother}
                  class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white py-3 px-6 rounded-lg font-medium"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Process Another
                </button>
                
              </div>
              
            </div>
            
          </div>
        </div>
      {/if}
      
      {#if error}
        <!-- Enhanced Error State -->
        <div class="max-w-4xl mx-auto">
          <ErrorDisplay
            {error}
            context={errorContext}
            showTechnicalDetails={true}
            allowRetry={true}
            autoHide={errorContext.attempt === 1}
            on:retry={handleErrorRetry}
            on:dismiss={handleErrorDismiss}
          />
        </div>
      {/if}
      
    </div>
  </section>
  
  <!-- Full Width Preview - Outside Container -->
  {#if result && showPreview && currentImageData}
    <section class="preview-section py-8">
      <BeforeAfterPreview
        originalImage={currentImageData}
        processedResult={result}
        autoProceeds={false}
        autoProceedDelay={3000}
        on:proceed={handlePreviewAction}
        on:stay={handlePreviewStay}
      />
    </section>
  {/if}
  
  <!-- Features Section -->
  {#if !processing && !result && !showPreview}
    <section class="features py-16 sm:py-24">
      <div class="container">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-dark-text mb-4">Built for Developer Workflow</h2>
          <p class="text-lg text-dark-text-secondary max-w-2xl mx-auto">
            Designed for speed and efficiency. Get back to building faster.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          
          <!-- Feature 1 -->
          <div class="feature-card glass-card rounded-xl p-6 text-center">
            <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-magic-400/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-dark-text mb-2">Lightning Fast</h3>
            <p class="text-sm text-dark-text-secondary">Average processing under 5 seconds. Keep your momentum going.</p>
          </div>
          
          <!-- Feature 2 -->
          <div class="feature-card glass-card rounded-xl p-6 text-center">
            <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-magic-400/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-dark-text mb-2">Seamless Paste</h3>
            <p class="text-sm text-dark-text-secondary">Cmd+V from any AI generator. Results auto-copy to clipboard.</p>
          </div>
          
          <!-- Feature 3 -->
          <div class="feature-card glass-card rounded-xl p-6 text-center">
            <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-magic-400/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-dark-text mb-2">Privacy First</h3>
            <p class="text-sm text-dark-text-secondary">Images auto-delete after 1 hour. No tracking, no accounts needed.</p>
          </div>
          
        </div>
        
      </div>
    </section>
  {/if}
  
</div>

<!-- Analytics Components -->

<!-- NPS Survey (shows after successful processing) -->
<NPSSurvey
  visible={showNPSSurvey}
  imagesProcessed={analyticsService.metrics.images_processed}
  on:submit={handleNPSSubmit}
  on:dismiss={handleNPSDismiss}
/>

<!-- Feedback Collection Modal -->
<FeedbackCollection
  visible={showFeedbackCollection}
  contextData={{
    images_processed: analyticsService.metrics.images_processed,
    successful_completions: analyticsService.metrics.successful_completions,
    failed_attempts: analyticsService.metrics.failed_attempts,
    processing_time: analyticsService.metrics.total_processing_time / Math.max(1, analyticsService.metrics.successful_completions),
    session_duration: analyticsService.metrics.session_duration
  }}
  on:submit={handleFeedbackSubmit}
  on:dismiss={handleFeedbackDismiss}
/>

<!-- Analytics Dashboard (dev mode only - Ctrl+Shift+A) -->
<AnalyticsDashboard
  visible={showAnalyticsDashboard}
  isDevMode={true}
  on:close={handleAnalyticsDashboardClose}
/>

<!-- Feedback Button (fixed position) -->
{#if !processing && !showFeedbackCollection}
  <button
    on:click={showFeedbackModal}
    class="fixed bottom-6 left-6 bg-magic-400/20 hover:bg-magic-400/30 border border-magic-400/40 rounded-full p-3 transition-all duration-200 z-40"
    title="Send Feedback"
  >
    <svg class="w-5 h-5 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h8a2 2 0 002-2V8M9 12h6"/>
    </svg>
  </button>
{/if}

<!-- Image Refinement Editor -->
{#if showRefinementEditor && currentImageData && result}
  <ImageRefinementEditor
    originalImage={currentImageData.preview}
    processedImage={processedImageUrl || ''}
    isVisible={showRefinementEditor}
    on:refined={handleRefinementRefined}
    on:cancel={handleRefinementCancel}
    on:error={handleRefinementError}
  />
{/if}

<!-- Batch Processor -->
<BatchProcessor
  isVisible={showBatchProcessor}
  on:completed={handleBatchCompleted}
  on:error={handleBatchError}
  on:close={handleBatchClose}
/>

<style>
  .page-container {
    min-height: calc(100vh - 140px); /* Account for header/footer */
  }
  
  .hero {
    background: 
      radial-gradient(ellipse at top, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at bottom, rgba(0, 136, 255, 0.05) 0%, transparent 50%);
  }
  
  .processing-container {
    /* Absolute positioning for perfect centering */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    /* Size constraints */
    width: min(900px, 90vw);
    min-height: min(400px, 60vh);
    
    /* Styling */
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    
    /* Flexbox for internal content alignment */
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* Ensure proper box-sizing */
    box-sizing: border-box;
  }
  
  .success-card,
  .feature-card {
    border: 1px solid rgba(56, 189, 248, 0.2);
    transition: all 0.3s ease;
  }
  
  .success-card:hover,
  .feature-card:hover {
    border-color: rgba(56, 189, 248, 0.4);
    transform: translateY(-2px);
  }
  
  /* Enhanced animations */
  .success-card {
    animation: slideUp 0.5s ease-out;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Shimmer animation for progress bar */
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(200%);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
  
  /* Processing section with absolute positioning for foolproof centering */
  .processing-section {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    z-index: 1000;
    /* Remove flexbox - we'll use absolute positioning instead */
  }
  
  @media (max-width: 768px) {
    .processing-container {
      width: min(95vw, 600px);
      min-height: min(350px, 50vh);
      /* Absolute positioning maintains perfect centering */
    }
  }
  
  @media (max-width: 480px) {
    .processing-container {
      width: min(calc(100vw - 24px), 400px);
      min-height: min(300px, 45vh);
      /* Absolute positioning maintains perfect centering */
    }
  }
  
  /* Processing container enhancements */
  .processing-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(circle at 30% 40%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 70% 60%, rgba(0, 136, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
  }
</style>