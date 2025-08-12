<!--
  Processing Feedback System
  Provides real-time visual feedback for all processing states
  Implements microinteractions and status updates for Chloe's workflow
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { quintOut, elasticOut } from 'svelte/easing';
  
  export let status: 'idle' | 'uploading' | 'processing' | 'success' | 'error' = 'idle';
  export let progress: number = 0; // 0-100
  export let message: string = '';
  export let attemptNumber: number = 1;
  export let processingTime: number = 0;
  export let showDetails: boolean = false;
  
  // Animation state
  let progressTween = tweened(0, { duration: 300, easing: quintOut });
  let pulseScale = tweened(1, { duration: 800, easing: elasticOut });
  let glowIntensity = tweened(0, { duration: 500, easing: quintOut });
  
  // Component state
  let animationFrame: number;
  let startTime: number = 0;
  let currentTime: number = 0;
  
  // Reactive updates
  $: progressTween.set(progress);
  $: {
    if (status === 'processing') {
      startPulsing();
      glowIntensity.set(0.8);
    } else {
      stopPulsing();
      glowIntensity.set(0);
    }
  }
  
  onMount(() => {
    if (status === 'processing') {
      startTime = Date.now();
      updateTimer();
    }
  });
  
  onDestroy(() => {
    stopPulsing();
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
  
  function startPulsing() {
    let start: number;
    
    function pulse(timestamp: number) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      
      // Create pulsing scale effect
      const pulseValue = 1 + 0.1 * Math.sin(elapsed * 0.003);
      pulseScale.set(pulseValue);
      
      if (status === 'processing') {
        animationFrame = requestAnimationFrame(pulse);
      }
    }
    
    animationFrame = requestAnimationFrame(pulse);
  }
  
  function stopPulsing() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    pulseScale.set(1);
  }
  
  function updateTimer() {
    function update() {
      if (status === 'processing') {
        currentTime = Date.now() - startTime;
        animationFrame = requestAnimationFrame(update);
      }
    }
    
    if (status === 'processing') {
      animationFrame = requestAnimationFrame(update);
    }
  }
  
  // Status configurations
  const statusConfig = {
    idle: {
      icon: 'upload',
      color: 'text-dark-text-muted',
      bgColor: 'bg-dark-elevated',
      borderColor: 'border-gray-600'
    },
    uploading: {
      icon: 'upload-cloud',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30'
    },
    processing: {
      icon: 'cog',
      color: 'text-magic-400',
      bgColor: 'bg-magic-400/10',
      borderColor: 'border-magic-400/30'
    },
    success: {
      icon: 'check-circle',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30'
    },
    error: {
      icon: 'exclamation-circle',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30'
    }
  };
  
  $: config = statusConfig[status];
  
  // Format time display
  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }
  
  // Get icon SVG path
  function getIconPath(iconName: string): string {
    const icons = {
      upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      'upload-cloud': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10',
      cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'exclamation-circle': 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[iconName as keyof typeof icons] || icons.upload;
  }
</script>

<div 
  class="processing-feedback transition-all duration-300 {config.bgColor} {config.borderColor} border rounded-lg p-4"
  style="transform: scale({$pulseScale})"
  role="status"
  aria-live="polite"
  aria-label="Background removal processing status"
>
  
  <!-- Main Status Display -->
  <div class="flex items-center space-x-4">
    
    <!-- Status Icon -->
    <div 
      class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {config.bgColor}"
      style="box-shadow: 0 0 {$glowIntensity * 20}px rgba(0, 255, 136, {$glowIntensity * 0.4})"
    >
      <svg 
        class="w-5 h-5 {config.color}" 
        class:animate-spin={status === 'processing' && config.icon === 'cog'}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d={getIconPath(config.icon)}
        />
      </svg>
    </div>
    
    <!-- Status Text -->
    <div class="flex-grow">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium {config.color}">
          {message || 'Ready'}
        </span>
        <!-- Screen reader status text -->
        <span class="sr-only">
          {#if status === 'processing'}
            Processing image, attempt {attemptNumber}, {formatTime(currentTime)} elapsed
          {:else if status === 'success'}
            Background removal completed successfully
          {:else if status === 'error'}
            Background removal failed
          {:else if status === 'uploading'}
            Uploading image
          {:else}
            Ready to process image
          {/if}
        </span>
        
        {#if status === 'processing'}
          <div class="flex items-center space-x-2 text-xs text-dark-text-muted">
            {#if attemptNumber > 1}
              <span class="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded">
                Attempt {attemptNumber}
              </span>
            {/if}
            <span>{formatTime(currentTime)}</span>
          </div>
        {/if}
        
        {#if status === 'success' && processingTime > 0}
          <span class="text-xs text-green-400">
            Completed in {formatTime(processingTime * 1000)}
          </span>
        {/if}
      </div>
      
      <!-- Progress Bar -->
      {#if status === 'uploading' || status === 'processing'}
        <div class="mt-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-dark-text-muted">Progress</span>
            <span class="text-xs {config.color}">{Math.round($progressTween)}%</span>
          </div>
          
          <div class="h-2 bg-dark-base rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-300 ease-out relative"
              class:bg-blue-400={status === 'uploading'}
              class:bg-magic-400={status === 'processing'}
              style="width: {$progressTween}%"
            >
              <!-- Animated shimmer effect -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Details Toggle -->
    {#if showDetails && (status === 'processing' || status === 'error')}
      <button
        on:click={() => showDetails = !showDetails}
        class="flex-shrink-0 p-1 text-dark-text-muted hover:text-dark-text transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    {/if}
    
  </div>
  
  <!-- Success Animations -->
  {#if status === 'success'}
    <div class="mt-4 flex items-center justify-center">
      <div class="success-checkmark">
        <svg class="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            class="checkmark-path"
          />
        </svg>
      </div>
    </div>
  {/if}
  
  <!-- Processing Particles Effect -->
  {#if status === 'processing'}
    <div class="processing-particles absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {#each Array(6) as _, i}
        <div 
          class="particle absolute w-1 h-1 bg-magic-400 rounded-full opacity-60"
          style="
            left: {10 + i * 15}%;
            animation: float {2 + i * 0.3}s ease-in-out infinite;
            animation-delay: {i * 0.2}s;
          "
        />
      {/each}
    </div>
  {/if}
  
</div>

<style>
  /* Shimmer animation for progress bar */
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
  
  /* Success checkmark animation */
  .success-checkmark {
    animation: successPop 0.6s ease-out;
  }
  
  @keyframes successPop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .checkmark-path {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawCheckmark 0.8s ease-out 0.2s forwards;
  }
  
  @keyframes drawCheckmark {
    to {
      stroke-dashoffset: 0;
    }
  }
  
  /* Floating particles animation */
  @keyframes float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.6;
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
      opacity: 1;
    }
  }
  
  .particle {
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(0, 255, 136, 0.6);
  }
  
  /* Processing feedback container */
  .processing-feedback {
    position: relative;
    backdrop-filter: blur(10px);
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .processing-feedback {
      padding: 0.75rem;
    }
    
    .flex.items-center.space-x-4 {
      space-x: 0.75rem;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .processing-feedback,
    .success-checkmark,
    .checkmark-path,
    .particle {
      animation: none;
      transition: none;
    }
    
    .animate-shimmer {
      animation: none;
    }
  }
</style>