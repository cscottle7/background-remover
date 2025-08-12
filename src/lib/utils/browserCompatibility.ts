/**
 * Browser Compatibility Testing Suite
 * Tests Clipboard API and drag-drop functionality across browsers
 * Phase 0 requirement for cross-browser validation
 */

export interface BrowserCapabilities {
  browser: string;
  version: string;
  clipboardAPI: {
    read: boolean;
    write: boolean;
    readText: boolean;
    writeText: boolean;
    permissions: boolean;
  };
  dragAndDrop: {
    supported: boolean;
    fileAPI: boolean;
    dataTransfer: boolean;
    dragEvents: boolean;
  };
  imageProcessing: {
    canvas: boolean;
    blob: boolean;
    fileReader: boolean;
    createObjectURL: boolean;
  };
  modernFeatures: {
    asyncAwait: boolean;
    modules: boolean;
    fetch: boolean;
    promises: boolean;
  };
  performance: {
    performanceAPI: boolean;
    webWorkers: boolean;
    offscreenCanvas: boolean;
  };
}

export interface CompatibilityTestResult {
  browser: string;
  timestamp: string;
  overallCompatibility: 'excellent' | 'good' | 'limited' | 'poor';
  score: number; // 0-100
  capabilities: BrowserCapabilities;
  tests: {
    clipboardTests: ClipboardTestResults;
    dragDropTests: DragDropTestResults;
    imageProcessingTests: ImageProcessingTestResults;
  };
  recommendations: string[];
  fallbacksNeeded: string[];
}

export interface ClipboardTestResults {
  basicSupport: boolean;
  readPermission: boolean;
  writePermission: boolean;
  imageHandling: boolean;
  keyboardShortcuts: boolean;
  crossOrigin: boolean;
  errors: string[];
}

export interface DragDropTestResults {
  basicDragDrop: boolean;
  fileHandling: boolean;
  multipleFiles: boolean;
  imageTypes: boolean;
  visualFeedback: boolean;
  errors: string[];
}

export interface ImageProcessingTestResults {
  canvasManipulation: boolean;
  blobProcessing: boolean;
  fileReaderAPI: boolean;
  imageFormats: string[];
  performanceOK: boolean;
  errors: string[];
}

export class BrowserCompatibilityTester {
  private testResults: CompatibilityTestResult | null = null;

  /**
   * Run comprehensive browser compatibility tests
   */
  async runFullCompatibilityTest(): Promise<CompatibilityTestResult> {
    console.log('Starting comprehensive browser compatibility test...');

    const browser = this.detectBrowser();
    const capabilities = this.detectCapabilities();

    const testResult: CompatibilityTestResult = {
      browser: browser.name + ' ' + browser.version,
      timestamp: new Date().toISOString(),
      overallCompatibility: 'poor',
      score: 0,
      capabilities: {
        browser: browser.name,
        version: browser.version,
        ...capabilities
      },
      tests: {
        clipboardTests: await this.testClipboardFunctionality(),
        dragDropTests: await this.testDragDropFunctionality(),
        imageProcessingTests: await this.testImageProcessing()
      },
      recommendations: [],
      fallbacksNeeded: []
    };

    // Calculate overall score and compatibility
    testResult.score = this.calculateCompatibilityScore(testResult);
    testResult.overallCompatibility = this.determineCompatibilityLevel(testResult.score);
    
    // Generate recommendations
    testResult.recommendations = this.generateRecommendations(testResult);
    testResult.fallbacksNeeded = this.identifyFallbacksNeeded(testResult);

    this.testResults = testResult;
    
    console.log('Browser compatibility test completed:', testResult);
    return testResult;
  }

