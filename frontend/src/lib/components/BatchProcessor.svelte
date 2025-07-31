<!--
  Batch Processor Component
  Multi-file drag-and-drop interface for batch background removal
  Implements concurrent processing with individual progress tracking
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { BatchProcessingResponse, ImageData } from '$lib/types/app';
  
  export let isVisible: boolean = false;
  export let maxFiles: number = 10;
  
  const dispatch = createEventDispatcher();
  
  // State management
  let dragActive = false;
  let selectedFiles: File[] = [];
  let imagePreviewUrls: string[] = [];
  let processing = false;
  let batchResults: BatchProcessingResponse | null = null;
  let currentProgress = 0;
  let processingMessage = '';
  let fileStatuses: Array<{
    index: number;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
  }> = [];
  
  // File input reference
  let fileInput: HTMLInputElement;
  
  onMount(() => {
    if (browser) {
      // Prevent default drag behaviors on document
      document.addEventListener('dragover', preventDefault);
      document.addEventListener('drop', preventDefault);
    }
    
    return () => {
      if (browser) {
        document.removeEventListener('dragover', preventDefault);
        document.removeEventListener('drop', preventDefault);
      }
    };
  });
  
  function preventDefault(e: Event) {
    e.preventDefault();
  }
  
  function validateFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return false;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return false;
    }
    
    return true;
  }
  
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragActive = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }
  
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
    
    const files = Array.from(e.dataTransfer?.files || []);
    await addFiles(files);
  }
  
  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    await addFiles(files);
    
    // Reset input for repeated selections
    target.value = '';
  }
  
  async function addFiles(files: File[]) {
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length === 0) {
      dispatch('error', { message: 'No valid image files selected' });
      return;
    }
    
    if (selectedFiles.length + validFiles.length > maxFiles) {
      dispatch('error', { 
        message: `Maximum ${maxFiles} files allowed. Please remove some files first.` 
      });
      return;
    }
    
    // Add to selected files
    selectedFiles = [...selectedFiles, ...validFiles];
    
    // Generate preview URLs
    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file);
      imagePreviewUrls = [...imagePreviewUrls, previewUrl];
    }
    
    // Initialize file statuses
    const newStatuses = validFiles.map((file, index) => ({
      index: selectedFiles.length - validFiles.length + index,
      filename: file.name,
      status: 'pending' as const,
      progress: 0
    }));
    
    fileStatuses = [...fileStatuses, ...newStatuses];
  }
  
  function removeFile(index: number) {
    // Revoke preview URL
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    // Remove from arrays
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    imagePreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    fileStatuses = fileStatuses.filter((_, i) => i !== index);
    
    // Update indices
    fileStatuses = fileStatuses.map((status, i) => ({
      ...status,
      index: i
    }));
  }
  
  function clearAll() {
    // Revoke all preview URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    selectedFiles = [];
    imagePreviewUrls = [];
    fileStatuses = [];
    batchResults = null;
    currentProgress = 0;
    processingMessage = '';
  }
  
  async function processBatch() {
    if (selectedFiles.length === 0) {
      dispatch('error', { message: 'No files selected for processing' });
      return;
    }
    
    processing = true;
    currentProgress = 0;
    processingMessage = 'Preparing batch processing...';
    
    // Update all file statuses to processing
    fileStatuses = fileStatuses.map(status => ({
      ...status,
      status: 'processing',
      progress: 0
    }));
    
    try {
      // Prepare FormData for batch processing
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      processingMessage = 'Processing images...';
      
      // Make API call to batch processing endpoint
      const response = await fetch('http://localhost:8000/process-batch', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const results: BatchProcessingResponse = await response.json();
      batchResults = results;
      
      // Update file statuses based on results
      fileStatuses = fileStatuses.map(status => {
        const result = results.results.find(r => r.index === status.index);
        if (result) {
          return {
            ...status,
            status: result.success ? 'completed' : 'failed',
            progress: 100,
            downloadUrl: result.download_url,
            error: result.error
          };
        }
        return status;
      });
      
      currentProgress = 100;
      processingMessage = `Processing complete! ${results.successful_count}/${results.total_images} images processed successfully.`;
      
      // Dispatch success event
      dispatch('completed', { batchResults: results });
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      
      // Update all file statuses to failed
      fileStatuses = fileStatuses.map(status => ({
        ...status,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Processing failed'
      }));
      
      processingMessage = 'Batch processing failed. Please try again.';
      dispatch('error', { message: processingMessage });
      
    } finally {
      processing = false;
    }
  }
  
  function downloadAll() {
    if (!batchResults) return;
    
    batchResults.results.forEach(result => {
      if (result.success && result.download_url) {
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = `processed_${result.filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }
  
  function downloadSingle(downloadUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `processed_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function close() {
    clearAll();
    dispatch('close');
  }
</script>

{#if isVisible}
  <div class="batch-overlay" on:click|self={close}>
    <div class="batch-container">
      
      <!-- Header -->
      <div class="batch-header">
        <h3 class="text-xl font-semibold text-magic-gradient">Batch Processing</h3>
        <p class="text-sm text-dark-text-secondary mt-1">
          Process multiple images simultaneously (max {maxFiles} files)
        </p>
        
        <button 
          on:click={close}
          class="close-button"
          aria-label="Close batch processor"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- File Drop Zone -->
      {#if selectedFiles.length === 0}
        <div 
          class="drop-zone {dragActive ? 'drag-active' : ''}"
          on:dragenter={handleDragEnter}
          on:dragleave={handleDragLeave}
          on:dragover={handleDragOver}
          on:drop={handleDrop}
        >
          <div class="drop-zone-content">
            <svg class="w-12 h-12 text-magic-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            
            <h4 class="text-lg font-semibold text-dark-text mb-2">
              Drop images here or click to select
            </h4>
            <p class="text-sm text-dark-text-secondary mb-4">
              Support for JPG, PNG, WebP • Max 10MB per file • Up to {maxFiles} files
            </p>
            
            <button 
              on:click={() => fileInput?.click()}
              class="btn btn-magic"
              disabled={processing}
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Select Files
            </button>
          </div>
          
          <input
            type="file"
            multiple
            accept="image/*"
            bind:this={fileInput}
            on:change={handleFileSelect}
            class="hidden"
          />
        </div>
      {/if}
      
      <!-- File List -->
      {#if selectedFiles.length > 0}
        <div class="file-list-container">
          <div class="file-list-header">
            <h4 class="text-lg font-semibold text-dark-text">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            
            <div class="file-list-actions">
              <button
                on:click={() => fileInput?.click()}
                class="btn btn-outline btn-sm"
                disabled={processing || selectedFiles.length >= maxFiles}
              >
                Add More
              </button>
              
              <button
                on:click={clearAll}
                class="btn btn-outline btn-sm"
                disabled={processing}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div class="file-list">
            {#each selectedFiles as file, index}
              <div class="file-item">
                <div class="file-preview">
                  <img 
                    src={imagePreviewUrls[index]} 
                    alt={file.name}
                    class="preview-image"
                  />
                </div>
                
                <div class="file-info">
                  <div class="file-name">{file.name}</div>
                  <div class="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                  
                  <!-- Status indicator -->
                  {#if fileStatuses[index]}
                    <div class="file-status status-{fileStatuses[index].status}">
                      {#if fileStatuses[index].status === 'pending'}
                        <span>Ready</span>
                      {:else if fileStatuses[index].status === 'processing'}
                        <div class="processing-indicator">
                          <div class="spinner"></div>
                          <span>Processing...</span>
                        </div>
                      {:else if fileStatuses[index].status === 'completed'}
                        <span class="text-green-400">✓ Completed</span>
                      {:else if fileStatuses[index].status === 'failed'}
                        <span class="text-red-400">✗ Failed</span>
                      {/if}
                    </div>
                    
                    {#if fileStatuses[index].error}
                      <div class="file-error">{fileStatuses[index].error}</div>
                    {/if}
                  {/if}
                </div>
                
                <div class="file-actions">
                  {#if fileStatuses[index]?.status === 'completed' && fileStatuses[index].downloadUrl}
                    <button
                      on:click={() => downloadSingle(fileStatuses[index].downloadUrl, file.name)}
                      class="btn btn-sm btn-magic"
                      title="Download processed image"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4"/>
                      </svg>
                    </button>
                  {/if}
                  
                  <button
                    on:click={() => removeFile(index)}
                    class="btn btn-sm btn-outline border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    disabled={processing}
                    title="Remove file"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
          
          <input
            type="file"
            multiple
            accept="image/*"
            bind:this={fileInput}
            on:change={handleFileSelect}
            class="hidden"
          />
        </div>
        
        <!-- Processing Controls -->
        <div class="processing-controls">
          {#if !processing && batchResults === null}
            <button
              on:click={processBatch}
              class="btn btn-magic btn-lg"
              disabled={selectedFiles.length === 0}
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Process {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
            </button>
          {:else if processing}
            <div class="processing-status">
              <div class="processing-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {currentProgress}%"></div>
                </div>
                <span class="progress-text">{processingMessage}</span>
              </div>
            </div>
          {:else if batchResults}
            <div class="batch-results">
              <div class="results-summary">
                <h4 class="text-lg font-semibold text-magic-gradient mb-2">
                  Processing Complete!
                </h4>
                <p class="text-dark-text-secondary mb-4">
                  {batchResults.successful_count} of {batchResults.total_images} images processed successfully
                  in {batchResults.processing_time.toFixed(2)}s
                </p>
              </div>
              
              <div class="results-actions">
                <button
                  on:click={downloadAll}
                  class="btn btn-magic"
                  disabled={batchResults.successful_count === 0}
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3"/>
                  </svg>
                  Download All ({batchResults.successful_count})
                </button>
                
                <button
                  on:click={clearAll}
                  class="btn btn-outline"
                >
                  Process New Batch
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      
    </div>
  </div>
{/if}

<style>
  .batch-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .batch-container {
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    width: 900px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  }
  
  .batch-header {
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
  
  .drop-zone {
    margin: 20px;
    padding: 60px 20px;
    border: 2px dashed rgba(0, 255, 136, 0.3);
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .drop-zone:hover,
  .drop-zone.drag-active {
    border-color: rgba(0, 255, 136, 0.6);
    background: rgba(0, 255, 136, 0.05);
  }
  
  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .file-list-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }
  
  .file-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .file-list-actions {
    display: flex;
    gap: 8px;
  }
  
  .file-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .file-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(0, 255, 136, 0.3);
  }
  
  .file-preview {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
  }
  
  .file-name {
    font-weight: 500;
    color: #fff;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-size {
    font-size: 12px;
    color: #999;
    margin-bottom: 4px;
  }
  
  .file-status {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .file-status.status-pending {
    color: #ccc;
  }
  
  .file-status.status-processing {
    color: #00ff88;
  }
  
  .file-status.status-completed {
    color: #00ff88;
  }
  
  .file-status.status-failed {
    color: #ff4444;
  }
  
  .processing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0, 255, 136, 0.3);
    border-top: 2px solid #00ff88;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .file-error {
    font-size: 11px;
    color: #ff4444;
    margin-top: 2px;
  }
  
  .file-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  
  .processing-controls {
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }
  
  .processing-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .processing-progress {
    width: 100%;
    max-width: 400px;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00d4aa);
    transition: width 0.3s ease;
  }
  
  .progress-text {
    color: #00ff88;
    font-size: 14px;
  }
  
  .batch-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .results-summary {
    text-align: center;
  }
  
  .results-actions {
    display: flex;
    gap: 12px;
  }
  
  .hidden {
    display: none;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .batch-container {
      width: 100%;
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }
    
    .file-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .file-actions {
      align-self: flex-end;
    }
    
    .results-actions {
      flex-direction: column;
      width: 100%;
    }
  }
</style>