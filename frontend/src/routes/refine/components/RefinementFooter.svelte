<!--
  Refinement Footer Component
  Keyboard shortcuts, help information, and status display
-->

<script lang="ts">
  import { refinementState, refinementActions, keyboardShortcuts } from '$lib/stores/refinementState.js';
  import { onMount, onDestroy } from 'svelte';
  
  // Reactive state from store
  $: currentState = $refinementState;
  $: showShortcutHelp = currentState.showShortcutHelp;
  
  // Keyboard shortcut handling
  function handleKeydown(event: KeyboardEvent) {
    // Don't handle shortcuts if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Build key combination string
    let key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey) key = `ctrl+${key}`;
    if (event.altKey) key = `alt+${key}`;
    if (event.shiftKey) key = `shift+${key}`;
    
    // Check if we have a handler for this key combination
    if (keyboardShortcuts[key]) {
      event.preventDefault();
      keyboardShortcuts[key]();
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
  });
  
  // Shortcut categories
  const shortcutCategories = [
    {
      title: 'Tools',
      shortcuts: [
        { key: 'B', description: 'Smart Restore' },
        { key: 'E', description: 'Erase' },
        { key: 'R', description: 'Background Restore' },
        { key: 'P', description: 'Precision Erase' },
        { key: 'G', description: 'Edge Refine' },
        { key: 'X', description: 'Background Erase' }
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { key: 'Space', description: 'Toggle Original Preview' },
        { key: 'Esc', description: 'Cancel / Close Help' },
        { key: 'Ctrl+S', description: 'Save & Return' },
        { key: 'Ctrl+W', description: 'Cancel & Return' }
      ]
    },
    {
      title: 'Editing',
      shortcuts: [
        { key: 'Ctrl+Z', description: 'Undo' },
        { key: 'Ctrl+Y', description: 'Redo' },
        { key: 'H', description: 'Toggle Help' }
      ]
    }
  ];
</script>

