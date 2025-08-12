<!--
  Refinement Toolbar Component
  Tool selection and configuration interface
  Mobile-first responsive design with touch-optimized controls
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { refinementState, refinementActions } from '$lib/stores/refinementState';
  import ContextualTooltip from './ContextualTooltip.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Reactive state from store
  $: currentState = $refinementState;
  $: currentTool = currentState.currentTool;
  $: controlsCollapsed = currentState.controlsCollapsed;
  
  // Tool definitions
  const tools = [
    {
      id: 'smart-restore',
      name: 'Smart Restore',
      icon: 'restore',
      description: 'Intelligently restore background-removed areas',
      shortcut: 'B'
    },
    {
      id: 'erase',
      name: 'Erase',
      icon: 'erase',
      description: 'Remove unwanted parts of the foreground',
      shortcut: 'E'
    },
    {
      id: 'smart-background-restore',
      name: 'Background Restore',
      icon: 'background-restore',
      description: 'Restore background with color-aware algorithms',
      shortcut: 'R'
    },
    {
      id: 'precision-erase',
      name: 'Precision Erase',
      icon: 'precision',
      description: 'Fine-tuned erasing with edge detection',
      shortcut: 'P'
    },
    {
      id: 'edge-refine',
      name: 'Edge Refine',
      icon: 'edge',
      description: 'Smooth and refine edges with advanced algorithms',
      shortcut: 'G'
    },
    {
      id: 'smart-background-erase',
      name: 'Background Erase',
      icon: 'background-erase',
      description: 'Remove background with intelligent color detection',
      shortcut: 'X'
    }
  ] as const;
  
  function handleToolSelect(toolId: typeof tools[number]['id']) {
    console.log('🔧 Tool selected:', toolId);
    refinementActions.setTool(toolId);
    dispatch('toolChanged', { tool: toolId });
    console.log('📡 Tool change event dispatched');
  }
  
  // Keyboard navigation for tools
  function handleToolKeydown(event: KeyboardEvent, tool: any) {
    const toolIds = tools.map(t => t.id);
    const currentIndex = toolIds.indexOf(tool.id);
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % toolIds.length;
        const nextToolId = toolIds[nextIndex];
        handleToolSelect(nextToolId);
        // Focus the next tool button
        setTimeout(() => {
          document.getElementById(`tool-${nextToolId}`)?.focus();
        }, 0);
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? toolIds.length - 1 : currentIndex - 1;
        const prevToolId = toolIds[prevIndex];
        handleToolSelect(prevToolId);
        // Focus the previous tool button
        setTimeout(() => {
          document.getElementById(`tool-${prevToolId}`)?.focus();
        }, 0);
        break;
        
      case 'Home':
        event.preventDefault();
        const firstToolId = toolIds[0];
        handleToolSelect(firstToolId);
        setTimeout(() => {
          document.getElementById(`tool-${firstToolId}`)?.focus();
        }, 0);
        break;
        
      case 'End':
        event.preventDefault();
        const lastToolId = toolIds[toolIds.length - 1];
        handleToolSelect(lastToolId);
        setTimeout(() => {
          document.getElementById(`tool-${lastToolId}`)?.focus();
        }, 0);
        break;
    }
  }
  
  function getToolIcon(iconType: string) {
    const icons = {
      restore: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      erase: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      'background-restore': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      precision: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
      edge: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4',
      'background-erase': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    };
    return icons[iconType] || icons.restore;
  }
</script>

