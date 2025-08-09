/**
 * Input State Machine for Unified Input Interface
 * Manages the complex state transitions for drag-drop/paste/upload workflow
 * Implements Chloe's seamless workflow requirements
 */

import { writable, derived } from 'svelte/store';
import type { ImageData } from '../types/app';

export type InputMethod = 'none' | 'drag' | 'paste' | 'upload' | 'drop';
export type InputState = 'idle' | 'hover' | 'active' | 'processing' | 'success' | 'error';

export interface InputStateData {
  currentState: InputState;
  inputMethod: InputMethod;
  isDragActive: boolean;
  isClipboardReady: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  canAcceptInput: boolean;
  showPasteHint: boolean;
}

export interface InputTransition {
  from: InputState;
  to: InputState;
  trigger: string;
  method?: InputMethod;
}

// Core input state
export const inputState = writable<InputStateData>({
  currentState: 'idle',
  inputMethod: 'none',
  isDragActive: false,
  isClipboardReady: false,
  errorMessage: null,
  successMessage: null,
  canAcceptInput: true,
  showPasteHint: true
});

// Derived states for UI components
export const inputStatus = derived(inputState, ($state) => ({
  isIdle: $state.currentState === 'idle',
  isActive: $state.currentState === 'active' || $state.isDragActive,
  isProcessing: $state.currentState === 'processing',
  hasError: $state.currentState === 'error',
  hasSuccess: $state.currentState === 'success',
  showDropZone: $state.canAcceptInput && ['idle', 'hover', 'active'].includes($state.currentState)
}));

// Input method tracking
export const inputAnalytics = writable({
  dragEvents: 0,
  pasteEvents: 0,
  uploadEvents: 0,
  successfulInputs: 0,
  failedInputs: 0,
  averageInputTime: 0
});

/**
 * State machine transitions configuration
 */
const validTransitions: InputTransition[] = [
  // From idle
  { from: 'idle', to: 'hover', trigger: 'DRAG_ENTER' },
  { from: 'idle', to: 'active', trigger: 'PASTE_READY', method: 'paste' },
  { from: 'idle', to: 'active', trigger: 'UPLOAD_CLICK', method: 'upload' },
  { from: 'idle', to: 'processing', trigger: 'FILE_SELECTED' },
  
  // From hover
  { from: 'hover', to: 'idle', trigger: 'DRAG_LEAVE' },
  { from: 'hover', to: 'active', trigger: 'DRAG_OVER' },
  { from: 'hover', to: 'hover', trigger: 'DRAG_ENTER' }, // Stay in hover on repeated drag enter
  { from: 'hover', to: 'processing', trigger: 'DROP', method: 'drop' },
  
  // From active
  { from: 'active', to: 'idle', trigger: 'CANCEL' },
  { from: 'active', to: 'processing', trigger: 'FILE_SELECTED' },
  { from: 'active', to: 'processing', trigger: 'DROP', method: 'drop' },
  { from: 'active', to: 'active', trigger: 'DRAG_OVER' }, // Stay active on repeated drag over
  { from: 'active', to: 'hover', trigger: 'DRAG_LEAVE' },
  { from: 'active', to: 'success', trigger: 'PROCESS_COMPLETE' }, // Direct success from active
  { from: 'active', to: 'error', trigger: 'PROCESS_ERROR' }, // Direct error from active
  
  // From processing
  { from: 'processing', to: 'success', trigger: 'PROCESS_COMPLETE' },
  { from: 'processing', to: 'error', trigger: 'PROCESS_ERROR' },
  
  // From success
  { from: 'success', to: 'idle', trigger: 'RESET' },
  { from: 'success', to: 'processing', trigger: 'PROCESS_ANOTHER' },
  
  // From error
  { from: 'error', to: 'idle', trigger: 'RESET' },
  { from: 'error', to: 'processing', trigger: 'RETRY' }
];

/**
 * Input State Machine Actions
 */
