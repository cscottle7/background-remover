<!--
  Image Cropper Component
  Interactive crop rectangle with handles for pre-processing images
  before background removal
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let imageUrl: string;
  export let isVisible: boolean = false;
  export let maxWidth: number = 800;
  export let maxHeight: number = 600;
  
  const dispatch = createEventDispatcher();
  
  // Canvas and container references
  let canvasContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Image and crop state
  let image: HTMLImageElement;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let imageScale = 1;
  let imageOffsetX = 0;
  let imageOffsetY = 0;
  
  // Crop rectangle state
  let cropRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 200
  };
  
  // Interaction state
  let isDragging = false;
  let isResizing = false;
  let dragStart = { x: 0, y: 0 };
  let resizeHandle = '';
  let aspectRatioLocked = false;
  let cropAspectRatio = 1;
  
  // Handle size
  const handleSize = 8;
  
  onMount(() => {
    if (browser && isVisible && imageUrl) {
      initializeCropper();
    }
  });
  
  $: if (browser && isVisible && imageUrl) {
    initializeCropper();
  }
  
  async function initializeCropper() {
    if (!canvas || !canvasContainer) return;
    
    try {
      // Get canvas context
      ctx = canvas.getContext('2d')!;
      
      // Load image
      await loadImage();
      
      // Setup canvas dimensions
      setupCanvas();
      
      // Setup event listeners
      setupEventListeners();
      
      // Initial draw
      draw();
      
    } catch (error) {
      console.error('Cropper initialization failed:', error);
      dispatch('error', { message: 'Failed to initialize image cropper' });
    }
  }
  
  function loadImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      image = new Image();
      image.crossOrigin = 'anonymous';
      
      image.onload = () => {
        console.log('Image loaded:', image.width, image.height);
        resolve();
      };
      
      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      image.src = imageUrl;
    });
  }
  
  function setupCanvas() {
    const containerWidth = canvasContainer.clientWidth || maxWidth;
    const containerHeight = canvasContainer.clientHeight || maxHeight;
    
    // Calculate scale to fit image in container
    const scaleX = Math.min(containerWidth - 40, maxWidth) / image.width;
    const scaleY = Math.min(containerHeight - 40, maxHeight) / image.height;
    imageScale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    // Calculate canvas dimensions
    canvasWidth = image.width * imageScale;
    canvasHeight = image.height * imageScale;
    
    // Center image in container
    imageOffsetX = 0;
    imageOffsetY = 0;
    
    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    // Initialize crop rectangle to center of image
    cropRect = {
      x: canvasWidth * 0.25,
      y: canvasHeight * 0.25,
      width: canvasWidth * 0.5,
      height: canvasHeight * 0.5
    };
    
    cropAspectRatio = cropRect.width / cropRect.height;
  }
  
  function setupEventListeners() {
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleMouseUp);
  }
  
  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on resize handle
    const handle = getResizeHandle(x, y);
    if (handle) {
      isResizing = true;
      resizeHandle = handle;
      dragStart = { x, y };
      canvas.style.cursor = getHandleCursor(handle);
      return;
    }
    
    // Check if clicking inside crop rectangle
    if (isInsideCropRect(x, y)) {
      isDragging = true;
      dragStart = { x: x - cropRect.x, y: y - cropRect.y };
      canvas.style.cursor = 'move';
    }
  }
  
  function handleMouseMove(e: MouseEvent) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isResizing) {
      handleResize(x, y);
      draw();
    } else if (isDragging) {
      handleDrag(x, y);
      draw();
    } else {
      // Update cursor based on position
      const handle = getResizeHandle(x, y);
      if (handle) {
        canvas.style.cursor = getHandleCursor(handle);
      } else if (isInsideCropRect(x, y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  }
  
  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
    resizeHandle = '';
    canvas.style.cursor = 'default';
  }
  
  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  }
  
  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  }
  
  function isInsideCropRect(x: number, y: number): boolean {
    return x >= cropRect.x && x <= cropRect.x + cropRect.width &&
           y >= cropRect.y && y <= cropRect.y + cropRect.height;
  }
  
  function getResizeHandle(x: number, y: number): string {
    const handles = [
      { name: 'nw', x: cropRect.x, y: cropRect.y },
      { name: 'ne', x: cropRect.x + cropRect.width, y: cropRect.y },
      { name: 'sw', x: cropRect.x, y: cropRect.y + cropRect.height },
      { name: 'se', x: cropRect.x + cropRect.width, y: cropRect.y + cropRect.height },
      { name: 'n', x: cropRect.x + cropRect.width / 2, y: cropRect.y },
      { name: 's', x: cropRect.x + cropRect.width / 2, y: cropRect.y + cropRect.height },
      { name: 'w', x: cropRect.x, y: cropRect.y + cropRect.height / 2 },
      { name: 'e', x: cropRect.x + cropRect.width, y: cropRect.y + cropRect.height / 2 }
    ];
    
    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
      );
      if (distance <= handleSize) {
        return handle.name;
      }
    }
    
    return '';
  }
  
  function getHandleCursor(handle: string): string {
    const cursors: Record<string, string> = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'sw': 'sw-resize',
      'se': 'se-resize',
      'n': 'n-resize',
      's': 's-resize',
      'w': 'w-resize',
      'e': 'e-resize'
    };
    return cursors[handle] || 'default';
  }
  
  function handleDrag(x: number, y: number) {
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    // Constrain to canvas bounds
    cropRect.x = Math.max(0, Math.min(newX, canvasWidth - cropRect.width));
    cropRect.y = Math.max(0, Math.min(newY, canvasHeight - cropRect.height));
  }
  
  function handleResize(x: number, y: number) {
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    let newRect = { ...cropRect };
    
    // Handle different resize directions
    switch (resizeHandle) {
      case 'nw':
        newRect.x += deltaX;
        newRect.y += deltaY;
        newRect.width -= deltaX;
        newRect.height -= deltaY;
        break;
      case 'ne':
        newRect.y += deltaY;
        newRect.width += deltaX;
        newRect.height -= deltaY;
        break;
      case 'sw':
        newRect.x += deltaX;
        newRect.width -= deltaX;
        newRect.height += deltaY;
        break;
      case 'se':
        newRect.width += deltaX;
        newRect.height += deltaY;
        break;
      case 'n':
        newRect.y += deltaY;
        newRect.height -= deltaY;
        break;
      case 's':
        newRect.height += deltaY;
        break;
      case 'w':
        newRect.x += deltaX;
        newRect.width -= deltaX;
        break;
      case 'e':
        newRect.width += deltaX;
        break;
    }
    
    // Maintain aspect ratio if locked
    if (aspectRatioLocked) {
      if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
        newRect.height = newRect.width / cropAspectRatio;
      } else if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
        newRect.width = newRect.height * cropAspectRatio;
      } else {
        // Corner handles - maintain aspect ratio based on width change
        newRect.height = newRect.width / cropAspectRatio;
      }
    }
    
    // Constrain to minimum size
    const minSize = 20;
    newRect.width = Math.max(minSize, newRect.width);
    newRect.height = Math.max(minSize, newRect.height);
    
    // Constrain to canvas bounds
    newRect.x = Math.max(0, Math.min(newRect.x, canvasWidth - newRect.width));
    newRect.y = Math.max(0, Math.min(newRect.y, canvasHeight - newRect.height));
    newRect.width = Math.min(newRect.width, canvasWidth - newRect.x);
    newRect.height = Math.min(newRect.height, canvasHeight - newRect.y);
    
    cropRect = newRect;
    dragStart = { x, y };
  }
  
  function draw() {
    if (!ctx || !image) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw image
    ctx.drawImage(image, imageOffsetX, imageOffsetY, canvasWidth, canvasHeight);
    
    // Draw crop overlay (darken outside crop area)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    // Top
    ctx.fillRect(0, 0, canvasWidth, cropRect.y);
    // Bottom
    ctx.fillRect(0, cropRect.y + cropRect.height, canvasWidth, canvasHeight - cropRect.y - cropRect.height);
    // Left
    ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height);
    // Right
    ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, canvasWidth - cropRect.x - cropRect.width, cropRect.height);
    
    // Draw crop rectangle border
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    
    // Draw resize handles
    drawResizeHandles();
  }
  
  function drawResizeHandles() {
    const handles = [
      { x: cropRect.x, y: cropRect.y },
      { x: cropRect.x + cropRect.width, y: cropRect.y },
      { x: cropRect.x, y: cropRect.y + cropRect.height },
      { x: cropRect.x + cropRect.width, y: cropRect.y + cropRect.height },
      { x: cropRect.x + cropRect.width / 2, y: cropRect.y },
      { x: cropRect.x + cropRect.width / 2, y: cropRect.y + cropRect.height },
      { x: cropRect.x, y: cropRect.y + cropRect.height / 2 },
      { x: cropRect.x + cropRect.width, y: cropRect.y + cropRect.height / 2 }
    ];
    
    ctx.fillStyle = '#00ff88';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  }
  
  function resetCrop() {
    cropRect = {
      x: canvasWidth * 0.25,
      y: canvasHeight * 0.25,
      width: canvasWidth * 0.5,
      height: canvasHeight * 0.5
    };
    cropAspectRatio = cropRect.width / cropRect.height;
    draw();
  }
  
  function setAspectRatio(ratio: number) {
    cropAspectRatio = ratio;
    aspectRatioLocked = true;
    
    // Adjust current crop to match aspect ratio
    const centerX = cropRect.x + cropRect.width / 2;
    const centerY = cropRect.y + cropRect.height / 2;
    
    if (cropRect.width / cropRect.height > ratio) {
      // Too wide, adjust width
      cropRect.width = cropRect.height * ratio;
    } else {
      // Too tall, adjust height
      cropRect.height = cropRect.width / ratio;
    }
    
    // Re-center
    cropRect.x = centerX - cropRect.width / 2;
    cropRect.y = centerY - cropRect.height / 2;
    
    // Constrain to bounds
    cropRect.x = Math.max(0, Math.min(cropRect.x, canvasWidth - cropRect.width));
    cropRect.y = Math.max(0, Math.min(cropRect.y, canvasHeight - cropRect.height));
    
    draw();
  }
  
  function unlockAspectRatio() {
    aspectRatioLocked = false;
  }
  
  async function applyCrop() {
    if (!image || !canvas) return;
    
    try {
      // Create a new canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d')!;
      
      // Calculate crop coordinates in original image space
      const scaleX = image.width / canvasWidth;
      const scaleY = image.height / canvasHeight;
      
      const cropX = cropRect.x * scaleX;
      const cropY = cropRect.y * scaleY;
      const cropWidth = cropRect.width * scaleX;
      const cropHeight = cropRect.height * scaleY;
      
      // Set crop canvas size
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      
      // Draw cropped image
      cropCtx.drawImage(
        image, 
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      
      // Convert to blob
      const blob = await canvasToBlob(cropCanvas);
      
      // Create File object
      const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
      
      // Dispatch cropped image
      dispatch('cropped', { 
        file,
        cropData: {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
          originalWidth: image.width,
          originalHeight: image.height
        }
      });
      
    } catch (error) {
      console.error('Crop operation failed:', error);
      dispatch('error', { message: 'Failed to apply crop' });
    }
  }
  
  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png', 0.95);
    });
  }
  
  function cancel() {
    dispatch('cancel');
  }
