<!--
  Refinement Canvas Component
  Core canvas editing logic extracted from ImageRefinementEditor
  Mobile-first responsive design with full viewport usage
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { refinementState, refinementActions } from '$lib/stores/refinementState';
  import { observeCanvasContainer, type LayoutDimensions } from '$lib/services/layoutObserverService';
  
  export let originalImage: string | null;
  export let processedImage: string | null;
  export let isProcessing: boolean = false;
  
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
  
  // Image objects
  let originalImg: HTMLImageElement;
  let processedImg: HTMLImageElement;
  
  // State
  let isInitialized = false;
  let canvasesReady = false;
  let canvasWidth = 600;
  let canvasHeight = 400;
  let canvasScale = 1;
  let zoomLevel = 1.0;
  let baseCanvasWidth = 600;
  let baseCanvasHeight = 400;
  let showDebugInfo = false;
  let isDrawing = false;
  let showComparison = false;
  let isDesktop = false;
  
  // Layout observer state
  let layoutCleanup: (() => void) | null = null;
  let containerDimensions: LayoutDimensions | null = null;
  let calculatedCanvasSize = { width: 600, height: 400, scale: 1 };
  
  // Reactive state from store
  $: currentState = $refinementState;
  $: currentTool = currentState.currentTool;
  $: brushSize = currentState.brushSize;
  $: showOriginalPreview = currentState.showOriginalPreview;
  
  // Debug prop changes
  $: console.log('🖼️ Canvas props changed:', {
    originalImage: originalImage ? 'Present (' + originalImage.substring(0, 20) + '...)' : 'NULL',
    processedImage: processedImage ? 'Present (' + processedImage.substring(0, 20) + '...)' : 'NULL',
    isInitialized,
    canvasesReady
  });
  
  onMount(() => {
    if (!browser) return;
    
    console.log('🎬 CANVAS: Component mounted');
    
    // Detect desktop for comparison view
    const checkIsDesktop = () => {
      isDesktop = window.innerWidth >= 1024;
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => {
      window.removeEventListener('resize', checkIsDesktop);
    };
  });
  
  onDestroy(() => {
    if (layoutCleanup) {
      layoutCleanup();
    }
  });
  
  // Watch for image changes - enable canvas rendering immediately
  $: if (browser && originalImage && processedImage && !canvasesReady) {
    console.log('🔄 Reactive statement triggered - enabling canvas rendering');
    console.log('  browser:', browser);
    console.log('  originalImage:', originalImage ? 'PRESENT' : 'NULL'); 
    console.log('  processedImage:', processedImage ? 'PRESENT' : 'NULL');
    console.log('  canvasesReady:', canvasesReady);
    canvasesReady = true; // Enable canvas rendering immediately
    
    // Initialize after a short delay to allow DOM rendering
    setTimeout(() => {
      if (!isInitialized && canvasContainer) {
        console.log('🚀 Starting canvas initialization...');
        initializeCanvas();
      } else {
        console.log('⚠️ Canvas initialization skipped:', { isInitialized, canvasContainer: !!canvasContainer });
      }
    }, 200); // Increased delay to ensure DOM is ready
  }
  
  async function initializeCanvas() {
    try {
      console.log('=== INITIALIZING CANVAS ===');
      console.log('Original image data:', originalImage ? 'Present' : 'Missing', originalImage?.substring(0, 50) + '...');
      console.log('Processed image data:', processedImage ? 'Present' : 'Missing', processedImage?.substring(0, 50) + '...');
      console.log('Container rect:', canvasContainer?.getBoundingClientRect());
      
      // Ensure DOM elements are mounted before proceeding
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Validate container is available
      if (!canvasContainer) {
        throw new Error('Canvas container not mounted');
      }
      
      // Load images
      originalImg = await loadImage(originalImage!);
      processedImg = await loadImage(processedImage!);
      
      console.log('🔍 LAYOUT OBSERVER: Setting up real-time layout measurement');
      console.log('🔍 LAYOUT OBSERVER: Image size:', originalImg.width, 'x', originalImg.height);
      
      // Setup layout observer for real-time measurements
      const observer = observeCanvasContainer(
        canvasContainer,
        originalImg.width,
        originalImg.height
      );
      
      layoutCleanup = observer.cleanup;
      
      // Subscribe to dimension changes
      const unsubscribeDimensions = observer.dimensions.subscribe((dims) => {
        containerDimensions = dims;
        console.log('📐 LAYOUT UPDATE: Container dimensions:', dims);
      });
      
      // Subscribe to canvas size changes
      const unsubscribeCanvasSize = observer.canvasSize.subscribe((size) => {
        calculatedCanvasSize = size;
        console.log('📐 LAYOUT UPDATE: Canvas size:', size);
        
        // Only update if significantly different and canvas is initialized
        const widthDiff = Math.abs(canvasWidth - size.width);
        const heightDiff = Math.abs(canvasHeight - size.height);
        
        if ((widthDiff > 10 || heightDiff > 10) && isInitialized) {
          console.log('✅ LAYOUT UPDATE: Applying new canvas size');
          canvasWidth = size.width;
          canvasHeight = size.height;
          canvasScale = size.scale;
          
          setupCanvases();
          drawImages();
          refinementActions.setCanvasSize(canvasWidth, canvasHeight, canvasScale);
        }
      });
      
      // Enhanced cleanup
      const originalCleanup = layoutCleanup;
      layoutCleanup = () => {
        unsubscribeDimensions();
        unsubscribeCanvasSize();
        if (originalCleanup) originalCleanup();
      };
      // Wait for layout observer to calculate initial size
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get initial size from layout observer or use fallback
      if (calculatedCanvasSize.width > 0 && calculatedCanvasSize.height > 0) {
        canvasWidth = calculatedCanvasSize.width;
        canvasHeight = calculatedCanvasSize.height;
        canvasScale = calculatedCanvasSize.scale;
      } else {
        // Fallback calculation if layout observer isn't ready
        const containerRect = canvasContainer.getBoundingClientRect();
        const availWidth = Math.max(300, containerRect.width * 0.9);
        const availHeight = Math.max(300, containerRect.height * 0.8);
        
        const scaleX = availWidth / originalImg.width;
        const scaleY = availHeight / originalImg.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        canvasWidth = Math.floor(originalImg.width * scale);
        canvasHeight = Math.floor(originalImg.height * scale);
        canvasScale = scale;
        
        console.log('📐 FALLBACK SIZING: Using fallback calculation');
      }
      
      // Store base dimensions for zoom calculations
      baseCanvasWidth = canvasWidth;
      baseCanvasHeight = canvasHeight;
      
      console.log('🔍 LAYOUT OBSERVER: Initial canvas size:', canvasWidth, 'x', canvasHeight, 'scale:', canvasScale);
      
      // Update store with canvas dimensions
      refinementActions.setCanvasSize(canvasWidth, canvasHeight, canvasScale);
      
      // Wait for essential canvas elements to be available
      let retries = 0;
      const maxRetries = 10;
      
      // We need at least originalCanvas and previewCanvas for basic functionality
      while ((!originalCanvas || !previewCanvas) && retries < maxRetries) {
        console.log(`Waiting for essential canvas elements (attempt ${retries + 1}/${maxRetries})`);
        console.log(`  originalCanvas: ${!!originalCanvas}, previewCanvas: ${!!previewCanvas}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!originalCanvas || !previewCanvas) {
        throw new Error('Essential canvas elements (original, preview) failed to mount after retries');
      }
      
      console.log('Essential canvas elements ready, proceeding with setup');
      
      // Initialize canvas contexts
      setupCanvases();
      
      // Draw initial images
      drawImages();
      
      isInitialized = true;
      console.log('✅ Canvas initialization complete!');
      
      // TEST: Add click event listener to verify canvas is interactive
      if (previewCanvas) {
        previewCanvas.addEventListener('click', (e) => {
          console.log('🧪 TEST: Canvas click detected!', e);
        });
        console.log('🧪 TEST: Click listener added to previewCanvas');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize canvas:', error);
      dispatch('error', { message: `Failed to load images for editing: ${error.message}` });
    }
  }
  
  function setupCanvases() {
    console.log('Setting up canvases - available elements:', {
      originalCanvas: !!originalCanvas,
      processedCanvas: !!processedCanvas,
      maskCanvas: !!maskCanvas,
      previewCanvas: !!previewCanvas,
      isDesktop,
      showComparison
    });
    
    // Get available canvases based on current view mode
    const availableCanvases = [];
    
    if (originalCanvas) {
      availableCanvases.push(originalCanvas);
      originalCtx = originalCanvas.getContext('2d')!;
    }
    
    if (previewCanvas) {
      availableCanvases.push(previewCanvas);
      previewCtx = previewCanvas.getContext('2d')!;
    }
    
    // Only setup these canvases if they exist (single view mode)
    if (processedCanvas) {
      availableCanvases.push(processedCanvas);
      processedCtx = processedCanvas.getContext('2d')!;
    }
    
    if (maskCanvas) {
      availableCanvases.push(maskCanvas);
      maskCtx = maskCanvas.getContext('2d')!;
    }
    
    if (availableCanvases.length === 0) {
      throw new Error('No canvas elements available');
    }
    
    // EMERGENCY: Simplified canvas setup - no zoom, no DPI complications
    console.log('🔧 EMERGENCY: Setting up canvases - simple approach');
    console.log('  Canvas size:', canvasWidth, 'x', canvasHeight);
    
    availableCanvases.forEach(canvas => {
      // Set canvas size directly
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Set CSS display size
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      
      console.log('  Canvas configured:', canvas.width, 'x', canvas.height);
    });
    
    // Basic context configuration
    const availableContexts = [originalCtx, previewCtx, processedCtx, maskCtx].filter(ctx => ctx);
    availableContexts.forEach(ctx => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    });
    
    console.log(`✅ Setup complete for ${availableCanvases.length} canvases`);
  }
  
  function drawImages() {
    if (!originalImg || !processedImg) return;
    
    console.log('🖼️ EMERGENCY: Drawing images - simple approach');
    console.log('  Canvas dimensions:', canvasWidth, 'x', canvasHeight);
    console.log('  Image dimensions:', originalImg.width, 'x', originalImg.height);
    
    // Use the actual canvas dimensions directly - no zoom complications
    const drawWidth = canvasWidth;
    const drawHeight = canvasHeight;
    
    // Clear and draw on available canvases - FILL THE ENTIRE CANVAS
    if (originalCtx) {
      originalCtx.clearRect(0, 0, drawWidth, drawHeight);
      originalCtx.drawImage(originalImg, 0, 0, drawWidth, drawHeight);
      console.log('✅ Original image drawn at', drawWidth, 'x', drawHeight);
    }
    
    if (processedCtx) {
      processedCtx.clearRect(0, 0, drawWidth, drawHeight);
      processedCtx.drawImage(processedImg, 0, 0, drawWidth, drawHeight);
      console.log('✅ Processed image drawn at', drawWidth, 'x', drawHeight);
    }
    
    if (previewCtx) {
      previewCtx.clearRect(0, 0, drawWidth, drawHeight);
      
      // Always use processed image for now to simplify
      previewCtx.drawImage(processedImg, 0, 0, drawWidth, drawHeight);
      console.log('✅ Preview image drawn at', drawWidth, 'x', drawHeight);
    }
    
    console.log('✅ All images drawn successfully');
  }
  
  // Basic drawing handlers (simplified for initial implementation)
  function handlePointerDown(event: PointerEvent) {
    console.log('🖱️ Pointer down - tool:', currentTool, 'initialized:', isInitialized, 'processing:', isProcessing);
    console.log('🖱️ Canvas state:', {
      previewCanvas: !!previewCanvas,
      isDesktop,
      showComparison,
      canvasWidth,
      canvasHeight,
      eventTarget: event.target
    });
    
    if (!isInitialized || isProcessing) {
      console.log('❌ Ignoring pointer down - not ready');
      return;
    }
    
    if (!previewCanvas) {
      console.log('❌ No preview canvas available for interaction!');
      return;
    }
    
    isDrawing = true;
    previewCanvas.setPointerCapture(event.pointerId);
    
    const rect = previewCanvas.getBoundingClientRect();
    const effectiveWidth = canvasWidth * zoomLevel;
    const effectiveHeight = canvasHeight * zoomLevel;
    const x = (event.clientX - rect.left) * (effectiveWidth / rect.width);
    const y = (event.clientY - rect.top) * (effectiveHeight / rect.height);
    
    console.log('🎯 Drawing at:', x, y, 'canvas size:', canvasWidth, 'x', canvasHeight);
    
    startDrawing(x, y);
    dispatch('change');
  }
  
  function handlePointerMove(event: PointerEvent) {
    if (!isDrawing || !isInitialized || isProcessing) return;
    
    const rect = previewCanvas.getBoundingClientRect();
    const effectiveWidth = canvasWidth * zoomLevel;
    const effectiveHeight = canvasHeight * zoomLevel;
    const x = (event.clientX - rect.left) * (effectiveWidth / rect.width);
    const y = (event.clientY - rect.top) * (effectiveHeight / rect.height);
    
    continueDrawing(x, y);
  }
  
  function handlePointerUp(event: PointerEvent) {
    if (!isDrawing) return;
    
    isDrawing = false;
    previewCanvas.releasePointerCapture(event.pointerId);
    endDrawing();
  }
  
  function startDrawing(x: number, y: number) {
    if (!previewCtx) {
      console.log('❌ No preview context available');
      return;
    }
    
    console.log('🎨 Starting drawing - tool:', currentTool, 'brush size:', brushSize);
    
    previewCtx.beginPath();
    previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    
    // Apply tool-specific operations
    applyToolEffect(x, y);
  }
  
  function continueDrawing(x: number, y: number) {
    if (!previewCtx) return;
    
    previewCtx.lineTo(x, y);
    previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    
    applyToolEffect(x, y);
  }
  
  function endDrawing() {
    // Finalize the drawing operation
    if (previewCtx) {
      previewCtx.stroke();
    }
  }
  
  function applyToolEffect(x: number, y: number) {
    if (!previewCtx) {
      console.log('❌ No preview context for tool effect');
      return;
    }
    
    console.log('🔧 Applying tool effect:', currentTool, 'at:', x, y);
    
    // Set brush style
    previewCtx.lineWidth = brushSize;
    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
    
    // Apply tool-specific operations
    switch (currentTool) {
      case 'erase':
        console.log('✂️ Applying erase tool');
        previewCtx.globalCompositeOperation = 'destination-out';
        previewCtx.beginPath();
        previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        previewCtx.fill();
        break;
        
      case 'smart-restore':
        console.log('🔄 Applying smart restore tool');
        previewCtx.globalCompositeOperation = 'source-over';
        
        // Copy from original image
        if (originalCtx && originalImg) {
          try {
            const copyX = Math.max(0, Math.min(canvasWidth - brushSize, x - brushSize / 2));
            const copyY = Math.max(0, Math.min(canvasHeight - brushSize, y - brushSize / 2));
            const copyWidth = Math.min(brushSize, canvasWidth - copyX);
            const copyHeight = Math.min(brushSize, canvasHeight - copyY);
            
            console.log('📊 Smart restore params:', { copyX, copyY, copyWidth, copyHeight, canvasWidth, canvasHeight, brushSize });
            
            // Verify original context has valid image data
            const testPixel = originalCtx.getImageData(copyX, copyY, 1, 1);
            console.log('🔍 Test pixel from original:', testPixel.data[0], testPixel.data[1], testPixel.data[2], testPixel.data[3]);
            
            // If the original canvas appears empty, redraw the original image
            if (testPixel.data[3] === 0 || (testPixel.data[0] === 0 && testPixel.data[1] === 0 && testPixel.data[2] === 0)) {
              console.log('⚠️ Original canvas appears empty, redrawing...');
              originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
              originalCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
            }
            
            // Now get the image data for the restore operation
            const imageData = originalCtx.getImageData(copyX, copyY, copyWidth, copyHeight);
            console.log('📦 Image data for restore:', imageData.width, 'x', imageData.height, 'pixels');
            
            // Use composite operation to blend the restored pixels properly
            previewCtx.putImageData(imageData, copyX, copyY);
            
            console.log('✅ Smart restore applied successfully');
          } catch (error) {
            console.error('❌ Smart restore error:', error);
            // Fallback to simple brush stroke
            previewCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            previewCtx.beginPath();
            previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
            previewCtx.fill();
          }
        } else {
          console.log('❌ No original context or image for restore');
          console.log('  originalCtx:', !!originalCtx);
          console.log('  originalImg:', !!originalImg);
          // Fallback visual feedback
          previewCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          previewCtx.beginPath();
          previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
          previewCtx.fill();
        }
        break;
        
      case 'precision-erase':
        console.log('✂️ Applying precision erase tool');
        previewCtx.globalCompositeOperation = 'destination-out';
        // Use smaller, more precise brush for precision erase
        const precisionSize = Math.max(1, brushSize * 0.7);
        previewCtx.beginPath();
        previewCtx.arc(x, y, precisionSize / 2, 0, 2 * Math.PI);
        previewCtx.fill();
        break;
        
      case 'edge-refine':
        console.log('🔧 Applying edge refine tool');
        previewCtx.globalCompositeOperation = 'source-over';
        
        // Create a soft edge refinement effect
        if (originalCtx && originalImg) {
          try {
            const refineSize = Math.max(2, brushSize * 1.2);
            const copyX = Math.max(0, Math.min(canvasWidth - refineSize, x - refineSize / 2));
            const copyY = Math.max(0, Math.min(canvasHeight - refineSize, y - refineSize / 2));
            const copyWidth = Math.min(refineSize, canvasWidth - copyX);
            const copyHeight = Math.min(refineSize, canvasHeight - copyY);
            
            const imageData = originalCtx.getImageData(copyX, copyY, copyWidth, copyHeight);
            
            // Apply edge refinement (simplified - blend with original)
            previewCtx.globalAlpha = 0.3; // Soft blending
            previewCtx.putImageData(imageData, copyX, copyY);
            previewCtx.globalAlpha = 1.0; // Reset alpha
            
            console.log('✅ Edge refine applied successfully');
          } catch (error) {
            console.error('❌ Edge refine error:', error);
            // Fallback visual feedback
            previewCtx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            previewCtx.beginPath();
            previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
            previewCtx.fill();
          }
        }
        break;
        
      case 'smart-background-erase':
        console.log('🗑️ Applying smart background erase tool');
        previewCtx.globalCompositeOperation = 'destination-out';
        
        // Larger, more aggressive erase for background removal
        const bgEraseSize = Math.max(5, brushSize * 1.5);
        previewCtx.beginPath();
        previewCtx.arc(x, y, bgEraseSize / 2, 0, 2 * Math.PI);
        previewCtx.fill();
        break;
        
      case 'smart-background-restore':
        console.log('🎨 Applying smart background restore tool');
        previewCtx.globalCompositeOperation = 'source-over';
        
        // Similar to smart-restore but with different visual feedback
        if (originalCtx && originalImg) {
          try {
            const restoreSize = Math.max(3, brushSize * 1.3);
            const copyX = Math.max(0, Math.min(canvasWidth - restoreSize, x - restoreSize / 2));
            const copyY = Math.max(0, Math.min(canvasHeight - restoreSize, y - restoreSize / 2));
            const copyWidth = Math.min(restoreSize, canvasWidth - copyX);
            const copyHeight = Math.min(restoreSize, canvasHeight - copyY);
            
            const imageData = originalCtx.getImageData(copyX, copyY, copyWidth, copyHeight);
            
            // Apply with reduced opacity for background restoration
            previewCtx.globalAlpha = 0.8;
            previewCtx.putImageData(imageData, copyX, copyY);
            previewCtx.globalAlpha = 1.0;
            
            console.log('✅ Smart background restore applied successfully');
          } catch (error) {
            console.error('❌ Smart background restore error:', error);
            // Fallback visual feedback
            previewCtx.fillStyle = 'rgba(0, 255, 0, 0.4)';
            previewCtx.beginPath();
            previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
            previewCtx.fill();
          }
        }
        break;
        
      default:
        console.log('🎨 Applying default tool effect for:', currentTool);
        previewCtx.globalCompositeOperation = 'destination-out';
        previewCtx.beginPath();
        previewCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
        previewCtx.fill();
    }
  }
  
  // Utility functions
  async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  // Legacy function - now uses layout observer calculated size
  function calculateOptimalCanvasSize(
    imageWidth: number,
    imageHeight: number,
    viewport: { width: number; height: number }
  ): { width: number; height: number; scale: number } {
    console.log('📐 LEGACY SIZING: Using layout observer calculated size instead');
    return calculatedCanvasSize;
  }
  
  // Export current canvas state
  function exportCanvas(): string {
    if (!previewCanvas) return '';
    return previewCanvas.toDataURL('image/png');
  }
  
  // Zoom functionality
  function zoomIn() {
    const newZoom = Math.min(3.0, zoomLevel * 1.2);
    setZoom(newZoom);
  }
  
  function zoomOut() {
    const newZoom = Math.max(0.3, zoomLevel / 1.2);
    setZoom(newZoom);
  }
  
  function zoomReset() {
    setZoom(1.0);
  }
  
  function zoomFit() {
    // Calculate optimal zoom for current viewport
    if (baseCanvasWidth && baseCanvasHeight) {
      const containerRect = canvasContainer?.getBoundingClientRect();
      if (containerRect) {
        const scaleX = (containerRect.width - 40) / baseCanvasWidth;
        const scaleY = (containerRect.height - 40) / baseCanvasHeight;
        const optimalZoom = Math.min(scaleX, scaleY, 2.0);
        setZoom(Math.max(0.3, optimalZoom));
      }
    }
  }
  
  function setZoom(newZoom: number) {
    zoomLevel = Math.max(0.3, Math.min(3.0, newZoom));
    canvasWidth = Math.round(baseCanvasWidth * zoomLevel);
    canvasHeight = Math.round(baseCanvasHeight * zoomLevel);
    
    if (isInitialized) {
      setupCanvases();
      drawImages();
    }
  }
  
  // Handle tool changes and preview toggles
  $: if (isInitialized) {
    drawImages(); // Redraw when preview mode changes
  }
  
  // Reactive drawing when original preview toggle changes
  $: if (isInitialized && originalImg && processedImg && showOriginalPreview !== undefined) {
    console.log('🔄 Original preview toggled:', showOriginalPreview);
    drawImages(); // Redraw when original preview toggle changes
  }
  
  // Reactive drawing when comparison mode changes
  $: if (isInitialized && originalImg && processedImg && showComparison !== undefined) {
    console.log('🔄 Comparison mode toggled:', showComparison);
    drawImages(); // Redraw when comparison mode changes
  }
  
  // Reactive drawing when zoom changes
  $: if (isInitialized && originalImg && processedImg && zoomLevel !== undefined) {
    console.log('🔍 Zoom level changed:', zoomLevel);
    setupCanvases(); // Resize canvases for new zoom
    drawImages(); // Redraw at new zoom level
  }
  
  // Handle canvas completion
  function handleComplete() {
    const refinedImage = exportCanvas();
    dispatch('complete', { refinedImage });
  }
  
  // Expose export function for parent component
  export { exportCanvas };
</script>

<div class="canvas-container" bind:this={canvasContainer}>
  {#if canvasesReady}
    
    <!-- Desktop comparison view toggle -->
    {#if isInitialized && isDesktop}
      <div class="comparison-controls">
        <button
          on:click={() => showComparison = !showComparison}
          class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white px-4 py-2 rounded-lg font-medium text-sm backdrop-blur-sm"
          class:active={showComparison}
          title="Toggle before/after comparison"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          {showComparison ? 'Single View' : 'Compare'}
        </button>
      </div>
    {/if}
    
    <!-- Canvas workspace -->
    <div class="canvas-workspace" class:comparison-mode={isDesktop && showComparison}>
      {#if isInitialized && isDesktop && showComparison}
        <!-- DEBUG: Using comparison view -->
        {console.log('🖼️ RENDERING: Comparison view - isDesktop:', isDesktop, 'showComparison:', showComparison)}
        <!-- Split view for comparison -->
        <div class="comparison-view">
          <div class="comparison-panel">
            <div class="panel-label">Original</div>
            <div class="canvas-stack">
              <canvas
                bind:this={originalCanvas}
                class="canvas-layer comparison-canvas"
              ></canvas>
            </div>
          </div>
          
          <div class="comparison-divider"></div>
          
          <div class="comparison-panel">
            <div class="panel-label">Edited</div>
            <div class="canvas-stack">
              <canvas
                bind:this={previewCanvas}
                class="canvas-layer interactive comparison-canvas"
                on:pointerdown={handlePointerDown}
                on:pointermove={handlePointerMove}
                on:pointerup={handlePointerUp}
                style="cursor: crosshair; touch-action: none;"
              ></canvas>
            </div>
          </div>
        </div>
      {:else}
        <!-- DEBUG: Using single view -->
        {console.log('🖼️ RENDERING: Single view - isDesktop:', isDesktop, 'showComparison:', showComparison)}
        <!-- Single view - Always render canvases once canvasesReady is true -->
        <div class="canvas-stack">
          <!-- Hidden canvases for image processing -->
          <canvas
            bind:this={originalCanvas}
            class="canvas-layer hidden"
            aria-hidden="true"
          ></canvas>
          
          <canvas
            bind:this={processedCanvas}
            class="canvas-layer hidden"
            aria-hidden="true"
          ></canvas>
          
          <canvas
            bind:this={maskCanvas}
            class="canvas-layer hidden"
            aria-hidden="true"
          ></canvas>
          
          <!-- Main preview canvas -->
          <canvas
            bind:this={previewCanvas}
            class="canvas-layer interactive"
            on:pointerdown={handlePointerDown}
            on:pointermove={handlePointerMove}
            on:pointerup={handlePointerUp}
            style="cursor: crosshair; touch-action: none;"
          ></canvas>
        </div>
      {/if}
      
      <!-- Tool cursor overlay -->
      {#if isDrawing}
        <div class="cursor-overlay">
          <div 
            class="brush-cursor"
            style="width: {brushSize}px; height: {brushSize}px;"
          ></div>
        </div>
      {/if}
      
      <!-- Loading overlay while initializing -->
      {#if !isInitialized}
        <div class="canvas-loading" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: white;">
            <div class="loading-spinner"></div>
            <p>Initializing canvas...</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Loading state -->
    <div class="canvas-loading">
      <div class="loading-spinner"></div>
      <p>Preparing canvas...</p>
    </div>
  {/if}
</div>

<!-- Quick action buttons -->
{#if isInitialized}
  <div class="quick-actions">
    <!-- Zoom Controls -->
    <div class="zoom-controls">
      <button
        on:click={() => zoomLevel = Math.min(zoomLevel * 1.2, 3.0)}
        class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-2 rounded-lg"
        title="Zoom In (+)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      </button>
      
      <div class="zoom-display">
        {Math.round(zoomLevel * 100)}%
      </div>
      
      <button
        on:click={() => zoomLevel = Math.max(zoomLevel / 1.2, 0.3)}
        class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-2 rounded-lg"
        title="Zoom Out (-)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"/>
        </svg>
      </button>
      
      <button
        on:click={() => zoomLevel = 1.0}
        class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-2 rounded-lg text-xs"
        title="Reset Zoom (1)"
      >
        1:1
      </button>
      
      <button
        on:click={() => {
          if (canvasContainer && originalImg) {
            const containerRect = canvasContainer.getBoundingClientRect();
            const optimalSize = calculateOptimalCanvasSize(
              originalImg.width,
              originalImg.height,
              { width: containerRect.width, height: containerRect.height }
            );
            zoomLevel = Math.min(2.0, Math.max(0.5, optimalSize.width / canvasWidth));
          }
        }}
        class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-2 rounded-lg text-xs"
        title="Fit to Screen"
      >
        FIT
      </button>
    </div>
    
    <!-- Original Controls -->
    <button
      on:click={() => refinementActions.toggleOriginalPreview()}
      class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-3 rounded-lg"
      class:active={showOriginalPreview}
      title="Toggle original preview (Space)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    </button>
    
    <!-- Debug Toggle (Development Only) -->
    <button
      on:click={() => showDebugInfo = !showDebugInfo}
      class="btn btn-outline border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black p-2 rounded-lg text-xs"
      title="Toggle Debug Info"
    >
      DEBUG
    </button>
    
    <button
      on:click={handleComplete}
      class="btn btn-magic py-3 px-4 rounded-lg font-medium"
      disabled={isProcessing}
      title="Complete editing"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
    </button>
  </div>
{/if}

<!-- Debug Info Panel -->
{#if showDebugInfo && isInitialized}
  <div class="debug-panel">
    <div class="debug-header">
      <h3>Canvas Debug Info</h3>
      <button on:click={() => showDebugInfo = false} class="debug-close">×</button>
    </div>
    <div class="debug-content">
      <div class="debug-section">
        <h4>Canvas Dimensions</h4>
        <p>Canvas: {canvasWidth}px × {canvasHeight}px</p>
        <p>Scale: {canvasScale.toFixed(3)}</p>
        <p>Zoom: {zoomLevel.toFixed(1)}x ({Math.round(zoomLevel * 100)}%)</p>
        <p>Effective: {Math.round(canvasWidth * zoomLevel)}px × {Math.round(canvasHeight * zoomLevel)}px</p>
      </div>
      
      <div class="debug-section">
        <h4>Image Info</h4>
        <p>Original: {originalImg?.width || 'N/A'}px × {originalImg?.height || 'N/A'}px</p>
        <p>Device: {isDesktop ? 'Desktop' : (browser && window.innerWidth < 768) ? 'Mobile' : 'Tablet'}</p>
        <p>Viewport: {browser ? window.innerWidth : 'N/A'}px × {browser ? window.innerHeight : 'N/A'}px</p>
      </div>
      
      <div class="debug-section">
        <h4>Container Info</h4>
        <p>Container: {canvasContainer?.getBoundingClientRect().width.toFixed(0) || 'N/A'}px × {canvasContainer?.getBoundingClientRect().height.toFixed(0) || 'N/A'}px</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--color-dark-bg);
    overflow: hidden;
    /* Ensure predictable layout behavior */
    flex-shrink: 1;
    flex-grow: 1;
  }
  
  .comparison-controls {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 100;
  }
  
  .comparison-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 8px;
    color: var(--color-dark-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    backdrop-filter: blur(8px);
  }
  
  .comparison-toggle:hover {
    background: var(--color-dark-hover);
    color: var(--color-dark-text);
    border-color: var(--color-magic-400);
  }
  
  .comparison-toggle.active {
    background: var(--color-magic-400);
    color: white;
    border-color: var(--color-magic-400);
  }
  
  .canvas-workspace {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    min-height: 0;
    width: 100%;
    height: 100%;
    /* Ensure the workspace can shrink and grow properly */
    flex-shrink: 1;
    flex-grow: 1;
    overflow: hidden;
  }
  
  .canvas-workspace.comparison-mode {
    padding: 2rem 1rem 1rem;
  }
  
  .comparison-view {
    display: flex;
    width: 100%;
    height: 100%;
    max-width: 1200px;
    gap: 1rem;
    align-items: center;
  }
  
  .comparison-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  
  .panel-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-dark-text-secondary);
    text-align: center;
    margin-bottom: 0.75rem;
    padding: 0.5rem 1rem;
    background: var(--color-dark-surface);
    border-radius: 6px;
    border: 1px solid var(--color-dark-border);
  }
  
  .comparison-divider {
    width: 2px;
    height: 80%;
    background: linear-gradient(to bottom, transparent, var(--color-magic-400), transparent);
    border-radius: 1px;
    position: relative;
  }
  
  .comparison-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background: var(--color-magic-400);
    border-radius: 50%;
    border: 2px solid var(--color-dark-bg);
  }
  
  .comparison-canvas {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .canvas-stack {
    position: relative;
    background: var(--color-dark-surface);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    /* Ensure canvas stack doesn't grow beyond calculated size */
    flex-shrink: 0;
    max-width: 100%;
    max-height: 100%;
  }
  
  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .canvas-layer.interactive {
    position: relative;
    z-index: 10;
  }
  
  .canvas-layer.hidden {
    display: none;
  }
  
  .cursor-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
  }
  
  .brush-cursor {
    position: absolute;
    border: 2px solid var(--color-magic-400);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    opacity: 0.7;
  }
  
  .canvas-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-dark-text-secondary);
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-dark-border);
    border-top: 3px solid var(--color-magic-400);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .quick-actions {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 30;
  }
  
  .zoom-controls {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 8px;
    padding: 0.5rem;
    backdrop-filter: blur(8px);
  }
  
  .zoom-display {
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-dark-text-secondary);
    padding: 0.25rem;
    font-weight: 600;
    min-width: 40px;
  }
  
  .debug-panel {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(12px);
    z-index: 100;
    max-width: 300px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .debug-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-dark-border);
    background: var(--color-dark-bg);
  }
  
  .debug-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-magic-400);
  }
  
  .debug-close {
    background: none;
    border: none;
    color: var(--color-dark-text-secondary);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .debug-close:hover {
    color: var(--color-dark-text);
  }
  
  .debug-content {
    padding: 1rem;
  }
  
  .debug-section {
    margin-bottom: 1rem;
  }
  
  .debug-section:last-child {
    margin-bottom: 0;
  }
  
  .debug-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-dark-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .debug-section p {
    margin: 0.25rem 0;
    font-size: 0.75rem;
    color: var(--color-dark-text-secondary);
    font-family: monospace;
  }
  
  .quick-action-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    color: var(--color-dark-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }
  
  .quick-action-btn:hover:not(:disabled) {
    background: var(--color-dark-hover);
    color: var(--color-dark-text);
    border-color: var(--color-magic-400);
    transform: scale(1.05);
  }
  
  .quick-action-btn.active {
    background: var(--color-magic-400);
    color: white;
    border-color: var(--color-magic-400);
  }
  
  .quick-action-btn.complete-btn:hover:not(:disabled) {
    background: var(--color-magic-400);
    color: white;
  }
  
  .quick-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .quick-actions {
      bottom: 5rem; /* Account for mobile toolbar */
    }
    
    .quick-action-btn {
      width: 44px;
      height: 44px;
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }
    
    .quick-action-btn {
      transform: none;
    }
    
    .quick-action-btn:hover:not(:disabled) {
      transform: none;
    }
  }
</style>