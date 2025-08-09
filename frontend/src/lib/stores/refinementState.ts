/**
 * Refinement State Management
 * Handles state for the dedicated /refine page including images, tools, and navigation
 */

import { writable, derived, get } from 'svelte/store';

// Refinement state interface
export interface RefinementState {
  originalImage: string | null;
  processedImage: string | null;
  currentEditSession: string | null;
  sessionId: string | null;
  hasUnsavedChanges: boolean;
  isProcessing: boolean;
  isInitialized: boolean;
  
  // Tool state
  currentTool: 'erase' | 'smart-restore' | 'precision-erase' | 'edge-refine' | 'smart-background-erase' | 'smart-background-restore';
  brushSize: number;
  backgroundSensitivity: number;
  edgeRefinement: number;
  backgroundTolerance: number;
  
  // Canvas state
  canvasWidth: number;
  canvasHeight: number;
  canvasScale: number;
  
  // UI state
  showOriginalPreview: boolean;
  showToolInfo: boolean;
  showShortcutHelp: boolean;
  controlsCollapsed: boolean;
  
  // Performance state
  performanceMode: boolean;
  processingThrottleDelay: number;
}

// Navigation state interface
export interface NavigationState {
  returnUrl: string;
  imageSessionId: string | null;
  entryPoint: 'main-page' | 'direct-link' | 'refresh';
}

// Default refinement state
const defaultRefinementState: RefinementState = {
  originalImage: null,
  processedImage: null,
  currentEditSession: null,
  sessionId: null,
  hasUnsavedChanges: false,
  isProcessing: false,
  isInitialized: false,
  
  // Tool defaults
  currentTool: 'smart-restore',
  brushSize: 20,
  backgroundSensitivity: 50,
  edgeRefinement: 50,
  backgroundTolerance: 10,
  
  // Canvas defaults
  canvasWidth: 600,
  canvasHeight: 400,
  canvasScale: 1,
  
  // UI defaults
  showOriginalPreview: false,
  showToolInfo: false,
  showShortcutHelp: false,
  controlsCollapsed: false,
  
  // Performance defaults
  performanceMode: false,
  processingThrottleDelay: 16
};

// Default navigation state
const defaultNavigationState: NavigationState = {
  returnUrl: '/',
  imageSessionId: null,
  entryPoint: 'main-page'
};

// Create stores
export const refinementState = writable<RefinementState>(defaultRefinementState);
export const refinementNavigation = writable<NavigationState>(defaultNavigationState);

// Derived stores for computed values
export const refinementCanvas = derived(
  refinementState,
  ($state) => ({
    displayBrushSize: Math.max(12, Math.round($state.brushSize * $state.canvasScale)),
    isCanvasReady: $state.originalImage !== null && $state.processedImage !== null,
    optimalCanvasSize: calculateOptimalCanvasSize(
      $state.canvasWidth,
      $state.canvasHeight,
      { width: window?.innerWidth || 1200, height: window?.innerHeight || 800 }
    )
  })
);

export const refinementTools = derived(
  refinementState,
  ($state) => ({
    toolConfig: getToolConfiguration($state.currentTool),
    isAdvancedTool: ['precision-erase', 'edge-refine', 'smart-background-erase', 'smart-background-restore'].includes($state.currentTool),
    needsBackgroundSensitivity: ['smart-background-erase', 'smart-background-restore'].includes($state.currentTool),
    needsEdgeRefinement: $state.currentTool === 'edge-refine'
  })
);