<footer class="refinement-footer">
  <div class="footer-content">
    
    <!-- Status information -->
    <div class="footer-left">
      <div class="status-item">
        <span class="status-label">Tool:</span>
        <span class="status-value">{currentState.currentTool.replace('-', ' ')}</span>
      </div>
      
      <div class="status-item">
        <span class="status-label">Size:</span>
        <span class="status-value">{currentState.brushSize}px</span>
      </div>
      
      {#if currentState.hasUnsavedChanges}
        <div class="status-item unsaved">
          <div class="unsaved-dot"></div>
          <span class="status-value">Unsaved</span>
        </div>
      {/if}
    </div>
    
    <!-- Help toggle -->
    <div class="footer-right">
      <button
        on:click={() => refinementActions.toggleShortcutHelp()}
        class="help-button"
        class:active={showShortcutHelp}
        title="Toggle keyboard shortcuts (H)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="help-text">Help</span>
      </button>
    </div>
    
  </div>
</footer>

<!-- Keyboard shortcuts overlay -->
{#if showShortcutHelp}
  <div class="shortcuts-overlay" on:click={() => refinementActions.toggleShortcutHelp()}>
    <div class="shortcuts-modal" on:click|stopPropagation>
      
      <!-- Modal header -->
      <div class="shortcuts-header">
        <h3 class="shortcuts-title">Keyboard Shortcuts</h3>
        <button
          on:click={() => refinementActions.toggleShortcutHelp()}
          class="close-button"
          title="Close help (Esc)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Shortcuts content -->
      <div class="shortcuts-content">
        {#each shortcutCategories as category}
          <div class="shortcut-category">
            <h4 class="category-title">{category.title}</h4>
            <div class="shortcuts-list">
              {#each category.shortcuts as shortcut}
                <div class="shortcut-item">
                  <kbd class="shortcut-key">{shortcut.key}</kbd>
                  <span class="shortcut-description">{shortcut.description}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Modal footer -->
      <div class="shortcuts-footer">
        <p class="footer-note">Press <kbd>H</kbd> to toggle this help, <kbd>Esc</kbd> to close</p>
      </div>
      
    </div>
  </div>
{/if}

<style>
  .refinement-footer {
    background: var(--color-dark-surface);
    border-top: 1px solid var(--color-dark-border);
    padding: 0.75rem 1rem;
    position: relative;
    z-index: 10;
  }
  
  .footer-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 100%;
  }
  
  .footer-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
  }
  
  .status-item.unsaved {
    color: var(--color-magic-400);
  }
  
  .status-label {
    color: var(--color-dark-text-muted);
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.05em;
  }
  
  .status-value {
    color: var(--color-dark-text-secondary);
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .unsaved-dot {
    width: 4px;
    height: 4px;
    background: var(--color-magic-400);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  .footer-right {
    flex-shrink: 0;
  }
  
  .help-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-dark-bg);
    border: 1px solid var(--color-dark-border);
    border-radius: 6px;
    color: var(--color-dark-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.75rem;
  }
  
  .help-button:hover {
    background: var(--color-dark-hover);
    border-color: var(--color-magic-400);
    color: var(--color-dark-text);
  }
  
  .help-button.active {
    background: var(--color-magic-400);
    border-color: var(--color-magic-400);
    color: white;
  }
  
  .help-text {
    font-weight: 500;
  }
  
  /* Shortcuts overlay */
  .shortcuts-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }
  
  .shortcuts-modal {
    background: var(--color-dark-surface);
    border: 1px solid var(--color-dark-border);
    border-radius: 12px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .shortcuts-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-dark-border);
    background: var(--color-dark-bg);
  }
  
  .shortcuts-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-dark-text);
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    color: var(--color-dark-text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background: var(--color-dark-hover);
    color: var(--color-dark-text);
  }
  
  .shortcuts-content {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .shortcut-category {
    margin-bottom: 2rem;
  }
  
  .shortcut-category:last-child {
    margin-bottom: 0;
  }
  
  .category-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-magic-400);
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-dark-border);
  }
  
  .shortcuts-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
  }
  
  .shortcut-key {
    background: var(--color-dark-bg);
    border: 1px solid var(--color-dark-border);
    color: var(--color-dark-text);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 3rem;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .shortcut-description {
    color: var(--color-dark-text-secondary);
    font-size: 0.875rem;
    flex: 1;
  }
  
  .shortcuts-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-dark-border);
    background: var(--color-dark-bg);
  }
  
  .footer-note {
    font-size: 0.75rem;
    color: var(--color-dark-text-muted);
    text-align: center;
    margin: 0;
  }
  
  .footer-note kbd {
    background: var(--color-dark-border);
    color: var(--color-dark-text);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-family: monospace;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .footer-content {
      gap: 0.5rem;
    }
    
    .footer-left {
      gap: 0.75rem;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .footer-left::-webkit-scrollbar {
      display: none;
    }
    
    .status-item {
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .help-button {
      padding: 0.5rem;
    }
    
    .help-text {
      display: none;
    }
    
    .shortcuts-modal {
      margin: 0.5rem;
      max-height: calc(100vh - 1rem);
    }
    
    .shortcuts-header {
      padding: 1rem;
    }
    
    .shortcuts-content {
      padding: 1rem;
    }
    
    .shortcuts-footer {
      padding: 0.75rem 1rem;
    }
    
    .shortcuts-list {
      gap: 0.5rem;
    }
    
    .shortcut-item {
      gap: 0.75rem;
      padding: 0.375rem 0;
    }
    
    .shortcut-key {
      min-width: 2.5rem;
      font-size: 0.7rem;
    }
    
    .shortcut-description {
      font-size: 0.8rem;
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .unsaved-dot {
      animation: none;
      opacity: 1;
    }
    
    .help-button,
    .close-button {
      transition: none;
    }
  }
</style>