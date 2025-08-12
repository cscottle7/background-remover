import { writable } from 'svelte/store';

// Toast store for global toast management
function createToastStore() {
  const { subscribe, update } = writable([]);
  
  let nextId = 1;
  
  return {
    subscribe,
    
    // Add a new toast
    add: (type, message, duration = 5000) => {
      const id = nextId++;
      const toast = {
        id,
        type,
        message,
        duration,
        timestamp: Date.now()
      };
      
      update(toasts => [...toasts, toast]);
      
      // Return the id so caller can dismiss early if needed
      return id;
    },
    
    // Remove a specific toast
    remove: (id) => {
      update(toasts => toasts.filter(toast => toast.id !== id));
    },
    
    // Clear all toasts
    clear: () => {
      update(() => []);
    },
    
    // Convenience methods for different toast types
    success: (message, duration) => {
      return createToastStore().add('success', message, duration);
    },
    
    error: (message, duration) => {
      return createToastStore().add('error', message, duration);
    },
    
    warning: (message, duration) => {
      return createToastStore().add('warning', message, duration);
    },
    
    info: (message, duration) => {
      return createToastStore().add('info', message, duration);
    }
  };
}

export const toastStore = createToastStore();

// Convenience functions for easy importing
export const toast = {
  success: (message, duration = 5000) => toastStore.add('success', message, duration),
  error: (message, duration = 5000) => toastStore.add('error', message, duration),
  warning: (message, duration = 5000) => toastStore.add('warning', message, duration),
  info: (message, duration = 5000) => toastStore.add('info', message, duration),
  remove: (id) => toastStore.remove(id),
  clear: () => toastStore.clear()
};