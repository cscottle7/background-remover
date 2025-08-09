/**
 * Image Processing Web Worker
 * Handles heavy image processing operations off the main thread
 */

interface ProcessingTask {
  id: string;
  type: 'apply-mask' | 'blend-images' | 'edge-detection' | 'color-replace';
  data: {
    imageData?: ImageData;
    maskData?: ImageData;
    originalData?: ImageData;
    processedData?: ImageData;
    params?: any;
  };
}

interface ProcessingResult {
  id: string;
  success: boolean;
  imageData?: ImageData;
  error?: string;
  processingTime: number;
}

// Main worker message handler
self.onmessage = function(event: MessageEvent<ProcessingTask>) {
  const task = event.data;
  const startTime = performance.now();
  
  try {
    let result: ImageData | null = null;
    
    switch (task.type) {
      case 'apply-mask':
        result = applyMask(task.data.imageData!, task.data.maskData!);
        break;
      case 'blend-images':
        result = blendImages(
          task.data.originalData!,
          task.data.processedData!,
          task.data.params?.blendMode || 'normal',
          task.data.params?.opacity || 1.0
        );
        break;
      case 'edge-detection':
        result = edgeDetection(task.data.imageData!, task.data.params?.threshold || 50);
        break;
      case 'color-replace':
        result = colorReplace(
          task.data.imageData!,
          task.data.params?.targetColor || [0, 0, 0],
          task.data.params?.replaceColor || [255, 255, 255],
          task.data.params?.tolerance || 10
        );
        break;
      default:
        throw new Error(`Unknown processing type: ${task.type}`);
    }
    
    const processingTime = performance.now() - startTime;
    
    const response: ProcessingResult = {
      id: task.id,
      success: true,
      imageData: result,
      processingTime
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const processingTime = performance.now() - startTime;
    
    const response: ProcessingResult = {
      id: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    };
    
    self.postMessage(response);
  }
};

/**
 * Apply a mask to an image
 */
function applyMask(imageData: ImageData, maskData: ImageData): ImageData {
  const result = new ImageData(imageData.width, imageData.height);
  const imgData = imageData.data;
  const maskDataArray = maskData.data;
  const resultData = result.data;
  
  for (let i = 0; i < imgData.length; i += 4) {
    const maskAlpha = maskDataArray[i + 3] / 255;
    
    resultData[i] = imgData[i];     // R
    resultData[i + 1] = imgData[i + 1]; // G
    resultData[i + 2] = imgData[i + 2]; // B
    resultData[i + 3] = imgData[i + 3] * maskAlpha; // A
  }
  
  return result;
}

/**
 * Blend two images with specified blend mode
 */
function blendImages(
  originalData: ImageData,
  processedData: ImageData,
  blendMode: string,
  opacity: number
): ImageData {
  const result = new ImageData(originalData.width, originalData.height);
  const orig = originalData.data;
  const proc = processedData.data;
  const resultData = result.data;
  
  for (let i = 0; i < orig.length; i += 4) {
    let r, g, b, a;
    
    switch (blendMode) {
      case 'multiply':
        r = (orig[i] * proc[i]) / 255;
        g = (orig[i + 1] * proc[i + 1]) / 255;
        b = (orig[i + 2] * proc[i + 2]) / 255;
        break;
      case 'screen':
        r = 255 - ((255 - orig[i]) * (255 - proc[i])) / 255;
        g = 255 - ((255 - orig[i + 1]) * (255 - proc[i + 1])) / 255;
        b = 255 - ((255 - orig[i + 2]) * (255 - proc[i + 2])) / 255;
        break;
      case 'overlay':
        r = orig[i] < 128 
          ? (2 * orig[i] * proc[i]) / 255
          : 255 - (2 * (255 - orig[i]) * (255 - proc[i])) / 255;
        g = orig[i + 1] < 128 
          ? (2 * orig[i + 1] * proc[i + 1]) / 255
          : 255 - (2 * (255 - orig[i + 1]) * (255 - proc[i + 1])) / 255;
        b = orig[i + 2] < 128 
          ? (2 * orig[i + 2] * proc[i + 2]) / 255
          : 255 - (2 * (255 - orig[i + 2]) * (255 - proc[i + 2])) / 255;
        break;
      default: // normal
        r = proc[i];
        g = proc[i + 1];
        b = proc[i + 2];
    }
    
    // Apply opacity blending
    resultData[i] = orig[i] + (r - orig[i]) * opacity;
    resultData[i + 1] = orig[i + 1] + (g - orig[i + 1]) * opacity;
    resultData[i + 2] = orig[i + 2] + (b - orig[i + 2]) * opacity;
    resultData[i + 3] = Math.max(orig[i + 3], proc[i + 3]);
  }
  
  return result;
}

/**
 * Edge detection using Sobel operator
 */
function edgeDetection(imageData: ImageData, threshold: number): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new ImageData(width, height);
  const resultData = result.data;
  
  // Sobel kernels
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let pixelX = 0;
      let pixelY = 0;
      
      // Apply Sobel kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
          
          pixelX += gray * sobelX[ky + 1][kx + 1];
          pixelY += gray * sobelY[ky + 1][kx + 1];
        }
      }
      
      const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
      const edge = magnitude > threshold ? 255 : 0;
      
      const index = (y * width + x) * 4;
      resultData[index] = edge;     // R
      resultData[index + 1] = edge; // G
      resultData[index + 2] = edge; // B
      resultData[index + 3] = 255;  // A
    }
  }
  
  return result;
}

/**
 * Replace specific colors in an image
 */
function colorReplace(
  imageData: ImageData,
  targetColor: [number, number, number],
  replaceColor: [number, number, number],
  tolerance: number
): ImageData {
  const result = new ImageData(imageData.width, imageData.height);
  const data = imageData.data;
  const resultData = result.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Calculate color distance
    const distance = Math.sqrt(
      Math.pow(r - targetColor[0], 2) +
      Math.pow(g - targetColor[1], 2) +
      Math.pow(b - targetColor[2], 2)
    );
    
    if (distance <= tolerance) {
      // Replace with new color
      resultData[i] = replaceColor[0];
      resultData[i + 1] = replaceColor[1];
      resultData[i + 2] = replaceColor[2];
      resultData[i + 3] = a;
    } else {
      // Keep original color
      resultData[i] = r;
      resultData[i + 1] = g;
      resultData[i + 2] = b;
      resultData[i + 3] = a;
    }
  }
  
  return result;
}

// Export type definitions for use in main thread
export type { ProcessingTask, ProcessingResult };