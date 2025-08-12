/**
 * Worker Pool Service - Manages Web Workers for heavy processing
 * Distributes tasks across multiple workers for optimal performance
 */

import type { ProcessingTask, ProcessingResult } from '../workers/imageProcessor.worker';

interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  currentTaskId: string | null;
  tasksCompleted: number;
  lastUsed: number;
}

interface PendingTask {
  task: ProcessingTask;
  resolve: (result: ProcessingResult) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class WorkerPoolService {
  private workers: WorkerInstance[] = [];
  private pendingTasks: PendingTask[] = [];
  private taskIdCounter = 0;
  private maxWorkers: number;
  private workerScript: string;
  
  constructor(maxWorkers: number = Math.min(4, navigator.hardwareConcurrency || 2)) {
    this.maxWorkers = maxWorkers;
    this.workerScript = new URL('../workers/imageProcessor.worker.ts', import.meta.url).href;
    this.initializeWorkers();
  }
  
  /**
   * Process a task using the worker pool
   */
  async processTask(
    type: ProcessingTask['type'],
    data: ProcessingTask['data']
  ): Promise<ProcessingResult> {
    const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;
    
    const task: ProcessingTask = {
      id: taskId,
      type,
      data
    };
    
    return new Promise((resolve, reject) => {
      const pendingTask: PendingTask = {
        task,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.pendingTasks.push(pendingTask);
      this.processPendingTasks();
    });
  }
  
  /**
   * Get worker pool statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    availableWorkers: number;
    pendingTasks: number;
    totalTasksCompleted: number;
  } {
    const busyWorkers = this.workers.filter(w => w.busy).length;
    const totalTasksCompleted = this.workers.reduce((sum, w) => sum + w.tasksCompleted, 0);
    
    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      availableWorkers: this.workers.length - busyWorkers,
      pendingTasks: this.pendingTasks.length,
      totalTasksCompleted
    };
  }
  
  /**
   * Terminate all workers and cleanup
   */
  destroy(): void {
    this.workers.forEach(workerInstance => {
      workerInstance.worker.terminate();
    });
    this.workers = [];
    
    // Reject all pending tasks
    this.pendingTasks.forEach(pendingTask => {
      pendingTask.reject(new Error('Worker pool destroyed'));
    });
    this.pendingTasks = [];
  }
  
  /**
   * Add more workers if needed (up to max)
   */
  scaleUp(): void {
    if (this.workers.length < this.maxWorkers && this.pendingTasks.length > 0) {
      const additionalWorkers = Math.min(
        this.maxWorkers - this.workers.length,
        this.pendingTasks.length
      );
      
      for (let i = 0; i < additionalWorkers; i++) {
        this.createWorker();
      }
    }
  }
  
  /**
   * Remove idle workers to free up resources
   */
  scaleDown(): void {
    const idleWorkers = this.workers.filter(w => !w.busy);
    const now = Date.now();
    
    // Remove workers idle for more than 30 seconds
    const workersToRemove = idleWorkers.filter(w => now - w.lastUsed > 30000);
    
    workersToRemove.forEach(workerInstance => {
      const index = this.workers.indexOf(workerInstance);
      if (index !== -1) {
        workerInstance.worker.terminate();
        this.workers.splice(index, 1);
      }
    });
  }
  
  // Private methods
  
  private initializeWorkers(): void {
    // Start with at least 1 worker, scale up as needed
    this.createWorker();
  }
  
  private createWorker(): WorkerInstance {
    try {
      const worker = new Worker(this.workerScript, { type: 'module' });
      
      const workerInstance: WorkerInstance = {
        worker,
        busy: false,
        currentTaskId: null,
        tasksCompleted: 0,
        lastUsed: Date.now()
      };
      
      worker.onmessage = (event: MessageEvent<ProcessingResult>) => {
        this.handleWorkerMessage(workerInstance, event.data);
      };
      
      worker.onerror = (error) => {
        this.handleWorkerError(workerInstance, error);
      };
      
      this.workers.push(workerInstance);
      return workerInstance;
      
    } catch (error) {
      console.error('Failed to create worker:', error);
      throw new Error('Failed to create worker instance');
    }
  }
  
  private handleWorkerMessage(workerInstance: WorkerInstance, result: ProcessingResult): void {
    const pendingTaskIndex = this.pendingTasks.findIndex(
      task => task.task.id === result.id
    );
    
    if (pendingTaskIndex !== -1) {
      const pendingTask = this.pendingTasks[pendingTaskIndex];
      this.pendingTasks.splice(pendingTaskIndex, 1);
      
      if (result.success) {
        pendingTask.resolve(result);
      } else {
        pendingTask.reject(new Error(result.error || 'Worker processing failed'));
      }
    }
    
    // Mark worker as available
    workerInstance.busy = false;
    workerInstance.currentTaskId = null;
    workerInstance.tasksCompleted++;
    workerInstance.lastUsed = Date.now();
    
    // Process next pending task
    this.processPendingTasks();
  }
  
  private handleWorkerError(workerInstance: WorkerInstance, error: ErrorEvent): void {
    console.error('Worker error:', error);
    
    // Find and reject the current task
    if (workerInstance.currentTaskId) {
      const pendingTaskIndex = this.pendingTasks.findIndex(
        task => task.task.id === workerInstance.currentTaskId
      );
      
      if (pendingTaskIndex !== -1) {
        const pendingTask = this.pendingTasks[pendingTaskIndex];
        this.pendingTasks.splice(pendingTaskIndex, 1);
        pendingTask.reject(new Error(`Worker error: ${error.message}`));
      }
    }
    
    // Remove the failed worker and create a new one
    const index = this.workers.indexOf(workerInstance);
    if (index !== -1) {
      workerInstance.worker.terminate();
      this.workers.splice(index, 1);
      
      // Create a replacement worker if we have pending tasks
      if (this.pendingTasks.length > 0) {
        this.createWorker();
        this.processPendingTasks();
      }
    }
  }
  
  private processPendingTasks(): void {
    if (this.pendingTasks.length === 0) return;
    
    // Find available workers
    const availableWorkers = this.workers.filter(w => !w.busy);
    
    // Scale up if needed
    if (availableWorkers.length === 0 && this.workers.length < this.maxWorkers) {
      this.scaleUp();
      return; // Will be called again after worker creation
    }
    
    // Assign tasks to available workers
    for (let i = 0; i < Math.min(availableWorkers.length, this.pendingTasks.length); i++) {
      const worker = availableWorkers[i];
      const pendingTask = this.pendingTasks.shift()!;
      
      worker.busy = true;
      worker.currentTaskId = pendingTask.task.id;
      worker.lastUsed = Date.now();
      
      worker.worker.postMessage(pendingTask.task);
    }
  }
}

/**
 * High-level image processing service using worker pool
 */
export class ImageProcessingService {
  private workerPool: WorkerPoolService;
  
  constructor(maxWorkers?: number) {
    this.workerPool = new WorkerPoolService(maxWorkers);
  }
  
  /**
   * Apply a mask to an image
   */
  async applyMask(imageData: ImageData, maskData: ImageData): Promise<ImageData> {
    const result = await this.workerPool.processTask('apply-mask', {
      imageData,
      maskData
    });
    
    if (!result.imageData) {
      throw new Error('Failed to apply mask');
    }
    
    return result.imageData;
  }
  
  /**
   * Blend two images
   */
  async blendImages(
    originalData: ImageData,
    processedData: ImageData,
    blendMode: string = 'normal',
    opacity: number = 1.0
  ): Promise<ImageData> {
    const result = await this.workerPool.processTask('blend-images', {
      originalData,
      processedData,
      params: { blendMode, opacity }
    });
    
    if (!result.imageData) {
      throw new Error('Failed to blend images');
    }
    
    return result.imageData;
  }
  
  /**
   * Detect edges in an image
   */
  async detectEdges(imageData: ImageData, threshold: number = 50): Promise<ImageData> {
    const result = await this.workerPool.processTask('edge-detection', {
      imageData,
      params: { threshold }
    });
    
    if (!result.imageData) {
      throw new Error('Failed to detect edges');
    }
    
    return result.imageData;
  }
  
  /**
   * Replace colors in an image
   */
  async replaceColor(
    imageData: ImageData,
    targetColor: [number, number, number],
    replaceColor: [number, number, number],
    tolerance: number = 10
  ): Promise<ImageData> {
    const result = await this.workerPool.processTask('color-replace', {
      imageData,
      params: { targetColor, replaceColor, tolerance }
    });
    
    if (!result.imageData) {
      throw new Error('Failed to replace color');
    }
    
    return result.imageData;
  }
  
  /**
   * Get processing statistics
   */
  getStats() {
    return this.workerPool.getStats();
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.workerPool.destroy();
  }
}

// Singleton instance
export const imageProcessingService = new ImageProcessingService();