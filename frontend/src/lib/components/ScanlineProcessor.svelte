<!--
  Scanline Animation System - The Magic Processing Experience
  Implements 3-second background dissolution effect with scanline progression
  Core to "Performance as a Feature" UX principle
-->

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut, quintOut } from 'svelte/easing';
  import type { ImageData } from '../types/app';
  
  export let image: ImageData;
  export let isProcessing: boolean = false;
  export let processingProgress: number = 0;
  export let processingMessage: string = 'Processing...';
  export let processedResult: string | null = null;
  
  const dispatch = createEventDispatcher<{
    animationComplete: void;
    scanlineComplete: void;
  }>();
  
  // Animation state
  let canvasRef: HTMLCanvasElement;
  let overlayCanvasRef: HTMLCanvasElement;
  let animationFrame: number;
  let scanlinePosition = tweened(0, { duration: 3000, easing: quintOut });
  let fadeOpacity = tweened(1, { duration: 1000, easing: cubicOut });
  let glowIntensity = tweened(0, { duration: 500, easing: cubicOut });
  
  // Canvas contexts
  let ctx: CanvasRenderingContext2D;
  let overlayCtx: CanvasRenderingContext2D;
  
  // Image elements
  let originalImage: HTMLImageElement;
  let processedImage: HTMLImageElement | null = null;
  
  // Animation timing constants
  const SCANLINE_DURATION = 3000; // 3 seconds for magic scanline
  const DISSOLUTION_DELAY = 1000; // 1 second delay before background starts dissolving
  const GLOW_PULSE_SPEED = 0.003; // Speed of the magic glow pulse
  const SPARK_COUNT = 12; // Number of sparks during processing
  const WAVE_AMPLITUDE = 5; // Amplitude of scanline wave effect
  
  // Reactive state
  $: if (isProcessing && canvasRef) {
    startProcessingAnimation();
  }
  
  $: if (processedResult && !isProcessing) {
    showProcessedResult();
  }
  
  onMount(() => {
    if (canvasRef && overlayCanvasRef) {
      ctx = canvasRef.getContext('2d')!;
      overlayCtx = overlayCanvasRef.getContext('2d')!;
      
      // Ensure fade opacity starts at 1 for image visibility
      fadeOpacity.set(1, { duration: 0 });
      
      loadOriginalImage();
    }
  });
  
  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
  
  async function loadOriginalImage() {
    originalImage = new Image();
    originalImage.onload = () => {
      setupCanvases();
      drawOriginalImage();
    };
    originalImage.src = image.preview;
  }
  
  function setupCanvases() {
    const { width, height } = calculateDisplayDimensions();
    
    // Set canvas dimensions
    canvasRef.width = width;
    canvasRef.height = height;
    overlayCanvasRef.width = width;
    overlayCanvasRef.height = height;
    
    // Configure contexts
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    overlayCtx.imageSmoothingEnabled = true;
    overlayCtx.imageSmoothingQuality = 'high';
  }
  
  function calculateDisplayDimensions() {
    // Make dimensions responsive to viewport size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate max dimensions based on screen size with better mobile handling
    let maxWidth = Math.min(600, viewportWidth - 80); // Leave some padding
    let maxHeight = Math.min(400, viewportHeight * 0.4); // Max 40% of viewport height
    
    // Further reduce on very small screens
    if (viewportWidth <= 480) {
      maxWidth = Math.min(maxWidth, viewportWidth - 40);
      maxHeight = Math.min(maxHeight, viewportHeight * 0.35);
    }
    
    // Provide fallback dimensions if not available
    const dimensions = image.dimensions || { width: 600, height: 400 };
    const aspectRatio = dimensions.width / dimensions.height;
    
    let width = Math.min(dimensions.width, maxWidth);
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    // Ensure minimum viable size
    width = Math.max(width, 200);
    height = Math.max(height, 150);
    
    return { width: Math.round(width), height: Math.round(height) };
  }
  
  function drawOriginalImage() {
    const { width, height } = calculateDisplayDimensions();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(originalImage, 0, 0, width, height);
  }
  
  async function startProcessingAnimation() {
    // Reset animation state
    scanlinePosition.set(0);
    glowIntensity.set(0.3);
    
    // Ensure original image remains visible during processing
    fadeOpacity.set(1, { duration: 0 });
    
    // Start scanline animation
    scanlinePosition.set(1);
    
    // Begin the magic glow effect
    startGlowPulse();
    
    // Begin scanline drawing animation
    startScanlineDrawing();
  }
  
  function startGlowPulse() {
    let startTime = Date.now();
    
    function pulse() {
      if (!isProcessing) return;
      
      const elapsed = Date.now() - startTime;
      const pulseValue = 0.3 + 0.4 * Math.sin(elapsed * GLOW_PULSE_SPEED);
      glowIntensity.set(pulseValue);
      
      animationFrame = requestAnimationFrame(pulse);
    }
    
    pulse();
  }
  
  function startScanlineDrawing() {
    const startTime = Date.now();
    const { width, height } = calculateDisplayDimensions();
    
    function drawFrame() {
      if (!isProcessing) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SCANLINE_DURATION, 1);
      
      // Clear overlay canvas
      overlayCtx.clearRect(0, 0, width, height);
      
      // Draw scanline with magic glow
      drawMagicScanline(progress, width, height);
      
      // Draw background dissolution effect after delay
      if (elapsed > DISSOLUTION_DELAY) {
        const dissolutionProgress = Math.min((elapsed - DISSOLUTION_DELAY) / (SCANLINE_DURATION - DISSOLUTION_DELAY), 1);
        drawBackgroundDissolution(dissolutionProgress, width, height);
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(drawFrame);
      } else {
        dispatch('scanlineComplete');
      }
    }
    
    drawFrame();
  }
  
  function drawMagicScanline(progress: number, width: number, height: number) {
    const baseY = progress * height;
    const glowValue = $glowIntensity;
    const time = Date.now() * 0.005;
    
    // Create wave effect on the scanline
    const waveOffset = Math.sin(time * 2) * WAVE_AMPLITUDE;
    const y = baseY + waveOffset;
    
    // Enhanced gradient for the scanline with wave distortion
    const gradient = overlayCtx.createLinearGradient(0, y - 25, 0, y + 25);
    gradient.addColorStop(0, `rgba(0, 255, 136, 0)`);
    gradient.addColorStop(0.3, `rgba(0, 255, 136, ${glowValue * 0.6})`);
    gradient.addColorStop(0.5, `rgba(0, 255, 136, ${glowValue})`);
    gradient.addColorStop(0.7, `rgba(0, 255, 136, ${glowValue * 0.6})`);
    gradient.addColorStop(1, `rgba(0, 255, 136, 0)`);
    
    // Draw the main scanline with wave distortion
    overlayCtx.fillStyle = gradient;
    overlayCtx.fillRect(0, y - 25, width, 50);
    
    // Draw enhanced leading edge particles
    drawEnhancedScanlineParticles(y, width, glowValue, time);
    
    // Draw energy sparks
    drawEnergySparks(y, width, glowValue, progress);
    
    // Draw trailing edge glow with fade
    const trailGradient = overlayCtx.createLinearGradient(0, Math.max(0, y - 80), 0, y);
    trailGradient.addColorStop(0, `rgba(0, 255, 136, 0)`);
    trailGradient.addColorStop(0.5, `rgba(0, 255, 136, ${glowValue * 0.2})`);
    trailGradient.addColorStop(1, `rgba(0, 255, 136, ${glowValue * 0.4})`);
    
    overlayCtx.fillStyle = trailGradient;
    overlayCtx.fillRect(0, Math.max(0, y - 80), width, 80);
    
    // Draw scanline reflection effect
    if (progress > 0.3) {
      drawScanlineReflection(y, width, glowValue, progress);
    }
  }
  
  function drawScanlineParticles(y: number, width: number, intensity: number) {
    const particleCount = 8;
    const particleSize = 2;
    
    for (let i = 0; i < particleCount; i++) {
      const x = (i / particleCount) * width + Math.sin(Date.now() * 0.01 + i) * 20;
      const offsetY = y + Math.sin(Date.now() * 0.008 + i * 2) * 10;
      
      overlayCtx.save();
      overlayCtx.globalAlpha = intensity * 0.8;
      overlayCtx.fillStyle = `rgba(0, 255, 136, 1)`;
      overlayCtx.shadowBlur = 8;
      overlayCtx.shadowColor = `rgba(0, 255, 136, ${intensity})`;
      
      overlayCtx.beginPath();
      overlayCtx.arc(x, offsetY, particleSize, 0, Math.PI * 2);
      overlayCtx.fill();
      overlayCtx.restore();
    }
  }
  
  function drawEnhancedScanlineParticles(y: number, width: number, intensity: number, time: number) {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const progress = (i / particleCount);
      const x = progress * width + Math.sin(time + i * 0.5) * 30;
      const offsetY = y + Math.sin(time * 1.2 + i * 0.8) * 8;
      
      // Varying particle sizes
      const size = 1.5 + Math.sin(time * 2 + i) * 0.8;
      const alpha = (0.6 + Math.sin(time * 1.5 + i * 0.3) * 0.3) * intensity;
      
      overlayCtx.save();
      overlayCtx.globalAlpha = alpha;
      
      // Create gradient for each particle
      const particleGradient = overlayCtx.createRadialGradient(x, offsetY, 0, x, offsetY, size * 3);
      particleGradient.addColorStop(0, `rgba(0, 255, 136, ${alpha})`);
      particleGradient.addColorStop(0.7, `rgba(0, 255, 136, ${alpha * 0.5})`);
      particleGradient.addColorStop(1, `rgba(0, 255, 136, 0)`);
      
      overlayCtx.fillStyle = particleGradient;
      overlayCtx.beginPath();
      overlayCtx.arc(x, offsetY, size * 3, 0, Math.PI * 2);
      overlayCtx.fill();
      
      // Core bright particle
      overlayCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      overlayCtx.beginPath();
      overlayCtx.arc(x, offsetY, size, 0, Math.PI * 2);
      overlayCtx.fill();
      
      overlayCtx.restore();
    }
  }
  
  function drawEnergySparks(y: number, width: number, intensity: number, progress: number) {
    const sparkCount = Math.floor(SPARK_COUNT * intensity);
    const time = Date.now() * 0.01;
    
    for (let i = 0; i < sparkCount; i++) {
      const x = Math.random() * width;
      const sparkY = y + (Math.random() - 0.5) * 40;
      const life = (Math.sin(time + i) + 1) / 2; // 0 to 1
      
      if (life < 0.1) continue; // Don't draw very faded sparks
      
      const sparkSize = (1 + Math.random() * 2) * life;
      const alpha = life * intensity * 0.6;
      
      overlayCtx.save();
      overlayCtx.globalAlpha = alpha;
      overlayCtx.shadowBlur = 6;
      overlayCtx.shadowColor = `rgba(0, 255, 136, ${alpha})`;
      
      // Draw spark as a small cross
      overlayCtx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      overlayCtx.lineWidth = sparkSize;
      overlayCtx.lineCap = 'round';
      
      overlayCtx.beginPath();
      overlayCtx.moveTo(x - sparkSize * 2, sparkY);
      overlayCtx.lineTo(x + sparkSize * 2, sparkY);
      overlayCtx.moveTo(x, sparkY - sparkSize * 2);
      overlayCtx.lineTo(x, sparkY + sparkSize * 2);
      overlayCtx.stroke();
      
      overlayCtx.restore();
    }
  }
  
  function drawScanlineReflection(y: number, width: number, intensity: number, progress: number) {
    // Create a subtle reflection effect below the scanline
    const reflectionHeight = 30;
    const reflectionY = y + 10;
    
    const reflectionGradient = overlayCtx.createLinearGradient(
      0, reflectionY, 
      0, reflectionY + reflectionHeight
    );
    reflectionGradient.addColorStop(0, `rgba(0, 255, 136, ${intensity * 0.2})`);
    reflectionGradient.addColorStop(1, `rgba(0, 255, 136, 0)`);
    
    overlayCtx.save();
    overlayCtx.globalAlpha = 0.4;
    overlayCtx.fillStyle = reflectionGradient;
    overlayCtx.fillRect(0, reflectionY, width, reflectionHeight);
    overlayCtx.restore();
  }
  
  function drawBackgroundDissolution(progress: number, width: number, height: number) {
    // Create a dissolving mask effect
    const imageData = overlayCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Generate noise pattern for dissolution
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor((i / 4) / width);
      
      // Create organic dissolution pattern
      const noise = Math.random() * 0.5 + 0.5;
      const distance = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
      const normalizedDistance = distance / Math.sqrt(width*width + height*height);
      
      const dissolveThreshold = progress * (1 + normalizedDistance * 0.3) * noise;
      
      if (dissolveThreshold > 0.6) {
        // Add subtle background dissolution sparkles
        data[i] = Math.min(255, data[i] + Math.random() * 100);     // R
        data[i + 1] = Math.min(255, data[i + 1] + Math.random() * 255); // G (magic green)
        data[i + 2] = Math.min(255, data[i + 2] + Math.random() * 150); // B
        data[i + 3] = Math.max(0, data[i + 3] - Math.random() * 100);   // A (fade out)
      }
    }
    
    overlayCtx.putImageData(imageData, 0, 0);
  }
  
  async function showProcessedResult() {
    if (!processedResult) return;
    
    // Load processed image
    processedImage = new Image();
    processedImage.onload = () => {
      // Clear overlay effects
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      overlayCtx.clearRect(0, 0, overlayCanvasRef.width, overlayCanvasRef.height);
      
      // Draw final processed image
      const { width, height } = calculateDisplayDimensions();
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(processedImage!, 0, 0, width, height);
      
      // Trigger completion animation
      fadeOpacity.set(0).then(() => {
        fadeOpacity.set(1);
        dispatch('animationComplete');
      });
    };
    processedImage.src = processedResult;
  }
