<!--
  Image Refinement Editor (Magic Eraser)
  Canvas-based editing for fixing background removal errors
  Implements brush tools for restore/erase functionality
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let originalImage: string; // Base64 or URL
  export let processedImage: string; // Base64 or URL  
  export let isVisible: boolean = false;
  export let brushSize: number = 20;
  
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
  
  // Tool state
  let currentTool: 'restore' | 'erase' = 'restore';
  let isDrawing = false;
  let canvasWidth = 600;
  let canvasHeight = 400;
  let transparency = 100; // Transparency percentage (0-100)
  
  // Mouse tracking for brush cursor
  let mouseX = 0;
  let mouseY = 0;
  let showBrushCursor = false;
  
  // Image objects
  let originalImg: HTMLImageElement;
  let processedImg: HTMLImageElement;
  
  // Refinement state
  let hasChanges = false;
  let isProcessingRefinement = false;
  let showOriginalPreview = false;
  
  onMount(() => {
    if (browser && isVisible) {
      initializeCanvas();
    }
  });
  
  $: if (browser && isVisible && originalImage && processedImage) {
    initializeCanvas();
  }
  
  // Update preview when showOriginalPreview toggle changes
  $: if (showOriginalPreview !== undefined && previewCtx) {
    updatePreview();
  }
  
  // Update preview when transparency changes
  $: if (transparency !== undefined && previewCtx) {
    updatePreview();
  }
  
  async function initializeCanvas() {
    if (!originalCanvas || !processedCanvas || !maskCanvas || !previewCanvas) return;
    
    console.log('Initializing canvas...');
    console.log('Canvas elements:', { originalCanvas, processedCanvas, maskCanvas, previewCanvas });
    
    // Get contexts
    originalCtx = originalCanvas.getContext('2d')!;
    processedCtx = processedCanvas.getContext('2d')!;
    maskCtx = maskCanvas.getContext('2d')!;
    previewCtx = previewCanvas.getContext('2d')!;
    
    try {
      // Load images
      console.log('Loading images...');
      await loadImages();
      
      // Set canvas dimensions based on image
      console.log('Setting up canvas dimensions...');
      setupCanvasDimensions();
      
      // Draw initial state
      console.log('Drawing images...');
      drawImages();
      
      // Initialize mask (transparent)
      console.log('Initializing mask...');
      initializeMask();
      
      // Setup event listeners
      console.log('Setting up event listeners...');
      setupEventListeners();
      
      console.log('Canvas initialization complete!');
    } catch (error) {
      console.error('Canvas initialization failed:', error);
      // Show error to user
      dispatch('error', { message: 'Failed to load images for editing' });
    }
  }
  
  async function loadImages() {
    return new Promise<void>((resolve, reject) => {
      let loadedCount = 0;
      let errorCount = 0;
      
      originalImg = new Image();
      processedImg = new Image();
      
      // Enable CORS for cross-origin images
      originalImg.crossOrigin = 'anonymous';
      processedImg.crossOrigin = 'anonymous';
      
      const onLoad = () => {
        loadedCount++;
        console.log(`Image ${loadedCount} loaded successfully`);
        if (loadedCount === 2) {
          console.log('All images loaded, resolving');
          resolve();
        }
      };
      
      const onError = (e: Event) => {
        errorCount++;
        console.error('Image loading failed:', e);
        if (errorCount + loadedCount === 2) {
          reject(new Error('Failed to load images'));
        }
      };
      
      originalImg.onload = onLoad;
      processedImg.onload = onLoad;
      originalImg.onerror = onError;
      processedImg.onerror = onError;
      
      console.log('Loading original image:', originalImage);
      console.log('Loading processed image:', processedImage);
      
      originalImg.src = originalImage;
      processedImg.src = processedImage;
    });
  }
  
  function setupCanvasDimensions() {
    // Force large dimensions to fill container height
    const containerWidth = canvasContainer?.clientWidth || 800;
    const containerHeight = canvasContainer?.clientHeight || 600;
    
    // Force larger canvas - prioritize height usage
    const maxWidth = Math.max(containerWidth - 80, 700); // Force minimum 700px width
    const maxHeight = Math.max(containerHeight - 60, 500); // Force minimum 500px height, use most of container
    
    // Fallback dimensions if image not loaded properly
    const imgWidth = originalImg?.width || processedImg?.width || 600;
    const imgHeight = originalImg?.height || processedImg?.height || 400;
    const aspectRatio = imgWidth / imgHeight;
    
    console.log('🎨 Image dimensions:', { imgWidth, imgHeight, aspectRatio });
    console.log('🎨 Container dimensions:', { containerWidth, containerHeight });
    console.log('🎨 Max dimensions:', { maxWidth, maxHeight });
    
    if (aspectRatio > maxWidth / maxHeight) {
      canvasWidth = maxWidth;
      canvasHeight = maxWidth / aspectRatio;
    } else {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * aspectRatio;
    }
    
    console.log('🎨 Final canvas dimensions:', { canvasWidth, canvasHeight });
    
    // Set all canvas dimensions
    [originalCanvas, processedCanvas, maskCanvas, previewCanvas].forEach(canvas => {
      if (canvas) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
      }
    });
  }
  
  function drawImages() {
    console.log('Drawing images to canvas...');
    
    // Draw original image on hidden canvas
    if (originalCtx && originalImg) {
      originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      originalCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
      console.log('Original image drawn');
    }
    
    // Draw processed image on hidden canvas
    if (processedCtx && processedImg) {
      processedCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      processedCtx.drawImage(processedImg, 0, 0, canvasWidth, canvasHeight);
      console.log('Processed image drawn');
    }
    
    // Update preview
    updatePreview();
  }
  
  function initializeMask() {
    // Initialize mask as transparent
    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  
  function setupEventListeners() {
    if (!previewCanvas) return;
    
    previewCanvas.addEventListener('mousedown', startDrawing);
    previewCanvas.addEventListener('mousemove', handleMouseMove);
    previewCanvas.addEventListener('mouseup', stopDrawing);
    previewCanvas.addEventListener('mouseout', handleMouseOut);
    previewCanvas.addEventListener('mouseenter', handleMouseEnter);
    
    // Touch events for mobile
    previewCanvas.addEventListener('touchstart', handleTouchStart);
    previewCanvas.addEventListener('touchmove', handleTouchMove);
    previewCanvas.addEventListener('touchend', stopDrawing);
  }
  
  function startDrawing(e: MouseEvent) {
    isDrawing = true;
    draw(e);
  }
  
  function handleMouseMove(e: MouseEvent) {
    updateMousePosition(e);
    if (isDrawing) {
      const rect = previewCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
      const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
      
      drawBrushStroke(x, y);
      updatePreview();
      hasChanges = true;
    }
  }
  
  function updateMousePosition(e: MouseEvent) {
    const rect = previewCanvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }
  
  function handleMouseEnter(e: MouseEvent) {
    showBrushCursor = true;
    updateMousePosition(e);
  }
  
  function handleMouseOut() {
    showBrushCursor = false;
    stopDrawing();
  }
  
  function draw(e: MouseEvent) {
    // Legacy function for compatibility
    handleMouseMove(e);
  }
  
  function stopDrawing() {
    isDrawing = false;
  }
  
  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  }
  
  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  }
  
  function drawBrushStroke(x: number, y: number) {
    maskCtx.globalCompositeOperation = currentTool === 'restore' ? 'source-over' : 'destination-out';
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    maskCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    maskCtx.fill();
  }
  
  function updatePreview() {
    if (!previewCtx || !processedCanvas || !maskCtx || !originalCtx) {
      console.log('Preview update skipped - missing contexts');
      return;
    }
    
    console.log('Updating preview...');
    
    // Clear preview canvas
    previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Choose base image based on preview toggle
    if (showOriginalPreview) {
      // Show original image as base
      previewCtx.drawImage(originalCanvas, 0, 0);
    } else {
      // Show processed image as base
      previewCtx.drawImage(processedCanvas, 0, 0);
    }
    
    // Apply mask to restore original pixels where needed
    previewCtx.globalCompositeOperation = 'source-over';
    
    try {
      // Get mask data
      const maskImageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const originalImageData = originalCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const previewImageData = previewCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      
      // Calculate alpha multiplier from transparency percentage
      const alphaMultiplier = transparency / 100;
      
      // Blend pixels based on mask and apply transparency
      for (let i = 0; i < maskImageData.data.length; i += 4) {
        const maskAlpha = maskImageData.data[i + 3] / 255;
        
        if (maskAlpha > 0) {
          // Restore original pixels
          previewImageData.data[i] = originalImageData.data[i];
          previewImageData.data[i + 1] = originalImageData.data[i + 1];
          previewImageData.data[i + 2] = originalImageData.data[i + 2];
          previewImageData.data[i + 3] = originalImageData.data[i + 3];
        }
        
        // Apply global transparency adjustment
        previewImageData.data[i + 3] = Math.round(previewImageData.data[i + 3] * alphaMultiplier);
      }
      
      previewCtx.putImageData(previewImageData, 0, 0);
      previewCtx.globalCompositeOperation = 'source-over';
      
      console.log('Preview updated successfully');
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  }
  
  function clearMask() {
    initializeMask();
    updatePreview();
    hasChanges = false;
  }
  
  function undoLastStroke() {
    // Simple implementation - could be enhanced with stroke history
    clearMask();
  }
  
  async function applyRefinements() {
    if (!hasChanges) {
      console.log('No changes made - using current processed image');
    }
    
    console.log('=== APPLYING REFINEMENTS ===');
    isProcessingRefinement = true;
    
    try {
      // Validate canvas state
      if (!previewCanvas) {
        throw new Error('Preview canvas not available');
      }
      
      console.log('Canvas dimensions:', previewCanvas.width, previewCanvas.height);
      console.log('Canvas context:', previewCtx);
      
      // Get the refined image data
      console.log('Converting canvas to data URL...');
      const refinedImageData = previewCanvas.toDataURL('image/png', 0.95);
      
      if (!refinedImageData || refinedImageData === 'data:,') {
        throw new Error('Canvas is empty or corrupted');
      }
      
      console.log('Refined image data length:', refinedImageData.length);
      console.log('Data URL preview:', refinedImageData.substring(0, 100) + '...');
      
      // Dispatch the refined image
      console.log('Dispatching refined event...');
      dispatch('refined', {
        refinedImage: refinedImageData,
        hasChanges: true
      });
      
      console.log('Refinement dispatch successful');
      
    } catch (error) {
      console.error('=== REFINEMENT ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      dispatch('error', { 
        message: `Failed to apply refinements: ${error.message}` 
      });
    } finally {
      isProcessingRefinement = false;
    }
  }
  
  function cancelRefinement() {
    dispatch('cancel');
  }
  
  function setBrushSize(size: number) {
    brushSize = Math.max(5, Math.min(100, size));
  }
