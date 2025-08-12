<!--
  Unified Input Interface Component
  Implements drag-drop, clipboard paste, and upload functionality
  Core implementation of Chloe's seamless workflow requirements
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import Dropzone from 'svelte-file-dropzone';
  
  import { validateImageFile, createImageData, compressImageIfNeeded } from '../utils/imageValidation';
  import type { ImageData } from '../types/app';
  
  // Component props
  export let disabled: boolean = false;
  export let showPasteHint: boolean = true;
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    imageSelected: { image: ImageData };
    error: { message: string };
  }>();
  
  // Component state - simplified for debugging
  let fileInput: HTMLInputElement;
  let dragActive = false;
  let clipboardSupported = false;
  let cleanupKeyboardListener: (() => void) | null = null;
  
  onMount(async () => {
    console.log('🔍 UnifiedInput component mounted');
    
    // Simple clipboard support check
    clipboardSupported = !!(navigator.clipboard && navigator.clipboard.read);
    console.log('🔍 Clipboard supported:', clipboardSupported);
    
    // Set up simplified keyboard listener for Cmd+V/Ctrl+V
    if (clipboardSupported) {
      cleanupKeyboardListener = setupKeyboardListener();
    }
  });
  
  onDestroy(() => {
    if (cleanupKeyboardListener) {
      cleanupKeyboardListener();
    }
  });
  
  /**
   * Simplified keyboard listener setup
   */
  function setupKeyboardListener() {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const isCommandV = (event.metaKey || event.ctrlKey) && event.key === 'v';
      
      if (!isCommandV) return;
      
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      event.preventDefault();
      await handleClipboardPaste();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
  
  /**
   * Handle files from any input method - simplified
   */
  async function handleFiles(files: FileList | File[]) {
    console.log('🔍 handleFiles called with', files.length, 'files');
    
    if (disabled || files.length === 0) return;
    
    const file = files[0]; // Process first file only for MVP
    console.log('🔍 Processing file:', file.name, file.type, file.size);
    
    try {
      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        console.log('🔍 File validation failed:', validation.error);
        dispatch('error', { message: validation.error || 'Invalid image file' });
        return;
      }
      
      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('Image validation warnings:', validation.warnings);
      }
      
      // Compress if needed
      const processedFile = await compressImageIfNeeded(file);
      console.log('🔍 File processed, size:', processedFile.size);
      
      // Create image data
      const imageData = await createImageData(processedFile);
      console.log('🔍 Image data created:', imageData);
      
      // Dispatch event
      dispatch('imageSelected', { image: imageData });
      console.log('🔍 imageSelected event dispatched');
      
    } catch (error) {
      console.log('🔍 Error in handleFiles:', error);
      const message = error instanceof Error ? error.message : 'Failed to process image';
      dispatch('error', { message });
    }
  }
  
  /**
   * Handle drag and drop events - simplified
   */
  function handleDragEnter() {
    console.log('🔍 handleDragEnter called');
    if (!disabled) {
      dragActive = true;
    }
  }
  
  function handleDragLeave() {
    console.log('🔍 handleDragLeave called');
    if (!disabled) {
      dragActive = false;
    }
  }
  
  function handleDragOver() {
    console.log('🔍 handleDragOver called');
    // No additional logic needed
  }
  
  async function handleDrop(event: CustomEvent<{ acceptedFiles: File[] }>) {
    console.log('🔍 handleDrop called with', event.detail.acceptedFiles.length, 'files');
    
    dragActive = false;
    
    if (!disabled && event.detail.acceptedFiles.length > 0) {
      await handleFiles(event.detail.acceptedFiles);
    } else {
      dispatch('error', { message: 'No supported files found in drop' });
    }
  }
  
  /**
   * Handle file input change - simplified
   */
  function handleFileInputChange() {
    console.log('🔍 handleFileInputChange called');
    console.log('🔍 fileInput.files:', fileInput.files);
    
    if (fileInput.files && fileInput.files.length > 0) {
      handleFiles(fileInput.files);
      
      // Reset the input value so the same file can be selected again
      fileInput.value = '';
    }
  }
  
  /**
   * Handle clipboard paste - simplified
   */
  async function handleClipboardPaste(file?: File) {
    console.log('🔍 handleClipboardPaste called');
    
    if (disabled) return;
    
    try {
      let imageFile: File | null = null;
      
      if (file) {
        // Called from keyboard listener
        imageFile = file;
        console.log('🔍 Using provided file from keyboard listener');
      } else {
        // Called from button click - simple clipboard read
        if (clipboardSupported) {
          console.log('🔍 Reading from clipboard');
          const clipboardItems = await navigator.clipboard.read();
          
          if (clipboardItems && clipboardItems.length > 0) {
            for (const clipboardItem of clipboardItems) {
              const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
              
              if (imageTypes.length > 0) {
                const imageType = imageTypes[0];
                const blob = await clipboardItem.getType(imageType);
                
                if (blob && blob.size > 0) {
                  imageFile = new File([blob], `clipboard-image.png`, { type: imageType });
                  console.log('🔍 Clipboard image converted to file');
                  break;
                }
              }
            }
          }
        }
      }
      
      if (imageFile) {
        await handleFiles([imageFile]);
      } else {
        dispatch('error', { message: 'No image found in clipboard' });
      }
      
    } catch (error) {
      console.log('🔍 Clipboard paste error:', error);
      const message = error instanceof Error ? error.message : 'Failed to paste image';
      dispatch('error', { message });
    }
  }
  
  /**
   * Trigger file input click - simplified
   */
  function triggerFileInput() {
    console.log('🔍 triggerFileInput called');
    console.log('🔍 disabled:', disabled);
    console.log('🔍 fileInput:', fileInput);
    
    if (!disabled && fileInput) {
      fileInput.click();
      console.log('🔍 File input clicked');
    }
  }
