<!--
  Test Refine Page - For testing the new refine components without backend
  Creates mock data to test the canvas functionality
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import RefineCanvas from '$lib/components/RefineCanvas.svelte';
  import RefineToolbox from '$lib/components/RefineToolbox.svelte';
  import type { ToolType } from '$lib/services/ToolOperations';
  
  // Mock data
  let originalImage: string | null = null;
  let processedImage: string | null = null;
  let isLoading = true;
  let error: string | null = null;
  
  // Canvas state
  let canvasComponent: RefineCanvas;
  let currentTool: ToolType = 'restore';
  let brushSize: number = 20;
  let showComparison: boolean = false;
  let showOriginal: boolean = false;
  let canUndo: boolean = false;
  let canRedo: boolean = false;
  let isToolboxCollapsed: boolean = false;
  
  // Calculate toolbox width for canvas scaling
  $: toolboxWidth = isToolboxCollapsed ? 0 : 250;

  // Mobile state
  let isMobile: boolean = false;
  let isDesktop: boolean = false;

  onMount(async () => {
    if (!browser) return;
    
    try {
      // Check screen size
      updateScreenSize();
      window.addEventListener('resize', updateScreenSize);
      
      // Create mock images for testing
      await createMockImages();
      
      isLoading = false;
      console.log('✅ Test refine page initialized');
      
    } catch (err) {
      console.error('❌ Failed to initialize test refine page:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      isLoading = false;
    }
  });

  async function createMockImages(): Promise<void> {
    try {
      // Load your actual image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/assets/icon-main-character.jpg';
      });
      
      // Create original image (with background)
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      const originalCtx = originalCanvas.getContext('2d')!;
      originalCtx.drawImage(img, 0, 0);
      originalImage = originalCanvas.toDataURL();
      
      // Create processed image (simulate background removal - just the character)
      const processedCanvas = document.createElement('canvas');
      processedCanvas.width = img.width;
      processedCanvas.height = img.height;
      const processedCtx = processedCanvas.getContext('2d')!;
      
      // Draw the image
      processedCtx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = processedCtx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      // Simple background removal simulation - make edges more transparent
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % img.width;
        const y = Math.floor((i / 4) / img.width);
        
        // Calculate distance from center
        const centerX = img.width / 2;
        const centerY = img.height / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDistance = Math.min(img.width, img.height) / 2;
        
        // Make edges more transparent
        if (distance > maxDistance * 0.7) {
          const alpha = Math.max(0, 1 - (distance - maxDistance * 0.7) / (maxDistance * 0.3));
          data[i + 3] = data[i + 3] * alpha; // Modify alpha channel
        }
      }
      
      processedCtx.putImageData(imageData, 0, 0);
      processedImage = processedCanvas.toDataURL();
      
      console.log('✅ Loaded actual image:', img.width + 'x' + img.height);
      console.log('📸 Original image data:', originalImage.substring(0, 50) + '...');
      console.log('📸 Processed image data:', processedImage.substring(0, 50) + '...');
    } catch (error) {
      console.warn('⚠️ Could not load actual image, creating simple mock:', error);
      
      // Fallback to simple shapes if image loading fails
      const size = 400;
      
      // Create original with background
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = size;
      originalCanvas.height = size;
      const originalCtx = originalCanvas.getContext('2d')!;
      
      // Background
      originalCtx.fillStyle = '#87CEEB';
      originalCtx.fillRect(0, 0, size, size);
      
      // Character shape
      originalCtx.fillStyle = '#FF6B6B';
      originalCtx.beginPath();
      originalCtx.arc(size/2, size/2, 80, 0, 2 * Math.PI);
      originalCtx.fill();
      
      originalImage = originalCanvas.toDataURL();
      
      // Create processed without background
      const processedCanvas = document.createElement('canvas');
      processedCanvas.width = size;
      processedCanvas.height = size;
      const processedCtx = processedCanvas.getContext('2d')!;
      
      // Only character
      processedCtx.fillStyle = '#FF6B6B';
      processedCtx.beginPath();
      processedCtx.arc(size/2, size/2, 80, 0, 2 * Math.PI);
      processedCtx.fill();
      
      processedImage = processedCanvas.toDataURL();
    }
  }

  function updateScreenSize(): void {
    if (!browser) return;
    
    isMobile = window.innerWidth < 768;
    isDesktop = window.innerWidth >= 1024;
    
    if (isMobile && !isToolboxCollapsed) {
      isToolboxCollapsed = true;
    }
  }

  function handleToolChanged(event: CustomEvent<{ tool: ToolType }>): void {
    currentTool = event.detail.tool;
    console.log('🔧 Tool changed to:', currentTool);
  }

  function handleBrushSizeChanged(event: CustomEvent<{ size: number }>): void {
    brushSize = event.detail.size;
    console.log('🖌️ Brush size changed to:', brushSize);
  }

  function handleCollapseToggled(event: CustomEvent<{ collapsed: boolean }>): void {
    isToolboxCollapsed = event.detail.collapsed;
  }

  function toggleToolsCollapse(): void {
    isToolboxCollapsed = !isToolboxCollapsed;
    // Trigger canvas resize to account for space change
    setTimeout(() => {
      if (canvasComponent) {
        // Force canvas to update viewport after transition
        window.dispatchEvent(new Event('resize'));
      }
    }, 300); // After transition completes
    console.log('🔧 Tools collapse toggled:', isToolboxCollapsed ? 'collapsed' : 'expanded');
  }

  function handleUndo(): void {
    if (canvasComponent) {
      const success = canvasComponent.undo();
      console.log('↶ Undo:', success ? 'success' : 'failed');
      updateUndoRedoState();
    }
  }

  function handleRedo(): void {
    if (canvasComponent) {
      const success = canvasComponent.redo();
      console.log('↷ Redo:', success ? 'success' : 'failed');
      updateUndoRedoState();
    }
  }

  function handleReset(): void {
    if (canvasComponent) {
      canvasComponent.reset();
      console.log('🔄 Canvas reset');
      updateUndoRedoState();
    }
  }

  function updateUndoRedoState(): void {
    canUndo = true; // Would check actual undo stack
    canRedo = false; // Would check actual redo stack
  }

  function toggleComparison(): void {
    showComparison = !showComparison;
    showOriginal = false;
    
    if (canvasComponent) {
      const viewMode = showComparison ? 'comparison' : 'processed';
      canvasComponent.setViewMode(viewMode);
    }
    
    console.log('🔄 Comparison mode:', showComparison);
  }

  function toggleOriginalPreview(): void {
    showOriginal = !showOriginal;
    showComparison = false;
    
    if (canvasComponent) {
      const viewMode = showOriginal ? 'original' : 'processed';
      canvasComponent.setViewMode(viewMode);
    }
    
    console.log('🔄 Original preview:', showOriginal);
  }

  function saveAndReturn(): void {
    if (!canvasComponent) {
      console.error('❌ Canvas component not available');
      return;
    }
    
    try {
      const processedImageData = canvasComponent.exportProcessedImage();
      if (!processedImageData) {
        console.error('❌ No processed image data available');
        return;
      }
      
      // Create download link
      const link = document.createElement('a');
      link.download = 'refined-character.png';
      link.href = processedImageData;
      link.click();
      
      console.log('✅ Image saved successfully');
      // Optional: Navigate back after successful save
      // goto('/');
      
    } catch (error) {
      console.error('❌ Save failed:', error);
    }
  }

  function handleCancel(): void {
    goto('/');
  }

  function handleCanvasError(event: CustomEvent<{ message: string }>): void {
    error = event.detail.message;
    console.error('❌ Canvas error:', error);
  }

  function handleCanvasInitialized(): void {
    updateUndoRedoState();
    console.log('✅ Canvas initialized successfully');
  }
