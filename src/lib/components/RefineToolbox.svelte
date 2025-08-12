<!--
  RefineToolbox - Clean tool selection interface
  Mobile-first responsive design with collapsible sections
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ToolType } from '$lib/services/ToolOperations';
  
  // Props
  export let currentTool: ToolType = 'restore';
  export let brushSize: number = 20;
  export let canUndo: boolean = false;
  export let canRedo: boolean = false;
  export let isCollapsed: boolean = false;

  const dispatch = createEventDispatcher();

  // Tool definitions
  const tools = [
    {
      id: 'restore' as ToolType,
      name: 'Restore',
      icon: '🖌️',
      description: 'Restore background areas'
    },
    {
      id: 'erase' as ToolType,
      name: 'Erase',
      icon: '🧽',
      description: 'Remove unwanted areas'
    },
    {
      id: 'smart-restore' as ToolType,
      name: 'Smart Restore',
      icon: '✨',
      description: 'Intelligent background restoration'
    },
    {
      id: 'smart-erase' as ToolType,
      name: 'Smart Erase',
      icon: '🎯',
      description: 'Intelligent edge removal'
    }
  ];

  function selectTool(toolId: ToolType): void {
    if (toolId !== currentTool) {
      currentTool = toolId;
      dispatch('toolChanged', { tool: toolId });
    }
  }

  function changeBrushSize(newSize: number): void {
    brushSize = Math.max(1, Math.min(100, newSize));
    dispatch('brushSizeChanged', { size: brushSize });
  }

  function toggleCollapse(): void {
    isCollapsed = !isCollapsed;
    dispatch('collapseToggled', { collapsed: isCollapsed });
  }

  function handleUndo(): void {
    if (canUndo) {
      dispatch('undo');
    }
  }

  function handleRedo(): void {
    if (canRedo) {
      dispatch('redo');
    }
  }

  function handleReset(): void {
    dispatch('reset');
  }
</script>

