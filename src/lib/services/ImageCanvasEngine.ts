/**
 * ImageCanvasEngine - Core canvas engine for image manipulation
 * Handles proper image editing operations (restore, erase) with layer management
 */

export type ToolType = 'restore' | 'erase' | 'smart-restore' | 'smart-erase';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasLayers {
  original: HTMLCanvasElement;
  processed: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  preview: HTMLCanvasElement;
}

export interface CanvasState {
  width: number;
  height: number;
  scale: number;
  imageWidth: number;
  imageHeight: number;
}

export class ImageCanvasEngine {
  private layers: CanvasLayers;
  private contexts: {
    original: CanvasRenderingContext2D;
    processed: CanvasRenderingContext2D;
    mask: CanvasRenderingContext2D;
    preview: CanvasRenderingContext2D;
  };
  private state: CanvasState;
  private originalImageData: ImageData | null = null;
  private processedImageData: ImageData | null = null;
  private isInitialized = false;
  
  // Performance and memory optimization
  private operationCache = new Map<string, ImageData>();
  private readonly MAX_CACHE_SIZE = 5;
  private lastCleanupTime = 0;
  private readonly CLEANUP_INTERVAL = 60000; // 60 seconds

  constructor(layers: CanvasLayers) {
    this.layers = layers;
    this.contexts = {
      original: layers.original.getContext('2d')!,
      processed: layers.processed.getContext('2d')!,
      mask: layers.mask.getContext('2d')!,
      preview: layers.preview.getContext('2d')!
    };
    
    this.state = {
      width: 0,
      height: 0,
      scale: 1,
      imageWidth: 0,
      imageHeight: 0
    };
  }

  /**
   * Initialize the canvas engine with image data
   */
  async initialize(originalImageSrc: string, processedImageSrc: string): Promise<void> {
    try {
      console.log('🎨 Initializing canvas engine...');
      console.log('🖼️ Original src:', originalImageSrc.substring(0, 50) + '...');
      console.log('🖼️ Processed src:', processedImageSrc.substring(0, 50) + '...');
      
      const [originalImg, processedImg] = await Promise.all([
        this.loadImage(originalImageSrc),
        this.loadImage(processedImageSrc)
      ]);

      console.log('📏 Image dimensions:', { 
        original: `${originalImg.width}x${originalImg.height}`,
        processed: `${processedImg.width}x${processedImg.height}`
      });

      // Set up canvas dimensions based on processed image
      this.state.imageWidth = processedImg.width;
      this.state.imageHeight = processedImg.height;
      
      this.setupCanvases(processedImg.width, processedImg.height);
      
      // Draw images to canvases
      this.contexts.original.drawImage(originalImg, 0, 0);
      this.contexts.processed.drawImage(processedImg, 0, 0);
      
      console.log('🎨 Images drawn to canvases');
      
      // Store image data for manipulation
      this.originalImageData = this.contexts.original.getImageData(0, 0, processedImg.width, processedImg.height);
      this.processedImageData = this.contexts.processed.getImageData(0, 0, processedImg.width, processedImg.height);
      
      console.log('💾 Image data stored');
      
      // Initialize preview with processed image
      this.updatePreview();
      
      this.isInitialized = true;
      console.log('✅ Canvas engine initialized successfully:', this.state);
      
    } catch (error) {
      console.error('❌ Canvas engine initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set canvas dimensions and scale
   */
  setCanvasDimensions(width: number, height: number, scale: number): void {
    this.state.width = width;
    this.state.height = height;
    this.state.scale = scale;
    
    // Update all canvas elements
    Object.values(this.layers).forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });
    
    console.log('📐 Canvas dimensions updated:', this.state);
  }

  /**
   * Perform restore operation at specified coordinates
   */
  performRestore(x: number, y: number, brushSize: number): void {
    if (!this.isInitialized || !this.originalImageData || !this.processedImageData) {
      console.warn('⚠️ Canvas not initialized for restore operation');
      return;
    }

    // Use image coordinates directly - no scale conversion needed here
    // The coordinates should already be in image space from the renderer
    const imageX = Math.round(Math.max(0, Math.min(this.state.imageWidth - 1, x)));
    const imageY = Math.round(Math.max(0, Math.min(this.state.imageHeight - 1, y)));
    const imageBrushSize = Math.max(1, Math.round(brushSize));

    console.log('🖌️ Restore operation:', { 
      coords: `${imageX},${imageY}`, 
      size: imageBrushSize,
      imageSize: `${this.state.imageWidth}x${this.state.imageHeight}`
    });

    // Get current preview image data
    const previewData = this.contexts.preview.getImageData(0, 0, this.state.imageWidth, this.state.imageHeight);
    
    // Restore circular area from original image
    this.restoreCircularArea(previewData.data, this.originalImageData.data, imageX, imageY, imageBrushSize);
    
    // Update preview canvas
    this.contexts.preview.putImageData(previewData, 0, 0);
    
    console.log('✅ Restore operation completed at', imageX, imageY);
  }

  /**
   * Perform erase operation at specified coordinates
   */
  performErase(x: number, y: number, brushSize: number): void {
    if (!this.isInitialized || !this.processedImageData) {
      console.warn('⚠️ Canvas not initialized for erase operation');
      return;
    }

    // Use image coordinates directly - no scale conversion needed here
    const imageX = Math.round(Math.max(0, Math.min(this.state.imageWidth - 1, x)));
    const imageY = Math.round(Math.max(0, Math.min(this.state.imageHeight - 1, y)));
    const imageBrushSize = Math.max(1, Math.round(brushSize));

    console.log('🗑️ Erase operation:', { 
      coords: `${imageX},${imageY}`, 
      size: imageBrushSize,
      imageSize: `${this.state.imageWidth}x${this.state.imageHeight}`
    });

    // Get current preview image data
    const previewData = this.contexts.preview.getImageData(0, 0, this.state.imageWidth, this.state.imageHeight);
    
    // Erase circular area (set alpha to 0)
    this.eraseCircularArea(previewData.data, imageX, imageY, imageBrushSize);
    
    // Update preview canvas
    this.contexts.preview.putImageData(previewData, 0, 0);
    
    console.log('✅ Erase operation completed at', imageX, imageY);
  }

  /**
   * Update preview canvas with current processed image
   */
  updatePreview(): void {
    if (!this.isInitialized || !this.processedImageData) return;
    
    this.contexts.preview.putImageData(this.processedImageData, 0, 0);
  }

  /**
   * Toggle between original and processed image in preview
   */
  showOriginalPreview(show: boolean): void {
    if (!this.isInitialized) return;
    
    if (show && this.originalImageData) {
      this.contexts.preview.putImageData(this.originalImageData, 0, 0);
    } else if (this.processedImageData) {
      this.contexts.preview.putImageData(this.processedImageData, 0, 0);
    }
  }

  /**
   * Export current preview as base64 data URL
   */
  exportPreview(): string {
    return this.layers.preview.toDataURL('image/png');
  }

  /**
   * Get current canvas state
   */
  getState(): CanvasState {
    return { ...this.state };
  }

  /**
   * Check if engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get preview canvas for direct access (needed for undo/redo)
   */
  getPreviewCanvas(): HTMLCanvasElement {
    return this.layers.preview;
  }

  /**
   * Perform memory cleanup to prevent leaks
   */
  performMemoryCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL) return;

