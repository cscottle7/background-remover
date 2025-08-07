<!--
  RefineCanvas - Lightweight UI component for image refinement
  Integrates ImageCanvasEngine, ToolOperations, and CanvasRenderer
  Mobile-first responsive design with touch support
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { ImageCanvasEngine, type CanvasLayers } from '$lib/services/ImageCanvasEngine';
  import { ToolOperations, ToolUtils, type ToolType, type PointerEvent } from '$lib/services/ToolOperations';
  import { CanvasRenderer, type RenderOptions } from '$lib/services/CanvasRenderer';
  
  // Props
  export let originalImage: string | null;
  export let processedImage: string | null;
  export let isProcessing: boolean = false;
  export let currentTool: ToolType = 'restore';
  export let brushSize: number = 20;
  export let showComparison: boolean = false;
  export let showOriginal: boolean = false;
  export let toolboxWidth: number = 0; // Width of toolbox for desktop scaling

  const dispatch = createEventDispatcher();
  
  // Canvas elements
  let canvasContainer: HTMLDivElement;
  let originalCanvas: HTMLCanvasElement;
  let processedCanvas: HTMLCanvasElement;
  let maskCanvas: HTMLCanvasElement;
  let previewCanvas: HTMLCanvasElement;
  let displayCanvas: HTMLCanvasElement;
  
  // Engine instances
  let canvasEngine: ImageCanvasEngine | null = null;
  let toolOperations: ToolOperations | null = null;
  let renderer: CanvasRenderer | null = null;
  
  // State
  let isInitialized = false;
  let isDrawing = false;
  let containerWidth = 0;
  let containerHeight = 0;
  let lastWidth = 0;
  let lastHeight = 0;
  
  // Throttling for performance
  let containerUpdateThrottle: ReturnType<typeof setTimeout>;

  // Reactive statements
  $: if (canvasEngine && toolOperations && currentTool) {
    toolOperations.setTool(currentTool);
  }
  
  $: if (canvasEngine && toolOperations && brushSize) {
    toolOperations.setBrushSize(brushSize);
  }
  
  $: if (renderer && (showComparison || showOriginal)) {
    renderer.render({ showComparison, showOriginal });
  }

  onMount(async () => {
    if (!browser) return;
    
    try {
      await initializeCanvas();
      setupEventListeners();
      console.log('✅ RefineCanvas mounted and initialized');
    } catch (error) {
      console.error('❌ RefineCanvas initialization failed:', error);
      dispatch('error', { message: 'Failed to initialize canvas' });
    }
  });

  onDestroy(() => {
    cleanup();
  });

  /**
   * Initialize the canvas system
   */
  async function initializeCanvas(): Promise<void> {
    if (!originalImage || !processedImage) {
      throw new Error('Missing image data');
    }

    // Update container dimensions
    updateContainerDimensions();
    
    // Create canvas layers
    const layers: CanvasLayers = {
      original: originalCanvas,
      processed: processedCanvas,
      mask: maskCanvas,
      preview: previewCanvas
    };
    
    // Initialize engines
    canvasEngine = new ImageCanvasEngine(layers);
    await canvasEngine.initialize(originalImage, processedImage);
    
    toolOperations = new ToolOperations(canvasEngine);
    toolOperations.setTool(currentTool);
    toolOperations.setBrushSize(brushSize);
    
    // Initialize renderer
    renderer = new CanvasRenderer(canvasContainer);
    renderer.initialize({
      original: originalCanvas,
      processed: processedCanvas,
      preview: previewCanvas,
      display: displayCanvas
    });
    
    // Set initial viewport with toolbox awareness
    renderer.setViewport(containerWidth, containerHeight);
    renderer.fitToViewport({ toolboxWidth });
    
    // Force initial render with improved fallback detection
    setTimeout(() => {
      console.log('🎬 Starting initial render sequence...');
      renderer?.render({ showOriginal: false, showComparison: false });
      
      // Smart fallback detection - check center area for content
      setTimeout(() => {
        if (renderer && displayCanvas) {
          const ctx = displayCanvas.getContext('2d');
          
          // Check center area for content (more reliable than corner)
          const centerX = Math.floor(containerWidth / 2) - 25;
          const centerY = Math.floor(containerHeight / 2) - 25;
          const imageData = ctx?.getImageData(centerX, centerY, 50, 50);
          let hasContent = false;
          
          if (imageData) {
            for (let i = 3; i < imageData.data.length; i += 4) {
              if (imageData.data[i] > 0) {
                hasContent = true;
                break;
              }
            }
          }
          
          if (!hasContent) {
            console.log('🚨 Center area empty, using emergency render...');
            renderer.forceRenderProcessed();
          } else {
            console.log('✅ Display canvas has content in center area');
          }
        }
      }, 100);
    }, 100);
    
    isInitialized = true;
    
    // Save initial state for undo functionality
    setTimeout(() => {
      toolOperations?.saveInitialState?.();
      // Dispatch initial history state
      dispatch('historyChanged', toolOperations?.getHistoryState());
    }, 100);
    
    dispatch('initialized');
  }

  /**
   * Setup event listeners for interaction
   */
  function setupEventListeners(): void {
    if (!displayCanvas) return;

    // Mouse events
    displayCanvas.addEventListener('mousedown', handleMouseDown);
    displayCanvas.addEventListener('mousemove', handleMouseMove);
    displayCanvas.addEventListener('mouseup', handleMouseUp);
    displayCanvas.addEventListener('mouseleave', handleMouseUp);

    // Touch events
    displayCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    displayCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    displayCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Prevent context menu
    displayCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window resize
    window.addEventListener('resize', handleResize);
  }

  /**
   * Handle mouse down
   */
  function handleMouseDown(event: MouseEvent): void {
    if (!toolOperations || !renderer) return;
    
    event.preventDefault();
    isDrawing = true;
    
    const coords = ToolUtils.getCanvasCoordinates(event, displayCanvas);
    const imageCoords = renderer.screenToImage(coords.x, coords.y);
    
    const pointerEvent: PointerEvent = {
      type: 'down',
      point: imageCoords,
      pointerType: 'mouse'
    };
    
    toolOperations.handlePointerDown(pointerEvent);
    renderer?.render();
  }

  /**
   * Handle mouse move
   */
  function handleMouseMove(event: MouseEvent): void {
    if (!isDrawing || !toolOperations || !renderer) return;
    
    event.preventDefault();
    
    const coords = ToolUtils.getCanvasCoordinates(event, displayCanvas);
    const imageCoords = renderer.screenToImage(coords.x, coords.y);
    
    const pointerEvent: PointerEvent = {
      type: 'move',
      point: imageCoords,
      pointerType: 'mouse'
    };
    
    toolOperations.handlePointerMove(pointerEvent);
    renderer?.render();
  }

  /**
   * Handle mouse up
   */
  function handleMouseUp(event: MouseEvent): void {
    if (!isDrawing || !toolOperations) return;
    
    isDrawing = false;
    
    const coords = ToolUtils.getCanvasCoordinates(event, displayCanvas);
    const imageCoords = renderer?.screenToImage(coords.x, coords.y) || coords;
    
    const pointerEvent: PointerEvent = {
      type: 'up',
      point: imageCoords,
      pointerType: 'mouse'
    };
    
    toolOperations.handlePointerUp(pointerEvent);
  }

  /**
   * Handle touch start
   */
  function handleTouchStart(event: TouchEvent): void {
    if (!toolOperations || !renderer || event.touches.length !== 1) return;
    
    ToolUtils.preventTouchDefaults(event);
    isDrawing = true;
    
    const touch = event.touches[0];
    const coords = ToolUtils.getCanvasCoordinates(touch, displayCanvas);
    const imageCoords = renderer.screenToImage(coords.x, coords.y);
    
    toolOperations.handleTouchEvent({
      type: 'start',
      point: imageCoords,
      pressure: ToolUtils.getTouchPressure(touch)
    });
    
    renderer.render();
  }

  /**
   * Handle touch move
   */
  function handleTouchMove(event: TouchEvent): void {
    if (!isDrawing || !toolOperations || !renderer || event.touches.length !== 1) return;
    
    ToolUtils.preventTouchDefaults(event);
    
    const touch = event.touches[0];
    const coords = ToolUtils.getCanvasCoordinates(touch, displayCanvas);
    const imageCoords = renderer.screenToImage(coords.x, coords.y);
    
    toolOperations.handleTouchEvent({
      type: 'move',
      point: imageCoords,
      pressure: ToolUtils.getTouchPressure(touch)
    });
    
    renderer.render();
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd(event: TouchEvent): void {
    if (!isDrawing || !toolOperations) return;
    
    ToolUtils.preventTouchDefaults(event);
    isDrawing = false;
    
    toolOperations.handleTouchEvent({
      type: 'end',
      point: { x: 0, y: 0 } // Point not needed for end event
    });
  }

  /**
   * Handle window resize with throttling
   */
  function handleResize(): void {
    updateContainerDimensions();
    if (renderer) {
      renderer.setViewport(containerWidth, containerHeight);
      renderer.refreshDisplayContext(); // Refresh context after canvas resize
      renderer.fitToViewport({ toolboxWidth }); // Re-fit with toolbox awareness
      renderer.render();
      
      console.log('🔄 Window resized, refitted viewport:', { containerWidth, containerHeight, toolboxWidth });
      
      // Add fallback check after resize to ensure image is visible
      setTimeout(() => {
        if (displayCanvas && renderer) {
          const ctx = displayCanvas.getContext('2d');
          const centerX = Math.floor(containerWidth / 2) - 25;
          const centerY = Math.floor(containerHeight / 2) - 25;
          const imageData = ctx?.getImageData(Math.max(0, centerX), Math.max(0, centerY), 50, 50);
          let hasContent = false;
          
          if (imageData) {
            for (let i = 3; i < imageData.data.length; i += 4) {
              if (imageData.data[i] > 0) {
                hasContent = true;
                break;
              }
            }
          }
          
          if (!hasContent) {
            console.log('🚨 Image disappeared after resize, using emergency render...');
            renderer.forceRenderProcessed();
          } else {
            console.log('✅ Image visible after resize');
          }
        }
      }, 200);
    }
  }

  /**
   * Update container dimensions with throttling
   */
  function updateContainerDimensions(): void {
    clearTimeout(containerUpdateThrottle);
    containerUpdateThrottle = setTimeout(() => {
      if (!canvasContainer) return;
      
      const rect = canvasContainer.getBoundingClientRect();
      
      // Get actual available space (container dimensions) - be more aggressive
      const newWidth = Math.max(rect.width || 800, 400); // Higher minimum for editing
      const newHeight = Math.max(rect.height || 600, 300); // Higher minimum for editing
      
      // Only update if dimensions actually changed
      if (newWidth !== lastWidth || newHeight !== lastHeight) {
        lastWidth = newWidth;
        lastHeight = newHeight;
        containerWidth = newWidth;
        containerHeight = newHeight;
        
        // Check if we're in a grid layout and need to account for toolbox
        const parentElement = canvasContainer.parentElement;
        if (parentElement) {
          const parentRect = parentElement.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(parentElement);
          
          // If parent has grid layout, our actual space might be constrained
          if (computedStyle.display === 'grid') {
            console.log('🔍 Grid layout detected, using actual container bounds');
            // Use the actual bounding rect which already accounts for grid constraints
          }
        }
        
        console.log('📏 Container dimensions updated:', { 
          containerWidth, 
          containerHeight,
          toolboxWidth,
          rect: { width: rect.width, height: rect.height },
          actualSpace: `${rect.width}x${rect.height}`
        });
        
        // Update display canvas to match container constraints
        if (displayCanvas && renderer) {
          displayCanvas.style.maxWidth = '100%';
          displayCanvas.style.maxHeight = '100%';
          displayCanvas.style.objectFit = 'contain';
          
          // Update renderer viewport if renderer exists
          renderer.setViewport(newWidth, newHeight);
        }
      }
    }, 50);
  }

  /**
   * Export current canvas as data URL
   */
  export function exportCanvas(): string | null {
    return canvasEngine?.exportPreview() || null;
  }

  /**
   * Export processed image as data URL
   */
  export function exportProcessedImage(): string | null {
    return renderer?.exportProcessedImage() || null;
  }

  /**
   * Set view mode
   */
  export function setViewMode(mode: 'processed' | 'original' | 'comparison'): void {
    renderer?.setViewMode(mode);
  }

  /**
   * Undo last operation
   */
  export function undo(): boolean {
    const result = toolOperations?.undo() || false;
    if (result) {
      renderer?.render();
      // Dispatch event to update undo/redo state
      dispatch('historyChanged', toolOperations?.getHistoryState());
    }
    return result;
  }

  /**
   * Redo last operation
   */
  export function redo(): boolean {
    const result = toolOperations?.redo() || false;
    if (result) {
      renderer?.render();
      // Dispatch event to update undo/redo state
      dispatch('historyChanged', toolOperations?.getHistoryState());
    }
    return result;
  }

  /**
   * Get current undo/redo state
   */
  export function getHistoryState(): { canUndo: boolean; canRedo: boolean } {
    return toolOperations?.getHistoryState() || { canUndo: false, canRedo: false };
  }

  /**
   * Reset to original processed image
   */
  export function reset(): void {
    canvasEngine?.updatePreview();
    toolOperations?.clearHistory();
    renderer?.render();
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    renderer?.destroy();
    toolOperations?.clearHistory();
    
    if (displayCanvas) {
      displayCanvas.removeEventListener('mousedown', handleMouseDown);
      displayCanvas.removeEventListener('mousemove', handleMouseMove);
      displayCanvas.removeEventListener('mouseup', handleMouseUp);
      displayCanvas.removeEventListener('touchstart', handleTouchStart);
      displayCanvas.removeEventListener('touchmove', handleTouchMove);
      displayCanvas.removeEventListener('touchend', handleTouchEnd);
    }
    
    window.removeEventListener('resize', handleResize);
    
    console.log('🧹 RefineCanvas cleaned up');
  }
</script>

<div 
  bind:this={canvasContainer}
  class="canvas-container"
  class:initialized={isInitialized}
  class:processing={isProcessing}
>
  <!-- Hidden working canvases -->
  <canvas 
    bind:this={originalCanvas}
    class="canvas-layer canvas-hidden"
    aria-hidden="true"
  ></canvas>
  
  <canvas 
    bind:this={processedCanvas}
    class="canvas-layer canvas-hidden"
    aria-hidden="true"
  ></canvas>
  
  <canvas 
    bind:this={maskCanvas}
    class="canvas-layer canvas-hidden"
    aria-hidden="true"
  ></canvas>
  
  <canvas 
    bind:this={previewCanvas}
    class="canvas-layer canvas-hidden"
    aria-hidden="true"
  ></canvas>

  <!-- Main display canvas -->
  <canvas 
    bind:this={displayCanvas}
    class="canvas-layer canvas-interactive"
    class:drawing={isDrawing}
    style="cursor: {isDrawing ? 'none' : 'crosshair'}"
  ></canvas>

  <!-- Loading overlay -->
  {#if !isInitialized && !isProcessing}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Initializing canvas...</p>
    </div>
  {/if}

  <!-- Processing overlay -->
  {#if isProcessing}
    <div class="processing-overlay">
      <div class="processing-spinner"></div>
      <p>Processing...</p>
    </div>
  {/if}
</div>

<style>
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 500px; /* Increased minimum height for better editing */
    overflow: hidden;
    background: #0f172a; /* Dark theme background */
    border-radius: 8px;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #334155; /* Dark theme border */
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .canvas-hidden {
    display: none;
  }

  .canvas-interactive {
    pointer-events: auto;
    touch-action: none;
    z-index: 10;
    display: block;
    position: relative;
    max-width: calc(100% - 20px); /* Account for container padding */
    max-height: calc(100% - 20px); /* Account for container padding */
    width: auto; /* Let canvas determine its own width based on aspect ratio */
    height: auto; /* Let canvas determine its own height based on aspect ratio */
    object-fit: contain;
    border: 2px solid #3b82f6; /* Brighter border for better visibility */
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* Add depth */
  }

  .canvas-interactive.drawing {
    cursor: none !important;
  }

  .loading-overlay,
  .processing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(248, 249, 250, 0.9);
    backdrop-filter: blur(4px);
    z-index: 20;
  }

  .loading-spinner,
  .processing-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e9ecef;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  .loading-overlay p,
  .processing-overlay p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
    font-weight: 500;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .canvas-container {
      border-radius: 0;
    }
    
    .canvas-interactive {
      touch-action: none;
    }
  }

  /* High DPI display optimizations */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .canvas-layer {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  }
</style>