</script>

<svelte:head>
  <title>Test Refine Image - CharacterCut</title>
  <meta name="description" content="Test the new refine image components">
</svelte:head>

<div class="refine-page" class:mobile={isMobile} class:desktop={isDesktop}>
  
  <!-- Header -->
  <header class="refine-header">
    <div class="header-content">
      
      <nav class="breadcrumb">
        <button class="breadcrumb-btn" on:click={handleCancel}>
          <span class="breadcrumb-icon">←</span>
          <span class="breadcrumb-text">Back to Main</span>
        </button>
      </nav>

      <h1 class="page-title">Test Refine Image</h1>

      <div class="view-controls">
        <button 
          class="view-btn"
          class:active={showComparison}
          on:click={toggleComparison}
          title="Compare original vs processed"
        >
          <span class="view-icon">⚖️</span>
          <span class="view-text">Compare</span>
        </button>
        
        <button 
          class="view-btn"
          class:active={showOriginal}
          on:click={toggleOriginalPreview}
          title="Toggle original preview"
        >
          <span class="view-icon">👁️</span>
          <span class="view-text">Original</span>
        </button>
      </div>

    </div>
  </header>

  <!-- Main Content -->
  <main class="refine-main">
    
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Creating test images...</p>
      </div>
      
    {:else if error}
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Test Error</h2>
        <p class="error-message">{error}</p>
        <button class="error-retry-btn" on:click={() => goto('/')}>
          Return to Main Page
        </button>
      </div>
      
    {:else}
      <div class="workspace {isToolboxCollapsed ? 'tools-collapsed' : 'tools-expanded'}">
        
        <div class="canvas-area">
          <RefineCanvas
            bind:this={canvasComponent}
            {originalImage}
            {processedImage}
            {currentTool}
            {brushSize}
            {showComparison}
            {showOriginal}
            {toolboxWidth}
            on:initialized={handleCanvasInitialized}
            on:error={handleCanvasError}
          />
        </div>

        <aside class="toolbox-area">
          <RefineToolbox
            {currentTool}
            {brushSize}
            {canUndo}
            {canRedo}
            isCollapsed={isToolboxCollapsed}
            on:toolChanged={handleToolChanged}
            on:brushSizeChanged={handleBrushSizeChanged}
            on:collapseToggled={handleCollapseToggled}
            on:undo={handleUndo}
            on:redo={handleRedo}
            on:reset={handleReset}
          />
        </aside>

        <!-- Collapse toggle button - always visible -->
        <button 
          class="collapse-toggle {isToolboxCollapsed ? 'collapsed' : ''}"
          on:click={toggleToolsCollapse}
          title={isToolboxCollapsed ? 'Show Tools' : 'Hide Tools'}
        >
          {isToolboxCollapsed ? '◀' : '▶'}
        </button>

      </div>
    {/if}

  </main>

  <!-- Footer -->
  <footer class="refine-footer">
    <div class="footer-content">
      
      <button class="action-btn secondary" on:click={handleCancel}>
        <span class="action-icon">✕</span>
        <span class="action-text">Cancel</span>
      </button>

      <button 
        class="action-btn primary" 
        on:click={saveAndReturn}
        disabled={isLoading || !!error}
      >
        <span class="action-icon">💾</span>
        <span class="action-text">Test Save</span>
      </button>

    </div>
  </footer>

