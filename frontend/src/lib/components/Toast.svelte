<script>
  import { fly, fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  export let type = 'info'; // 'success', 'error', 'warning', 'info'
  export let message = '';
  export let duration = 5000; // Auto-dismiss after 5 seconds
  export let onClose = () => {};
  
  let visible = true;
  let progressWidth = 100;
  
  const typeStyles = {
    success: 'border-green-500 bg-green-500/10 text-green-400',
    error: 'border-red-500 bg-red-500/10 text-red-400',
    warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    info: 'border-magic-400 bg-magic-400/10 text-magic-400'
  };
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'i'
  };
  
  onMount(() => {
    if (duration > 0) {
      // Start progress animation
      const progressInterval = setInterval(() => {
        progressWidth -= (100 / (duration / 100));
        if (progressWidth <= 0) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        visible = false;
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  });
  
  function handleClose() {
    visible = false;
    setTimeout(onClose, 300);
  }
</script>

{#if visible}
  <div
    class="toast-container fixed top-4 right-4 z-50"
    in:fly={{ x: 300, duration: 300 }}
    out:fly={{ x: 300, duration: 300 }}
  >
    <div class="glass-card border {typeStyles[type]} min-w-80 max-w-sm rounded-lg shadow-xl overflow-hidden">
      <!-- Toast Header -->
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                      {type === 'success' ? 'bg-green-500' : ''}
                      {type === 'error' ? 'bg-red-500' : ''}
                      {type === 'warning' ? 'bg-yellow-500' : ''}
                      {type === 'info' ? 'bg-magic-400' : ''} text-white">
            {icons[type]}
          </div>
          <p class="text-sm font-medium leading-5">{message}</p>
        </div>
        <button
          on:click={handleClose}
          class="flex-shrink-0 ml-4 text-gray-400 hover:text-white transition-colors duration-200 p-1 hover:bg-white/10 rounded"
          aria-label="Close notification"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Progress Bar -->
      {#if duration > 0}
        <div class="h-1 bg-black/20">
          <div 
            class="h-full transition-all duration-100 ease-linear
                   {type === 'success' ? 'bg-green-500' : ''}
                   {type === 'error' ? 'bg-red-500' : ''}
                   {type === 'warning' ? 'bg-yellow-500' : ''}
                   {type === 'info' ? 'bg-magic-400' : ''}"
            style="width: {progressWidth}%"
          ></div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .toast-container {
    /* Ensure toasts appear above all other content */
    z-index: 9999;
  }
  
  /* Enhanced backdrop blur for toast */
  .glass-card {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .glass-card {
      background: rgba(0, 0, 0, 0.95);
      border-width: 2px;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .transition-all {
      transition: none;
    }
  }
</style>