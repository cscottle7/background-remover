<!--
  Refinement Canvas Component
  Core canvas editing logic extracted from ImageRefinementEditor
  Mobile-first responsive design with full viewport usage
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { refinementState, refinementActions } from '$lib/stores/refinementState.js';
  
  export let originalImage: string | null;
  export let processedImage: string | null;
  export let isProcessing: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  // Canvas references
  let canvasContainer: HTMLDivElement;
  let originalCanvas: HTMLCanvasElement;
  let processedCanvas: HTMLCanvasElement;
  let maskCanvas: HTMLCanvasElement;
  let previewCanvas: HTMLCanvasElement;
  
  // Canvas contexts
  let originalCtx: CanvasRenderingContext2D;
  let processedCtx: CanvasRenderingContext2D;
  let maskCtx: CanvasRenderingContext2D;
  let previewCtx: CanvasRenderingContext2D;
  
  // Image objects
  let originalImg: HTMLImageElement;
  let processedImg: HTMLImageElement;
  
  // State
  let isInitialized = false;
  let canvasesReady = false; // New flag for canvas rendering
  let canvasWidth = 600;
  let canvasHeight = 400;
  let canvasScale = 1;
  let isDrawing = false;
  let showComparison = false;
  let isDesktop = false;
  
  // Reactive state from store
  $: currentState = $refinementState;
  $: currentTool = currentState.currentTool;
  $: brushSize = currentState.brushSize;
  $: showOriginalPreview = currentState.showOriginalPreview;
  
  onMount(() => {
    if (!browser || !originalImage || !processedImage) {
      return;
    }
    
    // Detect desktop for comparison view
    const checkIsDesktop = () => {
      isDesktop = window.innerWidth >= 1024;
    };
    checkIsDesktop();
    
    // Handle viewport changes for responsive canvas scaling
    const handleResize = () => {
      if (isInitialized && canvasContainer) {
        const containerRect = canvasContainer.getBoundingClientRect();
        const optimalSize = calculateOptimalCanvasSize(
          originalImg.width,
          originalImg.height,
          { width: containerRect.width, height: containerRect.height }
        );
        
        // Only resize if there's a significant change
        if (Math.abs(optimalSize.width - canvasWidth) > 10 || 
            Math.abs(optimalSize.height - canvasHeight) > 10) {
          canvasWidth = optimalSize.width;
          canvasHeight = optimalSize.height;
          canvasScale = optimalSize.scale;
          
          setupCanvases();
          drawImages();
          refinementActions.setCanvasSize(canvasWidth, canvasHeight, canvasScale);
        }
      }
    };
    
    // Throttled resize handler
    let resizeTimeout: number;
    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        checkIsDesktop();
        handleResize();
      }, 150);
    };
    
    window.addEventListener('resize', throttledResize);
    window.addEventListener('orientationchange', throttledResize);
    
    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', throttledResize);
      clearTimeout(resizeTimeout);
    };
  });
  
  // Watch for image changes - enable canvas rendering immediately
  $: if (browser && originalImage && processedImage && !canvasesReady) {
    console.log('🔄 Reactive statement triggered - enabling canvas rendering');
    console.log('  browser:', browser);
    console.log('  originalImage:', originalImage ? 'PRESENT' : 'NULL'); 
    console.log('  processedImage:', processedImage ? 'PRESENT' : 'NULL');
    console.log('  canvasesReady:', canvasesReady);
    canvasesReady = true; // Enable canvas rendering immediately
    
    // Initialize after a short delay to allow DOM rendering
    setTimeout(() => {
      if (!isInitialized) {
        initializeCanvas();
      }
    }, 100);
  }
  
  async function initializeCanvas() {
    try {
      console.log('=== INITIALIZING CANVAS ===');
      console.log('Original image data:', originalImage ? 'Present' : 'Missing', originalImage?.substring(0, 50) + '...');
      console.log('Processed image data:', processedImage ? 'Present' : 'Missing', processedImage?.substring(0, 50) + '...');
      console.log('Container rect:', canvasContainer?.getBoundingClientRect());
      
      // Ensure DOM elements are mounted before proceeding
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Validate container is available
      if (!canvasContainer) {
        throw new Error('Canvas container not mounted');
      }
      
      // Load images
      originalImg = await loadImage(originalImage!);
      processedImg = await loadImage(processedImage!);
      
      // Calculate optimal canvas size
      const containerRect = canvasContainer.getBoundingClientRect();
      
      if (containerRect.width === 0 || containerRect.height === 0) {
        throw new Error('Container has zero dimensions');
      }
      
      const optimalSize = calculateOptimalCanvasSize(
        originalImg.width,
        originalImg.height,
        { width: containerRect.width, height: containerRect.height }
      );
      
      canvasWidth = optimalSize.width;
      canvasHeight = optimalSize.height;
      canvasScale = optimalSize.scale;
      
      // Update store with canvas dimensions
      refinementActions.setCanvasSize(canvasWidth, canvasHeight, canvasScale);
      
      // Wait for essential canvas elements to be available
      let retries = 0;
      const maxRetries = 10;
      
      // We need at least originalCanvas and previewCanvas for basic functionality
      while ((!originalCanvas || !previewCanvas) && retries < maxRetries) {
        console.log(`Waiting for essential canvas elements (attempt ${retries + 1}/${maxRetries})`);
        console.log(`  originalCanvas: ${!!originalCanvas}, previewCanvas: ${!!previewCanvas}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!originalCanvas || !previewCanvas) {
        throw new Error('Essential canvas elements (original, preview) failed to mount after retries');
      }
      
      console.log('Essential canvas elements ready, proceeding with setup');
      
      // Initialize canvas contexts
      setupCanvases();
      
      // Draw initial images
      drawImages();
      
      isInitialized = true;
      console.log('✅ Canvas initialization complete!');
      
    } catch (error) {
      console.error('❌ Failed to initialize canvas:', error);
      dispatch('error', { message: `Failed to load images for editing: ${error.message}` });
    }
  }
  
  function setupCanvases() {
    console.log('Setting up canvases - available elements:', {
      originalCanvas: !!originalCanvas,
      processedCanvas: !!processedCanvas,
      maskCanvas: !!maskCanvas,
      previewCanvas: !!previewCanvas,
      isDesktop,
      showComparison
    });
    
    // Get available canvases based on current view mode
    const availableCanvases = [];
    
    if (originalCanvas) {
      availableCanvases.push(originalCanvas);
      originalCtx = originalCanvas.getContext('2d')!;
    }
    
    if (previewCanvas) {
      availableCanvases.push(previewCanvas);
      previewCtx = previewCanvas.getContext('2d')!;
    }
    
    // Only setup these canvases if they exist (single view mode)
    if (processedCanvas) {
      availableCanvases.push(processedCanvas);
      processedCtx = processedCanvas.getContext('2d')!;
    }
    
    if (maskCanvas) {
      availableCanvases.push(maskCanvas);
      maskCtx = maskCanvas.getContext('2d')!;
    }
    
    if (availableCanvases.length === 0) {
      throw new Error('No canvas elements available');
    }
    
    // Set canvas sizes for available canvases
    availableCanvases.forEach(canvas => {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
    });
    
    // Configure contexts for high quality rendering
    const availableContexts = [originalCtx, previewCtx, processedCtx, maskCtx].filter(ctx => ctx);
    availableContexts.forEach(ctx => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    });
    
    console.log(`✅ Setup complete for ${availableCanvases.length} canvases`);
  }
  
  function drawImages() {
    if (!originalImg || !processedImg) return;
    
    console.log('Drawing images on available canvases');
    
    // Clear and draw on available canvases
    if (originalCtx) {
      originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      originalCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
    }
    
    if (processedCtx) {
      processedCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      processedCtx.drawImage(processedImg, 0, 0, canvasWidth, canvasHeight);
    }
    
    if (previewCtx) {
      previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // In comparison mode, always show processed image in preview
      // In regular mode, respect the original preview toggle
      if (isDesktop && showComparison) {
        previewCtx.drawImage(processedImg, 0, 0, canvasWidth, canvasHeight);
      } else if (showOriginalPreview) {
        previewCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
      } else {
        previewCtx.drawImage(processedImg, 0, 0, canvasWidth, canvasHeight);
      }
    }
    
    console.log('✅ Images drawn successfully');
  }
  
  // Basic drawing handlers (simplified for initial implementation)
  function handlePointerDown(event: PointerEvent) {
    console.log('🖱️ Pointer down - tool:', currentTool, 'initialized:', isInitialized, 'processing:', isProcessing);
    
    if (!isInitialized || isProcessing) {
      console.log('❌ Ignoring pointer down - not ready');
      return;
    }
    
    isDrawing = true;
    previewCanvas.setPointerCapture(event.pointerId);
    
    const rect = previewCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (event.clientY - rect.top) * (canvasHeight / rect.height);
    
    console.log('🎯 Drawing at:', x, y, 'canvas size:', canvasWidth, 'x', canvasHeight);
    
    startDrawing(x, y);
    dispatch('change');
  }
  
  function handlePointerMove(event: PointerEvent) {
    if (!isDrawing || !isInitialized || isProcessing) return;
    
    const rect = previewCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (event.clientY - rect.top) * (canvasHeight / rect.height);
    
    continueDrawing(x, y);
  }
  
  function handlePointerUp(event: PointerEvent) {
    if (!isDrawing) return;
    
    isDrawing = false;
    previewCanvas.releasePointerCapture(event.pointerId);
    endDrawing();
  }
  
  function startDrawing(x: number, y: number) {
    if (!previewCtx) {
      console.log('❌ No preview context available');
      return;
    }
    
    console.log('🎨 Starting drawing - tool:', currentTool, 'brush size:', brushSize);
    
    previewCtx.beginPath();
    previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    
    // Apply tool-specific operations
    applyToolEffect(x, y);
  }
  
  function continueDrawing(x: number, y: number) {
    if (!previewCtx) return;
    
    previewCtx.lineTo(x, y);
    previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    
    applyToolEffect(x, y);
  }
  
  function endDrawing() {
    // Finalize the drawing operation
    if (previewCtx) {
      previewCtx.stroke();
    }
  }
  
  function applyToolEffect(x: number, y: number) {
    if (!previewCtx) {
      console.log('❌ No preview context for tool effect');
      return;
    }
    
    console.log('🔧 Applying tool effect:', currentTool, 'at:', x, y);
    
    // Set brush style
    previewCtx.lineWidth = brushSize;
    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
    
    // Apply tool-specific operations
    switch (currentTool) {
      case 'erase':
        console.log('✂️ Applying erase tool');
        previewCtx.globalCompositeOperation = 'destination-out';
        previewCtx.beginPath();
        previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        previewCtx.fill();
        break;
        
      case 'smart-restore':
        console.log('🔄 Applying smart restore tool');
        previewCtx.globalCompositeOperation = 'source-over';
        
        // Copy from original image
        if (originalCtx && originalImg) {
          try {
            const copyX = Math.max(0, Math.min(canvasWidth - brushSize, x - brushSize / 2));
            const copyY = Math.max(0, Math.min(canvasHeight - brushSize, y - brushSize / 2));
            const copyWidth = Math.min(brushSize, canvasWidth - copyX);
            const copyHeight = Math.min(brushSize, canvasHeight - copyY);
            
            console.log('📊 Smart restore params:', { copyX, copyY, copyWidth, copyHeight, canvasWidth, canvasHeight, brushSize });
            
            // Verify original context has valid image data
            const testPixel = originalCtx.getImageData(copyX, copyY, 1, 1);
            console.log('🔍 Test pixel from original:', testPixel.data[0], testPixel.data[1], testPixel.data[2], testPixel.data[3]);
            
            // If the original canvas appears empty, redraw the original image
            if (testPixel.data[3] === 0 || (testPixel.data[0] === 0 && testPixel.data[1] === 0 && testPixel.data[2] === 0)) {
              console.log('⚠️ Original canvas appears empty, redrawing...');
              originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
              originalCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
            }
            
            // Now get the image data for the restore operation
            const imageData = originalCtx.getImageData(copyX, copyY, copyWidth, copyHeight);
            console.log('📦 Image data for restore:', imageData.width, 'x', imageData.height, 'pixels');
            
            // Use composite operation to blend the restored pixels properly
            previewCtx.putImageData(imageData, copyX, copyY);
            
            console.log('✅ Smart restore applied successfully');
          } catch (error) {
            console.error('❌ Smart restore error:', error);
            // Fallback to simple brush stroke
            previewCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            previewCtx.beginPath();
            previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
            previewCtx.fill();
          }
        } else {
          console.log('❌ No original context or image for restore');
          console.log('  originalCtx:', !!originalCtx);
          console.log('  originalImg:', !!originalImg);
          // Fallback visual feedback
          previewCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          previewCtx.beginPath();
          previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
          previewCtx.fill();
        }
        break;
        
      default:
        console.log('🎨 Applying default tool effect for:', currentTool);
        previewCtx.globalCompositeOperation = 'destination-out';
        previewCtx.beginPath();
        previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        previewCtx.fill();
    }
  }
  
  // Utility functions
  async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  // Intelligent canvas sizing based on device and image dimensions
  function calculateOptimalCanvasSize(
    imageWidth: number,
    imageHeight: number,
    viewport: { width: number; height: number }
  ): { width: number; height: number; scale: number } {
    console.log('📐 Calculating canvas size:');
    console.log('  Image dimensions:', imageWidth, 'x', imageHeight);
    console.log('  Viewport:', viewport.width, 'x', viewport.height);
    
    // Detect if mobile viewport
    const isMobile = viewport.width < 768;
    
    // Calculate available space more accurately
    // Account for header (64px) + toolbar space + padding
    const maxWidth = viewport.width - (isMobile ? 32 : 360); // Desktop has 320px+ toolbar
    const maxHeight = viewport.height - (isMobile ? 200 : 80); // Mobile has bottom toolbar
    
    console.log('  Available space:', maxWidth, 'x', maxHeight);
    
    // Calculate scale factor maintaining aspect ratio
    // Remove the "don't scale up" limit (scale: 1) to allow full viewport usage
    const scaleX = maxWidth / imageWidth;
    const scaleY = maxHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const result = {
      width: Math.round(imageWidth * scale),
      height: Math.round(imageHeight * scale),
      scale
    };
    
    console.log('  Final canvas size:', result.width, 'x', result.height, 'scale:', result.scale);
    
    return result;
  }
  
  // Export current canvas state
  function exportCanvas(): string {
    if (!previewCanvas) return '';
    return previewCanvas.toDataURL('image/png');
  }
  
  // Handle tool changes and preview toggles
  $: if (isInitialized) {
    drawImages(); // Redraw when preview mode changes
  }
  
  // Reactive drawing when original preview toggle changes
  $: if (isInitialized && originalImg && processedImg && showOriginalPreview !== undefined) {
    console.log('🔄 Original preview toggled:', showOriginalPreview);
    drawImages(); // Redraw when original preview toggle changes
  }
  
  // Reactive drawing when comparison mode changes
  $: if (isInitialized && originalImg && processedImg && showComparison !== undefined) {
    console.log('🔄 Comparison mode toggled:', showComparison);
    drawImages(); // Redraw when comparison mode changes
  }
  
  // Handle canvas completion
  function handleComplete() {
    const refinedImage = exportCanvas();
    dispatch('complete', { refinedImage });
  }
  
  // Expose export function for parent component
  export { exportCanvas };
</script>

<div class="canvas-container" bind:this={canvasContainer}>
  {#if canvasesReady}
    
    <!-- Desktop comparison view toggle -->
    {#if isInitialized && isDesktop}
      <div class="comparison-controls">
        <button
          on:click={() => showComparison = !showComparison}
          class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white px-4 py-2 rounded-lg font-medium text-sm backdrop-blur-sm"
          class:active={showComparison}
          title="Toggle before/after comparison"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          {showComparison ? 'Single View' : 'Compare'}
        </button>
      </div>
    {/if}
    
    <!-- Canvas workspace -->
    <div class="canvas-workspace" class:comparison-mode={isDesktop && showComparison}>
      {#if isInitialized && isDesktop && showComparison}
        <!-- Split view for comparison -->
        <div class="comparison-view">
          <div class="comparison-panel">
            <div class="panel-label">Original</div>
            <div class="canvas-stack">
              <canvas
                bind:this={originalCanvas}
                class="canvas-layer comparison-canvas"
              ></canvas>
            </div>
          </div>
          
          <div class="comparison-divider"></div>
          
          <div class="comparison-panel">
            <div class="panel-label">Edited</div>
            <div class="canvas-stack">
              <canvas
                bind:this={previewCanvas}
                class="canvas-layer interactive comparison-canvas"
                on:pointerdown={handlePointerDown}
                on:pointermove={handlePointerMove}
                on:pointerup={handlePointerUp}
                style="cursor: crosshair; touch-action: none;"
              ></canvas>
            </div>
          </div>
        </div>
      {:else}
        <!-- Single view - Always render canvases once canvasesReady is true -->
        <div class="canvas-stack">
          <!-- Hidden canvases for image processing -->
          <canvas
            bind:this={originalCanvas}
            class="canvas-layer hidden"
            aria-hidden="true"
          ></canvas>
          
          <canvas
            bind:this={processedCanvas}
            class="canvas-layer hidden"
            aria-hidden="true"
          ></canvas>
          
          <canvas
            bind:this={maskCanvas}
            class="canvas-layer hidden"
            aria-hidden="true"
          ></canvas>
          
          <!-- Main preview canvas -->
          <canvas
            bind:this={previewCanvas}
            class="canvas-layer interactive"
            on:pointerdown={handlePointerDown}
            on:pointermove={handlePointerMove}
            on:pointerup={handlePointerUp}
            style="cursor: crosshair; touch-action: none;"
          ></canvas>
        </div>
      {/if}
      
      <!-- Tool cursor overlay -->
      {#if isDrawing}
        <div class="cursor-overlay">
          <div 
            class="brush-cursor"
            style="width: {brushSize}px; height: {brushSize}px;"
          ></div>
        </div>
      {/if}
      
      <!-- Loading overlay while initializing -->
      {#if !isInitialized}
        <div class="canvas-loading" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: white;">
            <div class="loading-spinner"></div>
            <p>Initializing canvas...</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Loading state -->
    <div class="canvas-loading">
      <div class="loading-spinner"></div>
      <p>Preparing canvas...</p>
    </div>
  {/if}
</div>

<!-- Quick action button for mobile -->
{#if isInitialized}
  <div class="quick-actions">
    <button
      on:click={() => refinementActions.toggleOriginalPreview()}
      class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-3 rounded-lg"
      class:active={showOriginalPreview}
      title="Toggle original preview (Space)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    </button>
    
    <button
      on:click={handleComplete}
      class="btn btn-magic py-3 px-4 rounded-lg font-medium"
      disabled={isProcessing}
      title="Complete editing"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
    </button>
  </div>
{/if}

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--color-dark-bg);
    overflow: hidden;
  }
  
  .comparison-controls {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 100;
  }
  
  .comparison-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 8px;
    color: var(--color-dark-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    backdrop-filter: blur(8px);
  }
  
  .comparison-toggle:hover {
    background: var(--color-dark-hover);
    color: var(--color-dark-text);
    border-color: var(--color-magic-400);
  }
  
  .comparison-toggle.active {
    background: var(--color-magic-400);
    color: white;
    border-color: var(--color-magic-400);
  }
  
  .canvas-workspace {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  
  .canvas-workspace.comparison-mode {
    padding: 2rem 1rem 1rem;
  }
  
  .comparison-view {
    display: flex;
    width: 100%;
    height: 100%;
    max-width: 1200px;
    gap: 1rem;
    align-items: center;
  }
  
  .comparison-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  
  .panel-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-dark-text-secondary);
    text-align: center;
    margin-bottom: 0.75rem;
    padding: 0.5rem 1rem;
    background: var(--color-dark-surface);
    border-radius: 6px;
    border: 1px solid var(--color-dark-border);
  }
  
  .comparison-divider {
    width: 2px;
    height: 80%;
    background: linear-gradient(to bottom, transparent, var(--color-magic-400), transparent);
    border-radius: 1px;
    position: relative;
  }
  
  .comparison-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background: var(--color-magic-400);
    border-radius: 50%;
    border: 2px solid var(--color-dark-bg);
  }
  
  .comparison-canvas {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .canvas-stack {
    position: relative;
    background: var(--color-dark-surface);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .canvas-layer.interactive {
    position: relative;
    z-index: 10;
  }
  
  .canvas-layer.hidden {
    display: none;
  }
  
  .cursor-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
  }
  
  .brush-cursor {
    position: absolute;
    border: 2px solid var(--color-magic-400);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    opacity: 0.7;
  }
  
  .canvas-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-dark-text-secondary);
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-dark-border);
    border-top: 3px solid var(--color-magic-400);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .quick-actions {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 30;
  }
  
  .quick-action-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    color: var(--color-dark-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }
  
  .quick-action-btn:hover:not(:disabled) {
    background: var(--color-dark-hover);
    color: var(--color-dark-text);
    border-color: var(--color-magic-400);
    transform: scale(1.05);
  }
  
  .quick-action-btn.active {
    background: var(--color-magic-400);
    color: white;
    border-color: var(--color-magic-400);
  }
  
  .quick-action-btn.complete-btn:hover:not(:disabled) {
    background: var(--color-magic-400);
    color: white;
  }
  
  .quick-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .quick-actions {
      bottom: 5rem; /* Account for mobile toolbar */
    }
    
    .quick-action-btn {
      width: 44px;
      height: 44px;
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }
    
    .quick-action-btn {
      transform: none;
    }
    
    .quick-action-btn:hover:not(:disabled) {
      transform: none;
    }
  }
</style>