<div class="toolbar-container glass-card">
  <!-- Mobile header -->
  <div class="toolbar-header">
    <h3 id="toolbar-heading" class="toolbar-title">Tools</h3>
    <button
      on:click={() => refinementActions.toggleControlsCollapsed()}
      class="btn btn-outline border-magic-400/30 text-magic-400 hover:bg-magic-400 hover:text-white p-2 rounded transition-all duration-200"
      class:collapsed={controlsCollapsed}
      title={controlsCollapsed ? 'Expand tools' : 'Collapse tools'}
      aria-label={controlsCollapsed ? 'Expand tools panel' : 'Collapse tools panel'}
      aria-expanded={!controlsCollapsed}
      aria-controls="tool-grid"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>
  </div>
  
  <!-- Tool grid -->
  <div 
    id="tool-grid"
    class="tool-grid" 
    class:collapsed={controlsCollapsed}
    role="radiogroup"
    aria-labelledby="toolbar-heading"
    aria-activedescendant={`tool-${currentTool}`}
  >
    {#each tools as tool}
      <ContextualTooltip 
        content={tool.description}
        title={tool.name}
        shortcut={tool.shortcut}
        contextType="tool"
        position="auto"
        trigger="hover"
        delay={500}
      >
        <button
          id="tool-{tool.id}"
          class="tool-button"
          class:active={currentTool === tool.id}
          on:click={() => handleToolSelect(tool.id)}
          on:keydown={(event) => handleToolKeydown(event, tool)}
          title="{tool.description} ({tool.shortcut})"
          role="radio"
          aria-checked={currentTool === tool.id}
          aria-label="{tool.name}: {tool.description}"
          tabindex={currentTool === tool.id ? "0" : "-1"}
        >
        <div class="tool-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getToolIcon(tool.icon)}/>
          </svg>
        </div>
        <div class="tool-shortcut-badge">{tool.shortcut}</div>
        </button>
      </ContextualTooltip>
    {/each}
  </div>
  
  <!-- Tool description -->
  {#if !controlsCollapsed}
    <div class="tool-description">
      {#each tools as tool}
        {#if currentTool === tool.id}
          <div class="description-content">
            <div class="description-title">{tool.name}</div>
            <div class="description-text">{tool.description}</div>
            <div class="description-shortcut">Press <kbd>{tool.shortcut}</kbd> to select</div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .toolbar-container {
    /* Background and styling handled by glass-card class */
    overflow: visible; /* Allow tooltips to show */
    position: relative;
    z-index: 10; /* Ensure tools appear above other elements */
  }
  
  .toolbar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-dark-border);
    background: var(--color-dark-bg);
  }
  
  .toolbar-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-dark-text);
    margin: 0;
  }
  
  .btn.collapsed {
    transform: rotate(180deg);
  }
  
  .tool-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.25rem;
    padding: 0.5rem;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .tool-grid.collapsed {
    max-height: 0;
    padding: 0 0.5rem;
    opacity: 0;
  }
  
  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--color-dark-bg);
    border: 2px solid var(--color-dark-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    width: 60px;
    height: 60px;
    position: relative;
  }
  
  .tool-button:hover {
    background: var(--color-dark-hover);
    border-color: var(--color-magic-300);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  .tool-button.active {
    background: linear-gradient(135deg, var(--color-magic-400), var(--color-magic-500));
    border-color: var(--color-magic-400);
    color: white;
    box-shadow: 0 4px 20px rgba(30, 64, 175, 0.4);
  }
  
  .tool-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-magic-400);
  }
  
  .tool-button.active .tool-icon {
    color: white;
  }
  
  .tool-shortcut-badge {
    font-size: 0.5rem;
    color: var(--color-dark-text-secondary);
    font-family: monospace;
    font-weight: 600;
    background: var(--color-dark-border);
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
    position: absolute;
    bottom: 2px;
    right: 2px;
    line-height: 1;
  }
  
  .tool-button.active .tool-shortcut-badge {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.2);
  }
  
  .tool-description {
    padding: 1rem;
    border-top: 1px solid var(--color-dark-border);
    background: var(--color-dark-bg);
  }
  
  .description-content {
    text-align: center;
  }
  
  .description-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-magic-400);
    margin-bottom: 0.5rem;
  }
  
  .description-text {
    font-size: 0.8rem;
    color: var(--color-dark-text-secondary);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  
  .description-shortcut {
    font-size: 0.75rem;
    color: var(--color-dark-text-muted);
  }
  
  kbd {
    font-family: monospace;
    background: var(--color-dark-border);
    color: var(--color-dark-text);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.75rem;
  }
  
  /* Desktop optimization */
  @media (min-width: 1024px) {
    .toolbar-container {
      background: transparent;
      border-radius: 0;
    }
    
    .toolbar-header {
      background: var(--color-dark-surface);
      border-bottom: 1px solid var(--color-dark-border);
      border-radius: 0;
      margin: 0;
      padding: 1.25rem 1.5rem;
    }
    
    .toolbar-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-magic-400);
    }
    
    .tool-grid {
      grid-template-columns: 1fr; /* Single column on desktop */
      max-height: none;
      opacity: 1;
      padding: 1rem;
      gap: 0.5rem;
      background: var(--color-dark-surface);
    }
    
    .tool-grid.collapsed {
      max-height: 0;
      opacity: 0;
      padding: 0 1rem;
      overflow: hidden;
    }
    
    .tool-button {
      width: 70px;
      height: 70px;
      padding: 0.75rem;
      gap: 0.25rem;
    }
    
    .tool-icon {
      width: 28px;
      height: 28px;
    }
    
    .tool-shortcut-badge {
      font-size: 0.55rem;
      bottom: 4px;
      right: 4px;
    }
    
    .tool-description {
      background: var(--color-dark-surface);
      border-top: 1px solid var(--color-dark-border);
      border-radius: 0;
      margin: 0;
      padding: 1rem;
    }
    
    .description-content {
      text-align: left;
    }
    
    .description-title {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .description-text {
      font-size: 0.8rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }
    
    .description-shortcut {
      font-size: 0.75rem;
    }
    
    kbd {
      background: var(--color-magic-400);
      color: white;
      padding: 0.15rem 0.3rem;
      border-radius: 3px;
      font-weight: 600;
    }
  }
  
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .tool-button {
      transform: none;
    }
    
    .tool-button:hover {
      transform: none;
    }
    
    .collapse-button {
      transition: none;
    }
    
    .tool-grid {
      transition: none;
    }
  }
  
  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .tool-button {
      min-height: 56px; /* Larger touch targets */
    }
  }
</style>