// Actions for refinement state management
export const refinementActions = {
  // Initialize refinement with session data
  async initialize(data: { originalImage: string; processedImage: string; sessionId: string }) {
    refinementState.update(state => ({
      ...state,
      originalImage: data.originalImage,
      processedImage: data.processedImage,
      sessionId: data.sessionId,
      hasUnsavedChanges: false,
      isInitialized: true
    }));
  },

  // Image management
  setImages(originalImage: string, processedImage: string) {
    refinementState.update(state => ({
      ...state,
      originalImage,
      processedImage,
      hasUnsavedChanges: false
    }));
  },
  
  updateProcessedImage(processedImage: string) {
    refinementState.update(state => ({
      ...state,
      processedImage,
      hasUnsavedChanges: true
    }));
  },
  
  // Tool management
  setTool(tool: RefinementState['currentTool']) {
    refinementState.update(state => ({
      ...state,
      currentTool: tool,
      hasUnsavedChanges: true
    }));
  },
  
  setBrushSize(size: number) {
    refinementState.update(state => ({
      ...state,
      brushSize: Math.max(1, Math.min(100, size))
    }));
  },
  
  setBackgroundSensitivity(sensitivity: number) {
    refinementState.update(state => ({
      ...state,
      backgroundSensitivity: Math.max(0, Math.min(100, sensitivity)),
      hasUnsavedChanges: true
    }));
  },
  
  setEdgeRefinement(refinement: number) {
    refinementState.update(state => ({
      ...state,
      edgeRefinement: Math.max(0, Math.min(100, refinement)),
      hasUnsavedChanges: true
    }));
  },
  
  setBackgroundTolerance(tolerance: number) {
    refinementState.update(state => ({
      ...state,
      backgroundTolerance: Math.max(1, Math.min(50, tolerance)),
      hasUnsavedChanges: true
    }));
  },
  
  // Canvas management
  setCanvasSize(width: number, height: number, scale: number = 1) {
    refinementState.update(state => ({
      ...state,
      canvasWidth: width,
      canvasHeight: height,
      canvasScale: scale
    }));
  },
  
  // UI management
  toggleOriginalPreview() {
    refinementState.update(state => ({
      ...state,
      showOriginalPreview: !state.showOriginalPreview
    }));
  },
  
  setToolInfo(show: boolean) {
    refinementState.update(state => ({
      ...state,
      showToolInfo: show
    }));
  },
  
  toggleShortcutHelp() {
    refinementState.update(state => ({
      ...state,
      showShortcutHelp: !state.showShortcutHelp
    }));
  },
  
  toggleControlsCollapsed() {
    refinementState.update(state => ({
      ...state,
      controlsCollapsed: !state.controlsCollapsed
    }));
  },
  
  // Processing management
  setProcessing(isProcessing: boolean) {
    refinementState.update(state => ({
      ...state,
      isProcessing
    }));
  },
  
  markSaved() {
    refinementState.update(state => ({
      ...state,
      hasUnsavedChanges: false
    }));
  },
  
  // Performance management
  setPerformanceMode(enabled: boolean) {
    refinementState.update(state => ({
      ...state,
      performanceMode: enabled,
      processingThrottleDelay: enabled ? 32 : 16 // Reduce update frequency in performance mode
    }));
  },
  
  // Reset
  reset() {
    refinementState.set(defaultRefinementState);
    refinementNavigation.set(defaultNavigationState);
  }
};

// Navigation actions
export const navigationActions = {
  setReturnUrl(url: string) {
    refinementNavigation.update(nav => ({
      ...nav,
      returnUrl: url
    }));
  },
  
  setImageSession(sessionId: string) {
    refinementNavigation.update(nav => ({
      ...nav,
      imageSessionId: sessionId
    }));
  },
  
  setEntryPoint(entryPoint: NavigationState['entryPoint']) {
    refinementNavigation.update(nav => ({
      ...nav,
      entryPoint
    }));
  }
};

// Utility functions
function calculateOptimalCanvasSize(
  imageWidth: number,
  imageHeight: number,
  viewport: { width: number; height: number }
): { width: number; height: number; scale: number } {
  const isMobile = viewport.width <= 768;
  const maxWidth = viewport.width - (isMobile ? 16 : 64);
  const maxHeight = viewport.height - (isMobile ? 120 : 160);
  
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
  
  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
    scale
  };
}

function getToolConfiguration(tool: RefinementState['currentTool']) {
  const configs = {
    'erase': {
      name: 'Erase',
      description: 'Remove unwanted parts of the foreground',
      cursor: 'crosshair',
      blendMode: 'destination-out'
    },
    'smart-restore': {
      name: 'Smart Restore',
      description: 'Intelligently restore background-removed areas',
      cursor: 'crosshair',
      blendMode: 'source-over'
    },
    'precision-erase': {
      name: 'Precision Erase',
      description: 'Fine-tuned erasing with edge detection',
      cursor: 'crosshair',
      blendMode: 'destination-out'
    },
    'edge-refine': {
      name: 'Edge Refine',
      description: 'Smooth and refine edges with advanced algorithms',
      cursor: 'crosshair',
      blendMode: 'source-over'
    },
    'smart-background-erase': {
      name: 'Smart Background Erase',
      description: 'Remove background with intelligent color detection',
      cursor: 'crosshair',
      blendMode: 'destination-out'
    },
    'smart-background-restore': {
      name: 'Smart Background Restore',
      description: 'Restore background with color-aware algorithms',
      cursor: 'crosshair',
      blendMode: 'source-over'
    }
  };
  
  return configs[tool] || configs['smart-restore'];
}

// Import keyboard service types
import type { KeyboardShortcut } from '../services/keyboardService';
import { ShortcutCategories } from '../services/keyboardService';

