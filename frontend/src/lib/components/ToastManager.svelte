<script>
  import { toastStore } from '$lib/stores/toastStore.js';
  import Toast from './Toast.svelte';
  
  let toasts = [];
  
  // Subscribe to toast store
  toastStore.subscribe(value => {
    toasts = value;
  });
  
  function handleToastClose(toastId) {
    toastStore.remove(toastId);
  }
</script>

<!-- Toast Container - Fixed positioning for top-right placement -->
<div class="toast-manager fixed top-0 right-0 z-50 p-4 pointer-events-none">
  <div class="space-y-3">
    {#each toasts as toast (toast.id)}
      <div class="pointer-events-auto">
        <Toast
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => handleToastClose(toast.id)}
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .toast-manager {
    /* Ensure highest z-index for toasts */
    z-index: 9999;
    /* Prevent toasts from blocking interactions with other elements */
    pointer-events: none;
  }
  
  .toast-manager > div {
    /* Allow interactions only with toast components */
    pointer-events: auto;
  }
</style>