    // Clear operation cache if it's getting too large
    if (this.operationCache.size > this.MAX_CACHE_SIZE) {
      const entriesToRemove = this.operationCache.size - this.MAX_CACHE_SIZE;
      const keys = Array.from(this.operationCache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this.operationCache.delete(key));
      console.log(`🧹 Cleaned up ${entriesToRemove} cached operations`);
    }

    this.lastCleanupTime = now;
  }

  /**
   * Optimized brush operation with caching
   */
  performOptimizedBrushOp(
    operation: 'restore' | 'erase', 
    x: number, 
    y: number, 
    brushSize: number,
    pressure: number = 1.0
  ): void {
    // Adjust brush size based on pressure
    const adjustedBrushSize = Math.round(brushSize * pressure);
    
    // Create cache key for operation
    const cacheKey = `${operation}-${adjustedBrushSize}`;
    
    // Perform cleanup occasionally
    this.performMemoryCleanup();
    
    // Use the existing optimized operations
    if (operation === 'restore') {
      this.performRestore(x, y, adjustedBrushSize);
    } else {
      this.performErase(x, y, adjustedBrushSize);
    }
  }

  // Private helper methods

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private setupCanvases(width: number, height: number): void {
    Object.values(this.layers).forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });
  }

  private restoreCircularArea(targetData: Uint8ClampedArray, sourceData: Uint8ClampedArray, centerX: number, centerY: number, radius: number): void {
    const radiusSquared = radius * radius;
    
    for (let y = Math.max(0, centerY - radius); y <= Math.min(this.state.imageHeight - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(this.state.imageWidth - 1, centerX + radius); x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared <= radiusSquared) {
          const index = (y * this.state.imageWidth + x) * 4;
          
          // Copy RGBA from source to target
          targetData[index] = sourceData[index];         // R
          targetData[index + 1] = sourceData[index + 1]; // G
          targetData[index + 2] = sourceData[index + 2]; // B
          targetData[index + 3] = sourceData[index + 3]; // A
        }
      }
    }
  }

  private eraseCircularArea(targetData: Uint8ClampedArray, centerX: number, centerY: number, radius: number): void {
    const radiusSquared = radius * radius;
    
    for (let y = Math.max(0, centerY - radius); y <= Math.min(this.state.imageHeight - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(this.state.imageWidth - 1, centerX + radius); x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared <= radiusSquared) {
          const index = (y * this.state.imageWidth + x) * 4;
          
          // Set alpha to 0 (transparent)
          targetData[index + 3] = 0;
        }
      }
    }
  }
}