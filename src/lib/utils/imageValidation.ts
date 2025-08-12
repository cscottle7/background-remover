/**
 * Client-side image validation utilities
 * Implements security checks and format validation before upload
 */

import type { ValidationResult, ImageData } from '../types/app';

// Configuration constants matching backend
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 4096; // 4K max
const MIN_DIMENSION = 32; // Minimum viable size
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff'
]);

/**
 * Validate image file before processing
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`);
    }

    // Check MIME type
    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      errors.push(`Unsupported file type: ${file.type}. Supported formats: JPEG, PNG, WebP, BMP, TIFF`);
    }

    // Load image to check dimensions and integrity
    const imageInfo = await loadImageInfo(file);
    
    if (!imageInfo.valid) {
      errors.push('Invalid or corrupted image file');
      return { isValid: false, error: errors.join('. ') };
    }

    const { width, height } = imageInfo;

    // Check dimensions
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      errors.push(`Image dimensions (${width}×${height}) are too small. Minimum: ${MIN_DIMENSION}×${MIN_DIMENSION}px`);
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      errors.push(`Image dimensions (${width}×${height}) are too large. Maximum: ${MAX_DIMENSION}×${MAX_DIMENSION}px`);
    }

    // Performance warnings
    const totalPixels = width * height;
    if (totalPixels > 2048 * 2048) {
      warnings.push('Large images may take longer to process');
    }

    // Aspect ratio warnings
    const aspectRatio = width / height;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      warnings.push('Unusual aspect ratio may affect processing quality');
    }

    // Check for animated images
    if (await isAnimatedImage(file)) {
      warnings.push('Animated images will be processed as static images');
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join('. ') : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Create ImageData object from validated file
 */
export async function createImageData(file: File): Promise<ImageData> {
  const preview = await createImagePreview(file);
  const dimensions = await getImageDimensions(file);
  
  return {
    file,
    preview,
    size: file.size,
    dimensions,
    format: file.type
  };
}

/**
 * Load image information including dimensions
 */
function loadImageInfo(file: File): Promise<{ valid: boolean; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        valid: true,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      resolve({ valid: false, width: 0, height: 0 });
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create image preview URL
 */
function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to create image preview'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if image is animated (GIF, APNG, etc.)
 */
async function isAnimatedImage(file: File): Promise<boolean> {
  try {
    // For GIFs, we can check the file structure
    if (file.type === 'image/gif') {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Look for multiple image descriptors in GIF
      let imageCount = 0;
      for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0x21 && bytes[i + 1] === 0xF9) { // Graphic Control Extension
          imageCount++;
          if (imageCount > 1) {
            return true;
          }
        }
      }
    }
    
    // For other formats, we'd need more complex detection
    // For now, return false for non-GIF images
    return false;
    
  } catch (error) {
    return false;
  }
}

/**
 * Format file size for human-readable display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get optimal image quality settings for upload
 */
export function getOptimalUploadSettings(file: File): { shouldCompress: boolean; quality: number } {
  const isLarge = file.size > 5 * 1024 * 1024; // 5MB
  const isJpeg = file.type === 'image/jpeg';
  
  return {
    shouldCompress: isLarge && isJpeg,
    quality: isLarge ? 0.8 : 0.9
  };
}

/**
 * Compress image if needed before upload
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  const settings = getOptimalUploadSettings(file);
  
  if (!settings.shouldCompress) {
    return file;
  }
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          settings.quality
        );
      };
      
      img.onerror = () => resolve(file); // Fallback to original
      img.src = URL.createObjectURL(file);
    });
    
  } catch (error) {
    return file; // Fallback to original on any error
  }
}