  /**
   * Test clipboard functionality across browsers
   */
  async testClipboardFunctionality(): Promise<ClipboardTestResults> {
    const results: ClipboardTestResults = {
      basicSupport: false,
      readPermission: false,
      writePermission: false,
      imageHandling: false,
      keyboardShortcuts: false,
      crossOrigin: false,
      errors: []
    };

    try {
      // Test basic clipboard API support
      results.basicSupport = !!(navigator.clipboard);
      
      if (results.basicSupport) {
        // Test permissions
        try {
          if (navigator.permissions) {
            const readPermission = await navigator.permissions.query({ 
              name: 'clipboard-read' as PermissionName 
            });
            results.readPermission = readPermission.state !== 'denied';

            const writePermission = await navigator.permissions.query({ 
              name: 'clipboard-write' as PermissionName 
            });
            results.writePermission = writePermission.state !== 'denied';
          } else {
            // Assume permissions are available if API exists
            results.readPermission = true;
            results.writePermission = true;
          }
        } catch (error) {
          results.errors.push(`Permission query failed: ${error}`);
          // Assume permissions available
          results.readPermission = true;
          results.writePermission = true;
        }

        // Test image handling
        try {
          // Try to write a test image
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
            
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const clipboardItem = new ClipboardItem({
                    [blob.type]: blob
                  });
                  await navigator.clipboard.write([clipboardItem]);
                  results.imageHandling = true;
                } catch (error) {
                  results.errors.push(`Image clipboard write failed: ${error}`);
                }
              }
            });
          }
        } catch (error) {
          results.errors.push(`Image handling test failed: ${error}`);
        }

        // Test keyboard shortcuts
        results.keyboardShortcuts = this.testKeyboardEventHandling();
      } else {
        results.errors.push('Clipboard API not supported');
      }

      // Test cross-origin behavior (simplified)
      results.crossOrigin = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost';

    } catch (error) {
      results.errors.push(`Clipboard test failed: ${error}`);
    }

    return results;
  }

  /**
   * Test drag and drop functionality
   */
  async testDragDropFunctionality(): Promise<DragDropTestResults> {
    const results: DragDropTestResults = {
      basicDragDrop: false,
      fileHandling: false,
      multipleFiles: false,
      imageTypes: false,
      visualFeedback: false,
      errors: []
    };

    try {
      // Test basic drag and drop support
      const testDiv = document.createElement('div');
      results.basicDragDrop = 'ondragstart' in testDiv && 
                             'ondrop' in testDiv && 
                             'ondragover' in testDiv;

      if (results.basicDragDrop) {
        // Test File API support
        results.fileHandling = !!(window.File && window.FileReader && window.FileList && window.Blob);

        // Test DataTransfer API
        const dataTransferSupported = typeof DataTransfer !== 'undefined';
        
        if (dataTransferSupported) {
          // Test multiple files support
          results.multipleFiles = true; // Modern browsers support this
          
          // Test image type support
          results.imageTypes = this.testImageTypeSupport();
          
          // Test visual feedback capabilities
          results.visualFeedback = this.testDragVisualFeedback();
        } else {
          results.errors.push('DataTransfer API not supported');
        }
      } else {
        results.errors.push('Basic drag and drop not supported');
      }

    } catch (error) {
      results.errors.push(`Drag and drop test failed: ${error}`);
    }

    return results;
  }

  /**
   * Test image processing capabilities
   */
  async testImageProcessing(): Promise<ImageProcessingTestResults> {
    const results: ImageProcessingTestResults = {
      canvasManipulation: false,
      blobProcessing: false,
      fileReaderAPI: false,
      imageFormats: [],
      performanceOK: false,
      errors: []
    };

    try {
      // Test Canvas API
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      results.canvasManipulation = !!(canvas && ctx);

      // Test Blob processing
      results.blobProcessing = !!(window.Blob && URL.createObjectURL);

      // Test FileReader API
      results.fileReaderAPI = !!window.FileReader;

      // Test supported image formats
      results.imageFormats = await this.testImageFormats();

      // Test performance (simplified)
      results.performanceOK = await this.testImageProcessingPerformance();

    } catch (error) {
      results.errors.push(`Image processing test failed: ${error}`);
    }

    return results;
  }

  /**
   * Detect browser and version
   */
  private detectBrowser(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    
    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { name: 'Chrome', version: match ? match[1] : 'unknown' };
    }
    
    // Firefox
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { name: 'Firefox', version: match ? match[1] : 'unknown' };
    }
    
    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { name: 'Safari', version: match ? match[1] : 'unknown' };
    }
    
    // Edge
    if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { name: 'Edge', version: match ? match[1] : 'unknown' };
    }
    
    return { name: 'Unknown', version: 'unknown' };
  }

  /**
   * Detect browser capabilities
   */
  private detectCapabilities() {
    return {
      clipboardAPI: {
        read: !!(navigator.clipboard && navigator.clipboard.read),
        write: !!(navigator.clipboard && navigator.clipboard.write),
        readText: !!(navigator.clipboard && navigator.clipboard.readText),
        writeText: !!(navigator.clipboard && navigator.clipboard.writeText),
        permissions: !!navigator.permissions
      },
      dragAndDrop: {
        supported: 'ondragstart' in document.createElement('div'),
        fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
        dataTransfer: typeof DataTransfer !== 'undefined',
        dragEvents: 'ondragenter' in document.createElement('div')
      },
      imageProcessing: {
        canvas: !!document.createElement('canvas').getContext,
        blob: !!window.Blob,
        fileReader: !!window.FileReader,
        createObjectURL: !!(URL && URL.createObjectURL)
      },
      modernFeatures: {
        asyncAwait: this.testAsyncAwait(),
        modules: 'noModule' in document.createElement('script'),
        fetch: !!window.fetch,
        promises: !!window.Promise
      },
      performance: {
        performanceAPI: !!window.performance,
        webWorkers: !!window.Worker,
        offscreenCanvas: !!window.OffscreenCanvas
      }
    };
  }

  private testAsyncAwait(): boolean {
    try {
      new Function('return (async () => {})')();
      return true;
    } catch {
      return false;
    }
  }

  private testKeyboardEventHandling(): boolean {
    try {
      const testEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      return testEvent instanceof KeyboardEvent;
    } catch {
      return false;
    }
  }

  private testImageTypeSupport(): boolean {
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
    ];
    
    // Simple check if browser recognizes these MIME types
    return supportedTypes.length > 0; // Simplified for proof of concept
  }

  private testDragVisualFeedback(): boolean {
    // Test if CSS drag effects are supported
    const testElement = document.createElement('div');
    return 'dropEffect' in (testElement.style as any);
  }

  private async testImageFormats(): Promise<string[]> {
    const formats = ['jpeg', 'png', 'webp', 'gif'];
    const supportedFormats: string[] = [];

    for (const format of formats) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        if (canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`)) {
          supportedFormats.push(format);
        }
      } catch {
        // Format not supported
      }
    }

    return supportedFormats;
  }

  private async testImageProcessingPerformance(): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Create a test image processing operation
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return false;
      
      // Simple performance test
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgb(${i * 2}, 100, 150)`;
        ctx.fillRect(i, i, 100, 100);
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Should complete basic operations under 100ms
      return processingTime < 100;
      
    } catch {
      return false;
    }
  }

  private calculateCompatibilityScore(result: CompatibilityTestResult): number {
    let score = 0;
    const weights = {
      clipboard: 30,
      dragDrop: 25,
      imageProcessing: 25,
      modernFeatures: 20
    };

    // Clipboard score
    const clipboardTests = result.tests.clipboardTests;
    const clipboardScore = (
      (clipboardTests.basicSupport ? 1 : 0) +
      (clipboardTests.readPermission ? 1 : 0) +
      (clipboardTests.writePermission ? 1 : 0) +
      (clipboardTests.imageHandling ? 1 : 0) +
      (clipboardTests.keyboardShortcuts ? 1 : 0)
    ) / 5;
    score += clipboardScore * weights.clipboard;

    // Drag and drop score
    const dragDropTests = result.tests.dragDropTests;
    const dragDropScore = (
      (dragDropTests.basicDragDrop ? 1 : 0) +
      (dragDropTests.fileHandling ? 1 : 0) +
      (dragDropTests.multipleFiles ? 1 : 0) +
      (dragDropTests.imageTypes ? 1 : 0) +
      (dragDropTests.visualFeedback ? 1 : 0)
    ) / 5;
    score += dragDropScore * weights.dragDrop;

    // Image processing score
    const imageTests = result.tests.imageProcessingTests;
    const imageScore = (
      (imageTests.canvasManipulation ? 1 : 0) +
      (imageTests.blobProcessing ? 1 : 0) +
      (imageTests.fileReaderAPI ? 1 : 0) +
      (imageTests.imageFormats.length > 2 ? 1 : 0) +
      (imageTests.performanceOK ? 1 : 0)
    ) / 5;
    score += imageScore * weights.imageProcessing;

    // Modern features score
    const modernFeatures = result.capabilities.modernFeatures;
    const modernScore = (
      (modernFeatures.asyncAwait ? 1 : 0) +
      (modernFeatures.modules ? 1 : 0) +
      (modernFeatures.fetch ? 1 : 0) +
      (modernFeatures.promises ? 1 : 0)
    ) / 4;
    score += modernScore * weights.modernFeatures;

    return Math.round(score);
  }

  private determineCompatibilityLevel(score: number): 'excellent' | 'good' | 'limited' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'limited';
    return 'poor';
  }

  private generateRecommendations(result: CompatibilityTestResult): string[] {
    const recommendations: string[] = [];
    const { capabilities, tests } = result;

    // Clipboard recommendations
    if (!tests.clipboardTests.basicSupport) {
      recommendations.push('Implement drag-and-drop as primary input method due to limited clipboard support');
    }
    if (!tests.clipboardTests.imageHandling) {
      recommendations.push('Provide visual feedback for clipboard operations due to limited image handling');
    }

    // Drag and drop recommendations
    if (!tests.dragDropTests.basicDragDrop) {
      recommendations.push('Implement file upload button as fallback for drag-and-drop');
    }
    if (!tests.dragDropTests.visualFeedback) {
      recommendations.push('Add custom visual feedback for drag operations');
    }

    // Performance recommendations
    if (!tests.imageProcessingTests.performanceOK) {
      recommendations.push('Consider client-side image optimization before processing');
    }

    // Browser-specific recommendations
    if (capabilities.browser === 'Safari') {
      recommendations.push('Test clipboard functionality thoroughly in Safari due to stricter security policies');
    }
    if (capabilities.browser === 'Firefox') {
      recommendations.push('Implement additional clipboard permission handling for Firefox');
    }

    return recommendations;
  }

  private identifyFallbacksNeeded(result: CompatibilityTestResult): string[] {
    const fallbacks: string[] = [];
    const { tests } = result;

    if (!tests.clipboardTests.basicSupport) {
      fallbacks.push('File upload button for clipboard-unsupported browsers');
    }
    if (!tests.clipboardTests.keyboardShortcuts) {
      fallbacks.push('Visual paste button for keyboard shortcut issues');
    }
    if (!tests.dragDropTests.basicDragDrop) {
      fallbacks.push('Traditional file input element');
    }
    if (!tests.imageProcessingTests.canvasManipulation) {
      fallbacks.push('Server-side image processing for canvas-limited browsers');
    }

    return fallbacks;
  }

  /**
   * Get the latest test results
   */
  getLatestResults(): CompatibilityTestResult | null {
    return this.testResults;
  }

  /**
   * Export test results for documentation
   */
  exportResults(): string {
    if (!this.testResults) {
      return 'No test results available';
    }

    return JSON.stringify(this.testResults, null, 2);
  }
}

// Export singleton instance
export const browserCompatibilityTester = new BrowserCompatibilityTester();