<div class="toolbox" class:collapsed={isCollapsed}>
  <!-- Header with collapse toggle -->
  <div class="toolbox-header">
    <h3 class="toolbox-title">Tools</h3>
    <button 
      class="collapse-btn"
      on:click={toggleCollapse}
      aria-label={isCollapsed ? 'Expand tools' : 'Collapse tools'}
    >
      <span class="collapse-icon" class:rotated={isCollapsed}>
        ▼
      </span>
    </button>
  </div>

  <!-- Tool content -->
  <div class="toolbox-content">
    
    <!-- Primary Tools -->
    <div class="tool-section">
      <h4 class="section-title">Basic Tools</h4>
      <div class="tool-grid">
        {#each tools.filter(t => ['restore', 'erase'].includes(t.id)) as tool}
          <button
            class="tool-btn"
            class:active={currentTool === tool.id}
            on:click={() => selectTool(tool.id)}
            title={tool.description}
          >
            <span class="tool-icon">{tool.icon}</span>
            <span class="tool-name">{tool.name}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Smart Tools -->
    <div class="tool-section">
      <h4 class="section-title">Smart Tools</h4>
      <div class="tool-grid">
        {#each tools.filter(t => ['smart-restore', 'smart-erase'].includes(t.id)) as tool}
          <button
            class="tool-btn"
            class:active={currentTool === tool.id}
            on:click={() => selectTool(tool.id)}
            title={tool.description}
          >
            <span class="tool-icon">{tool.icon}</span>
            <span class="tool-name">{tool.name}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Brush Controls -->
    <div class="tool-section">
      <h4 class="section-title">Brush Settings</h4>
      <div class="brush-controls">
        <div class="brush-size-control">
          <label for="brush-size" class="control-label">
            Size: <span class="size-value">{brushSize}px</span>
          </label>
          <input
            id="brush-size"
            type="range"
            min="1"
            max="100"
            bind:value={brushSize}
            on:input={(e) => changeBrushSize(Number(e.target.value))}
            class="brush-slider"
          />
        </div>
      </div>
    </div>

    <!-- Action Controls -->
    <div class="tool-section">
      <h4 class="section-title">Actions</h4>
      <div class="action-controls">
        <button
          class="action-btn"
          class:disabled={!canUndo}
          on:click={handleUndo}
          disabled={!canUndo}
          title="Undo last action"
        >
          <span class="action-icon">↶</span>
          <span class="action-name">Undo</span>
        </button>
        
        <button
          class="action-btn"
          class:disabled={!canRedo}
          on:click={handleRedo}
          disabled={!canRedo}
          title="Redo last action"
        >
          <span class="action-icon">↷</span>
          <span class="action-name">Redo</span>
        </button>
        
        <button
          class="action-btn reset-btn"
          on:click={handleReset}
          title="Reset to original"
        >
          <span class="action-icon">🔄</span>
          <span class="action-name">Reset</span>
        </button>
      </div>
    </div>

  </div>
</div>

<style>
  .toolbox {
    background: #1e293b; /* Dark theme background */
    border: 1px solid #334155;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .toolbox.collapsed .toolbox-content {
    display: none;
  }

  .toolbox-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f172a; /* Darker header */
    border-bottom: 1px solid #334155;
  }

  .toolbox-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #f8fafc; /* Light text */
  }

  .collapse-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #9ca3af; /* Light gray for dark theme */
    transition: color 0.2s ease;
  }

  .collapse-btn:hover {
    color: #f3f4f6; /* Lighter on hover */
  }

  .collapse-icon {
    display: inline-block;
    transition: transform 0.3s ease;
    font-size: 12px;
  }

  .collapse-icon.rotated {
    transform: rotate(-90deg);
  }

  .toolbox-content {
    padding: 16px;
    transition: opacity 0.3s ease;
  }


  .tool-section {
    margin-bottom: 20px;
  }

  .tool-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #d1d5db; /* Light text for dark theme */
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tool-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .tool-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: #334155; /* Dark tool button background */
    border: 2px solid #475569;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 70px;
    color: #f8fafc; /* Light text */
  }

  .tool-btn:hover {
    background: #475569; /* Lighter on hover */
    border-color: #64748b;
  }

  .tool-btn.active {
    background: #3b82f6; /* Blue active state */
    border-color: #3b82f6;
    color: white;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .tool-btn.active .tool-name {
    color: white;
  }

  .tool-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .tool-name {
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
  }

  .brush-controls {
    padding: 12px;
    background: #0f172a; /* Darker brush controls background */
    border: 1px solid #334155;
    border-radius: 6px;
  }

  .brush-size-control {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: #f8fafc; /* Light text */
  }

  .size-value {
    color: #3b82f6; /* Blue value text */
    font-weight: 600;
  }

  .brush-slider {
    width: 100%;
    height: 4px;
    background: #475569; /* Dark slider track */
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .brush-slider::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    background: #3b82f6; /* Blue thumb */
    border-radius: 50%;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  .brush-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #3b82f6; /* Blue thumb */
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  .action-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 8px;
    background: #334155; /* Dark action button background */
    border: 2px solid #475569;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 60px;
    color: #f8fafc; /* Light text */
  }

  .action-btn:hover:not(.disabled) {
    background: #475569; /* Lighter on hover */
    border-color: #64748b;
  }

  .action-btn.disabled {
    opacity: 0.3; /* More transparent for disabled state */
    cursor: not-allowed;
  }

  .action-btn.reset-btn {
    grid-column: 1 / -1;
    background: #dc3545;
    border-color: #dc3545;
    color: white;
  }

  .action-btn.reset-btn:hover {
    background: #c82333;
    border-color: #bd2130;
  }

  .action-icon {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .action-name {
    font-size: 12px;
    font-weight: 500;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .toolbox {
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    .toolbox-content {
      padding: 12px;
    }

    .tool-grid {
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .tool-btn,
    .action-btn {
      min-height: 60px;
      padding: 8px 6px;
    }

    .tool-icon {
      font-size: 18px;
    }

    .tool-name,
    .action-name {
      font-size: 11px;
    }
  }

  /* Tablet optimizations */
  @media (min-width: 769px) and (max-width: 1024px) {
    .tool-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Desktop optimizations */
  @media (min-width: 1025px) {
    .toolbox {
      min-width: 200px;
    }
    
    .tool-grid {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .tool-btn {
      flex-direction: row;
      justify-content: flex-start;
      text-align: left;
      min-height: 44px;
      padding: 8px 12px;
    }

    .tool-icon {
      margin-right: 8px;
      margin-bottom: 0;
    }

    .action-controls {
      grid-template-columns: 1fr;
    }
  }
</style>