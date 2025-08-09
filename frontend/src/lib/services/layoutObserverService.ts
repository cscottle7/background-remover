/**
 * Layout Observer Service
 * Provides real-time layout measurements for canvas sizing
 * Replaces calculations with actual DOM measurements
 */

import { writable, type Writable } from 'svelte/store';

export interface LayoutDimensions {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface CanvasConstraints {
  maxWidth: number;
  maxHeight: number;
  aspectRatio?: number;
  padding: number;
}

class LayoutObserverService {
  private observers = new Map<string, ResizeObserver>();
  private dimensions = new Map<string, Writable<LayoutDimensions>>();
  private elements = new Map<string, HTMLElement>();

  /**
   * Observe an element for layout changes
   */
  observe(elementId: string, element: HTMLElement): Writable<LayoutDimensions> {
    // Clean up existing observer
    this.unobserve(elementId);

    // Create new dimension store with initial measurement
    const initialDimensions = this.measureElement(element);
    const dimensionStore = writable<LayoutDimensions>(initialDimensions);
    this.dimensions.set(elementId, dimensionStore);
    this.elements.set(elementId, element);

    // Create ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === element) {
            const newDimensions = this.measureElement(element);
            dimensionStore.set(newDimensions);
          }
        }
      });

      observer.observe(element);
      this.observers.set(elementId, observer);
    } else {
      // Fallback for environments without ResizeObserver
      console.warn('ResizeObserver not available, using fallback');
      const checkSize = () => {
        const newDimensions = this.measureElement(element);
        dimensionStore.set(newDimensions);
      };
      
      // Check size on window resize as fallback
      window.addEventListener('resize', checkSize);
      
      // Store cleanup function
      this.observers.set(elementId, {
        disconnect: () => window.removeEventListener('resize', checkSize)
      } as ResizeObserver);
    }

    return dimensionStore;
  }

  /**
   * Stop observing an element
   */
  unobserve(elementId: string): void {
    const observer = this.observers.get(elementId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(elementId);
    }
    
    this.dimensions.delete(elementId);
    this.elements.delete(elementId);
  }

  /**
   * Measure element's actual dimensions and available space
   */
  private measureElement(element: HTMLElement): LayoutDimensions {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    const padding = {
      top: parseFloat(computedStyle.paddingTop),
      right: parseFloat(computedStyle.paddingRight),
      bottom: parseFloat(computedStyle.paddingBottom),
      left: parseFloat(computedStyle.paddingLeft)
    };

    return {
      width: rect.width,
      height: rect.height,
      availableWidth: rect.width - padding.left - padding.right,
      availableHeight: rect.height - padding.top - padding.bottom,
      padding
    };
  }

  /**
   * Calculate optimal canvas size based on real layout dimensions
   */
  calculateCanvasSize(
    containerDimensions: LayoutDimensions,
    imageWidth: number,
    imageHeight: number,
    constraints: Partial<CanvasConstraints> = {}
  ): { width: number; height: number; scale: number } {
    const {
      maxWidth = containerDimensions.availableWidth * 0.95,
      maxHeight = containerDimensions.availableHeight * 0.9,
      padding = 20
    } = constraints;

    // Calculate available space with padding
    const availableWidth = Math.max(0, maxWidth - (padding * 2));
    const availableHeight = Math.max(0, maxHeight - (padding * 2));

    // Calculate scale to fit within available space
    const scaleX = availableWidth / imageWidth;
    const scaleY = availableHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

    return {
      width: Math.floor(imageWidth * scale),
      height: Math.floor(imageHeight * scale),
      scale
    };
  }

  /**
   * Get current dimensions for an observed element
   */
  getDimensions(elementId: string): LayoutDimensions | null {
    const element = this.elements.get(elementId);
    return element ? this.measureElement(element) : null;
  }

  /**
   * Force refresh dimensions for an element
   */
  refresh(elementId: string): void {
    const element = this.elements.get(elementId);
    const dimensionStore = this.dimensions.get(elementId);
    
    if (element && dimensionStore) {
      const newDimensions = this.measureElement(element);
      dimensionStore.set(newDimensions);
    }
  }

  /**
   * Clean up all observers
   */
  cleanup(): void {
    for (const [elementId] of this.observers) {
      this.unobserve(elementId);
    }
  }
}

// Global instance
export const layoutObserver = new LayoutObserverService();

// Helper function for canvas containers
export function observeCanvasContainer(
  element: HTMLElement,
  imageWidth: number,
  imageHeight: number
): {
  dimensions: Writable<LayoutDimensions>;
  canvasSize: Writable<{ width: number; height: number; scale: number }>;
  cleanup: () => void;
} {
  const containerId = `canvas-container-${Date.now()}`;
  const dimensions = layoutObserver.observe(containerId, element);
  
  // Create derived store for canvas size
  const canvasSize = writable({ width: 0, height: 0, scale: 1 });
  
  // Update canvas size when dimensions change
  const unsubscribe = dimensions.subscribe((dims) => {
    const size = layoutObserver.calculateCanvasSize(dims, imageWidth, imageHeight);
    canvasSize.set(size);
  });

  return {
    dimensions,
    canvasSize,
    cleanup: () => {
      unsubscribe();
      layoutObserver.unobserve(containerId);
    }
  };
}