// Comprehensive keyboard shortcuts configuration
export function createKeyboardShortcuts(): KeyboardShortcut[] {
  return [
    // Tool shortcuts
    {
      key: 'b',
      action: () => refinementActions.setTool('smart-restore'),
      description: 'Smart Restore Brush',
      category: ShortcutCategories.TOOL
    },
    {
      key: 'e',
      action: () => refinementActions.setTool('erase'),
      description: 'Erase Tool',
      category: ShortcutCategories.TOOL
    },
    {
      key: 'r',
      action: () => refinementActions.setTool('smart-background-restore'),
      description: 'Smart Background Restore',
      category: ShortcutCategories.TOOL
    },
    {
      key: 'p',
      action: () => refinementActions.setTool('precision-erase'),
      description: 'Precision Erase',
      category: ShortcutCategories.TOOL
    },
    {
      key: 'f',
      action: () => refinementActions.setTool('edge-refine'),
      description: 'Edge Refine',
      category: ShortcutCategories.TOOL
    },
    {
      key: 'g',
      action: () => refinementActions.setTool('smart-background-erase'),
      description: 'Smart Background Erase',
      category: ShortcutCategories.TOOL
    },
    
    // Canvas shortcuts
    {
      key: 'z',
      ctrl: true,
      action: () => {
        // Undo functionality (to be implemented in canvas component)
        window.dispatchEvent(new CustomEvent('refinement-undo'));
      },
      description: 'Undo last action',
      category: ShortcutCategories.CANVAS
    },
    {
      key: 'y',
      ctrl: true,
      action: () => {
        // Redo functionality (to be implemented in canvas component)
        window.dispatchEvent(new CustomEvent('refinement-redo'));
      },
      description: 'Redo last action',
      category: ShortcutCategories.CANVAS
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => {
        // Alternative redo shortcut
        window.dispatchEvent(new CustomEvent('refinement-redo'));
      },
      description: 'Redo last action',
      category: ShortcutCategories.CANVAS
    },
    {
      key: 'space',
      action: () => refinementActions.toggleOriginalPreview(),
      description: 'Toggle original preview',
      category: ShortcutCategories.CANVAS
    },
    {
      key: '+',
      action: () => {
        refinementState.update(state => ({
          ...state,
          brushSize: Math.min(100, state.brushSize + 5)
        }));
      },
      description: 'Increase brush size',
      category: ShortcutCategories.CANVAS
    },
    {
      key: '-',
      action: () => {
        refinementState.update(state => ({
          ...state,
          brushSize: Math.max(1, state.brushSize - 5)
        }));
      },
      description: 'Decrease brush size',
      category: ShortcutCategories.CANVAS
    },
    {
      key: '[',
      action: () => {
        refinementState.update(state => ({
          ...state,
          brushSize: Math.max(1, state.brushSize - 2)
        }));
      },
      description: 'Decrease brush size (fine)',
      category: ShortcutCategories.CANVAS
    },
    {
      key: ']',
      action: () => {
        refinementState.update(state => ({
          ...state,
          brushSize: Math.min(100, state.brushSize + 2)
        }));
      },
      description: 'Increase brush size (fine)',
      category: ShortcutCategories.CANVAS
    },
    
    // UI shortcuts
    {
      key: 'h',
      action: () => refinementActions.toggleShortcutHelp(),
      description: 'Show/hide keyboard shortcuts',
      category: ShortcutCategories.UI
    },
    {
      key: 'i',
      action: () => refinementActions.setToolInfo(!get(refinementState).showToolInfo),
      description: 'Show/hide tool information',
      category: ShortcutCategories.UI
    },
    {
      key: 'c',
      action: () => refinementActions.toggleControlsCollapsed(),
      description: 'Collapse/expand controls',
      category: ShortcutCategories.UI
    },
    {
      key: 'escape',
      action: () => {
        refinementState.update(state => ({
          ...state,
          showShortcutHelp: false,
          showToolInfo: false
        }));
      },
      description: 'Close dialogs and overlays',
      category: ShortcutCategories.UI
    },
    
    // Navigation shortcuts
    {
      key: 'enter',
      ctrl: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('refinement-complete'));
      },
      description: 'Complete refinement',
      category: ShortcutCategories.NAVIGATION
    },
    {
      key: 'escape',
      shift: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('refinement-cancel'));
      },
      description: 'Cancel refinement',
      category: ShortcutCategories.NAVIGATION
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('refinement-save'));
      },
      description: 'Save current state',
      category: ShortcutCategories.NAVIGATION
    }
  ];
}

// Legacy shortcuts object for backward compatibility
export const keyboardShortcuts = createKeyboardShortcuts().reduce((acc, shortcut) => {
  const key = shortcut.ctrl ? `ctrl+${shortcut.key}` : 
              shortcut.shift ? `shift+${shortcut.key}` : 
              shortcut.alt ? `alt+${shortcut.key}` : shortcut.key;
  acc[key] = shortcut.action;
  return acc;
}, {} as Record<string, () => void>);

// Auto-detect performance mode based on device capabilities
if (typeof window !== 'undefined') {
  const isLowEndDevice = () => {
    // Check for indicators of low-end devices
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const userAgent = navigator.userAgent.toLowerCase();
    
    return (
      (memory && memory <= 2) ||
      (cores && cores <= 2) ||
      userAgent.includes('android') && userAgent.includes('chrome/') ||
      /mobile|tablet|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    );
  };
  
  if (isLowEndDevice()) {
    refinementActions.setPerformanceMode(true);
  }
}