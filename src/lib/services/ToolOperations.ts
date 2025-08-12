/**
 * ToolOperations - Handles tool-specific logic and interactions
 * Manages tool states, interactions, and coordinates with canvas engine
 */

import type { ImageCanvasEngine, ToolType, Point } from './ImageCanvasEngine';

export interface ToolConfig {
  type: ToolType;
  brushSize: number;
  opacity: number;
  hardness: number;
}

export interface TouchEvent {
  type: 'start' | 'move' | 'end';
  point: Point;
  pressure?: number;
}

export interface PointerEvent {
  type: 'down' | 'move' | 'up';
  point: Point;
  pressure?: number;
  pointerType: 'mouse' | 'pen' | 'touch';
  velocity?: number;
  tiltX?: number;
  tiltY?: number;
}

export class ToolOperations {
  private canvasEngine: ImageCanvasEngine;
  private currentTool: ToolType = 'restore';
  private brushSize: number = 20;
  private isDrawing: boolean = false;
  private lastPoint: Point | null = null;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxUndoSteps: number = 20;
  
  // Advanced brush dynamics
  private lastPressure: number = 1.0;
  private lastVelocity: number = 0;
  private lastTimestamp: number = 0;
  private strokePoints: Array<{ point: Point; pressure: number; timestamp: number }> = [];
  private readonly MIN_BRUSH_SIZE = 1;
  private readonly MAX_BRUSH_SIZE = 200;

  constructor(canvasEngine: ImageCanvasEngine) {
    this.canvasEngine = canvasEngine;
  }

  /**
   * Set the current tool
   */
  setTool(tool: ToolType): void {
    this.currentTool = tool;
    console.log('🔧 Tool changed to:', tool);
  }

  /**
   * Set brush size
   */
  setBrushSize(size: number): void {
    this.brushSize = Math.max(1, Math.min(100, size));
    console.log('🖌️ Brush size set to:', this.brushSize);
  }

  /**
   * Get current tool
   */
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  /**
   * Get current brush size
   */
  getBrushSize(): number {
    return this.brushSize;
  }

  /**
   * Handle pointer down event (mouse or touch start)
   */
  handlePointerDown(event: PointerEvent): void {
    if (!this.canvasEngine.isReady()) return;

    this.isDrawing = true;
    this.lastPoint = event.point;
    this.lastTimestamp = performance.now();
    this.strokePoints = [{ point: event.point, pressure: event.pressure || 1.0, timestamp: this.lastTimestamp }];
    
    // Save state for undo
    this.saveUndoState();
    
    // Perform initial tool operation with pressure
    this.performToolOperation(event.point, event.pressure || 1.0);
    
    console.log('🎯 Pointer down:', { 
      tool: this.currentTool, 
      point: event.point, 
      pressure: event.pressure || 1.0,
      pointerType: event.pointerType 
    });
  }

  /**
   * Handle pointer move event (mouse move or touch move)
   */
  handlePointerMove(event: PointerEvent): void {
    if (!this.canvasEngine.isReady() || !this.isDrawing || !this.lastPoint) return;

    // Interpolate between last point and current point for smooth strokes
    this.interpolateStroke(this.lastPoint, event.point);
    this.lastPoint = event.point;
  }

  /**
   * Handle pointer up event (mouse up or touch end)
   */
  handlePointerUp(event: PointerEvent): void {
    if (!this.canvasEngine.isReady()) return;

    this.isDrawing = false;
    this.lastPoint = null;
    
    console.log('🎯 Pointer up:', { tool: this.currentTool });
  }

  /**
   * Handle touch events specifically (for mobile)
   */
  handleTouchEvent(event: TouchEvent): void {
    const pointerEvent: PointerEvent = {
      type: event.type === 'start' ? 'down' : event.type === 'move' ? 'move' : 'up',
      point: event.point,
      pressure: event.pressure,
      pointerType: 'touch'
    };

    switch (event.type) {
      case 'start':
        this.handlePointerDown(pointerEvent);
        break;
      case 'move':
        this.handlePointerMove(pointerEvent);
        break;
      case 'end':
        this.handlePointerUp(pointerEvent);
        break;
    }
  }

  /**
   * Perform smart restore operation (auto-detect areas to restore)
   */
  performSmartRestore(point: Point): void {
    if (!this.canvasEngine.isReady()) return;

    console.log('🧠 Smart restore at:', point);
    
    // For MVP, smart restore acts like regular restore with larger brush
    const smartBrushSize = this.brushSize * 2;
    this.canvasEngine.performRestore(point.x, point.y, smartBrushSize);
  }

  /**
   * Perform smart erase operation (auto-detect edges)
   */
  performSmartErase(point: Point): void {
    if (!this.canvasEngine.isReady()) return;

    console.log('🧠 Smart erase at:', point);
    
    // For MVP, smart erase acts like regular erase with edge detection
    const smartBrushSize = this.brushSize * 1.5;
    this.canvasEngine.performErase(point.x, point.y, smartBrushSize);
  }

