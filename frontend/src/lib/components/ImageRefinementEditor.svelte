<!--
  Image Refinement Editor (Magic Eraser)
  Canvas-based editing for fixing background removal errors
  Implements brush tools for restore/erase functionality
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let originalImage: string; // Base64 or URL
  export let processedImage: string; // Base64 or URL  
  export let isVisible: boolean = false;
  export let brushSize: number = 20;
  
  const dispatch = createEventDispatcher();
  
  // Canvas references
  let canvasContainer: HTMLDivElement;
  let originalCanvas: HTMLCanvasElement;
  let processedCanvas: HTMLCanvasElement;
  let maskCanvas: HTMLCanvasElement;
  let previewCanvas: HTMLCanvasElement;
  
  // Canvas contexts
  let originalCtx: CanvasRenderingContext2D;
  let processedCtx: CanvasRenderingContext2D;
  let maskCtx: CanvasRenderingContext2D;
  let previewCtx: CanvasRenderingContext2D;
  
  // Tool state
  let currentTool: 'restore' | 'erase' | 'precision-erase' | 'edge-refine' | 'smart-background-erase' | 'smart-background-restore' = 'restore';
  let isDrawing = false;
  let isCurrentlyDrawing = false; // Simpler flag for blocking slider updates during drawing
  let canvasWidth = 600;
  let canvasHeight = 400;
  let backgroundSensitivity = 50; // Background removal sensitivity (0-100)
  let edgeRefinement = 50; // Edge refinement precision (0-100)
  
  // Mouse tracking for brush cursor
  let mouseX = 0;
  let mouseY = 0;
  let showBrushCursor = false;
  let showBrushPreview = false;
  let brushPreviewData: ImageData | null = null;
  
  // Image objects
  let originalImg: HTMLImageElement;
  let processedImg: HTMLImageElement;
  
  // Refinement state
  let hasChanges = false;
  let isProcessingRefinement = false;
  let showOriginalPreview = false;
  
  // Layout state
  let controlsCollapsed = false;
  
  // Background tools
  let backgroundTolerance = 10; // Tolerance for background detection (1-50%)
  
  // Tolerance preview state
  let showTolerancePreview = false;
  let tolerancePreviewCanvas: HTMLCanvasElement;
  let tolerancePreviewCtx: CanvasRenderingContext2D;
  
  // Tool info state
  let showToolInfo = false;
  
  // Stroke history for undo functionality
  let strokeHistory: ImageData[] = [];
  let maxHistorySize = 20;
  let currentHistoryIndex = -1;
  
  // Computed brush size for CSS display
  $: displayBrushSize = previewCanvas 
    ? brushSize * (previewCanvas.getBoundingClientRect().width / canvasWidth)
    : brushSize;
  
  // Reactive undo state to fix button state management
  $: canUndoStrokes = currentHistoryIndex > 0 && strokeHistory.length > 1;
  
  onMount(() => {
    if (browser && isVisible) {
      initializeCanvas();
    }
    
    // Handle window resize to make canvas responsive
    const handleResize = () => {
      if (browser && isVisible && originalImg && processedImg) {
        console.log('Window resized, adjusting canvas dimensions');
        setupCanvasDimensions();
        drawImages();
      }
    };
    
    if (browser) {
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  });
  
  $: if (browser && isVisible && originalImage && processedImage) {
    initializeCanvas();
  }
  
  // Update preview when showOriginalPreview toggle changes
  $: if (showOriginalPreview !== undefined && previewCtx) {
    updatePreview();
  }
  
  // Debounced preview updates for sensitivity changes  
  let sensitivityTimeout: NodeJS.Timeout;
  let refinementTimeout: NodeJS.Timeout;
  let lastBackgroundSensitivity = backgroundSensitivity;
  let lastEdgeRefinement = edgeRefinement;
  
  $: if (backgroundSensitivity !== lastBackgroundSensitivity && previewCtx && !isCurrentlyDrawing) {
    console.log('🎛️ Background sensitivity changed from', lastBackgroundSensitivity, 'to:', backgroundSensitivity);
    lastBackgroundSensitivity = backgroundSensitivity;
    clearTimeout(sensitivityTimeout);
    sensitivityTimeout = setTimeout(() => {
      if (!isCurrentlyDrawing) {
        console.log('🎛️ Applying ENHANCED background sensitivity update:', backgroundSensitivity);
        updatePreviewWithFullReprocessing();
      }
    }, 200); // Faster response for better user feedback
  }
  
  $: if (edgeRefinement !== lastEdgeRefinement && previewCtx && !isCurrentlyDrawing) {
    console.log('✨ Edge refinement changed from', lastEdgeRefinement, 'to:', edgeRefinement);
    lastEdgeRefinement = edgeRefinement;
    clearTimeout(refinementTimeout);
    refinementTimeout = setTimeout(() => {
      if (!isCurrentlyDrawing) {
        console.log('✨ Applying ENHANCED edge refinement update:', edgeRefinement);
        updatePreviewWithFullReprocessing();
      }
    }, 200); // Faster response for better user feedback
  }
  
  async function initializeCanvas() {
    if (!originalCanvas || !processedCanvas || !maskCanvas || !previewCanvas) return;
    
    console.log('Initializing canvas...');
    console.log('Canvas elements:', { originalCanvas, processedCanvas, maskCanvas, previewCanvas });
    
    // Get contexts with performance optimization
    originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true })!;
    processedCtx = processedCanvas.getContext('2d', { willReadFrequently: true })!;
    maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
    previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true })!;
    
    try {
      // Load images
      console.log('Loading images...');
      await loadImages();
      
      // Set canvas dimensions based on image
      console.log('Setting up canvas dimensions...');
      setupCanvasDimensions();
      
      // Draw initial state
      console.log('Drawing images...');
      drawImages();
      
      // Apply initial slider settings immediately
      setTimeout(() => {
        console.log('🚀 Applying initial slider settings on load');
        updatePreviewWithFullReprocessing();
      }, 100);
      
      // Initialize mask (transparent)
      console.log('Initializing mask...');
      initializeMask();
      
      // Setup event listeners
      console.log('Setting up event listeners...');
      setupEventListeners();
      
      console.log('Canvas initialization complete!');
    } catch (error) {
      console.error('Canvas initialization failed:', error);
      // Show error to user
      dispatch('error', { message: 'Failed to load images for editing' });
    }
  }
  
  async function loadImages() {
    return new Promise<void>((resolve, reject) => {
      let loadedCount = 0;
      let errorCount = 0;
      
      originalImg = new Image();
      processedImg = new Image();
      
      // Enable CORS for cross-origin images
      originalImg.crossOrigin = 'anonymous';
      processedImg.crossOrigin = 'anonymous';
      
      const onLoad = () => {
        loadedCount++;
        console.log(`Image ${loadedCount} loaded successfully`);
        if (loadedCount === 2) {
          console.log('All images loaded, resolving');
          resolve();
        }
      };
      
      const onError = (e: string | Event) => {
        errorCount++;
        console.error('Image loading failed:', e);
        if (errorCount + loadedCount === 2) {
          reject(new Error('Failed to load images'));
        }
      };
      
      originalImg.onload = onLoad;
      processedImg.onload = onLoad;
      originalImg.onerror = onError;
      processedImg.onerror = onError;
      
      console.log('Loading original image:', originalImage);
      console.log('Loading processed image:', processedImage);
      
      originalImg.src = originalImage;
      processedImg.src = processedImage;
    });
  }
  
  function setupCanvasDimensions() {
    // Get actual container dimensions
    const containerWidth = canvasContainer?.clientWidth || 600;
    const containerHeight = canvasContainer?.clientHeight || 400;
    
    // MAXIMIZE CANVAS SIZE - Title removed, use more space
    const maxWidth = containerWidth - 40; // Reduced padding since no title
    const maxHeight = containerHeight - 40; // Less overhead needed without title
    
    // Set reasonable minimum dimensions
    const minWidth = Math.min(400, maxWidth);
    const minHeight = Math.min(400, maxHeight); // Don't exceed available space
    
    // Get image dimensions with fallbacks
    const imgWidth = originalImg?.width || processedImg?.width || 600;
    const imgHeight = originalImg?.height || processedImg?.height || 400;
    const aspectRatio = imgWidth / imgHeight;
    
    console.log('🎨 Image dimensions:', { imgWidth, imgHeight, aspectRatio });
    console.log('🎨 Container dimensions:', { containerWidth, containerHeight });
    console.log('🎨 Available space (HEIGHT PRIORITY):', { maxWidth, maxHeight, minHeight });
    
    // Calculate dimensions - FIT WITHIN CONTAINER BOUNDS
    let targetWidth, targetHeight;
    
    // Try to maximize size while staying within bounds
    // With title removed, can use more height
    targetHeight = Math.min(maxHeight, containerHeight * 0.85); // Use up to 85% of container height
    targetWidth = targetHeight * aspectRatio;
    
    // If width is too large, scale down based on width instead
    if (targetWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / aspectRatio;
    }
    
    // Ensure we meet minimum requirements if possible
    if (targetWidth < minWidth && maxWidth >= minWidth) {
      targetWidth = minWidth;
      targetHeight = targetWidth / aspectRatio;
    }
    if (targetHeight < minHeight && maxHeight >= minHeight) {
      targetHeight = minHeight;
      targetWidth = targetHeight * aspectRatio;
    }
    
    // Final bounds check - ensure it absolutely fits in container
    targetWidth = Math.min(targetWidth, maxWidth);
    targetHeight = Math.min(targetHeight, maxHeight);
    
    canvasWidth = Math.round(targetWidth);
    canvasHeight = Math.round(targetHeight);
    
    console.log('🎨 Final canvas dimensions (HEIGHT OPTIMIZED):', { canvasWidth, canvasHeight });
    console.log('🎨 Height usage:', `${Math.round((canvasHeight / containerHeight) * 100)}% of container`);
    console.log('🎨 Fits in container:', { 
      widthOk: canvasWidth <= maxWidth, 
      heightOk: canvasHeight <= maxHeight 
    });
    
    // Set all canvas dimensions
    [originalCanvas, processedCanvas, maskCanvas, previewCanvas].forEach(canvas => {
      if (canvas) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
      }
    });
  }
  
  function drawImages() {
    console.log('Drawing images to canvas...');
    
    // Draw original image on hidden canvas
    if (originalCtx && originalImg) {
      originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      originalCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
      console.log('Original image drawn');
    }
    
    // Draw processed image on hidden canvas
    if (processedCtx && processedImg) {
      processedCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      processedCtx.drawImage(processedImg, 0, 0, canvasWidth, canvasHeight);
      console.log('Processed image drawn');
    }
    
    // Update preview
    updatePreview();
  }
  
  function initializeMask() {
    // Initialize mask as transparent
    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Save initial state to history
    saveInitialMaskState();
  }
  
  function saveInitialMaskState() {
    if (maskCtx) {
      try {
        const initialMask = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        strokeHistory = [initialMask];
        currentHistoryIndex = 0;
        console.log('Initial mask state saved to history');
      } catch (error) {
        console.error('Failed to save initial mask state:', error);
        strokeHistory = [];
        currentHistoryIndex = -1;
      }
    }
  }
  
  function saveStrokeToHistory() {
    if (!maskCtx) {
      console.warn('Cannot save stroke: maskCtx not available');
      return;
    }
    
    try {
      const currentMask = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      
      // Remove any future history if we're not at the end (when user had undone and then drew)
      if (currentHistoryIndex < strokeHistory.length - 1) {
        const removedStates = strokeHistory.length - 1 - currentHistoryIndex;
        strokeHistory = strokeHistory.slice(0, currentHistoryIndex + 1);
        console.log(`Removed ${removedStates} future history states`);
      }
      
      // Add new state
      strokeHistory.push(currentMask);
      currentHistoryIndex = strokeHistory.length - 1;
      
      // Limit history size for memory management - remove oldest entries
      if (strokeHistory.length > maxHistorySize) {
        const removedCount = strokeHistory.length - maxHistorySize;
        strokeHistory.splice(0, removedCount);
        currentHistoryIndex = strokeHistory.length - 1;
        console.log(`Trimmed ${removedCount} old history states for memory management`);
      }
      
      console.log(`Stroke saved to history. Index: ${currentHistoryIndex}, Total: ${strokeHistory.length}`);
    } catch (error) {
      console.error('Failed to save stroke to history:', error);
      // On error, try to maintain a valid state
      if (strokeHistory.length === 0) {
        console.log('Attempting to recover by reinitializing mask state');
        initializeMask();
      }
    }
  }
  
  function setupEventListeners() {
    if (!previewCanvas) return;
    
    previewCanvas.addEventListener('mousedown', startDrawing);
    previewCanvas.addEventListener('mousemove', handleMouseMove);
    previewCanvas.addEventListener('mouseup', stopDrawing);
    previewCanvas.addEventListener('mouseout', handleMouseOut);
    previewCanvas.addEventListener('mouseenter', handleMouseEnter);
    
    // Touch events for mobile
    previewCanvas.addEventListener('touchstart', handleTouchStart);
    previewCanvas.addEventListener('touchmove', handleTouchMove);
    previewCanvas.addEventListener('touchend', handleTouchEnd);
  }
  
  function startDrawing(e: MouseEvent) {
    console.log('Starting drawing with tool:', currentTool);
    
    // Handle smart background tools differently
    if (currentTool === 'smart-background-erase' || currentTool === 'smart-background-restore') {
      const rect = previewCanvas.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (canvasWidth / rect.width));
      const y = Math.round((e.clientY - rect.top) * (canvasHeight / rect.height));
      
      console.log(`Smart background operation at (${x}, ${y})`);
      
      if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
        const operation = currentTool === 'smart-background-erase' ? 'erase' : 'restore';
        floodFill(x, y, operation);
      }
      
      // Keep the tool active for repeated use - don't auto-reset
      return;
    }
    
    isDrawing = true;
    isCurrentlyDrawing = true; // Block slider updates during drawing
    draw(e);
  }
  
  function handleMouseMove(e: MouseEvent) {
    updateMousePosition(e);
    
    // Show brush preview when hovering
    if (!isDrawing && showBrushCursor) {
      updateBrushPreview(e);
    }
    
    if (isDrawing) {
      const rect = previewCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
      const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
      
      console.log('Mouse drawing at:', { 
        clientX: e.clientX, 
        clientY: e.clientY, 
        rectLeft: rect.left, 
        rectTop: rect.top, 
        rectWidth: rect.width, 
        rectHeight: rect.height, 
        canvasWidth, 
        canvasHeight, 
        scaledX: x,
        scaledY: y,
        mouseX: mouseX,
        mouseY: mouseY,
        isDrawing, 
        currentTool 
      });
      
      drawBrushStroke(x, y);
      updatePreview();
      hasChanges = true;
    }
  }
  
  function updateMousePosition(e: MouseEvent) {
    const rect = previewCanvas.getBoundingClientRect();
    // For cursor display, use CSS coordinates (relative to canvas element)
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }
  
  function handleMouseEnter(e: MouseEvent) {
    showBrushCursor = true;
    showBrushPreview = true;
    updateMousePosition(e);
    updateBrushPreview(e);
  }
  
  function handleMouseOut() {
    showBrushCursor = false;
    showBrushPreview = false;
    stopDrawing();
  }
  
  function draw(e: MouseEvent) {
    // Legacy function for compatibility
    handleMouseMove(e);
  }
  
  function stopDrawing() {
    if (isDrawing) {
      console.log('Stopping drawing');
      
      // Save the completed stroke to history
      saveStrokeToHistory();
    }
    isDrawing = false;
    isCurrentlyDrawing = false; // Re-enable slider updates
  }

  
  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  }
  
  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  }

  function handleTouchEnd(e: TouchEvent) {
    stopDrawing();
  }
  
  function drawBrushStroke(x: number, y: number) {
    console.log('Drawing brush stroke:', { 
      tool: currentTool, 
      x, 
      y, 
      brushSize, 
      canvasWidth, 
      canvasHeight,
      inBounds: x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight
    });
    
    // Check if coordinates are within canvas bounds
    if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
      console.warn('Brush stroke out of bounds:', { x, y, canvasWidth, canvasHeight });
      return;
    }
    
    switch (currentTool) {
      case 'restore':
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.beginPath();
        maskCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        maskCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        maskCtx.fill();
        console.log('Painted basic restore stroke at:', { x, y, radius: brushSize / 2 });
        break;
        
      case 'erase':
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.beginPath();
        maskCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        maskCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        maskCtx.fill();
        console.log('Painted basic erase stroke at:', { x, y, radius: brushSize / 2 });
        break;
        
      case 'precision-erase':
        maskCtx.globalCompositeOperation = 'destination-out';
        maskCtx.beginPath();
        const eraseSize = brushSize * 0.7; // Precision erase uses smaller size
        maskCtx.arc(x, y, eraseSize / 2, 0, 2 * Math.PI);
        maskCtx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        maskCtx.fill();
        console.log('Painted erase stroke at:', { x, y, radius: eraseSize / 2, operation: 'destination-out' });
        break;
        
      case 'edge-refine':
        // Edge refine uses a softer, gradient brush
        maskCtx.globalCompositeOperation = 'source-over';
        const gradient = maskCtx.createRadialGradient(x, y, 0, x, y, brushSize / 2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        maskCtx.beginPath();
        maskCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        maskCtx.fillStyle = gradient;
        maskCtx.fill();
        console.log('Painted edge-refine stroke at:', { x, y, radius: brushSize / 2, type: 'gradient' });
        break;
    }
  }
  
  function updatePreviewWithFullReprocessing() {
    if (!previewCtx || !processedCanvas || !originalCtx) {
      console.log('Full reprocessing skipped - missing contexts');
      return;
    }
    
    console.log('🔄 FULL REPROCESSING with sliders - Sensitivity:', backgroundSensitivity, 'Edge:', edgeRefinement);
    
    // Clear preview canvas
    previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Start with processed image
    previewCtx.drawImage(processedCanvas, 0, 0);
    
    try {
      // Get image data for full processing
      const originalImageData = originalCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const previewImageData = previewCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      
      // Apply sliders to ENTIRE image
      const sensitivityFactor = backgroundSensitivity / 100;
      const aggressiveness = 1 - sensitivityFactor;
      const edgeSmoothingFactor = edgeRefinement / 100;
      
      console.log('🎛️ Processing entire image with aggressiveness:', aggressiveness, 'smoothing:', edgeSmoothingFactor);
      
      // Process every pixel
      for (let i = 0; i < previewImageData.data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % canvasWidth;
        const y = Math.floor(pixelIndex / canvasWidth);
        
        const currentAlpha = previewImageData.data[i + 3];
        
        // ENHANCED BACKGROUND SENSITIVITY - Apply to all semi-transparent pixels
        if (currentAlpha > 0 && currentAlpha < 255) {
          const luminance = (previewImageData.data[i] * 0.299 + 
                           previewImageData.data[i + 1] * 0.587 + 
                           previewImageData.data[i + 2] * 0.114) / 255;
          
          let adjustedAlpha = currentAlpha;
          
          // More aggressive removal for background-like pixels
          if (aggressiveness > 0.5) {
            const backgroundLikelihood = Math.max(0, 1 - luminance * 1.2);
            const removalStrength = aggressiveness * backgroundLikelihood * 0.8;
            adjustedAlpha = Math.max(0, currentAlpha * (1 - removalStrength));
          }
          
          // Conservative approach
          if (aggressiveness < 0.3) {
            const threshold = 80 + (sensitivityFactor * 120);
            adjustedAlpha = currentAlpha > threshold ? currentAlpha : currentAlpha * sensitivityFactor;
          } else {
            // Gradient-based removal
            const threshold = 40 + (sensitivityFactor * 180);
            if (currentAlpha < threshold) {
              const fadeStrength = aggressiveness * 1.5;
              adjustedAlpha = Math.max(0, currentAlpha - (threshold - currentAlpha) * fadeStrength * 0.01);
            }
          }
          
          previewImageData.data[i + 3] = Math.round(Math.max(0, Math.min(255, adjustedAlpha)));
        }
        
        // ENHANCED EDGE REFINEMENT - Apply to edge pixels
        if (edgeSmoothingFactor > 0.1 && currentAlpha > 10 && currentAlpha < 240) {
          let neighborSum = 0;
          let neighborCount = 0;
          
          // Sample 3x3 neighborhood
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < canvasWidth && ny >= 0 && ny < canvasHeight) {
                const neighborIndex = (ny * canvasWidth + nx) * 4;
                if (neighborIndex < previewImageData.data.length) {
                  neighborSum += previewImageData.data[neighborIndex + 3];
                  neighborCount++;
                }
              }
            }
          }
          
          if (neighborCount > 0) {
            const averageNeighborAlpha = neighborSum / neighborCount;
            const edgeStrength = Math.abs(currentAlpha - averageNeighborAlpha) / 255;
            
            // Apply smoothing based on edge refinement setting
            if (edgeStrength > 0.1) {
              const smoothingAmount = edgeSmoothingFactor * 0.6 * Math.min(edgeStrength * 2, 1);
              const smoothedAlpha = currentAlpha + (averageNeighborAlpha - currentAlpha) * smoothingAmount;
              previewImageData.data[i + 3] = Math.round(Math.max(0, Math.min(255, smoothedAlpha)));
            }
          }
        }
      }
      
      // Apply mask restoration on top
      if (maskCtx) {
        const maskImageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        
        for (let i = 0; i < maskImageData.data.length; i += 4) {
          const maskAlpha = maskImageData.data[i + 3] / 255;
          
          if (maskAlpha > 0) {
            const originalR = originalImageData.data[i];
            const originalG = originalImageData.data[i + 1];
            const originalB = originalImageData.data[i + 2];
            const originalAlpha = originalImageData.data[i + 3];
            
            // Restore original pixels where mask is painted
            previewImageData.data[i] = originalR;
            previewImageData.data[i + 1] = originalG;
            previewImageData.data[i + 2] = originalB;
            previewImageData.data[i + 3] = originalAlpha;
          }
        }
      }
      
      previewCtx.putImageData(previewImageData, 0, 0);
      console.log('🎯 Full reprocessing complete!');
      
    } catch (error) {
      console.error('Full reprocessing failed:', error);
      // Fallback to basic preview
      updatePreview();
    }
  }

  function updatePreview() {
    if (!previewCtx || !processedCanvas || !maskCtx || !originalCtx) {
      console.log('Preview update skipped - missing contexts');
      return;
    }
    
    console.log('Updating preview...');
    
    // Clear preview canvas
    previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Choose base image based on preview toggle
    if (showOriginalPreview) {
      // Show original image as base
      previewCtx.drawImage(originalCanvas, 0, 0);
    } else {
      // Show processed image as base
      previewCtx.drawImage(processedCanvas, 0, 0);
    }
    
    // Apply mask to restore original pixels where needed
    previewCtx.globalCompositeOperation = 'source-over';
    
    try {
      // Get image data
      const maskImageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const originalImageData = originalCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const previewImageData = previewCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      
      // ENHANCED BACKGROUND SENSITIVITY ALGORITHM
      const sensitivityFactor = backgroundSensitivity / 100; // 0-1 range
      const aggressiveness = 1 - sensitivityFactor; // Higher = more aggressive removal
      
      // ENHANCED EDGE REFINEMENT ALGORITHM
      const edgeSmoothingFactor = edgeRefinement / 100; // 0-1 range
      
      // Count mask pixels for debugging
      let maskPixelCount = 0;
      for (let i = 3; i < maskImageData.data.length; i += 4) {
        if (maskImageData.data[i] > 0) maskPixelCount++;
      }
      
      console.log('Mask has', maskPixelCount, 'painted pixels');
      console.log('Applying REAL sensitivity:', backgroundSensitivity, 'aggressiveness:', aggressiveness);
      console.log('Applying REAL edge refinement:', edgeRefinement, 'smoothing:', edgeSmoothingFactor);
      
      // Enhanced pixel processing with real algorithms
      for (let i = 0; i < maskImageData.data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % canvasWidth;
        const y = Math.floor(pixelIndex / canvasWidth);
        
        const maskAlpha = maskImageData.data[i + 3] / 255;
        const originalR = originalImageData.data[i];
        const originalG = originalImageData.data[i + 1];
        const originalB = originalImageData.data[i + 2];
        const originalAlpha = originalImageData.data[i + 3];
        const processedAlpha = previewImageData.data[i + 3];
        
        if (maskAlpha > 0) {
          // ENHANCED RESTORATION with smart blending
          // Check if this is from smart restore (higher alpha values) vs basic restore
          const isSmartRestore = maskAlpha > 0.9;
          
          if (isSmartRestore) {
            // Smart restore: blend original with processed for smoother transitions
            const processedR = previewImageData.data[i];
            const processedG = previewImageData.data[i + 1];
            const processedB = previewImageData.data[i + 2];
            
            // Calculate blend factor based on mask alpha and content-aware blending
            const luminanceDiff = Math.abs(
              (originalR * 0.299 + originalG * 0.587 + originalB * 0.114) -
              (processedR * 0.299 + processedG * 0.587 + processedB * 0.114)
            );
            
            // Use content-aware blending - less blending where colors differ significantly
            const blendFactor = Math.min(maskAlpha, 1 - (luminanceDiff / 255) * 0.3);
            
            previewImageData.data[i] = Math.round(originalR * blendFactor + processedR * (1 - blendFactor));
            previewImageData.data[i + 1] = Math.round(originalG * blendFactor + processedG * (1 - blendFactor));
            previewImageData.data[i + 2] = Math.round(originalB * blendFactor + processedB * (1 - blendFactor));
            previewImageData.data[i + 3] = Math.round(originalAlpha * blendFactor + previewImageData.data[i + 3] * (1 - blendFactor));
          } else {
            // Basic restore: direct replacement
            previewImageData.data[i] = originalR;
            previewImageData.data[i + 1] = originalG;
            previewImageData.data[i + 2] = originalB;
            previewImageData.data[i + 3] = originalAlpha;
          }
        } else {
          // REAL BACKGROUND SENSITIVITY PROCESSING
          if (processedAlpha > 0) {
            // Calculate color luminance for better background detection
            const luminance = (previewImageData.data[i] * 0.299 + 
                             previewImageData.data[i + 1] * 0.587 + 
                             previewImageData.data[i + 2] * 0.114) / 255;
            
            // Apply aggressive background removal based on sensitivity
            let adjustedAlpha = processedAlpha;
            
            // More aggressive removal for low-luminance areas (typical backgrounds)
            if (aggressiveness > 0.5) {
              const backgroundLikelihood = Math.max(0, 1 - luminance);
              const removalStrength = aggressiveness * backgroundLikelihood;
              adjustedAlpha = Math.max(0, processedAlpha * (1 - removalStrength));
            }
            
            // Conservative approach - only remove very transparent areas
            if (aggressiveness < 0.3) {
              const threshold = 50 + (sensitivityFactor * 150); // 50-200 range
              adjustedAlpha = processedAlpha < threshold ? 0 : processedAlpha;
            } else {
              // Gradient removal based on sensitivity
              const threshold = 30 + (sensitivityFactor * 200); // 30-230 range
              const fadeStrength = aggressiveness * 2;
              if (processedAlpha < threshold) {
                adjustedAlpha = Math.max(0, processedAlpha - (threshold - processedAlpha) * fadeStrength);
              }
            }
            
            previewImageData.data[i + 3] = Math.round(adjustedAlpha);
          }
          
          // REAL EDGE REFINEMENT PROCESSING
          if (edgeSmoothingFactor > 0 && previewImageData.data[i + 3] > 0) {
            const currentAlpha = previewImageData.data[i + 3];
            
            // Apply gaussian-like smoothing for edge refinement
            if (currentAlpha > 0 && currentAlpha < 255) {
              // Sample neighboring pixels for edge detection
              let neighborSum = 0;
              let neighborCount = 0;
              
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx >= 0 && nx < canvasWidth && ny >= 0 && ny < canvasHeight) {
                    const neighborIndex = (ny * canvasWidth + nx) * 4;
                    if (neighborIndex < previewImageData.data.length) {
                      neighborSum += previewImageData.data[neighborIndex + 3];
                      neighborCount++;
                    }
                  }
                }
              }
              
              if (neighborCount > 0) {
                const averageNeighborAlpha = neighborSum / neighborCount;
                const edgeStrength = Math.abs(currentAlpha - averageNeighborAlpha) / 255;
                
                // Apply stronger smoothing to high-contrast edges
                if (edgeStrength > 0.2) {
                  const smoothingAmount = edgeSmoothingFactor * 0.4 * edgeStrength;
                  const smoothedAlpha = currentAlpha + (averageNeighborAlpha - currentAlpha) * smoothingAmount;
                  previewImageData.data[i + 3] = Math.round(Math.max(0, Math.min(255, smoothedAlpha)));
                }
              }
            }
          }
        }
      }
      
      previewCtx.putImageData(previewImageData, 0, 0);
      previewCtx.globalCompositeOperation = 'source-over';
      
      console.log('Preview updated with REAL slider functionality');
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  }
  
  function clearMask() {
    console.log('Clearing mask...');
    if (maskCtx) {
      // Clear the mask canvas
      maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
      maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Reset history to initial state
      saveInitialMaskState();
      updatePreview();
      hasChanges = false;
      
      console.log('Mask cleared and history reset');
    }
  }

  // Helper function to check if undo is available
  function canUndo(): boolean {
    return currentHistoryIndex > 0 && strokeHistory.length > 1;
  }

  // Helper function to get history state info for debugging
  function getHistoryInfo() {
    return {
      currentIndex: currentHistoryIndex,
      totalStates: strokeHistory.length,
      canUndo: canUndo(),
      hasChanges: hasChanges
    };
  }

  // Smart background tools
  function smartBackgroundErase() {
    currentTool = 'smart-background-erase';
    console.log('Smart background erase activated with tolerance:', backgroundTolerance);
  }

  function smartBackgroundRestore() {
    currentTool = 'smart-background-restore';
    console.log('Smart background restore activated with tolerance:', backgroundTolerance);
  }

  // Tolerance preview functions
  function showTolerancePreviewOverlay() {
    if (!originalCtx || !previewCanvas) return;
    
    showTolerancePreview = true;
    
    // Create tolerance preview overlay
    if (!tolerancePreviewCanvas) {
      tolerancePreviewCanvas = document.createElement('canvas');
      tolerancePreviewCanvas.width = canvasWidth;
      tolerancePreviewCanvas.height = canvasHeight;
      tolerancePreviewCtx = tolerancePreviewCanvas.getContext('2d')!;
    }
    
    try {
      const originalImageData = originalCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const previewImageData = tolerancePreviewCtx.createImageData(canvasWidth, canvasHeight);
      
      const tolerance = (backgroundTolerance / 100) * 255;
      
      // Sample from center of image to detect likely background color
      const centerX = Math.floor(canvasWidth / 2);
      const centerY = Math.floor(canvasHeight / 2);
      const centerIndex = (centerY * canvasWidth + centerX) * 4;
      const bgR = originalImageData.data[centerIndex];
      const bgG = originalImageData.data[centerIndex + 1];
      const bgB = originalImageData.data[centerIndex + 2];
      
      console.log(`Showing tolerance preview with ${backgroundTolerance}% tolerance`);
      console.log(`Background sample color: RGB(${bgR}, ${bgG}, ${bgB})`);
      
      // Highlight areas that would be affected by current tolerance
      for (let i = 0; i < originalImageData.data.length; i += 4) {
        const r = originalImageData.data[i];
        const g = originalImageData.data[i + 1];
        const b = originalImageData.data[i + 2];
        
        // Calculate color distance from background sample
        const distance = colorDistance(bgR, bgG, bgB, r, g, b);
        
        if (distance <= tolerance) {
          // Highlight affected areas with semi-transparent overlay
          previewImageData.data[i] = 255;     // Red
          previewImageData.data[i + 1] = 255; // Green 
          previewImageData.data[i + 2] = 0;   // Blue (Yellow highlight)
          previewImageData.data[i + 3] = 80;  // Alpha (semi-transparent)
        } else {
          // Transparent for unaffected areas
          previewImageData.data[i] = 0;
          previewImageData.data[i + 1] = 0;
          previewImageData.data[i + 2] = 0;
          previewImageData.data[i + 3] = 0;
        }
      }
      
      tolerancePreviewCtx.putImageData(previewImageData, 0, 0);
      
      // Draw the preview overlay on top of the main canvas
      previewCtx.save();
      previewCtx.globalCompositeOperation = 'source-over';
      previewCtx.drawImage(tolerancePreviewCanvas, 0, 0);
      previewCtx.restore();
      
    } catch (error) {
      console.error('Failed to show tolerance preview:', error);
    }
  }
  
  function hideTolerancePreviewOverlay() {
    showTolerancePreview = false;
    // Redraw the normal preview without the tolerance overlay
    updatePreview();
  }
  
  // Update tolerance preview when slider changes
  $: if (showTolerancePreview && backgroundTolerance !== undefined) {
    showTolerancePreviewOverlay();
  }

  // Color similarity calculation for flood fill
  function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  }

  // Flood fill algorithm for smart background operations
  function floodFill(startX: number, startY: number, operation: 'erase' | 'restore') {
    if (!maskCtx || !originalCtx || !processedCtx) return;

    try {
      const imageData = originalCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const maskData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imageData.data;
      const mask = maskData.data;
      
      // Get the starting pixel color
      const startIndex = (startY * canvasWidth + startX) * 4;
      const startR = data[startIndex];
      const startG = data[startIndex + 1];
      const startB = data[startIndex + 2];
      
      const tolerance = (backgroundTolerance / 100) * 255; // Convert percentage to RGB range
      const visited = new Set<string>();
      const queue: Array<{x: number, y: number}> = [{x: startX, y: startY}];
      
      console.log(`Starting flood fill at (${startX}, ${startY}) with color RGB(${startR}, ${startG}, ${startB}) and tolerance ${tolerance}`);
      
      let processedPixels = 0;
      
      while (queue.length > 0 && processedPixels < 10000) { // Limit to prevent infinite loops
        const {x, y} = queue.shift()!;
        const key = `${x},${y}`;
        
        if (visited.has(key) || x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) {
          continue;
        }
        
        visited.add(key);
        processedPixels++;
        
        const index = (y * canvasWidth + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Check if pixel color is similar to start color
        const distance = colorDistance(startR, startG, startB, r, g, b);
        if (distance <= tolerance) {
          // Apply the operation to the mask
          if (operation === 'erase') {
            mask[index + 3] = 0; // Make transparent in mask
          } else {
            mask[index + 3] = 255; // Make opaque in mask (restore)
          }
          
          // Add neighboring pixels to queue
          queue.push(
            {x: x + 1, y: y},
            {x: x - 1, y: y},
            {x: x, y: y + 1},
            {x: x, y: y - 1}
          );
        }
      }
      
      console.log(`Flood fill completed: processed ${processedPixels} pixels, visited ${visited.size} locations`);
      
      // Update the mask canvas
      maskCtx.putImageData(maskData, 0, 0);
      
      // Save to history and update preview
      saveStrokeToHistory();
      updatePreview();
      hasChanges = true;
      
    } catch (error) {
      console.error('Flood fill operation failed:', error);
    }
  }
  
  function undoLastStroke() {
    if (currentHistoryIndex <= 0 || strokeHistory.length === 0) {
      console.log('No strokes to undo - at initial state');
      return;
    }
    
    if (!maskCtx) {
      console.error('Cannot undo: maskCtx not available');
      return;
    }
    
    try {
      currentHistoryIndex--;
      const previousState = strokeHistory[currentHistoryIndex];
      
      if (!previousState) {
        throw new Error(`No history state found at index ${currentHistoryIndex}`);
      }
      
      // Restore the previous mask state
      maskCtx.putImageData(previousState, 0, 0);
      updatePreview();
      
      // Update hasChanges based on whether we're back to initial state (index 0)
      hasChanges = currentHistoryIndex > 0;
      
      console.log(`Undo to history index: ${currentHistoryIndex}. HasChanges: ${hasChanges}`);
    } catch (error) {
      console.error('Failed to undo stroke:', error);
      console.error('History state:', { 
        currentIndex: currentHistoryIndex, 
        historyLength: strokeHistory.length,
        state: strokeHistory[currentHistoryIndex] ? 'exists' : 'missing'
      });
      
      // Try to recover by going to a known good state
      if (strokeHistory.length > 0) {
        console.log('Attempting recovery by resetting to initial state');
        currentHistoryIndex = 0;
        try {
          maskCtx.putImageData(strokeHistory[0], 0, 0);
          updatePreview();
          hasChanges = false;
        } catch (recoveryError) {
          console.error('Recovery failed, clearing mask:', recoveryError);
          clearMask();
        }
      } else {
        console.log('No history available, clearing mask');
        clearMask();
      }
    }
  }
  
  async function applyRefinements() {
    if (!hasChanges) {
      console.log('No changes made - using current processed image');
    }
    
    console.log('=== APPLYING REFINEMENTS ===');
    isProcessingRefinement = true;
    
    try {
      // Validate canvas state
      if (!previewCanvas) {
        throw new Error('Preview canvas not available');
      }
      
      console.log('Canvas dimensions:', previewCanvas.width, previewCanvas.height);
      console.log('Canvas context:', previewCtx);
      
      // Get the refined image data
      console.log('Converting canvas to data URL...');
      const refinedImageData = previewCanvas.toDataURL('image/png', 0.95);
      
      if (!refinedImageData || refinedImageData === 'data:,') {
        throw new Error('Canvas is empty or corrupted');
      }
      
      console.log('Refined image data length:', refinedImageData.length);
      console.log('Data URL preview:', refinedImageData.substring(0, 100) + '...');
      
      // Dispatch the refined image
      console.log('Dispatching refined event...');
      dispatch('refined', {
        refinedImage: refinedImageData,
        hasChanges: true
      });
      
      console.log('Refinement dispatch successful');
      
    } catch (error) {
      console.error('=== REFINEMENT ERROR ===');
      console.error('Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error message:', errorMessage);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      dispatch('error', { 
        message: `Failed to apply refinements: ${errorMessage}` 
      });
    } finally {
      isProcessingRefinement = false;
    }
  }
  
  function cancelRefinement() {
    dispatch('cancel');
  }
  
  function setBrushSize(size: number) {
    brushSize = Math.max(5, Math.min(100, size));
  }
  
  function updateBrushPreview(e: MouseEvent) {
    if (!previewCanvas || !previewCtx) return;
    
    const rect = previewCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
    
    // Create a temporary canvas to show brush effect preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Copy current preview to temp canvas
    tempCtx.drawImage(previewCanvas, 0, 0);
    
    // Apply brush preview effect
    tempCtx.globalCompositeOperation = 'source-over';
    tempCtx.beginPath();
    tempCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    
    switch (currentTool) {
      case 'restore':
        tempCtx.fillStyle = 'rgba(0, 255, 136, 0.3)';
        tempCtx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
        break;
      case 'erase':
        tempCtx.fillStyle = 'rgba(255, 136, 68, 0.4)';
        tempCtx.strokeStyle = 'rgba(255, 136, 68, 1.0)';
        break;
      case 'precision-erase':
        tempCtx.fillStyle = 'rgba(255, 68, 68, 0.4)';
        tempCtx.strokeStyle = 'rgba(255, 68, 68, 1.0)';
        break;
      case 'edge-refine':
        tempCtx.fillStyle = 'rgba(136, 136, 255, 0.3)';
        tempCtx.strokeStyle = 'rgba(136, 136, 255, 0.8)';
        break;
    }
    
    tempCtx.lineWidth = 2;
    tempCtx.fill();
    tempCtx.stroke();
    
    // Store preview data
    brushPreviewData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  }
</script>

{#if isVisible}
  <div class="refinement-overlay" on:click|self={cancelRefinement}>
    <div class="refinement-container">
      
      <!-- Header -->
      <div class="refinement-header">
        <h3 class="text-xl font-semibold text-magic-gradient">Refine Your Character</h3>
        <p class="text-sm text-dark-text-secondary mt-1">
          Use the brush tools to restore or remove parts as needed
        </p>
        
        
        <button 
          on:click={cancelRefinement}
          class="close-button"
          aria-label="Close refinement editor"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      
      <!-- Main Editor Layout -->
      <div class="editor-layout">
        
        <!-- Left Panel - Controls -->
        <div class="controls-panel" class:collapsed={controlsCollapsed}>
          
          <!-- Info Button - positioned before collapse button -->
          <button 
            class="tool-info-button-header"
            on:click={() => showToolInfo = !showToolInfo}
            title="Show tool descriptions"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>

          <!-- Collapse Toggle Button -->
          <button 
            class="collapse-toggle"
            on:click={() => controlsCollapsed = !controlsCollapsed}
            title={controlsCollapsed ? 'Expand Controls' : 'Collapse Controls'}
          >
            <svg class="w-4 h-4 {controlsCollapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            {#if !controlsCollapsed}
              <span class="collapse-text">Collapse</span>
            {/if}
          </button>
          
          <!-- Controls Content -->
          <div class="controls-content" class:hidden={controlsCollapsed}>
          
          <!-- Tool Selection -->
          <div class="tool-section">
            <h4 class="section-title">Tools</h4>
            
            {#if showToolInfo}
              <div class="tool-info-panel">
                <div class="tool-info-item">
                  <strong>Restore:</strong> Basic brush to bring back original background areas
                </div>
                <div class="tool-info-item">
                  <strong>Smart Restore:</strong> Intelligent restoration with better edge blending and gradient effects
                </div>
                <div class="tool-info-item">
                  <strong>Erase:</strong> Remove unwanted parts with a standard eraser
                </div>
                <div class="tool-info-item">
                  <strong>Precision Erase:</strong> Smaller, more accurate eraser for detailed work
                </div>
                <div class="tool-info-item">
                  <strong>Edge Refine:</strong> Smooth and blend edge transitions with gradient effects
                </div>
              </div>
            {/if}
            
            <!-- Quick Background Tools - Moved to top -->
            <div class="background-tools-section">
              <h4 class="section-title">Quick Background Tools</h4>
              <p class="control-description">Quickly erase or restore similar background colors</p>
              
              <div class="background-tolerance-controls">
                <div class="slider-value-display">
                  <span class="slider-value">{backgroundTolerance}%</span>
                  <span class="slider-status">Tolerance</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  bind:value={backgroundTolerance}
                  class="tolerance-slider"
                  title="Color similarity tolerance for background operations"
                />
                <div class="slider-labels">
                  <span class="slider-label-left">Precise</span>
                  <span class="slider-label-right">Broad</span>
                </div>
              </div>
              
              <div class="quick-background-buttons">
                <button
                  on:click={smartBackgroundErase}
                  on:mouseenter={showTolerancePreviewOverlay}
                  on:mouseleave={hideTolerancePreviewOverlay}
                  class="quick-bg-btn erase"
                  title="Click on background area to erase similar colors (hover to preview affected areas)"
                  disabled={isCurrentlyDrawing}
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Smart Background Erase
                  {#if showTolerancePreview}
                    <span class="tolerance-preview-indicator">👁️</span>
                  {/if}
                </button>
                
                <button
                  on:click={smartBackgroundRestore}
                  on:mouseenter={showTolerancePreviewOverlay}
                  on:mouseleave={hideTolerancePreviewOverlay}
                  class="quick-bg-btn restore"
                  title="Click on area to restore similar background colors (hover to preview affected areas)"
                  disabled={isCurrentlyDrawing}
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Smart Background Restore
                  {#if showTolerancePreview}
                    <span class="tolerance-preview-indicator">👁️</span>
                  {/if}
                </button>
              </div>
            </div>
            
            <!-- Main Tool Buttons -->
            <div class="tool-buttons">
              <button
                class="tool-button {currentTool === 'restore' ? 'active' : ''}"
                on:click={() => currentTool = 'restore'}
                title="Basic brush - restore original pixels"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Restore
              </button>
              
              <button
                class="tool-button {currentTool === 'erase' ? 'active' : ''}"
                on:click={() => currentTool = 'erase'}
                title="Basic eraser - remove pixels to make transparent"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Erase
              </button>
              
              <button
                class="tool-button {currentTool === 'precision-erase' ? 'active' : ''}"
                on:click={() => currentTool = 'precision-erase'}
                title="Precision eraser - smaller, more accurate removal"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                Precision Erase
              </button>
              
              <button
                class="tool-button {currentTool === 'edge-refine' ? 'active' : ''}"
                on:click={() => currentTool = 'edge-refine'}
                title="Edge refine - smooth and blend edge transitions"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                Edge Refine
              </button>
            </div>
          </div>
          
          <!-- Brush Size -->
          <div class="brush-section">
            <h4 class="section-title">Brush Size</h4>
            <div class="brush-controls">
              <input
                type="range"
                min="5"
                max="100"
                bind:value={brushSize}
                class="brush-slider"
              />
              <span class="brush-size-display">{brushSize}px</span>
            </div>
          </div>
          
          <!-- Background Sensitivity Control -->
          <div class="sensitivity-section">
            <h4 class="section-title">Background Sensitivity</h4>
            <p class="control-description">Adjust how aggressively backgrounds are removed</p>
            <div class="sensitivity-controls">
              <div class="slider-value-display">
                <span class="slider-value">{backgroundSensitivity}%</span>
                <span class="slider-status">{backgroundSensitivity < 30 ? 'Aggressive' : backgroundSensitivity > 70 ? 'Conservative' : 'Balanced'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                bind:value={backgroundSensitivity}
                class="sensitivity-slider"
                title="Lower = Remove more background, Higher = Keep more detail"
              />
              <div class="slider-labels">
                <span class="slider-label-left">Aggressive</span>
                <span class="slider-label-right">Conservative</span>
              </div>
            </div>
          </div>
          
          <!-- Edge Refinement Control -->
          <div class="edge-section">
            <h4 class="section-title">Edge Refinement</h4>
            <p class="control-description">Smooth and refine edges around complex areas</p>
            <div class="edge-controls">
              <div class="slider-value-display">
                <span class="slider-value">{edgeRefinement}%</span>
                <span class="slider-status">{edgeRefinement < 30 ? 'Sharp' : edgeRefinement > 70 ? 'Smooth' : 'Balanced'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                bind:value={edgeRefinement}
                class="edge-slider"
                title="Higher values create smoother, softer edges"
              />
              <div class="slider-labels">
                <span class="slider-label-left">Sharp</span>
                <span class="slider-label-right">Smooth</span>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="actions-section">
            <h4 class="section-title">Actions</h4>
            <div class="action-buttons">
              <button
                on:click={undoLastStroke}
                class="action-btn"
                title="Undo last stroke"
                disabled={!canUndoStrokes}
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
                Undo
              </button>
              
              <button
                on:click={clearMask}
                class="action-btn"
                title="Clear all changes"
                disabled={!hasChanges}
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear
              </button>
            </div>
          </div>
          
          <!-- Preview Toggle -->
          <div class="preview-section">
            <h4 class="section-title">Preview</h4>
            <div class="preview-controls">
              <label class="preview-toggle">
                <input type="checkbox" bind:checked={showOriginalPreview} />
                <span>Show Original Background</span>
              </label>
            </div>
          </div>
          
          
          </div> <!-- End controls-content -->
          
          <!-- Collapsed State Hint -->
          {#if controlsCollapsed}
            <div class="collapsed-hint">
              <div class="tool-indicator">🖌️</div>
              <div class="collapse-help">Click arrow to expand tools</div>
            </div>
          {/if}
          
        </div>
        
        <!-- Right Panel - Canvas Area -->
        <div class="canvas-area">
          
          <!-- Main Canvas Container -->
          <div class="main-canvas-container" bind:this={canvasContainer}>
            <!-- Hidden canvases for processing -->
            <canvas bind:this={originalCanvas} class="hidden" />
            <canvas bind:this={processedCanvas} class="hidden" />
            <canvas bind:this={maskCanvas} class="hidden" />
            
            <!-- Editing Canvas -->
            <div class="editing-canvas-wrapper">
              <div class="canvas-container">
                <canvas 
                  bind:this={previewCanvas}
                  class="editing-canvas"
                  style="cursor: none"
                />
                
                <!-- Dynamic Brush cursor -->
                {#if showBrushCursor}
                  <div 
                    class="dynamic-brush-cursor {currentTool}"
                    class:drawing={isDrawing}
                    style="
                      left: {mouseX}px; 
                      top: {mouseY}px; 
                      width: {displayBrushSize}px; 
                      height: {displayBrushSize}px;
                      opacity: {isDrawing ? 0.3 : 0.6}
                    "
                  >
                  <!-- Inner dot for precision -->
                  <div class="cursor-center"></div>
                  
                  <!-- Brush effect preview ring -->
                  {#if showBrushPreview && !isDrawing}
                    <div class="brush-preview-ring {currentTool}">
                      <div class="preview-indicator">
                        {#if currentTool === 'restore'}
                          ↺
                        {:else if currentTool === 'erase'}
                          ⌫
                        {:else if currentTool === 'precision-erase'}
                          ✕
                        {:else if currentTool === 'edge-refine'}
                          ✨
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
      
      <!-- Footer Actions -->
      <div class="refinement-footer">
        <button
          on:click={cancelRefinement}
          class="btn btn-outline border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
          disabled={isProcessingRefinement}
        >
          Cancel
        </button>
        
        <button
          on:click={applyRefinements}
          class="btn btn-magic"
          disabled={isProcessingRefinement}
        >
          {#if isProcessingRefinement}
            <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Applying...
          {:else}
            {hasChanges ? 'Apply Changes' : 'Use Current Image'}
          {/if}
        </button>
      </div>
      
    </div>
  </div>
{/if}

<style>
  .refinement-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 10px;
  }
  
  .refinement-container {
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 12px;
    max-width: 95vw;
    max-height: 95vh;
    width: 95vw;
    height: 95vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  }
  
  .editor-layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  
  .controls-panel {
    width: 320px;
    background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(26, 26, 26, 0.85) 100%);
    border-right: 1px solid rgba(0, 255, 136, 0.1);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    overflow-y: auto;
    transition: width 0.3s ease, padding 0.3s ease;
    position: relative;
    backdrop-filter: blur(10px);
  }
  
  .controls-panel.collapsed {
    width: 60px;
    padding: 20px 10px;
  }
  
  .tool-info-button-header {
    position: absolute;
    top: 10px;
    right: 120px; /* Moved further left to prevent overlap issues */
    background: transparent;
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 50%;
    color: rgba(0, 255, 136, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    width: 24px;
    height: 24px;
    transition: all 0.2s ease;
    z-index: 10;
  }
  
  .tool-info-button-header:hover {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.4);
    color: rgba(0, 255, 136, 0.9);
    transform: scale(1.1);
  }

  .collapse-toggle {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid rgba(0, 255, 136, 0.3);
    border-radius: 6px;
    color: #00ff88;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s;
    z-index: 10;
  }
  
  .collapse-toggle:hover {
    background: rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.5);
  }
  
  .collapse-toggle svg {
    transition: transform 0.3s ease;
  }
  
  .controls-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    transition: opacity 0.2s ease;
  }
  
  .controls-content.hidden {
    opacity: 0;
    pointer-events: none;
  }
  
  .collapsed-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 40px;
    opacity: 0.7;
    text-align: center;
  }
  
  .tool-indicator {
    font-size: 24px;
    opacity: 0.6;
  }
  
  .collapse-help {
    color: #666;
    font-size: 10px;
    font-weight: 500;
    line-height: 1.2;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    max-width: 40px;
  }
  
  .canvas-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px;
    min-width: 0;
    height: 100%; /* Use full available height */
  }
  
  .refinement-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
  }
  
  .close-button {
    position: absolute;
    top: 16px;
    right: 20px;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;
  }
  
  .close-button:hover {
    color: #fff;
  }
  
  
  /* Control Panel Styles */
  .section-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .section-title {
    color: #00ff88;
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
    border-bottom: 1px solid rgba(0, 255, 136, 0.2);
    padding-bottom: 8px;
  }
  
  .tool-info-button {
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid rgba(0, 255, 136, 0.5);
    border-radius: 50%;
    color: rgba(0, 255, 136, 0.9);
    cursor: pointer;
    padding: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .tool-info-button:hover {
    background: rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.8);
    color: rgba(0, 255, 136, 1);
    transform: scale(1.15);
    box-shadow: 0 4px 8px rgba(0, 255, 136, 0.3);
  }
  
  .info-section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: flex-end;
  }
  
  .tool-info-button-subtle {
    background: transparent;
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 50%;
    color: rgba(0, 255, 136, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    width: 24px;
    height: 24px;
    transition: all 0.2s ease;
    margin-left: auto;
  }
  
  .tool-info-button-subtle:hover {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.4);
    color: rgba(0, 255, 136, 0.9);
    transform: scale(1.1);
  }
  
  .tool-info-panel {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 6px;
    margin-bottom: 12px;
    padding: 12px;
    animation: slideDown 0.2s ease-out;
  }
  
  .tool-info-item {
    color: #ccc;
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 8px;
  }
  
  .tool-info-item:last-child {
    margin-bottom: 0;
  }
  
  .tool-info-item strong {
    color: #00ff88;
    font-weight: 600;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .tool-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  
  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 6px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: #bbb;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: center;
  }
  
  .tool-button:hover,
  .tool-button.active {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.4);
    color: #00ff88;
  }
  
  .brush-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .brush-slider {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  
  .brush-slider::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    background: #00ff88;
    border-radius: 50%;
    cursor: pointer;
    -webkit-appearance: none;
  }
  
  .brush-size-display {
    color: #00ff88;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
  }
  
  .sensitivity-controls,
  .edge-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .control-description {
    color: #999;
    font-size: 12px;
    margin: -8px 0 8px 0;
    line-height: 1.3;
  }
  
  .sensitivity-slider,
  .edge-slider {
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, rgba(255, 68, 68, 0.3), rgba(0, 255, 136, 0.3));
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  
  .edge-slider {
    background: linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(0, 255, 136, 0.4));
  }
  
  .sensitivity-slider::-webkit-slider-thumb,
  .edge-slider::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    background: #00ff88;
    border-radius: 50%;
    cursor: pointer;
    -webkit-appearance: none;
    box-shadow: 0 0 4px rgba(0, 255, 136, 0.4);
  }
  
  .slider-labels {
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .slider-label-left {
    color: #ff4444;
  }
  
  .slider-label-right {
    color: #00ff88;
  }

  .slider-value-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .slider-value {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    background: rgba(0, 255, 136, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 255, 136, 0.3);
  }

  .slider-status {
    color: #999;
    font-size: 12px;
    font-style: italic;
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #ccc;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }
  
  .action-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .quick-fix-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .quick-fix-btn {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%);
    border: 1px solid rgba(0, 255, 136, 0.3);
    border-radius: 6px;
    color: #00ff88;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }
  
  .quick-fix-btn:hover {
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%);
    border-color: rgba(0, 255, 136, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.2);
  }
  
  .preview-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ccc;
    font-size: 14px;
    cursor: pointer;
  }
  
  .preview-toggle input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #00ff88;
  }

  /* Background Tools Styles */
  .background-tools-section {
    padding: 16px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(0, 255, 136, 0.2);
  }

  .background-tolerance-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tolerance-slider {
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, rgba(0, 255, 136, 0.2), rgba(255, 255, 136, 0.4));
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }

  .tolerance-slider::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    background: #00ff88;
    border-radius: 50%;
    cursor: pointer;
    -webkit-appearance: none;
    box-shadow: 0 0 4px rgba(0, 255, 136, 0.4);
  }

  .quick-background-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .quick-bg-btn {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 12px 16px;
    border: 1px solid;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
    position: relative;
  }

  .quick-bg-btn.erase {
    background: linear-gradient(135deg, rgba(255, 68, 68, 0.1) 0%, rgba(255, 68, 68, 0.05) 100%);
    border-color: rgba(255, 68, 68, 0.3);
    color: #ff4444;
  }

  .quick-bg-btn.erase:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255, 68, 68, 0.2) 0%, rgba(255, 68, 68, 0.1) 100%);
    border-color: rgba(255, 68, 68, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 68, 68, 0.2);
  }

  .quick-bg-btn.restore {
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%);
    border-color: rgba(0, 255, 136, 0.3);
    color: #00ff88;
  }

  .quick-bg-btn.restore:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%);
    border-color: rgba(0, 255, 136, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.2);
  }

  .quick-bg-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .tolerance-preview-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    font-size: 12px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 1; }
  }
  
  
  /* Canvas Area Styles */
  .image-preview {
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .preview-title {
    color: #ccc;
    font-size: 12px;
    font-weight: 500;
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .preview-img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 4px;
    object-fit: contain;
  }
  
  .main-canvas-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 100%;
    width: 100%;
    padding: 4px;
    overflow: hidden;
    min-height: 500px; /* Larger minimum for bigger canvas */
  }
  
  .editing-canvas-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 100%;
    justify-content: center;
    max-width: 100%;
    max-height: 100%;
  }
  
  .canvas-container {
    position: relative;
    display: inline-block;
  }
  
  .canvas-title {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .editing-canvas {
    border: 2px solid rgba(0, 255, 136, 0.3);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    background: 
      linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    display: block;
    /* Canvas will be sized by JavaScript - no constraints for maximum size */
  }
  
  .brush-cursor {
    position: absolute;
    border: 2px solid #00ff88;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 10;
    transition: opacity 0.2s;
  }
  
  .dynamic-brush-cursor {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 15;
    transition: opacity 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dynamic-brush-cursor.restore {
    border: 2px solid #00ff88;
    background: rgba(0, 255, 136, 0.1);
  }
  
  .dynamic-brush-cursor.erase {
    border: 2px solid #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }
  
  .cursor-center {
    width: 2px;
    height: 2px;
    background: currentColor;
    border-radius: 50%;
    opacity: 0.8;
  }
  
  .dynamic-brush-cursor.restore .cursor-center {
    background: #00ff88;
  }
  
  .dynamic-brush-cursor.erase .cursor-center {
    background: #ff4444;
  }
  
  /* Reduce opacity and visual interference during drawing */
  .dynamic-brush-cursor.drawing {
    border-width: 1px;
    background: transparent !important;
  }
  
  .dynamic-brush-cursor.drawing .cursor-center {
    opacity: 0.5;
  }
  
  .brush-preview-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    animation: pulsePreview 2s ease-in-out infinite;
  }
  
  .brush-preview-ring.restore {
    border: 1px dashed #00ff88;
    background: rgba(0, 255, 136, 0.05);
  }
  
  .brush-preview-ring.precision-erase {
    border: 2px dashed #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }
  
  .brush-preview-ring.edge-refine {
    border: 1px dashed #8888ff;
    background: rgba(136, 136, 255, 0.05);
  }
  
  .preview-indicator {
    font-size: 12px;
    font-weight: bold;
    opacity: 0.7;
  }
  
  .brush-preview-ring.restore .preview-indicator {
    color: #00ff88;
  }
  
  .brush-preview-ring.precision-erase .preview-indicator {
    color: #ff4444;
  }
  
  .brush-preview-ring.edge-refine .preview-indicator {
    color: #8888ff;
  }
  
  @keyframes pulsePreview {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  
  .refinement-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .hidden {
    display: none;
  }
  
  .debug-info {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 12px;
    color: #ccc;
  }
  
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .refinement-overlay {
      padding: 0;
    }
    
    .refinement-container {
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }
    
    .editor-layout {
      flex-direction: column;
    }
    
    .controls-panel {
      width: 100%;
      max-height: 40vh;
      overflow-y: auto;
      padding: 12px;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .controls-panel.collapsed {
      width: 100%;
      max-height: 60px;
      padding: 12px;
    }
    
    .collapse-toggle {
      position: relative;
      top: auto;
      right: auto;
      margin-bottom: 8px;
    }
    
    .collapsed-hint {
      margin-top: 8px;
    }
    
    .collapse-help {
      writing-mode: horizontal-tb;
      text-orientation: initial;
      max-width: none;
    }
    
    .canvas-area {
      flex: 1;
      padding: 8px;
      height: calc(100vh - 100px); /* More height on mobile */
    }
    
    /* Make tool buttons larger for touch */
    .tool-button {
      padding: 16px 20px;
      font-size: 16px;
      min-height: 50px;
    }
    
    /* Ensure tools remain accessible without mobile quick actions */
    .tool-buttons {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    
    /* Improve slider usability on mobile */
    .brush-slider,
    .sensitivity-slider,
    .edge-slider {
      height: 10px;
    }
    
    .brush-slider::-webkit-slider-thumb,
    .sensitivity-slider::-webkit-slider-thumb,
    .edge-slider::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
    }
    
    /* Stack controls vertically on very small screens */
    @media (max-width: 480px) {
      .controls-panel {
        gap: 16px;
      }
      
      .tool-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .tool-button {
        padding: 12px 8px;
        font-size: 14px;
        text-align: center;
      }
      
      .tool-button svg {
        margin: 0 auto 4px;
      }
      
      /* Mobile quick fixes layout */
      .quick-fix-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      
      .quick-fix-btn {
        padding: 8px 10px;
        font-size: 12px;
      }
      
      .quick-fix-btn svg {
        width: 14px;
        height: 14px;
      }
    }
  }
  
  /* Touch-friendly enhancements */
  @media (hover: none) and (pointer: coarse) {
    .tool-button {
      min-height: 48px;
      padding: 16px;
    }
    
    .action-btn {
      min-height: 44px;
      padding: 12px 16px;
    }
    
    .brush-slider,
    .sensitivity-slider,
    .edge-slider {
      height: 12px;
    }
    
    .brush-slider::-webkit-slider-thumb,
    .sensitivity-slider::-webkit-slider-thumb,
    .edge-slider::-webkit-slider-thumb {
      width: 28px;
      height: 28px;
    }
    
    /* Increase brush cursor size on touch devices */
    .dynamic-brush-cursor {
      border-width: 3px;
    }
  }
</style>