</script>

{#if isVisible}
  <div class="cropper-overlay" on:click|self={cancel}>
    <div class="cropper-container">
      
      <!-- Header -->
      <div class="cropper-header">
        <h3 class="text-xl font-semibold text-magic-gradient">Crop Image</h3>
        <p class="text-sm text-dark-text-secondary mt-1">
          Adjust the crop area and click Apply to crop before processing
        </p>
        
        <button 
          on:click={cancel}
          class="close-button"
          aria-label="Close image cropper"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Main Layout -->
      <div class="cropper-layout">
        
        <!-- Controls Panel -->
        <div class="controls-panel">
          
          <!-- Aspect Ratio Controls -->
          <div class="control-section">
            <h4 class="section-title">Aspect Ratio</h4>
            <div class="aspect-buttons">
              <button
                on:click={unlockAspectRatio}
                class="aspect-btn {!aspectRatioLocked ? 'active' : ''}"
              >
                Free
              </button>
              <button
                on:click={() => setAspectRatio(1)}
                class="aspect-btn {aspectRatioLocked && Math.abs(cropAspectRatio - 1) < 0.01 ? 'active' : ''}"
              >
                1:1
              </button>
              <button
                on:click={() => setAspectRatio(4/3)}
                class="aspect-btn {aspectRatioLocked && Math.abs(cropAspectRatio - 4/3) < 0.01 ? 'active' : ''}"
              >
                4:3
              </button>
              <button
                on:click={() => setAspectRatio(16/9)}
                class="aspect-btn {aspectRatioLocked && Math.abs(cropAspectRatio - 16/9) < 0.01 ? 'active' : ''}"
              >
                16:9
              </button>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="control-section">
            <h4 class="section-title">Actions</h4>
            <button
              on:click={resetCrop}
              class="action-btn"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Reset Crop
            </button>
          </div>
          
        </div>
        
        <!-- Canvas Area -->
        <div class="canvas-area">
          <div class="canvas-container" bind:this={canvasContainer}>
            <canvas 
              bind:this={canvas}
              class="crop-canvas"
            />
          </div>
        </div>
        
      </div>
      
      <!-- Footer Actions -->
      <div class="cropper-footer">
        <button
          on:click={cancel}
          class="btn btn-outline border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
        >
          Cancel
        </button>
        
        <button
          on:click={applyCrop}
          class="btn btn-magic"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16H3m0 0l4-4m-4 4l4 4m11-4h-4m0 0l-4-4m4 4l-4 4"/>
          </svg>
          Apply Crop
        </button>
      </div>
      
    </div>
  </div>
{/if}

<style>
  .cropper-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .cropper-container {
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 12px;
    max-width: 95vw;
    max-height: 95vh;
    width: 1000px;
    height: 700px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  }
  
  .cropper-header {
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
  
  .cropper-layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  
  .controls-panel {
    width: 250px;
    background: rgba(20, 20, 20, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: hidden;
  }
  
  .canvas-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  
  .crop-canvas {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .section-title {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .aspect-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .aspect-btn {
    padding: 8px 12px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #ccc;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .aspect-btn:hover,
  .aspect-btn.active {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.4);
    color: #00ff88;
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
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .cropper-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .cropper-container {
      width: 100%;
      height: 100%;
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }
    
    .cropper-layout {
      flex-direction: column;
    }
    
    .controls-panel {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
      padding: 16px;
    }
    
    .control-section {
      min-width: 200px;
    }
  }
</style>