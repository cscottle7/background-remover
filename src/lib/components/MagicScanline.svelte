<!--
  MagicScanline - Magic Workbench scanline animation
  Provides the satisfying "dissolve" effect for processing feedback
-->

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  
  export let isActive: boolean = false;
  export let duration: number = 2000; // Animation duration in ms
  export let color: string = '#3b82f6'; // Blue scanline color
  export let glowIntensity: number = 0.8;
  
  const dispatch = createEventDispatcher();
  
  let scanlineElement: HTMLDivElement;
  let containerElement: HTMLDivElement;
  let animationId: number;
  let isAnimating = false;
  
  $: if (isActive && !isAnimating) {
    startScanline();
  }
  
  function startScanline() {
    if (!scanlineElement || !containerElement || isAnimating) return;
    
    isAnimating = true;
    dispatch('started');
    
    // Reset position
    scanlineElement.style.transform = 'translateY(-100%)';
    scanlineElement.style.opacity = '1';
    
    // Animate scanline from top to bottom
    scanlineElement.animate([
      { 
        transform: 'translateY(-100%)', 
        opacity: '1',
        filter: `drop-shadow(0 0 ${glowIntensity * 10}px ${color})`
      },
      { 
        transform: 'translateY(100vh)', 
        opacity: '0.8',
        filter: `drop-shadow(0 0 ${glowIntensity * 15}px ${color})`
      },
      { 
        transform: 'translateY(100vh)', 
        opacity: '0',
        filter: `drop-shadow(0 0 ${glowIntensity * 5}px ${color})`
      }
    ], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ease-out-quad
      fill: 'forwards'
    }).addEventListener('finish', () => {
      isAnimating = false;
      dispatch('completed');
    });
    
    console.log('✨ Scanline animation started');
  }
  
  function stopScanline() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    isAnimating = false;
    if (scanlineElement) {
      scanlineElement.style.opacity = '0';
    }
    dispatch('stopped');
  }
  
  onMount(() => {
    return () => {
      stopScanline();
    };
  });
</script>

<div 
  bind:this={containerElement}
  class="scanline-container" 
  class:active={isActive}
>
  <div 
    bind:this={scanlineElement}
    class="scanline"
    style="--scanline-color: {color}; --glow-intensity: {glowIntensity};"
  ></div>
  
  <!-- Processing overlay -->
  {#if isActive}
    <div class="processing-overlay">
      <div class="magic-particles">
        {#each Array(8) as _, i}
          <div class="particle particle-{i}"></div>
        {/each}
      </div>
      <div class="processing-text">
        <span class="text-glow">Enchanting your character...</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .scanline-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 30;
  }
  
  .scanline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      var(--scanline-color) 20%, 
      var(--scanline-color) 80%, 
      transparent 100%
    );
    box-shadow: 
      0 0 10px var(--scanline-color),
      0 0 20px var(--scanline-color),
      0 0 30px var(--scanline-color);
    opacity: 0;
    transform: translateY(-100%);
    border-radius: 2px;
  }
  
  .processing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  }
  
  .magic-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #3b82f6;
    border-radius: 50%;
    opacity: 0;
    animation: sparkle 2s infinite;
    box-shadow: 0 0 6px #3b82f6;
  }
  
  .particle-0 { top: 20%; left: 15%; animation-delay: 0.1s; }
  .particle-1 { top: 30%; right: 20%; animation-delay: 0.3s; }
  .particle-2 { bottom: 40%; left: 25%; animation-delay: 0.5s; }
  .particle-3 { top: 60%; right: 30%; animation-delay: 0.7s; }
  .particle-4 { bottom: 20%; right: 15%; animation-delay: 0.9s; }
  .particle-5 { top: 45%; left: 10%; animation-delay: 1.1s; }
  .particle-6 { bottom: 60%; right: 40%; animation-delay: 1.3s; }
  .particle-7 { top: 15%; left: 60%; animation-delay: 1.5s; }
  
  .processing-text {
    text-align: center;
    color: #f8fafc;
    font-size: 16px;
    font-weight: 500;
    margin-top: 20px;
  }
  
  .text-glow {
    text-shadow: 
      0 0 10px rgba(59, 130, 246, 0.8),
      0 0 20px rgba(59, 130, 246, 0.6),
      0 0 30px rgba(59, 130, 246, 0.4);
    animation: textPulse 1.5s ease-in-out infinite;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes sparkle {
    0%, 100% { 
      opacity: 0; 
      transform: scale(0.5); 
    }
    50% { 
      opacity: 1; 
      transform: scale(1.2); 
    }
  }
  
  @keyframes textPulse {
    0%, 100% { 
      opacity: 0.8; 
      text-shadow: 
        0 0 10px rgba(59, 130, 246, 0.6),
        0 0 20px rgba(59, 130, 246, 0.4);
    }
    50% { 
      opacity: 1; 
      text-shadow: 
        0 0 15px rgba(59, 130, 246, 1),
        0 0 25px rgba(59, 130, 246, 0.8),
        0 0 35px rgba(59, 130, 246, 0.6);
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .scanline, .particle, .text-glow {
      animation: none;
    }
    
    .processing-overlay {
      animation: none;
    }
  }
</style>