</div>

<style>
  /* Same styles as the main refine page */
  .refine-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #0f172a; /* Dark theme to match main app */
    color: #f8fafc;
  }

  .refine-header {
    background: #1e293b;
    border-bottom: 1px solid #334155;
    padding: 12px 16px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }

  .breadcrumb-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: 1px solid #4b5563;
    border-radius: 6px;
    color: #d1d5db;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .breadcrumb-btn:hover {
    background: #374151;
    border-color: #6b7280;
    color: #f3f4f6;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #f8fafc;
  }

  .view-controls {
    display: flex;
    gap: 8px;
  }

  .view-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #374151;
    border: 1px solid #4b5563;
    border-radius: 6px;
    color: #f3f4f6;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .view-btn:hover {
    background: #4b5563;
    border-color: #6b7280;
    color: white;
  }

  .view-btn.active {
    background: #3b82f6;
    border-color: #2563eb;
    color: white;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.5);
  }

  .refine-main {
    flex: 1;
    padding: 16px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    background: #0f172a;
  }

  .workspace {
    display: grid;
    gap: 16px;
    height: calc(100vh - 120px); /* Reduce reserved space for header/footer */
    transition: grid-template-columns 0.3s ease;
    position: relative;
    background: #0f172a;
  }

  .workspace.tools-expanded {
    grid-template-columns: 1fr 280px; /* Slightly wider toolbox */
  }

  .workspace.tools-collapsed {
    grid-template-columns: 1fr 0px;
  }

  .canvas-area {
    background: #1e293b;
    border-radius: 8px;
    border: 1px solid #334155;
    overflow: hidden;
    position: relative;
  }

  .toolbox-area {
    overflow: hidden;
    transition: opacity 0.3s ease;
  }

  .workspace.tools-collapsed .toolbox-area {
    opacity: 0;
  }

  .collapse-toggle {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: #1e293b;
    color: white;
    border: none;
    width: 32px;
    height: 48px;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    z-index: 1000;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .collapse-toggle:hover {
    background: #334155;
    width: 36px;
  }

  .collapse-toggle.collapsed {
    right: 0px;
    border-radius: 0 8px 8px 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #6c757d;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
    color: #dc3545;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .error-message {
    font-size: 16px;
    margin: 0 0 24px 0;
    color: #6c757d;
  }

  .error-retry-btn {
    padding: 12px 24px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: background 0.2s ease;
  }

  .error-retry-btn:hover {
    background: #0056b3;
  }

  .refine-footer {
    background: white;
    border-top: 1px solid #e9ecef;
    padding: 16px;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .action-btn.secondary {
    background: #6c757d;
    color: white;
  }

  .action-btn.secondary:hover {
    background: #545b62;
  }

  .action-btn.primary {
    background: #007bff;
    color: white;
  }

  .action-btn.primary:hover {
    background: #0056b3;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .refine-page.mobile .workspace {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
      height: calc(100vh - 120px);
    }

    .refine-page.mobile .toolbox-area {
      order: -1;
      transform: none;
    }

    .refine-page.mobile .toolbox-area.collapsed {
      transform: none;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>