</script>

<div class="scanline-processor relative overflow-hidden rounded-lg">
  <!-- Main image canvas -->
  <canvas
    bind:this={canvasRef}
    class="absolute inset-0 w-full h-full object-contain z-10"
    style="opacity: {$fadeOpacity}"
  />
  
  <!-- Scanline overlay canvas -->
  <canvas
    bind:this={overlayCanvasRef}
    class="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
    style="mix-blend-mode: screen;"
  />
  
  <!-- Processing status overlay -->
  {#if isProcessing}
    <div class="absolute bottom-4 left-4 right-4 z-30">
      <div class="bg-dark-elevated/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-magic-400/20">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-magic-400 font-medium">{processingMessage}</span>
          <span class="text-xs text-dark-text-secondary">{Math.round(processingProgress)}%</span>
        </div>
        
        <!-- Progress bar -->
        <div class="h-1 bg-dark-base rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-magic-400 to-magic-300 transition-all duration-500 ease-out"
            style="width: {processingProgress}%"
          >
            <div class="h-full w-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        <!-- Scanline progress indicator -->
        <div class="mt-2 flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-magic-400 animate-pulse"></div>
          <span class="text-xs text-dark-text-muted">Magic scanline active...</span>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Magic glow overlay -->
  {#if isProcessing}
    <div 
      class="absolute inset-0 pointer-events-none z-5"
      style="
        background: radial-gradient(circle at center, rgba(0, 255, 136, {$glowIntensity * 0.1}) 0%, transparent 70%);
        box-shadow: inset 0 0 100px rgba(0, 255, 136, {$glowIntensity * 0.2});
      "
    />
  {/if}
</div>

<style>
  .scanline-processor {
    min-height: 300px;
    max-height: 60vh;
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(38, 38, 38, 0.8) 100%);
    border: 1px solid rgba(156, 163, 175, 0.2);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    .scanline-processor {
      min-height: 250px;
      max-height: 50vh;
    }
  }
  
  canvas {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  
  @keyframes magic-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .animate-pulse {
    animation: magic-pulse 2s ease-in-out infinite;
  }
</style>