</script>

<div class="unified-input-container">
  <!-- Hidden file input -->
  <input
    bind:this={fileInput}
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/tiff"
    on:change={handleFileInputChange}
    class="hidden"
    {disabled}
  />
  
  <!-- Main dropzone - simplified -->
  <Dropzone
    on:drop={handleDrop}
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:dragover={handleDragOver}
    accept="image/*"
    multiple={false}
    disableDefaultStyles={true}
    containerClasses="dropzone-container"
    {disabled}
    noClick={true}
  >
    <div 
      class="dropzone {dragActive ? 'dropzone-active' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
      class:animate-pulse-glow={dragActive}
    >
      <!-- Character placement guide -->
      <div class="character-guide absolute inset-0 pointer-events-none opacity-20"></div>
      
      <!-- Main content -->
      <div class="flex flex-col items-center justify-center space-y-6 relative z-10">
        
        <!-- Icon -->
        <div class="w-24 h-24 rounded-full bg-magic-400/10 flex items-center justify-center">
          <svg 
            class="w-12 h-12 text-magic-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        
        <!-- Main heading -->
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-magic-gradient mb-2">
            Place Character Here
          </h2>
          <p class="text-dark-text-secondary text-lg">
            Watch backgrounds disappear like magic
          </p>
        </div>
        
        <!-- Action buttons - simplified -->
        <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          
          <!-- Upload button -->
          <button
            on:click={triggerFileInput}
            class="btn btn-magic flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200"
            {disabled}
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Choose Image
          </button>
          
          <!-- Paste button (simplified) -->
          {#if clipboardSupported}
            <button
              on:click={() => handleClipboardPaste()}
              class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200"
              {disabled}
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Paste
            </button>
          {/if}
        </div>
        
        <!-- Help text - simplified -->
        <div class="text-center text-sm text-dark-text-muted space-y-1">
          <p>
            Drag & drop, choose file{#if clipboardSupported && showPasteHint}, or paste it in{/if}
          </p>
          <p class="opacity-75">
            Supports JPEG, PNG, WebP • Max 10MB • Up to 4K resolution
          </p>
        </div>
        
      </div>
      
      <!-- Drag overlay -->
      {#if dragActive}
        <div class="absolute inset-0 bg-magic-400/20 border-2 border-magic-400 rounded-lg flex items-center justify-center z-20">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-magic-400/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <p class="text-xl font-semibold text-magic-400">Drop to process</p>
            <p class="text-magic-300">Release to start the magic</p>
          </div>
        </div>
      {/if}
      
    </div>
  </Dropzone>
</div>

<style>
  .unified-input-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .dropzone-container {
    width: 100%;
  }
  
  .dropzone {
    position: relative;
    min-height: 400px;
    border-radius: 0.75rem;
    border: 2px dashed rgba(156, 163, 175, 0.5);
    background-color: rgba(26, 26, 26, 0.8);
    transition: all 300ms ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .dropzone:hover {
    background-color: rgba(38, 38, 38, 0.9);
    border-color: rgba(156, 163, 175, 0.7);
  }
  
  .dropzone-active {
    border-color: rgba(0, 255, 136, 0.8);
    background-color: rgba(0, 255, 136, 0.05);
    box-shadow: 0 25px 50px -12px rgba(0, 255, 136, 0.2);
    transform: scale(1.02);
    border-style: solid;
  }
  
  .character-guide {
    background-image: 
      radial-gradient(circle at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%);
    background-size: 200px 200px;
    background-position: center;
    background-repeat: no-repeat;
  }
  
  .kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', monospace;
    border-radius: 0.25rem;
    border: 1px solid rgba(156, 163, 175, 0.3);
    background-color: rgba(38, 38, 38, 0.8);
    min-width: 1.5rem;
    height: 1.5rem;
  }
</style>