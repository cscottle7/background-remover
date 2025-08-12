/**
 * Graceful Degradation Service
 * Provides fallback functionality for unsupported browser features
 * Ensures Chloe's workflow remains intact across all browsers
 */

import { browserCompatibilityTester, type CompatibilityTestResult } from '../utils/browserCompatibility';

export interface DegradationConfig {
  clipboardFallback: boolean;
  dragDropFallback: boolean;
  performanceFallback: boolean;
  formatFallback: boolean;
  notificationFallback: boolean;
}

export interface FallbackStrategies {
  clipboard: ClipboardFallback;
  dragDrop: DragDropFallback;
  imageProcessing: ImageProcessingFallback;
  notifications: NotificationFallback;
}

export interface ClipboardFallback {
  strategy: 'manual-upload' | 'show-instructions' | 'disable-feature';
  showPasteButton: boolean;
  showInstructions: boolean;
  manualUploadPrompt: string;
}

export interface DragDropFallback {
  strategy: 'file-input' | 'enhanced-upload' | 'disable-feature';
  showUploadButton: boolean;
  showDropZone: boolean;
  visualEnhancements: boolean;
}

export interface ImageProcessingFallback {
  strategy: 'compress-client' | 'server-processing' | 'format-conversion';
  maxFileSize: number;
  supportedFormats: string[];
  compressionQuality: number;
}

export interface NotificationFallback {
  strategy: 'toast' | 'inline' | 'modal';
  duration: number;
  position: 'top' | 'bottom' | 'center';
}

export class GracefulDegradationService {
  private static instance: GracefulDegradationService;
  private compatibilityResult: CompatibilityTestResult | null = null;
  private fallbackStrategies: FallbackStrategies | null = null;
  private config: DegradationConfig = {
    clipboardFallback: true,
    dragDropFallback: true,
    performanceFallback: true,
    formatFallback: true,
    notificationFallback: true
  };

  private constructor() {}

  static getInstance(): GracefulDegradationService {
    if (!GracefulDegradationService.instance) {
      GracefulDegradationService.instance = new GracefulDegradationService();
    }
    return GracefulDegradationService.instance;
  }

  /**
   * Initialize degradation service with browser compatibility results
   */
  async initialize(): Promise<void> {
    this.compatibilityResult = await browserCompatibilityTester.runFullCompatibilityTest();
    this.fallbackStrategies = this.generateFallbackStrategies();
    
    console.log('Graceful degradation initialized:', {
      compatibility: this.compatibilityResult.overallCompatibility,
      score: this.compatibilityResult.score,
      fallbacks: this.fallbackStrategies
    });
  }

  /**
   * Get clipboard fallback configuration
   */
  getClipboardFallback(): ClipboardFallback {
    if (!this.fallbackStrategies) {
      return this.getDefaultClipboardFallback();
    }
    return this.fallbackStrategies.clipboard;
  }

  /**
   * Get drag and drop fallback configuration
   */
  getDragDropFallback(): DragDropFallback {
    if (!this.fallbackStrategies) {
      return this.getDefaultDragDropFallback();
    }
    return this.fallbackStrategies.dragDrop;
  }

  /**
   * Get image processing fallback configuration
   */
  getImageProcessingFallback(): ImageProcessingFallback {
    if (!this.fallbackStrategies) {
      return this.getDefaultImageProcessingFallback();
    }
    return this.fallbackStrategies.imageProcessing;
  }

  /**
   * Check if clipboard is supported with current fallbacks
   */
  isClipboardSupported(): boolean {
    if (!this.compatibilityResult) return false;
    
    const clipboard = this.compatibilityResult.tests.clipboardTests;
    return clipboard.basicSupport && clipboard.imageHandling;
  }

  /**
   * Check if drag and drop is supported with current fallbacks
   */
  isDragDropSupported(): boolean {
    if (!this.compatibilityResult) return false;
    
    const dragDrop = this.compatibilityResult.tests.dragDropTests;
    return dragDrop.basicDragDrop && dragDrop.fileHandling;
  }

  /**
   * Get user-friendly compatibility message
   */
  getCompatibilityMessage(): string {
    if (!this.compatibilityResult) {
      return 'Checking browser compatibility...';
    }

    const { overallCompatibility, score } = this.compatibilityResult;
    
    switch (overallCompatibility) {
      case 'excellent':
        return 'All features supported! You can use drag-and-drop, clipboard paste, and all shortcuts.';
      case 'good':
        return 'Most features supported! Some advanced features may have fallbacks.';
      case 'limited':
        return 'Basic features supported. Some functionality will use alternative methods.';
      case 'poor':
        return 'Limited browser support detected. Using compatibility mode for best experience.';
      default:
        return 'Browser compatibility unknown.';
    }
  }

