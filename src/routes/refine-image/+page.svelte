<!--
  Refine Image Page - Complete redesign with new canvas engine
  Mobile-first responsive design with clean architecture
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { imageSessionManager } from '$lib/services/imageSessionManager';
  import RefineCanvas from '$lib/components/RefineCanvas.svelte';
  import RefineToolbox from '$lib/components/RefineToolbox.svelte';
  import type { ToolType } from '$lib/services/ToolOperations';
  
  // State
  let originalImage: string | null = null;
  let processedImage: string | null = null;
  let sessionId: string | null = null;
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

  // Mobile state
  let isMobile: boolean = false;
  let isDesktop: boolean = false;

  onMount(async () => {
    if (!browser) return;
    
    try {
      // Check screen size
      updateScreenSize();
      window.addEventListener('resize', updateScreenSize);
      
      // Get session ID from URL params
      sessionId = $page.url.searchParams.get('session');
      
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      
      // Load session data
      const sessionData = await imageSessionManager.getSession(sessionId);
      
      if (!sessionData) {
        throw new Error('Session not found');
      }
      
      originalImage = sessionData.originalImage;
      processedImage = sessionData.processedImage;
      
      if (!originalImage || !processedImage) {
        throw new Error('Invalid session data');
      }
      
      isLoading = false;
      console.log('✅ Refine page initialized with session:', sessionId);
      
    } catch (err) {
      console.error('❌ Failed to initialize refine page:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      isLoading = false;
    }
  });

  function updateScreenSize(): void {
    if (!browser) return;
    
    isMobile = window.innerWidth < 768;
    isDesktop = window.innerWidth >= 1024;
    
    // Auto-collapse toolbox on mobile
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
    // This would need to be implemented in the canvas component
    // For now, we'll simulate it
    canUndo = true; // Would check actual undo stack
    canRedo = false; // Would check actual redo stack
  }

  function toggleComparison(): void {
    showComparison = !showComparison;
    showOriginal = false; // Can't show both at same time
    console.log('🔄 Comparison mode:', showComparison);
  }

  function toggleOriginalPreview(): void {
    showOriginal = !showOriginal;
    showComparison = false; // Can't show both at same time
    console.log('🔄 Original preview:', showOriginal);
  }

  async function saveAndReturn(): Promise<void> {
    if (!canvasComponent || !sessionId) return;
    
    try {
      // Export current canvas state
      const exportedImage = canvasComponent.exportCanvas();
      
      if (!exportedImage) {
        throw new Error('Failed to export canvas');
      }
      
      // Update session with refined image
      await imageSessionManager.updateSession(sessionId, {
        processedImage: exportedImage,
        lastModified: new Date()
      });
      
      console.log('💾 Image saved successfully');
      
      // Navigate back to main page
      goto('/');
      
    } catch (err) {
      console.error('❌ Failed to save image:', err);
      error = 'Failed to save image';
    }
  }

  function handleCancel(): void {
    // Clear session and return to main page
    if (sessionId) {
      imageSessionManager.clearSession(sessionId);
    }
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
  <title>Refine Image - CharacterCut</title>
  <meta name="description" content="Refine and perfect your character image with advanced editing tools">
</svelte:head>

<div class="refine-page" class:mobile={isMobile} class:desktop={isDesktop}>
  
  <!-- Header -->
  <header class="refine-header">
    <div class="header-content">
      
      <!-- Breadcrumb / Navigation -->
      <nav class="breadcrumb">
        <button class="breadcrumb-btn" on:click={handleCancel}>
          <span class="breadcrumb-icon">←</span>
          <span class="breadcrumb-text">Back to Main</span>
        </button>
      </nav>

      <!-- Page Title -->
      <h1 class="page-title">Refine Image</h1>

      <!-- View Controls -->
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
      <!-- Loading State -->
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your image...</p>
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-message">{error}</p>
        <button class="error-retry-btn" on:click={() => goto('/')}>
          Return to Main Page
        </button>
      </div>
      
    {:else}
      <!-- Canvas and Tools -->
      <div class="workspace">
        
        <!-- Canvas Area -->
        <div class="canvas-area">
          <RefineCanvas
            bind:this={canvasComponent}
            {originalImage}
            {processedImage}
            {currentTool}
            {brushSize}
            {showComparison}
            {showOriginal}
            on:initialized={handleCanvasInitialized}
            on:error={handleCanvasError}
          />
        </div>

        <!-- Toolbox -->
        <aside class="toolbox-area" class:collapsed={isToolboxCollapsed}>
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

      </div>
    {/if}

  </main>

  <!-- Footer / Action Bar -->
  <footer class="refine-footer">
    <div class="footer-content">
      
      <!-- Cancel Button -->
      <button class="action-btn secondary" on:click={handleCancel}>
        <span class="action-icon">✕</span>
        <span class="action-text">Cancel</span>
      </button>

      <!-- Save Button -->
      <button 
        class="action-btn primary" 
        on:click={saveAndReturn}
        disabled={isLoading || !!error}
      >
        <span class="action-icon">💾</span>
        <span class="action-text">Save & Return</span>
      </button>

    </div>
  </footer>

</div>

<style>
  .refine-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #f8f9fa;
  }

  /* Header */
  .refine-header {
    background: white;
    border-bottom: 1px solid #e9ecef;
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
    border: 1px solid #dee2e6;
    border-radius: 6px;
    color: #495057;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .breadcrumb-btn:hover {
    background: #f8f9fa;
    border-color: #adb5bd;
  }

  .breadcrumb-icon {
    font-size: 16px;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #212529;
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
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    color: #495057;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-btn:hover {
    background: #e9ecef;
  }

  .view-btn.active {
    background: #007bff;
    border-color: #007bff;
    color: white;
  }

  .view-icon {
    font-size: 14px;
  }

  /* Main Content */
  .refine-main {
    flex: 1;
    padding: 16px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .workspace {
    display: grid;
    grid-template-columns: 1fr 250px;
    gap: 16px;
    height: calc(100vh - 140px); /* Account for header and footer */
  }

  .canvas-area {
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    overflow: hidden;
    position: relative;
  }

  .toolbox-area {
    transition: transform 0.3s ease;
  }

  .toolbox-area.collapsed {
    transform: translateX(100%);
  }

  /* Loading State */
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

  .loading-text {
    font-size: 16px;
    margin: 0;
  }

  /* Error State */
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

  /* Footer */
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

  .action-icon {
    font-size: 16px;
  }

  /* Mobile Responsive */
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

    .refine-page.mobile .header-content {
      flex-wrap: wrap;
      gap: 12px;
    }

    .refine-page.mobile .page-title {
      order: -1;
      width: 100%;
      text-align: center;
      font-size: 18px;
    }

    .refine-page.mobile .view-controls {
      order: 1;
    }

    .refine-page.mobile .breadcrumb-text,
    .refine-page.mobile .view-text {
      display: none;
    }

    .refine-page.mobile .footer-content {
      gap: 12px;
    }

    .refine-page.mobile .action-btn {
      flex: 1;
      justify-content: center;
    }
  }

  /* Tablet Responsive */
  @media (min-width: 769px) and (max-width: 1024px) {
    .workspace {
      grid-template-columns: 1fr 220px;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>