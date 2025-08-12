<!--
  Before/After Preview Component
  Shows side-by-side comparison with smooth transitions and micro-interactions
  Implements auto-proceeding preview workflow for Chloe's seamless experience
-->

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { quintOut, cubicOut } from 'svelte/easing';
  import { downloadService } from '../services/downloadService';
  import type { ImageData, ProcessingResponse } from '../types/app';
  import { toast } from '$lib/stores/toastStore.js';
  
  export let originalImage: ImageData;
  export let processedResult: ProcessingResponse;
  export let autoProceeds: boolean = true;
  export let autoProceedDelay: number = 2000; // 2 seconds by default
  
  const dispatch = createEventDispatcher<{
    proceed: { action: 'download' | 'continue' | 'refine' };
    stay: void;
  }>();
  
  // Animation state
  let showComparison = false;
  let revealProgress = tweened(0, { duration: 1500, easing: quintOut });
  let slideOffset = tweened(100, { duration: 800, easing: cubicOut });
  let fadeIn = tweened(0, { duration: 600, easing: cubicOut });
  
  // Component state
  let comparisonContainer: HTMLDivElement;
  let autoProceedTimer: ReturnType<typeof setTimeout>;
  let showAutoProceedControls = false;
  let countdownSeconds = Math.floor(autoProceedDelay / 1000);
  let countdownTimer: ReturnType<typeof setInterval>;
  let containerHeight = 400; // Default height
  
  // Reactive calculations
  $: processedImageUrl = processedResult.download_url;
  $: processingTime = processedResult.processing_time || 0;
  
  onMount(() => {
    calculateContainerHeight();
    startRevealAnimation();
  });
  
  function calculateContainerHeight() {
    // Create a temporary image to get natural dimensions
    const tempImage = new Image();
    tempImage.onload = () => {
      const imageAspectRatio = tempImage.naturalWidth / tempImage.naturalHeight;
      const containerWidth = 800; // Max width from CSS
      const calculatedHeight = containerWidth / imageAspectRatio;
      
      // Set reasonable bounds
      containerHeight = Math.max(300, Math.min(calculatedHeight, window.innerHeight * 0.7));
      
      console.log('📐 Container height calculated:', {
        imageSize: { width: tempImage.naturalWidth, height: tempImage.naturalHeight },
        aspectRatio: imageAspectRatio,
        containerHeight
      });
    };
    tempImage.src = originalImage.preview;
  }
  
  async function startRevealAnimation() {
    // Initial fade in
    fadeIn.set(1);
    
    // Start the side-by-side reveal after a brief delay
    setTimeout(() => {
      showComparison = true;
      slideOffset.set(0);
      revealProgress.set(1);
    }, 300);
    
    // Show auto-proceed controls after reveal completes
    setTimeout(() => {
      if (autoProceeds) {
        showAutoProceedControls = true;
        startAutoProceedCountdown();
      }
    }, 2000);
  }
  
  function startAutoProceedCountdown() {
    countdownTimer = setInterval(() => {
      countdownSeconds--;
      if (countdownSeconds <= 0) {
        clearInterval(countdownTimer);
        handleAutoProceed();
      }
    }, 1000);
    
    // Set the main auto-proceed timer
    autoProceedTimer = setTimeout(() => {
      handleAutoProceed();
    }, autoProceedDelay);
  }
  
  function handleAutoProceed() {
    clearTimers();
    dispatch('proceed', { action: 'continue' });
  }
  
  function handleStay() {
    clearTimers();
    showAutoProceedControls = false;
    dispatch('stay');
  }
  
  async function handleDownload() {
    clearTimers();
    
    // Show toast notification for download
    toast.info('Preparing download...');
    
    // Just dispatch the event - let the parent handle the actual download
    dispatch('proceed', { action: 'download' });
  }
  
  function clearTimers() {
    if (autoProceedTimer) clearTimeout(autoProceedTimer);
    if (countdownTimer) clearInterval(countdownTimer);
  }
  
  // Slider interaction for manual comparison
  let sliderPosition = 50;
  let isDragging = false;
  
  function handleSliderMove(event: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    
    const rect = comparisonContainer.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    sliderPosition = Math.max(0, Math.min(100, position));
  }
  
  function startDragging() {
    isDragging = true;
    clearTimers(); // Pause auto-proceed while user interacts
  }
  
  function stopDragging() {
    isDragging = false;
  }
</script>

<svelte:window 
  on:mousemove={handleSliderMove}
  on:mouseup={stopDragging}
  on:touchmove={handleSliderMove}
  on:touchend={stopDragging}
/>