  /**
   * Generate fallback strategies based on compatibility results
   */
  private generateFallbackStrategies(): FallbackStrategies {
    if (!this.compatibilityResult) {
      return this.getDefaultFallbackStrategies();
    }

    const { tests, capabilities } = this.compatibilityResult;

    return {
      clipboard: this.generateClipboardFallback(tests.clipboardTests, capabilities.browser),
      dragDrop: this.generateDragDropFallback(tests.dragDropTests, capabilities.browser),
      imageProcessing: this.generateImageProcessingFallback(tests.imageProcessingTests),
      notifications: this.generateNotificationFallback(capabilities.browser)
    };
  }

  /**
   * Generate clipboard fallback strategy
   */
  private generateClipboardFallback(clipboardTests: any, browser: string): ClipboardFallback {
    if (clipboardTests.basicSupport && clipboardTests.imageHandling) {
      return {
        strategy: 'manual-upload',
        showPasteButton: true,
        showInstructions: false,
        manualUploadPrompt: 'Paste or upload your image'
      };
    }

    if (clipboardTests.basicSupport) {
      return {
        strategy: 'show-instructions',
        showPasteButton: true,
        showInstructions: true,
        manualUploadPrompt: 'Your browser supports text paste. For images, please use the upload button.'
      };
    }

    return {
      strategy: 'manual-upload',
      showPasteButton: false,
      showInstructions: true,
      manualUploadPrompt: 'Please use the upload button to select your image file.'
    };
  }

  /**
   * Generate drag and drop fallback strategy
   */
  private generateDragDropFallback(dragDropTests: any, browser: string): DragDropFallback {
    if (dragDropTests.basicDragDrop && dragDropTests.fileHandling) {
      return {
        strategy: 'enhanced-upload',
        showUploadButton: true,
        showDropZone: true,
        visualEnhancements: dragDropTests.visualFeedback
      };
    }

    if (dragDropTests.basicDragDrop) {
      return {
        strategy: 'file-input',
        showUploadButton: true,
        showDropZone: true,
        visualEnhancements: false
      };
    }

    return {
      strategy: 'file-input',
      showUploadButton: true,
      showDropZone: false,
      visualEnhancements: false
    };
  }

  /**
   * Generate image processing fallback strategy
   */
  private generateImageProcessingFallback(imageTests: any): ImageProcessingFallback {
    const supportedFormats = imageTests.imageFormats || ['jpeg', 'png'];
    
    if (imageTests.canvasManipulation && imageTests.performanceOK) {
      return {
        strategy: 'compress-client',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats,
        compressionQuality: 0.8
      };
    }

    if (imageTests.canvasManipulation) {
      return {
        strategy: 'format-conversion',
        maxFileSize: 5 * 1024 * 1024, // 5MB
        supportedFormats,
        compressionQuality: 0.9
      };
    }

    return {
      strategy: 'server-processing',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedFormats: ['jpeg', 'png'], // Basic formats only
      compressionQuality: 1.0
    };
  }

  /**
   * Generate notification fallback strategy
   */
  private generateNotificationFallback(browser: string): NotificationFallback {
    // Safari and older browsers prefer different notification styles
    if (browser === 'Safari' || browser === 'Unknown') {
      return {
        strategy: 'modal',
        duration: 4000,
        position: 'center'
      };
    }

    return {
      strategy: 'toast',
      duration: 3000,
      position: 'top'
    };
  }

  /**
   * Default fallback strategies for uninitialized service
   */
  private getDefaultFallbackStrategies(): FallbackStrategies {
    return {
      clipboard: this.getDefaultClipboardFallback(),
      dragDrop: this.getDefaultDragDropFallback(),
      imageProcessing: this.getDefaultImageProcessingFallback(),
      notifications: {
        strategy: 'toast',
        duration: 3000,
        position: 'top'
      }
    };
  }

  private getDefaultClipboardFallback(): ClipboardFallback {
    return {
      strategy: 'manual-upload',
      showPasteButton: true,
      showInstructions: false,
      manualUploadPrompt: 'Upload or paste your image'
    };
  }

  private getDefaultDragDropFallback(): DragDropFallback {
    return {
      strategy: 'enhanced-upload',
      showUploadButton: true,
      showDropZone: true,
      visualEnhancements: true
    };
  }

