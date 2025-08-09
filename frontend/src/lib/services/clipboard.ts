/**
 * Clipboard service for paste functionality
 * Implements cross-browser clipboard access with graceful fallbacks
 */

import type { ClipboardReadResult } from '../types/app';

export class ClipboardService {
  private static instance: ClipboardService;
  
  private constructor() {}
  
  static getInstance(): ClipboardService {
    if (!ClipboardService.instance) {
      ClipboardService.instance = new ClipboardService();
    }
    return ClipboardService.instance;
  }

  /**
   * Check if clipboard API is supported
   */
  isSupported(): boolean {
    return !!(
      navigator.clipboard && 
      navigator.clipboard.read && 
      typeof navigator.clipboard.read === 'function'
    );
  }

  /**
   * Read image from clipboard
   * Implements cross-browser compatibility with error handling
   */
  async readImage(): Promise<ClipboardReadResult> {
    try {
      if (!this.isSupported()) {
        return {
          success: false,
          error: 'Clipboard API not supported in this browser'
        };
      }

      // Request clipboard permission
      const permission = await this.requestPermission();
      if (!permission) {
        return {
          success: false,
          error: 'Clipboard permission denied'
        };
      }

      // Read clipboard contents
      const clipboardItems = await navigator.clipboard.read();
      
      if (!clipboardItems || clipboardItems.length === 0) {
        return {
          success: false,
          error: 'No items found in clipboard'
        };
      }

      // Find image items
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => 
          type.startsWith('image/')
        );
        
        if (imageTypes.length === 0) {
          continue;
        }

        // Get the first image type
        const imageType = imageTypes[0];
        const blob = await clipboardItem.getType(imageType);
        
        if (blob && blob.size > 0) {
          // Convert blob to File
          const file = new File([blob], `clipboard-image.${this.getExtensionFromMimeType(imageType)}`, {
            type: imageType
          });
          
          return {
            success: true,
            file
          };
        }
      }

      return {
        success: false,
        error: 'No valid images found in clipboard'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read clipboard'
      };
    }
  }

  /**
   * Request clipboard permission
   */
  private async requestPermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) {
        // Assume permission is granted if permissions API is not available
        return true;
      }

      const result = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
      
      if (result.state === 'granted') {
        return true;
      }
      
      if (result.state === 'prompt') {
        // Permission will be requested when we try to read
        return true;
      }
      
      return false;
      
    } catch (error) {
      // If permission query fails, try anyway
      return true;
    }
  }

  /**
   * Copy processed image to clipboard
   */
  async copyImage(blob: Blob): Promise<boolean> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write) {
        return false;
      }

      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });

      await navigator.clipboard.write([clipboardItem]);
      return true;

    } catch (error) {
      console.warn('Failed to copy image to clipboard:', error);
      return false;
    }
  }

  /**
   * Set up keyboard listener for Cmd+V / Ctrl+V
   */
  setupKeyboardListener(onPaste: (file: File) => void): () => void {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check for Cmd+V (Mac) or Ctrl+V (Windows/Linux)
      const isCommandV = (event.metaKey || event.ctrlKey) && event.key === 'v';
      
      if (!isCommandV) {
        return;
      }

      // Don't interfere with paste in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      event.preventDefault();
      
      const result = await this.readImage();
      if (result.success && result.file) {
        onPaste(result.file);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff'
    };
    
    return extensions[mimeType.toLowerCase()] || 'png';
  }

  /**
   * Check if browser supports specific clipboard features
   */
  getCapabilities() {
    return {
      read: !!(navigator.clipboard && navigator.clipboard.read),
      write: !!(navigator.clipboard && navigator.clipboard.write),
      readText: !!(navigator.clipboard && navigator.clipboard.readText),
      writeText: !!(navigator.clipboard && navigator.clipboard.writeText),
      permissions: !!navigator.permissions
    };
  }
}

// Export singleton instance
export const clipboardService = ClipboardService.getInstance();