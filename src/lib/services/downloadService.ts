/**
 * Enhanced Download Service
 * Provides download functionality with format options and metadata
 * Supports Chloe's developer workflow requirements
 */

export interface DownloadOptions {
  format: 'png' | 'webp' | 'jpeg';
  quality?: number; // 0.1 to 1.0 for lossy formats
  filename?: string;
  includeMetadata?: boolean;
}

export interface DownloadMetadata {
  originalFilename?: string;
  processingTime?: number;
  processingId?: string;
  timestamp: string;
  format: string;
  dimensions?: { width: number; height: number };
}

export class DownloadService {
  private static instance: DownloadService;

  private constructor() {}

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  /**
   * Download processed image with format options
   */
  async downloadImage(
    downloadUrl: string,
    options: DownloadOptions = { format: 'png' },
    metadata?: Partial<DownloadMetadata>
  ): Promise<boolean> {
    try {
      // Fetch the processed image
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const originalBlob = await response.blob();
      
      // Convert format if needed
      const { blob: processedBlob, filename } = await this.processImageBlob(
        originalBlob,
        options,
        metadata
      );

      // Create download link
      const url = URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      // Add to DOM, click, and clean up
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;

    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }

  /**
   * Download multiple images (batch processing)
   */
  async downloadBatch(
    images: Array<{ url: string; metadata?: Partial<DownloadMetadata> }>,
    options: DownloadOptions = { format: 'png' }
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < images.length; i++) {
      const { url, metadata } = images[i];
      const batchOptions = {
        ...options,
        filename: options.filename || `character_batch_${i + 1}.${options.format}`
      };

      const success = await this.downloadImage(url, batchOptions, metadata);
      if (success) {
        successful++;
      } else {
        failed++;
      }

      // Small delay between downloads to avoid overwhelming the browser
      await this.delay(200);
    }

    return { successful, failed };
  }

  /**
   * Get download preview (for showing file info before download)
   */
  async getDownloadPreview(
    downloadUrl: string,
    options: DownloadOptions
  ): Promise<{
    estimatedSize: string;
    format: string;
    filename: string;
    dimensions?: { width: number; height: number };
  }> {
    try {
      const response = await fetch(downloadUrl, { method: 'HEAD' });
      const originalSize = parseInt(response.headers.get('content-length') || '0');

      // Estimate converted size based on format
      let estimatedSize = originalSize;
      if (options.format === 'jpeg') {
        estimatedSize = Math.floor(originalSize * 0.6); // JPEG typically smaller
      } else if (options.format === 'webp') {
        estimatedSize = Math.floor(originalSize * 0.7); // WebP typically smaller
      }

      return {
        estimatedSize: this.formatFileSize(estimatedSize),
        format: options.format.toUpperCase(),
        filename: this.generateFilename(options),
        dimensions: await this.getImageDimensions(downloadUrl)
      };

    } catch (error) {
      return {
        estimatedSize: 'Unknown',
        format: options.format.toUpperCase(),
        filename: this.generateFilename(options)
      };
    }
  }

  /**
   * Process image blob with format conversion
   */
  private async processImageBlob(
    blob: Blob,
    options: DownloadOptions,
    metadata?: Partial<DownloadMetadata>
  ): Promise<{ blob: Blob; filename: string }> {
    const filename = this.generateFilename(options, metadata);

    // If PNG and no metadata, return original
    if (options.format === 'png' && !options.includeMetadata) {
      return { blob, filename };
    }

    // Convert format using canvas
    const convertedBlob = await this.convertImageFormat(blob, options);
    
    return { blob: convertedBlob, filename };
  }

  /**
   * Convert image format using canvas
   */
  private async convertImageFormat(
    blob: Blob,
    options: DownloadOptions
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Convert to desired format
        canvas.toBlob(
          (convertedBlob) => {
            resolve(convertedBlob || blob);
          },
          this.getMimeType(options.format),
          options.quality || 0.9
        );
      };

      img.onerror = () => resolve(blob); // Fallback to original
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Generate filename with proper extensions and metadata
   */
  private generateFilename(
    options: DownloadOptions,
    metadata?: Partial<DownloadMetadata>
  ): string {
    if (options.filename) {
      return this.ensureExtension(options.filename, options.format);
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const processingId = metadata?.processingId?.slice(-8) || 'unknown';
    
    return `character_${processingId}_${timestamp}.${options.format}`;
  }

  /**
   * Ensure filename has correct extension
   */
  private ensureExtension(filename: string, format: string): string {
    const extension = `.${format}`;
    if (filename.toLowerCase().endsWith(extension)) {
      return filename;
    }
    
    // Remove existing extension if present
    const lastDot = filename.lastIndexOf('.');
    if (lastDot > 0) {
      filename = filename.substring(0, lastDot);
    }
    
    return filename + extension;
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp'
    };
    return mimeTypes[format as keyof typeof mimeTypes] || 'image/png';
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get image dimensions from URL
   */
  private async getImageDimensions(url: string): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if browser supports format conversion
   */
  supportsFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    const supportedFormats = ['png', 'jpeg', 'webp'];
    
    if (!supportedFormats.includes(format)) {
      return false;
    }

    // Test canvas.toBlob support for the format
    try {
      canvas.toBlob(() => {}, this.getMimeType(format));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get recommended format based on browser support and use case
   */
  getRecommendedFormat(useCase: 'web' | 'print' | 'development' = 'development'): 'png' | 'webp' | 'jpeg' {
    const supportsWebP = this.supportsFormat('webp');
    
    switch (useCase) {
      case 'web':
        return supportsWebP ? 'webp' : 'png';
      case 'print':
        return 'png'; // Highest quality for print
      case 'development':
      default:
        return 'png'; // Transparent background preserved
    }
  }
}

// Export singleton instance
export const downloadService = DownloadService.getInstance();