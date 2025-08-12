/**
 * Canvas Pool Service - Performance optimization for canvas operations
 * Manages a pool of reusable canvas contexts to avoid expensive allocation/deallocation
 */

interface CanvasPoolItem {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  inUse: boolean;
  lastUsed: number;
}

export class CanvasPoolService {
  private pool: CanvasPoolItem[] = [];
  private maxPoolSize: number;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor(maxPoolSize: number = 10, cleanupInterval: number = 30000) {
    this.maxPoolSize = maxPoolSize;
    this.cleanupInterval = cleanupInterval;
    this.startCleanupTimer();
  }
  
  /**
   * Get a canvas from the pool or create a new one
   */
  getCanvas(width: number, height: number): CanvasPoolItem {
    // Try to find an unused canvas with matching dimensions
    const existing = this.pool.find(item => 
      !item.inUse && 
      item.width === width && 
      item.height === height
    );
    
    if (existing) {
      existing.inUse = true;
      existing.lastUsed = Date.now();
      
      // Clear the canvas for reuse
      existing.ctx.clearRect(0, 0, width, height);
      
      return existing;
    }
    
    // Try to find an unused canvas that can be resized
    const resizable = this.pool.find(item => !item.inUse);
    
    if (resizable) {
      this.resizeCanvas(resizable, width, height);
      resizable.inUse = true;
      resizable.lastUsed = Date.now();
      
      return resizable;
    }
    
    // Create a new canvas if pool isn't full
    if (this.pool.length < this.maxPoolSize) {
      const newItem = this.createCanvasItem(width, height);
      this.pool.push(newItem);
      return newItem;
    }
    
    // Pool is full, force reuse the oldest unused canvas
    const oldest = this.pool
      .filter(item => !item.inUse)
      .sort((a, b) => a.lastUsed - b.lastUsed)[0];
    
    if (oldest) {
      this.resizeCanvas(oldest, width, height);
      oldest.inUse = true;
      oldest.lastUsed = Date.now();
      return oldest;
    }
    
    // All canvases are in use, create a temporary one (not pooled)
    console.warn('Canvas pool exhausted, creating temporary canvas');
    return this.createCanvasItem(width, height);
  }
  
  /**
   * Return a canvas to the pool
   */
  releaseCanvas(item: CanvasPoolItem): void {
    const poolIndex = this.pool.indexOf(item);
    
    if (poolIndex !== -1) {
      item.inUse = false;
      item.lastUsed = Date.now();
      
      // Clear the canvas for next use
      item.ctx.clearRect(0, 0, item.width, item.height);
    }
  }
  
  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    memoryEstimate: number;
  } {
    const total = this.pool.length;
    const inUse = this.pool.filter(item => item.inUse).length;
    const available = total - inUse;
    
    // Rough memory estimate (4 bytes per pixel for RGBA)
    const memoryEstimate = this.pool.reduce((total, item) => {
      return total + (item.width * item.height * 4);
    }, 0);
    
    return {
      total,
      inUse,
      available,
      memoryEstimate
    };
  }
  
  /**
   * Clear unused canvases from the pool
   */
  cleanup(maxAge: number = 60000): number {
    const now = Date.now();
    const initialSize = this.pool.length;
    
    this.pool = this.pool.filter(item => {
      if (!item.inUse && (now - item.lastUsed) > maxAge) {
        // Explicitly clean up the canvas
        item.canvas.width = 1;
        item.canvas.height = 1;
        return false;
      }
      return true;
    });
    
    const cleaned = initialSize - this.pool.length;
    if (cleaned > 0) {
      console.log(`Canvas pool cleanup: removed ${cleaned} canvases`);
    }
    
    return cleaned;
  }
  
  /**
   * Destroy the canvas pool and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Cleanup all canvases
    this.pool.forEach(item => {
      item.canvas.width = 1;
      item.canvas.height = 1;
    });
    
    this.pool = [];
  }
  
  // Private methods
  
  private createCanvasItem(width: number, height: number): CanvasPoolItem {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for canvas');
    }
    
    // Configure context for high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    return {
      canvas,
      ctx,
      width,
      height,
      inUse: true,
      lastUsed: Date.now()
    };
  }
  
  private resizeCanvas(item: CanvasPoolItem, width: number, height: number): void {
    item.canvas.width = width;
    item.canvas.height = height;
    item.width = width;
    item.height = height;
    
    // Reconfigure context after resize
    item.ctx.imageSmoothingEnabled = true;
    item.ctx.imageSmoothingQuality = 'high';
  }
  
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
}

// Singleton instance
export const canvasPool = new CanvasPoolService();

/**
 * Throttle utility for limiting function calls
 */
export class ThrottleService {
  private timers = new Map<string, NodeJS.Timeout>();
  private lastCalls = new Map<string, number>();
  
  /**
   * Throttle a function call by key
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 16 // ~60fps by default
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const lastCall = this.lastCalls.get(key) || 0;
      
      if (now - lastCall >= delay) {
        // Call immediately if enough time has passed
        this.lastCalls.set(key, now);
        fn(...args);
      } else {
        // Schedule the call for later
        this.clearTimer(key);
        
        const timeoutId = setTimeout(() => {
          this.lastCalls.set(key, Date.now());
          fn(...args);
          this.timers.delete(key);
        }, delay - (now - lastCall));
        
        this.timers.set(key, timeoutId);
      }
    };
  }
  
  /**
   * Debounce a function call by key
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      this.clearTimer(key);
      
      const timeoutId = setTimeout(() => {
        fn(...args);
        this.timers.delete(key);
      }, delay);
      
      this.timers.set(key, timeoutId);
    };
  }
  
  /**
   * Clear a specific timer
   */
  clearTimer(key: string): void {
    const timerId = this.timers.get(key);
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(key);
    }
  }
  
  /**
   * Clear all timers
   */
  clearAll(): void {
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
    this.lastCalls.clear();
  }
}

// Singleton instance
export const throttleService = new ThrottleService();