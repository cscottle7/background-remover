<!--
  Download Options Component
  Provides format selection and download customization for developer workflow
  Implements Chloe's need for quick asset preparation
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { downloadService, type DownloadOptions } from '../services/downloadService';
  
  export let downloadUrl: string;
  export let processingId: string = '';
  export let originalFilename: string = '';
  export let processingTime: number = 0;
  export let showAdvanced: boolean = false;
  
  const dispatch = createEventDispatcher<{
    download: { options: DownloadOptions };
    cancel: void;
  }>();
  
  // Download options state
  let selectedFormat: 'png' | 'webp' | 'jpeg' = 'png';
  let quality = 0.9;
  let customFilename = '';
  let includeMetadata = false;
  
  // Preview state
  let downloadPreview: {
    estimatedSize: string;
    format: string;
    filename: string;
    dimensions?: { width: number; height: number };
  } | null = null;
  
  // Reactive updates
  $: {
    updatePreview();
  }
  
  async function updatePreview() {
    if (downloadUrl) {
      downloadPreview = await downloadService.getDownloadPreview(downloadUrl, {
        format: selectedFormat,
        quality,
        filename: customFilename || undefined,
        includeMetadata
      });
    }
  }
  
  function handleDownload() {
    const options: DownloadOptions = {
      format: selectedFormat,
      quality: selectedFormat !== 'png' ? quality : undefined,
      filename: customFilename || undefined,
      includeMetadata
    };
    
    dispatch('download', { options });
  }
  
  function handleQuickDownload(format: 'png' | 'webp' | 'jpeg') {
    const options: DownloadOptions = {
      format,
      quality: format !== 'png' ? 0.9 : undefined
    };
    
    dispatch('download', { options });
  }
  
  // Format recommendations
  const formatInfo = {
    png: {
      name: 'PNG',
      description: 'Best for transparency',
      recommended: 'development',
      pros: ['Lossless quality', 'Transparency support', 'Wide compatibility']
    },
    webp: {
      name: 'WebP',
      description: 'Smaller file size',
      recommended: 'web',
      pros: ['Smaller files', 'Good quality', 'Modern format']
    },
    jpeg: {
      name: 'JPEG',
      description: 'Smallest file size',
      recommended: 'sharing',
      pros: ['Smallest files', 'Universal support', 'Good for photos']
    }
  };
  
  // Check browser support
  $: webpSupported = downloadService.supportsFormat('webp');
  $: recommendedFormat = downloadService.getRecommendedFormat('development');
</script>