<div class="before-after-preview" style="opacity: {$fadeIn}">
  
  <!-- Header -->
  <div class="mb-6 text-center">
    <h3 class="text-2xl font-semibold text-magic-gradient mb-2">
      Perfect Reveal Complete!
    </h3>
    <p class="text-dark-text-secondary">
      Background removed in {processingTime.toFixed(2)}s • Auto-copied to clipboard
    </p>
  </div>
  
  <!-- Comparison Container -->
  <div 
    bind:this={comparisonContainer}
    class="comparison-container relative overflow-hidden rounded-xl border border-magic-400/20"
    style="transform: translateY({$slideOffset}px); height: {containerHeight}px"
  >
    
    {#if showComparison}
      <!-- Before Image (Base layer) -->
      <div class="comparison-image absolute inset-0">
        <img 
          src={originalImage.preview} 
          alt="Original character with background"
          class="w-full h-full object-contain"
        />
        <div class="absolute bottom-2 left-2 px-2 py-1 bg-dark-elevated/90 rounded text-xs text-dark-text-secondary">
          Before
        </div>
      </div>
      
      <!-- After Image (Overlay with clip-path) -->
      <div 
        class="comparison-image absolute inset-0 transition-all duration-300 ease-out"
        style="clip-path: inset(0 {100 - sliderPosition}% 0 0)"
      >
        <img 
          src={processedImageUrl} 
          alt="Character with background removed"
          class="w-full h-full object-contain processed-image"
        />
        <div class="absolute bottom-2 right-2 px-2 py-1 bg-magic-400/20 backdrop-blur-sm rounded text-xs text-magic-400">
          After
        </div>
      </div>
      
      <!-- Interactive Slider -->
      <div 
        class="slider-container absolute inset-0 cursor-ew-resize" 
        on:mousedown={startDragging} 
        on:touchstart={startDragging}
        role="slider"
        tabindex="0"
        aria-label="Compare before and after images. Drag left and right to reveal the original or processed image."
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={sliderPosition}
        aria-valuetext="{Math.round(sliderPosition)}% comparison position"
        on:keydown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            sliderPosition = Math.max(0, sliderPosition - 5);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            sliderPosition = Math.min(100, sliderPosition + 5);
          }
        }}
      >
        <div 
          class="slider-line absolute top-0 bottom-0 w-0.5 bg-magic-400 shadow-lg"
          style="left: {sliderPosition}%"
        >
          <!-- Slider Handle -->
          <div class="slider-handle absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="w-8 h-8 bg-magic-400 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reveal Progress Indicator -->
      <div class="absolute top-2 left-2 right-2">
        <div class="h-1 bg-dark-elevated rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-magic-400 to-magic-300 transition-all duration-1000 ease-out"
            style="width: {$revealProgress * 100}%"
          />
        </div>
      </div>
    {/if}
    
  </div>
  
  <!-- Auto-Proceed Controls -->
  {#if showAutoProceedControls && autoProceeds}
    <div class="mt-6 p-4 bg-dark-elevated/50 backdrop-blur-sm rounded-lg border border-magic-400/20">
      <div class="flex items-center justify-between">
        
        <!-- Countdown Display -->
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-magic-400/20 flex items-center justify-center">
            <span class="text-sm font-mono text-magic-400">{countdownSeconds}</span>
          </div>
          <div>
            <p class="text-sm text-dark-text">
              Continuing to process another image in {countdownSeconds}s
            </p>
            <p class="text-xs text-dark-text-muted">
              Perfect for batch processing workflow
            </p>
          </div>
        </div>
        
        <!-- Control Buttons -->
        <div class="flex space-x-2">
          <button
            on:click={handleDownload}
            class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white px-4 py-2 rounded text-sm"
            aria-label="Download the processed image without background"
          >
            Download
          </button>
          <button
            on:click={handleStay}
            class="btn btn-outline border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white px-4 py-2 rounded text-sm"
            aria-label="Cancel auto-download and stay on this page"
          >
            Stay Here
          </button>
        </div>
        
      </div>
      
      <!-- Progress Bar -->
      <div class="mt-3 h-1 bg-dark-base rounded-full overflow-hidden">
        <div 
          class="h-full bg-magic-400 transition-all duration-1000 ease-linear"
          style="width: {((Math.floor(autoProceedDelay / 1000) - countdownSeconds) / Math.floor(autoProceedDelay / 1000)) * 100}%"
        />
      </div>
    </div>
  {/if}
  
  <!-- Manual Controls -->
  {#if !autoProceeds || !showAutoProceedControls}
    <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
      
      <button
        on:click={handleDownload}
        class="btn btn-magic py-3 px-6 rounded-lg font-medium"
        aria-label="Download the processed image as PNG file"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3"/>
        </svg>
        Download PNG
      </button>
      
      <button
        on:click={() => dispatch('proceed', { action: 'refine' })}
        class="btn btn-outline border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white py-3 px-6 rounded-lg font-medium"
        aria-label="Open refinement editor to fix any background removal errors with brush tools"
        title="Fix any background removal errors with brush tools"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
        Refine
      </button>
      
      <button
        on:click={() => dispatch('proceed', { action: 'continue' })}
        class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white py-3 px-6 rounded-lg font-medium"
        aria-label="Process another image - return to upload interface"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Process Another
      </button>
      
    </div>
  {/if}
  
</div>

<style>
  .before-after-preview {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .comparison-container {
    /* Dynamic aspect ratio based on image content - no fixed ratio */
    min-height: 400px;
    max-height: 80vh;
    width: 100%;
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(38, 38, 38, 0.8) 100%);
    /* Maintain image proportions */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .comparison-image {
    background-color: rgba(0, 0, 0, 0.1);
    /* Ensure images maintain aspect ratio */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .comparison-image img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    /* Preserve aspect ratio */
    object-fit: contain;
  }

  /* Transparency checkerboard - only behind the image itself */
  .processed-image {
    background-image: 
      linear-gradient(45deg, rgba(170, 170, 170, 0.3) 25%, transparent 25%), 
      linear-gradient(-45deg, rgba(170, 170, 170, 0.3) 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, rgba(170, 170, 170, 0.3) 75%), 
      linear-gradient(-45deg, transparent 75%, rgba(170, 170, 170, 0.3) 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  }
  
  .slider-container {
    z-index: 10;
  }
  
  .slider-line {
    z-index: 20;
    filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.4));
  }
  
  .slider-handle {
    z-index: 30;
    transition: transform 0.2s ease;
  }
  
  .slider-handle:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  .slider-handle:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
  
  /* Smooth transitions for all interactive elements */
  .comparison-image img {
    transition: opacity 0.3s ease;
  }
  
  .comparison-container:hover .comparison-image img {
    opacity: 0.95;
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .comparison-container,
    .slider-handle,
    .comparison-image {
      transition: none;
    }
    
    .before-after-preview * {
      animation: none;
    }
  }
</style>