  private getDefaultImageProcessingFallback(): ImageProcessingFallback {
    return {
      strategy: 'compress-client',
      maxFileSize: 10 * 1024 * 1024,
      supportedFormats: ['jpeg', 'png', 'webp'],
      compressionQuality: 0.8
    };
  }

  /**
   * Apply clipboard fallback to file handling
   */
  async handleClipboardFallback(): Promise<File | null> {
    const fallback = this.getClipboardFallback();
    
    switch (fallback.strategy) {
      case 'manual-upload':
        return this.promptForFileUpload();
      case 'show-instructions':
        this.showClipboardInstructions();
        return null;
      case 'disable-feature':
        return null;
      default:
        return this.promptForFileUpload();
    }
  }

  /**
   * Apply drag and drop fallback
   */
  handleDragDropFallback(files: FileList): Promise<File[]> {
    const fallback = this.getDragDropFallback();
    
    switch (fallback.strategy) {
      case 'enhanced-upload':
        return this.processFilesWithEnhancements(files);
      case 'file-input':
        return this.processFilesBasic(files);
      case 'disable-feature':
        return Promise.resolve([]);
      default:
        return this.processFilesBasic(files);
    }
  }

  /**
   * Prompt for manual file upload
   */
  private promptForFileUpload(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        resolve(file);
      };
      input.click();
    });
  }

  /**
   * Show clipboard instructions to user
   */
  private showClipboardInstructions(): void {
    // This would integrate with the notification system
    console.log('Clipboard paste not fully supported. Please use the upload button.');
  }

  /**
   * Process files with enhancements
   */
  private async processFilesWithEnhancements(files: FileList): Promise<File[]> {
    const fallback = this.getImageProcessingFallback();
    const processedFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > fallback.maxFileSize) {
        console.warn(`File ${file.name} exceeds size limit`);
        continue;
      }

      // Check format support
      const fileType = file.type.replace('image/', '');
      if (!fallback.supportedFormats.includes(fileType)) {
        console.warn(`File format ${fileType} not supported`);
        continue;
      }

      processedFiles.push(file);
    }

    return processedFiles;
  }

  /**
   * Process files with basic validation
   */
  private async processFilesBasic(files: FileList): Promise<File[]> {
    return Array.from(files).filter(file => 
      file.type.startsWith('image/') && 
      file.size <= 10 * 1024 * 1024 // 10MB limit
    );
  }

  /**
   * Get compatibility score
   */
  getCompatibilityScore(): number {
    return this.compatibilityResult?.score || 0;
  }

  /**
   * Get browser info
   */
  getBrowserInfo(): { name: string; version: string } {
    if (!this.compatibilityResult) {
      return { name: 'Unknown', version: 'unknown' };
    }
    
    return {
      name: this.compatibilityResult.capabilities.browser,
      version: this.compatibilityResult.capabilities.version
    };
  }

  /**
   * Check if feature should be shown
   */
  shouldShowFeature(feature: 'clipboard' | 'dragdrop' | 'advanced'): boolean {
    if (!this.compatibilityResult) return true;

    const score = this.compatibilityResult.score;
    
    switch (feature) {
      case 'clipboard':
        return score >= 50; // Show clipboard features for decent compatibility
      case 'dragdrop':
        return score >= 30; // Show drag-drop for basic compatibility
      case 'advanced':
        return score >= 75; // Show advanced features for good compatibility
      default:
        return true;
    }
  }

  /**
   * Get fallback configuration for component
   */
  getComponentConfig(component: 'input' | 'processor' | 'download'): any {
    if (!this.fallbackStrategies) {
      return {};
    }

    switch (component) {
      case 'input':
        return {
          showPasteButton: this.fallbackStrategies.clipboard.showPasteButton,
          showDropZone: this.fallbackStrategies.dragDrop.showDropZone,
          showUploadButton: this.fallbackStrategies.dragDrop.showUploadButton,
          showInstructions: this.fallbackStrategies.clipboard.showInstructions
        };
      case 'processor':
        return {
          compressionQuality: this.fallbackStrategies.imageProcessing.compressionQuality,
          maxFileSize: this.fallbackStrategies.imageProcessing.maxFileSize
        };
      case 'download':
        return {
          supportedFormats: this.fallbackStrategies.imageProcessing.supportedFormats
        };
      default:
        return {};
    }
  }
}

// Export singleton instance
export const gracefulDegradationService = GracefulDegradationService.getInstance();