<div class="download-options bg-dark-elevated rounded-xl p-6 border border-magic-400/20">
  
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold text-magic-gradient">Download Options</h3>
    <button
      on:click={() => dispatch('cancel')}
      class="text-dark-text-muted hover:text-dark-text"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
  
  <!-- Quick Download Options -->
  <div class="mb-6">
    <h4 class="text-sm font-medium text-dark-text mb-3">Quick Download</h4>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      
      <!-- PNG Option -->
      <button
        on:click={() => handleQuickDownload('png')}
        class="quick-option p-3 rounded-lg border border-magic-400/30 hover:border-magic-400/60 hover:bg-magic-400/10 transition-all text-left"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-magic-400">PNG</span>
          {#if recommendedFormat === 'png'}
            <span class="text-xs px-2 py-1 bg-green-400/20 text-green-400 rounded">Recommended</span>
          {/if}
        </div>
        <p class="text-xs text-dark-text-muted">Perfect transparency</p>
      </button>
      
      <!-- WebP Option -->
      <button
        on:click={() => handleQuickDownload('webp')}
        class="quick-option p-3 rounded-lg border border-blue-400/30 hover:border-blue-400/60 hover:bg-blue-400/10 transition-all text-left"
        disabled={!webpSupported}
        class:opacity-50={!webpSupported}
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-blue-400">WebP</span>
          {#if !webpSupported}
            <span class="text-xs px-2 py-1 bg-red-400/20 text-red-400 rounded">Not Supported</span>
          {/if}
        </div>
        <p class="text-xs text-dark-text-muted">Smaller files</p>
      </button>
      
      <!-- JPEG Option -->
      <button
        on:click={() => handleQuickDownload('jpeg')}
        class="quick-option p-3 rounded-lg border border-orange-400/30 hover:border-orange-400/60 hover:bg-orange-400/10 transition-all text-left"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-orange-400">JPEG</span>
        </div>
        <p class="text-xs text-dark-text-muted">Smallest size</p>
      </button>
      
    </div>
  </div>
  
  <!-- Advanced Options Toggle -->
  <div class="mb-6">
    <button
      on:click={() => showAdvanced = !showAdvanced}
      class="flex items-center space-x-2 text-sm text-dark-text-muted hover:text-dark-text transition-colors"
    >
      <svg 
        class="w-4 h-4 transition-transform duration-200" 
        class:rotate-90={showAdvanced}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
      <span>Advanced Options</span>
    </button>
  </div>
  
  <!-- Advanced Options Panel -->
  {#if showAdvanced}
    <div class="advanced-options space-y-4 p-4 bg-dark-base/50 rounded-lg border border-dark-elevated">
      
      <!-- Format Selection -->
      <div>
        <label class="block text-sm font-medium text-dark-text mb-2">Format</label>
        <div class="grid grid-cols-3 gap-2">
          {#each Object.entries(formatInfo) as [format, info]}
            <label class="format-option">
              <input
                type="radio"
                bind:group={selectedFormat}
                value={format}
                class="sr-only"
              />
              <div class="format-card p-3 rounded-lg border border-gray-600 hover:border-magic-400 cursor-pointer transition-all">
                <div class="text-sm font-medium text-dark-text">{info.name}</div>
                <div class="text-xs text-dark-text-muted">{info.description}</div>
              </div>
            </label>
          {/each}
        </div>
      </div>
      
      <!-- Quality Slider (for lossy formats) -->
      {#if selectedFormat !== 'png'}
        <div>
          <label class="block text-sm font-medium text-dark-text mb-2">
            Quality: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            bind:value={quality}
            min="0.1"
            max="1"
            step="0.1"
            class="w-full h-2 bg-dark-base rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-dark-text-muted mt-1">
            <span>Smaller file</span>
            <span>Higher quality</span>
          </div>
        </div>
      {/if}
      
      <!-- Custom Filename -->
      <div>
        <label class="block text-sm font-medium text-dark-text mb-2">Custom Filename</label>
        <input
          type="text"
          bind:value={customFilename}
          placeholder="character_asset"
          class="w-full px-3 py-2 bg-dark-base border border-gray-600 rounded-lg text-dark-text placeholder-dark-text-muted focus:border-magic-400 focus:outline-none"
        />
        <p class="text-xs text-dark-text-muted mt-1">
          Extension will be added automatically
        </p>
      </div>
      
      <!-- Include Metadata -->
      <div class="flex items-center space-x-2">
        <input
          type="checkbox"
          bind:checked={includeMetadata}
          class="w-4 h-4 text-magic-400 border-gray-600 rounded focus:ring-magic-400"
        />
        <label class="text-sm text-dark-text">Include processing metadata in filename</label>
      </div>
      
    </div>
  {/if}
  
  <!-- Download Preview -->
  {#if downloadPreview}
    <div class="download-preview p-4 bg-dark-base/30 rounded-lg border border-magic-400/20 mb-6">
      <h4 class="text-sm font-medium text-dark-text mb-2">Download Preview</h4>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-dark-text-muted">Format:</span>
          <span class="text-dark-text ml-2">{downloadPreview.format}</span>
        </div>
        <div>
          <span class="text-dark-text-muted">Size:</span>
          <span class="text-dark-text ml-2">{downloadPreview.estimatedSize}</span>
        </div>
        <div class="col-span-2">
          <span class="text-dark-text-muted">Filename:</span>
          <span class="text-dark-text ml-2 font-mono text-xs">{downloadPreview.filename}</span>
        </div>
        {#if downloadPreview.dimensions}
          <div class="col-span-2">
            <span class="text-dark-text-muted">Dimensions:</span>
            <span class="text-dark-text ml-2">{downloadPreview.dimensions.width} × {downloadPreview.dimensions.height}px</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Download Button -->
  <div class="flex justify-end">
    <button
      on:click={handleDownload}
      class="btn btn-magic py-3 px-6 rounded-lg font-medium"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3"/>
      </svg>
      Download {selectedFormat.toUpperCase()}
    </button>
  </div>
  
</div>

<style>
  /* Custom radio button styling */
  .format-option input:checked + .format-card {
    border-color: rgba(0, 255, 136, 0.6);
    background-color: rgba(0, 255, 136, 0.1);
  }
  
  /* Custom range slider styling */
  input[type="range"] {
    background: linear-gradient(to right, rgba(0, 255, 136, 0.3) 0%, rgba(0, 255, 136, 0.3) var(--value, 90%), rgba(156, 163, 175, 0.3) var(--value, 90%), rgba(156, 163, 175, 0.3) 100%);
  }
  
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 255, 136, 1);
    cursor: pointer;
    border: 2px solid rgba(26, 26, 26, 1);
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 255, 136, 1);
    cursor: pointer;
    border: 2px solid rgba(26, 26, 26, 1);
  }
  
  .quick-option:hover {
    transform: translateY(-1px);
  }
  
  .advanced-options {
    animation: slideDown 0.3s ease-out;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 500px;
    }
  }
</style>