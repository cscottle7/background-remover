/**
 * CanvasRenderer - Optimized rendering engine for smooth performance
 * Handles efficient canvas operations, viewport management, and responsive scaling
 */

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export type ViewMode = 'processed' | 'original' | 'comparison';

export interface RenderOptions {
  showOriginal?: boolean;
  showComparison?: boolean;
  comparisonSplit?: number; // 0-1, where to split comparison
  quality?: 'low' | 'medium' | 'high';
}

export interface ViewportConstraints {
  toolboxWidth?: number;
  reservedHeight?: number;
}

export class CanvasRenderer {
  private container: HTMLElement;
  private canvases: {
    original: HTMLCanvasElement;
    processed: HTMLCanvasElement;
    preview: HTMLCanvasElement;
    display: HTMLCanvasElement;
  };
  private contexts: {
    original: CanvasRenderingContext2D;
    processed: CanvasRenderingContext2D;
    preview: CanvasRenderingContext2D;
    display: CanvasRenderingContext2D;
  };
  
  private viewport: ViewportState;
  private animationFrameId: number | null = null;
  private isDirty = false;
  private isRendering = false;
  private viewMode: ViewMode = 'processed';
  
  // Performance optimization
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenContext: OffscreenCanvasRenderingContext2D | null = null;
  private renderQueue: (() => void)[] = [];
  
  // Advanced performance optimizations
  private lastViewportUpdate = 0;
  private readonly VIEWPORT_THROTTLE_MS = 16; // 60fps throttling
  private renderScheduled = false;
  private lastRenderTime = 0;
  private readonly MIN_RENDER_INTERVAL = 16; // 60fps maximum
  private frameDropCount = 0;
  
  // Memory management
  private imageDataCache = new Map<string, ImageData>();
  private readonly MAX_CACHE_SIZE = 10;

  constructor(container: HTMLElement) {
    this.container = container;
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      width: 0,
      height: 0
    };
    