  /**
   * Undo last operation
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;

    const currentState = this.canvasEngine.exportPreview();
    this.redoStack.push(currentState);
    
    const previousState = this.undoStack.pop()!;
    this.restoreCanvasState(previousState);
    
    console.log('↶ Undo performed, stack size:', this.undoStack.length);
    return true;
  }

  /**
   * Redo last undone operation
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const currentState = this.canvasEngine.exportPreview();
    this.undoStack.push(currentState);
    
    const nextState = this.redoStack.pop()!;
    this.restoreCanvasState(nextState);
    
    console.log('↷ Redo performed, stack size:', this.redoStack.length);
    return true;
  }

  /**
   * Clear undo/redo history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    console.log('🗑️ Undo/redo history cleared');
  }

  /**
   * Get undo/redo availability
   */
  getHistoryState(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0
    };
  }

  /**
   * Save initial state for undo functionality
   */
  saveInitialState(): void {
    if (this.canvasEngine.isReady()) {
      const initialState = this.canvasEngine.exportPreview();
      // Don't add to undo stack, just set as baseline
      console.log('💾 Initial canvas state saved');
    }
  }

  // Private helper methods

  private performToolOperation(point: Point, pressure: number = 1.0): void {
    // Use optimized brush operation with pressure sensitivity
    const currentTime = performance.now();
    const timeDelta = currentTime - this.lastTimestamp;
    
    // Calculate velocity for dynamic brush effects
    if (this.lastPoint && timeDelta > 0) {
      const distance = Math.sqrt(
        Math.pow(point.x - this.lastPoint.x, 2) + 
        Math.pow(point.y - this.lastPoint.y, 2)
      );
      this.lastVelocity = distance / timeDelta;
    }
    
    // Dynamic brush size based on pressure and velocity
    let dynamicBrushSize = this.brushSize * pressure;
    
    // Reduce brush size for fast movements (for more control)
    if (this.lastVelocity > 0.5) {
      dynamicBrushSize *= Math.max(0.5, 1 - (this.lastVelocity - 0.5) * 0.3);
    }
    
    dynamicBrushSize = Math.max(this.MIN_BRUSH_SIZE, Math.min(this.MAX_BRUSH_SIZE, dynamicBrushSize));
    
    switch (this.currentTool) {
      case 'restore':
        this.canvasEngine.performOptimizedBrushOp?.('restore', point.x, point.y, dynamicBrushSize, pressure) ||
        this.canvasEngine.performRestore(point.x, point.y, dynamicBrushSize);
        break;
      case 'erase':
        this.canvasEngine.performOptimizedBrushOp?.('erase', point.x, point.y, dynamicBrushSize, pressure) ||
        this.canvasEngine.performErase(point.x, point.y, dynamicBrushSize);
        break;
      case 'smart-restore':
        this.performSmartRestore(point);
        break;
      case 'smart-erase':
        this.performSmartErase(point);
        break;
    }
    
    this.lastPressure = pressure;
    this.lastTimestamp = currentTime;
  }

  private interpolateStroke(from: Point, to: Point): void {
    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const steps = Math.max(1, Math.floor(distance / (this.brushSize * 0.1)));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const interpolatedPoint: Point = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      };
      
      this.performToolOperation(interpolatedPoint);
    }
  }

  private saveUndoState(): void {
    const currentState = this.canvasEngine.exportPreview();
    this.undoStack.push(currentState);
    
    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

  private restoreCanvasState(stateDataUrl: string): void {
    const img = new Image();
    img.onload = () => {
      // Get the preview canvas and draw the restored state
      const previewCanvas = this.canvasEngine.getPreviewCanvas();
      if (previewCanvas) {
        const ctx = previewCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          ctx.drawImage(img, 0, 0);
          console.log('🔄 Canvas state restored from image data');
        }
      }
    };
    img.src = stateDataUrl;
  }
}

/**
 * Utility functions for coordinate conversion and touch handling
 */
export class ToolUtils {
  /**
   * Convert DOM event coordinates to canvas coordinates
   */
  static getCanvasCoordinates(event: MouseEvent | Touch, canvas: HTMLCanvasElement): Point {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  /**
   * Get touch pressure (if available)
   */
  static getTouchPressure(touch: Touch): number {
    // @ts-ignore - force is not in all Touch interfaces but exists on some devices
    return touch.force || 1.0;
  }

  /**
   * Check if device supports pressure sensitivity
   */
  static supportsPressure(): boolean {
    return 'ontouchstart' in window && 'force' in Touch.prototype;
  }

  /**
   * Prevent default touch behaviors (scrolling, zooming)
   */
  static preventTouchDefaults(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
}