export const inputActions = {
  // Core state transitions
  transition(trigger: string, method?: InputMethod, data?: Partial<InputStateData>) {
    inputState.update(current => {
      const validTransition = validTransitions.find(
        t => t.from === current.currentState && t.trigger === trigger
      );

      if (!validTransition) {
        console.warn(`Invalid transition: ${current.currentState} -> ${trigger}`);
        return current;
      }

      const newState: InputStateData = {
        ...current,
        currentState: validTransition.to,
        inputMethod: validTransition.method || method || current.inputMethod,
        errorMessage: validTransition.to !== 'error' ? null : current.errorMessage,
        successMessage: validTransition.to !== 'success' ? null : current.successMessage,
        ...data
      };

      // Log transition for debugging
      console.log(`Input state: ${current.currentState} -> ${newState.currentState} (${trigger})`);
      
      return newState;
    });
  },

  // Drag and drop actions
  dragEnter() {
    inputActions.transition('DRAG_ENTER');
    inputState.update(state => ({ ...state, isDragActive: true }));
  },

  dragLeave() {
    inputActions.transition('DRAG_LEAVE');
    inputState.update(state => ({ ...state, isDragActive: false }));
  },

  dragOver() {
    inputActions.transition('DRAG_OVER');
  },

  drop(files: File[]) {
    if (files.length === 0) return;
    
    inputActions.transition('DROP', 'drop');
    inputState.update(state => ({ 
      ...state, 
      isDragActive: false,
      canAcceptInput: false 
    }));
    
    // Track analytics
    inputAnalytics.update(analytics => ({
      ...analytics,
      dragEvents: analytics.dragEvents + 1
    }));
  },

  // Clipboard actions
  pasteReady() {
    inputActions.transition('PASTE_READY', 'paste');
  },

  paste() {
    inputActions.transition('FILE_SELECTED', 'paste');
    inputState.update(state => ({ ...state, canAcceptInput: false }));
    
    // Track analytics
    inputAnalytics.update(analytics => ({
      ...analytics,
      pasteEvents: analytics.pasteEvents + 1
    }));
  },

  // Upload actions
  uploadClick() {
    inputActions.transition('UPLOAD_CLICK', 'upload');
  },

  uploadSelected(file: File) {
    inputActions.transition('FILE_SELECTED', 'upload');
    inputState.update(state => ({ ...state, canAcceptInput: false }));
    
    // Track analytics
    inputAnalytics.update(analytics => ({
      ...analytics,
      uploadEvents: analytics.uploadEvents + 1
    }));
  },

  // Processing actions
  startProcessing() {
    inputActions.transition('FILE_SELECTED');
  },

  completeProcessing(successMessage: string = 'Processing complete!') {
    inputActions.transition('PROCESS_COMPLETE');
    inputState.update(state => ({ 
      ...state, 
      successMessage,
      canAcceptInput: true 
    }));
    
    // Track success
    inputAnalytics.update(analytics => ({
      ...analytics,
      successfulInputs: analytics.successfulInputs + 1
    }));
  },

  errorProcessing(errorMessage: string) {
    inputActions.transition('PROCESS_ERROR');
    inputState.update(state => ({ 
      ...state, 
      errorMessage,
      canAcceptInput: true 
    }));
    
    // Track failure
    inputAnalytics.update(analytics => ({
      ...analytics,
      failedInputs: analytics.failedInputs + 1
    }));
  },

  // Reset actions
  reset() {
    inputActions.transition('RESET');
    inputState.update(state => ({
      ...state,
      inputMethod: 'none',
      isDragActive: false,
      errorMessage: null,
      successMessage: null,
      canAcceptInput: true
    }));
  },

  processAnother() {
    inputActions.transition('PROCESS_ANOTHER');
    inputState.update(state => ({
      ...state,
      inputMethod: 'none',
      isDragActive: false,
      errorMessage: null,
      successMessage: null,
      canAcceptInput: true
    }));
  },

  retry() {
    inputActions.transition('RETRY');
    inputState.update(state => ({
      ...state,
      errorMessage: null,
      canAcceptInput: true
    }));
  },

  // Clipboard readiness detection
  setClipboardReady(ready: boolean) {
    inputState.update(state => ({ 
      ...state, 
      isClipboardReady: ready,
      showPasteHint: ready
    }));
  },

  // Validation and error handling
  validateInput(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large (max 10MB)' };
    }
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Unsupported file type' };
    }
    
    return { valid: true };
  }
};

/**
 * Input State Machine Utilities
 */
export const inputUtils = {
  // Get current state snapshot
  getCurrentState(): Promise<InputStateData> {
    return new Promise((resolve) => {
      const unsubscribe = inputState.subscribe((state) => {
        unsubscribe();
        resolve(state);
      });
    });
  },

  // Check if transition is valid
  canTransition(from: InputState, trigger: string): boolean {
    return validTransitions.some(t => t.from === from && t.trigger === trigger);
  },

  // Get analytics summary
  getAnalyticsSummary() {
    return new Promise((resolve) => {
      const unsubscribe = inputAnalytics.subscribe((analytics) => {
        unsubscribe();
        const total = analytics.dragEvents + analytics.pasteEvents + analytics.uploadEvents;
        const successRate = total > 0 ? (analytics.successfulInputs / total) * 100 : 0;
        
        resolve({
          ...analytics,
          totalInputs: total,
          successRate: Math.round(successRate),
          mostUsedMethod: analytics.dragEvents > analytics.pasteEvents 
            ? (analytics.dragEvents > analytics.uploadEvents ? 'drag' : 'upload')
            : (analytics.pasteEvents > analytics.uploadEvents ? 'paste' : 'upload')
        });
      });
    });
  },

  // Debug helpers
  logCurrentState() {
    inputState.subscribe((state) => {
      console.log('Input State:', state);
    })();
  },

  exportStateHistory(): string {
    // In a real implementation, we'd maintain a history array
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      message: 'State history export not implemented in MVP'
    });
  }
};

// Initialize clipboard detection on load
if (typeof window !== 'undefined') {
  // Check clipboard support
  const clipboardSupported = !!(navigator.clipboard && navigator.clipboard.read);
  inputActions.setClipboardReady(clipboardSupported);
}