    this.setupCanvases();
    this.setupOffscreenCanvas();
  }

  /**
   * Initialize renderer with canvas elements
   */
  initialize(canvases: {
    original: HTMLCanvasElement;
    processed: HTMLCanvasElement;
    preview: HTMLCanvasElement;
    display: HTMLCanvasElement;
  }): void {
    this.canvases = canvases;
    this.contexts = {
      original: canvases.original.getContext('2d')!,
      processed: canvases.processed.getContext('2d')!,
      preview: canvases.preview.getContext('2d')!,
      display: canvases.display.getContext('2d')!
    };

    // Optimize contexts for performance
    Object.values(this.contexts).forEach(ctx => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // Avoid frequent getImageData warnings
      if ('willReadFrequently' in ctx) {
        (ctx as any).willReadFrequently = true;
      }
    });

    console.log('🎨 Canvas renderer initialized');
  }

  /**
   * Set viewport dimensions and update scaling with throttling
   */
  setViewport(width: number, height: number): void {
    const now = Date.now();
    if (now - this.lastViewportUpdate < this.VIEWPORT_THROTTLE_MS) {
      return; // Skip update if too recent
    }
    
    // Only update if dimensions actually changed
    if (this.viewport.width === width && this.viewport.height === height) {
      return;
    }
    
    this.lastViewportUpdate = now;
    this.viewport.width = width;
    this.viewport.height = height;
    
    this.updateCanvasSizes();
    this.markDirty();
    
    console.log('📐 Viewport updated:', this.viewport);
  }
  
  /**
   * Force refresh of display context (for resize issues)
   */
  refreshDisplayContext(): void {
    if (this.canvases.display) {
      // Get fresh context after any canvas manipulation
      this.contexts.display = this.canvases.display.getContext('2d')!;
      this.contexts.display.imageSmoothingEnabled = true;
      this.contexts.display.imageSmoothingQuality = 'high';
      if ('willReadFrequently' in this.contexts.display) {
        (this.contexts.display as any).willReadFrequently = true;
      }
      console.log('🔄 Display context refreshed');
    }
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.viewport.zoom = Math.max(0.1, Math.min(5.0, zoom));
    this.markDirty();
    
    console.log('🔍 Zoom set to:', this.viewport.zoom);
  }

  /**
   * Pan viewport
   */
  pan(deltaX: number, deltaY: number): void {
    this.viewport.x += deltaX;
    this.viewport.y += deltaY;
    this.markDirty();
  }

  /**
   * Center viewport on image
   */
  centerImage(): void {
    if (!this.canvases.processed) return;
    
    const imageWidth = this.canvases.processed.width;
    const imageHeight = this.canvases.processed.height;
    
    const scaledWidth = imageWidth * this.viewport.zoom;
    const scaledHeight = imageHeight * this.viewport.zoom;
    
    this.viewport.x = (this.viewport.width - scaledWidth) / 2;
    this.viewport.y = (this.viewport.height - scaledHeight) / 2;
    
    console.log('📍 Centered image (FIXED):', {
      scaledSize: `${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`,
      position: `${this.viewport.x.toFixed(1)}, ${this.viewport.y.toFixed(1)}`,
      zoom: this.viewport.zoom
    });
    
    this.markDirty();
  }

  /**
   * Fit image to viewport with constraints awareness
   */
  fitToViewport(constraints?: ViewportConstraints): void {
    if (!this.canvases.processed) return;
    
    const imageWidth = this.canvases.processed.width;
    const imageHeight = this.canvases.processed.height;
    
    if (this.viewport.width <= 0 || this.viewport.height <= 0) {
      console.warn('⚠️ Invalid viewport dimensions for fitToViewport');
      return;
    }
    
    // Account for toolbox width on desktop (>768px)
    const effectiveWidth = window.innerWidth > 768 && constraints?.toolboxWidth 
      ? this.viewport.width - constraints.toolboxWidth - 16 // 16px gap
      : this.viewport.width;
    
    const effectiveHeight = constraints?.reservedHeight 
      ? this.viewport.height - constraints.reservedHeight
      : this.viewport.height;

    // Reduce padding for maximum space utilization
    const padding = Math.min(20, Math.floor(Math.min(effectiveWidth, effectiveHeight) * 0.02)); // 2% of smallest dimension, max 20px
    const availableWidth = effectiveWidth - (padding * 2);
    const availableHeight = effectiveHeight - (padding * 2);
    
    const scaleX = availableWidth / imageWidth;
    const scaleY = availableHeight / imageHeight;
    
    // Allow scaling up to 2x for small images to improve editing experience
    this.viewport.zoom = Math.min(scaleX, scaleY, 2);
    this.centerImage();
    
    console.log('📏 Fitted to viewport (DESKTOP AWARE):', {
      imageSize: `${imageWidth}x${imageHeight}`,
      viewportSize: `${this.viewport.width}x${this.viewport.height}`,
      effectiveSize: `${effectiveWidth}x${effectiveHeight}`,
      availableArea: `${availableWidth}x${availableHeight}`,
      toolboxWidth: constraints?.toolboxWidth || 0,
      zoom: this.viewport.zoom,
      padding
    });
  }

  /**
   * Render with specified options (optimized for 60fps)
   */
  render(options: RenderOptions = {}): void {
    if (!this.isDirty) return;
    
    const now = performance.now();
    
    // Throttle renders to maintain smooth 60fps
    if (now - this.lastRenderTime < this.MIN_RENDER_INTERVAL) {
      if (!this.renderScheduled) {
        this.renderScheduled = true;
        const timeToWait = this.MIN_RENDER_INTERVAL - (now - this.lastRenderTime);
        setTimeout(() => {
          this.renderScheduled = false;
          this.render(options);
        }, timeToWait);
      }
      return;
    }
    
    // Detect frame drops
    if (now - this.lastRenderTime > 32) { // More than 2 frames
      this.frameDropCount++;
      if (this.frameDropCount > 5) {
        console.warn('🐌 Performance warning: Frame drops detected', {
          lastInterval: now - this.lastRenderTime,
          frameDrops: this.frameDropCount
        });
      }
    } else {
      this.frameDropCount = Math.max(0, this.frameDropCount - 1);
    }
    
    this.lastRenderTime = now;
    this.queueRender(() => this.performRender(options));
  }

  /**
   * Force immediate render (use sparingly)
   */
  forceRender(options: RenderOptions = {}): void {
    this.cancelPendingRender();
    this.performRender(options);
  }
  
  /**
   * Force render with processed canvas as source (emergency fallback)
   */
  forceRenderProcessed(): void {
    if (!this.contexts.display) {
      console.warn('⚠️ Cannot force render - missing display context');
      return;
    }
    
    console.log('🚨 Emergency render - trying all available canvases');
    
    // Try canvases in order: original (has content), processed, preview
    const candidateCanvases = [
      { name: 'original', canvas: this.canvases.original },
      { name: 'processed', canvas: this.canvases.processed },
      { name: 'preview', canvas: this.canvases.preview }
    ].filter(c => c.canvas && c.canvas.width > 0 && c.canvas.height > 0);
    
    console.log('🔍 Available canvas candidates:', candidateCanvases.map(c => `${c.name} (${c.canvas!.width}x${c.canvas!.height})`));
    
    const ctx = this.contexts.display;
    ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    
    let success = false;
    
    for (const candidate of candidateCanvases) {
      console.log(`🎨 Attempting direct render from ${candidate.name} canvas...`);
      
      try {
        // Get actual display canvas dimensions
        const displayWidth = ctx.canvas.width;
        const displayHeight = ctx.canvas.height;
        const displayStyleWidth = this.viewport.width;
        const displayStyleHeight = this.viewport.height;
        
        console.log(`📐 Display canvas dimensions:`, { 
          actual: `${displayWidth}x${displayHeight}`, 
          style: `${displayStyleWidth}x${displayStyleHeight}`,
          viewport: this.viewport 
        });
        
        // Calculate scale to fit image within the visible area with reduced padding
        const padding = Math.min(20, Math.floor(Math.min(displayStyleWidth, displayStyleHeight) * 0.02)); // 2% of smallest dimension, max 20px
        const availableWidth = displayStyleWidth - (padding * 2);
        const availableHeight = displayStyleHeight - (padding * 2);
        
        const scaleX = availableWidth / candidate.canvas!.width;
        const scaleY = availableHeight / candidate.canvas!.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = candidate.canvas!.width * scale;
        const scaledHeight = candidate.canvas!.height * scale;
        const x = (displayStyleWidth - scaledWidth) / 2;
        const y = (displayStyleHeight - scaledHeight) / 2;
        
        console.log(`📐 ${candidate.name} scaling calculation:`, { 
          sourceSize: `${candidate.canvas!.width}x${candidate.canvas!.height}`,
          availableArea: `${availableWidth}x${availableHeight}`,
          scale, 
          scaledSize: `${scaledWidth}x${scaledHeight}`,
          position: `${x},${y}`
        });
        
        ctx.drawImage(candidate.canvas!, x, y, scaledWidth, scaledHeight);
        
        // Verify content was drawn
        const testImageData = ctx.getImageData(Math.floor(x + scaledWidth/4), Math.floor(y + scaledHeight/4), 50, 50);
        let hasContent = false;
        for (let i = 3; i < testImageData.data.length; i += 4) {
          if (testImageData.data[i] > 0) {
            hasContent = true;
            break;
          }
        }
        
        console.log(`🔍 ${candidate.name} render result - Display canvas has content:`, hasContent);
        
        if (hasContent) {
          console.log(`✅ Emergency render successful using ${candidate.name} canvas`);
          success = true;
          break;
        }
        
      } catch (error) {
        console.error(`❌ ${candidate.name} render failed:`, error);
      }
    }
    
    if (!success) {
      console.error('💥 All emergency render attempts failed');
    }
  }

  /**
   * Set view mode for display
   */
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.markDirty();
    this.render();
    console.log('👁️ View mode changed to:', mode);
  }

  /**
   * Export processed image as data URL
   */
  exportProcessedImage(): string | null {
    const sourceCanvas = this.canvases.preview || this.canvases.processed;
    if (!sourceCanvas) return null;
    return sourceCanvas.toDataURL('image/png');
  }

  /**
   * Get current viewport state
   */
  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  /**
   * Convert screen coordinates to image coordinates
   */
  screenToImage(screenX: number, screenY: number): { x: number; y: number } {
    const imageX = (screenX - this.viewport.x) / this.viewport.zoom;
    const imageY = (screenY - this.viewport.y) / this.viewport.zoom;
    
    return { x: imageX, y: imageY };
  }

  /**
   * Convert image coordinates to screen coordinates
   */
  imageToScreen(imageX: number, imageY: number): { x: number; y: number } {
    const screenX = imageX * this.viewport.zoom + this.viewport.x;
    const screenY = imageY * this.viewport.zoom + this.viewport.y;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelPendingRender();
    this.renderQueue = [];
    
    if (this.offscreenCanvas) {
      this.offscreenCanvas = null;
      this.offscreenContext = null;
    }
    
    console.log('🗑️ Canvas renderer destroyed');
  }

  // Private methods

  private setupCanvases(): void {
    // Set up CSS for proper canvas positioning
    const style = document.createElement('style');
    style.textContent = `
      .canvas-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
      
      .canvas-layer {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      
      .canvas-interactive {
        pointer-events: auto;
        touch-action: none;
      }
    `;
    document.head.appendChild(style);
  }

  private setupOffscreenCanvas(): void {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(800, 600);
      this.offscreenContext = this.offscreenCanvas.getContext('2d')!;
      console.log('⚡ Offscreen canvas enabled for better performance');
    }
  }

  private updateCanvasSizes(): void {
    if (!this.canvases.display) return;
    
    const displayCanvas = this.canvases.display;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Set display size
    displayCanvas.style.width = `${this.viewport.width}px`;
    displayCanvas.style.height = `${this.viewport.height}px`;
    
    // Set actual size for high DPI displays
    displayCanvas.width = this.viewport.width * pixelRatio;
    displayCanvas.height = this.viewport.height * pixelRatio;
    
    // Get fresh context after resizing
    this.contexts.display = displayCanvas.getContext('2d')!;
    this.contexts.display.imageSmoothingEnabled = true;
    this.contexts.display.imageSmoothingQuality = 'high';
    
    // Scale context to match pixel ratio
    this.contexts.display.scale(pixelRatio, pixelRatio);
    
    console.log('📐 Display canvas resized:', {
      style: `${displayCanvas.style.width} x ${displayCanvas.style.height}`,
      actual: `${displayCanvas.width} x ${displayCanvas.height}`,
      pixelRatio
    });
  }

  private markDirty(): void {
    this.isDirty = true;
  }

  private queueRender(renderFn: () => void): void {
    this.renderQueue.push(renderFn);
    
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.processRenderQueue();
      });
    }
  }

  private processRenderQueue(): void {
    this.isRendering = true;
    
    while (this.renderQueue.length > 0) {
      const renderFn = this.renderQueue.shift()!;
      renderFn();
    }
    
    this.isRendering = false;
    this.isDirty = false;
    this.animationFrameId = null;
  }

  private cancelPendingRender(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private performRender(options: RenderOptions = {}): void {
    if (!this.contexts.display) {
      console.warn('⚠️ Missing display context for render');
      return;
    }
    
    const ctx = this.contexts.display;
    
    console.log('🎨 Performing render with view mode:', this.viewMode);
    console.log('📐 Viewport:', this.viewport);
    
    // Clear display canvas
    ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    
    // Save context state
    ctx.save();
    
    // Apply viewport transformation
    ctx.translate(this.viewport.x, this.viewport.y);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
    
    try {
      switch (this.viewMode) {
        case 'original':
          this.drawCanvas(this.canvases.original);
          console.log('🖼️ Rendered original view');
          break;
        case 'comparison':
          this.drawComparisonView();
          console.log('🖼️ Rendered comparison view');
          break;
        case 'processed':
        default:
          this.drawCanvas(this.canvases.preview || this.canvases.processed);
          console.log('🖼️ Rendered processed view');
          break;
      }
      
    } catch (error) {
      console.error('❌ Error drawing to canvas:', error);
    }
    
    // Restore context state
    ctx.restore();
    
    console.log('🎨 Render completed');
  }

  private drawCanvas(sourceCanvas: HTMLCanvasElement | null): void {
    if (!sourceCanvas || sourceCanvas.width <= 0 || sourceCanvas.height <= 0) {
      console.warn('⚠️ No valid source canvas for drawing');
      return;
    }

    const ctx = this.contexts.display;
    ctx.drawImage(sourceCanvas, 0, 0);
    console.log(`✅ Drew ${sourceCanvas.width}x${sourceCanvas.height} canvas to display`);
  }

  private drawComparisonView(): void {
    const ctx = this.contexts.display;
    const originalCanvas = this.canvases.original;
    const processedCanvas = this.canvases.preview || this.canvases.processed;
    
    if (!originalCanvas || !processedCanvas) {
      console.warn('⚠️ Missing canvases for comparison view');
      return;
    }
    
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    const splitX = width * 0.5; // Split in the middle
    
    // Draw original on left half
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();
    ctx.drawImage(originalCanvas, 0, 0);
    ctx.restore();
    
    // Draw processed on right half
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, width - splitX, height);
    ctx.clip();
    ctx.drawImage(processedCanvas, 0, 0);
    ctx.restore();
    
    // Draw split line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();
    
    console.log('✅ Comparison view drawn with split at 50%');
  }

  private renderComparison(ctx: CanvasRenderingContext2D, splitPosition: number): void {
    if (!this.canvases.original || !this.canvases.preview) return;
    
    const width = this.canvases.preview.width;
    const height = this.canvases.preview.height;
    const splitX = width * splitPosition;
    
    // Save context
    ctx.save();
    
    // Draw original on left side
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();
    ctx.drawImage(this.canvases.original, 0, 0);
    
    // Restore and draw processed on right side
    ctx.restore();
    ctx.save();
    
    ctx.beginPath();
    ctx.rect(splitX, 0, width - splitX, height);
    ctx.clip();
    ctx.drawImage(this.canvases.preview, 0, 0);
    
    // Draw split line
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();
  }
}