</script>

{#if isVisible}
  <div class="refinement-overlay" on:click|self={cancelRefinement}>
    <div class="refinement-container">
      
      <!-- Header -->
      <div class="refinement-header">
        <h3 class="text-xl font-semibold text-magic-gradient">Refine Your Character</h3>
        <p class="text-sm text-dark-text-secondary mt-1">
          Use the brush tools to restore or remove parts as needed
        </p>
        
        <button 
          on:click={cancelRefinement}
          class="close-button"
          aria-label="Close refinement editor"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      
      <!-- Main Editor Layout -->
      <div class="editor-layout">
        
        <!-- Left Panel - Controls -->
        <div class="controls-panel">
          
          <!-- Tool Selection -->
          <div class="tool-section">
            <h4 class="section-title">Tools</h4>
            <div class="tool-buttons">
              <button
                class="tool-button {currentTool === 'restore' ? 'active' : ''}"
                on:click={() => currentTool = 'restore'}
                title="Brush tool - restore original pixels by painting over removed areas"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 6l3 3m-5 5l-3-3m3 3l-3-3m3 3l3-3"/>
                </svg>
                🖌️ Brush
              </button>
              
              <button
                class="tool-button {currentTool === 'erase' ? 'active' : ''}"
                on:click={() => currentTool = 'erase'}
                title="Eraser tool - remove unwanted parts by painting over them"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                🧹 Eraser
              </button>
            </div>
          </div>
          
          <!-- Brush Size -->
          <div class="brush-section">
            <h4 class="section-title">Brush Size</h4>
            <div class="brush-controls">
              <input
                type="range"
                min="5"
                max="100"
                bind:value={brushSize}
                class="brush-slider"
              />
              <span class="brush-size-display">{brushSize}px</span>
            </div>
          </div>
          
          <!-- Transparency Control -->
          <div class="transparency-section">
            <h4 class="section-title">Transparency</h4>
            <div class="transparency-controls">
              <input
                type="range"
                min="0"
                max="100"
                bind:value={transparency}
                class="transparency-slider"
              />
              <span class="transparency-display">{transparency}%</span>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="actions-section">
            <h4 class="section-title">Actions</h4>
            <div class="action-buttons">
              <button
                on:click={undoLastStroke}
                class="action-btn"
                title="Undo last stroke"
                disabled={!hasChanges}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
                Undo
              </button>
              
              <button
                on:click={clearMask}
                class="action-btn"
                title="Clear all changes"
                disabled={!hasChanges}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear
              </button>
            </div>
          </div>
          
          <!-- Preview Toggle -->
          <div class="preview-section">
            <h4 class="section-title">Preview</h4>
            <div class="preview-controls">
              <label class="preview-toggle">
                <input type="checkbox" bind:checked={showOriginalPreview} />
                <span>Show Original Background</span>
              </label>
            </div>
          </div>
          
        </div>
        
        <!-- Right Panel - Canvas Area -->
        <div class="canvas-area">
          
          <!-- Main Canvas Container -->
          <div class="main-canvas-container" bind:this={canvasContainer}>
            <!-- Hidden canvases for processing -->
            <canvas bind:this={originalCanvas} class="hidden" />
            <canvas bind:this={processedCanvas} class="hidden" />
            <canvas bind:this={maskCanvas} class="hidden" />
            
            <!-- Editing Canvas -->
            <div class="editing-canvas-wrapper">
              <h5 class="canvas-title">Edit Your Character</h5>
              <canvas 
                bind:this={previewCanvas}
                class="editing-canvas"
                style="cursor: none"
              />
              
              <!-- Dynamic Brush cursor -->
              {#if showBrushCursor}
                <div 
                  class="dynamic-brush-cursor {currentTool}"
                  style="
                    left: {mouseX}px; 
                    top: {mouseY}px; 
                    width: {brushSize}px; 
                    height: {brushSize}px;
                    opacity: {isDrawing ? 0.8 : 0.6}
                  "
                >
                  <!-- Inner dot for precision -->
                  <div class="cursor-center"></div>
                </div>
              {/if}
            </div>
          </div>
          
        </div>
        
      </div>
      
      <!-- Footer Actions -->
      <div class="refinement-footer">
        <button
          on:click={cancelRefinement}
          class="btn btn-outline border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
          disabled={isProcessingRefinement}
        >
          Cancel
        </button>
        
        <button
          on:click={applyRefinements}
          class="btn btn-magic"
          disabled={isProcessingRefinement}
        >
          {#if isProcessingRefinement}
            <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Applying...
          {:else}
            {hasChanges ? 'Apply Changes' : 'Use Current Image'}
          {/if}
        </button>
      </div>
      
    </div>
  </div>
{/if}

<style>
  .refinement-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 10px;
  }
  
  .refinement-container {
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 12px;
    max-width: 95vw;
    max-height: 95vh;
    width: fit-content;
    height: fit-content;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  }
  
  .editor-layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  
  .controls-panel {
    width: 280px;
    background: rgba(20, 20, 20, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
  }
  
  .canvas-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    min-width: 0;
  }
  
  .refinement-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
  }
  
  .close-button {
    position: absolute;
    top: 16px;
    right: 20px;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;
  }
  
  .close-button:hover {
    color: #fff;
  }
  
  /* Control Panel Styles */
  .section-title {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .tool-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .tool-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ccc;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }
  
  .tool-button:hover,
  .tool-button.active {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.4);
    color: #00ff88;
  }
  
  .brush-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .brush-slider {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  
  .brush-slider::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    background: #00ff88;
    border-radius: 50%;
    cursor: pointer;
    -webkit-appearance: none;
  }
  
  .brush-size-display {
    color: #00ff88;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
  }
  
  .transparency-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .transparency-slider {
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(0, 255, 136, 0.3));
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  
  .transparency-slider::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    background: #00ff88;
    border-radius: 50%;
    cursor: pointer;
    -webkit-appearance: none;
  }
  
  .transparency-display {
    color: #00ff88;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #ccc;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }
  
  .action-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .preview-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ccc;
    font-size: 14px;
    cursor: pointer;
  }
  
  .preview-toggle input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #00ff88;
  }
  
  
  /* Canvas Area Styles */
  .image-preview {
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .preview-title {
    color: #ccc;
    font-size: 12px;
    font-weight: 500;
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .preview-img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 4px;
    object-fit: contain;
  }
  
  .main-canvas-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 100%;
    padding: 20px;
    overflow: hidden;
  }
  
  .editing-canvas-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    height: 100%;
    justify-content: center;
  }
  
  .canvas-title {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .editing-canvas {
    border: 2px solid rgba(0, 255, 136, 0.3);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    background: #000;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .brush-cursor {
    position: absolute;
    border: 2px solid #00ff88;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 10;
    transition: opacity 0.2s;
  }
  
  .dynamic-brush-cursor {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 15;
    transition: opacity 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dynamic-brush-cursor.restore {
    border: 2px solid #00ff88;
    background: rgba(0, 255, 136, 0.1);
  }
  
  .dynamic-brush-cursor.erase {
    border: 2px solid #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }
  
  .cursor-center {
    width: 2px;
    height: 2px;
    background: currentColor;
    border-radius: 50%;
    opacity: 0.8;
  }
  
  .dynamic-brush-cursor.restore .cursor-center {
    background: #00ff88;
  }
  
  .dynamic-brush-cursor.erase .cursor-center {
    background: #ff4444;
  }
  
  .refinement-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .hidden {
    display: none;
  }
  
  .debug-info {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 12px;
    color: #ccc;
  }
  
  .debug-info p {
    margin: 2px 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .editor-layout {
      flex-direction: column;
    }
    
    .controls-panel {
      width: 100%;
      flex-direction: row;
      gap: 16px;
      overflow-x: auto;
      padding: 16px;
    }
    
    .tool-section,
    .brush-section,
    .actions-section,
    .preview-section {
      min-width: 200px;
    }
    
    .canvas-area {
      padding: 16px;
    }
    
    .refinement-container {
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }
  }
</style>