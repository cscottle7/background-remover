<!--
  Refinement Controls Component
  Brush size, sensitivity, and other tool settings
  Mobile-first responsive design with touch-optimized sliders
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { refinementState, refinementActions, refinementTools } from '$lib/stores/refinementState';
  
  const dispatch = createEventDispatcher();
  
  // Reactive state from store
  $: currentState = $refinementState;
  $: toolConfig = $refinementTools;
  $: brushSize = currentState.brushSize;
  $: backgroundSensitivity = currentState.backgroundSensitivity;
  $: edgeRefinement = currentState.edgeRefinement;
  $: backgroundTolerance = currentState.backgroundTolerance;
  $: controlsCollapsed = currentState.controlsCollapsed;
  
  function handleBrushSizeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newSize = parseInt(target.value);
    refinementActions.setBrushSize(newSize);
    dispatch('settingsChanged', { brushSize: newSize });
  }
  
  function handleBackgroundSensitivityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newSensitivity = parseInt(target.value);
    refinementActions.setBackgroundSensitivity(newSensitivity);
    dispatch('settingsChanged', { backgroundSensitivity: newSensitivity });
  }
  
  function handleEdgeRefinementChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newRefinement = parseInt(target.value);
    refinementActions.setEdgeRefinement(newRefinement);
    dispatch('settingsChanged', { edgeRefinement: newRefinement });
  }
  
  function handleBackgroundToleranceChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newTolerance = parseInt(target.value);
    refinementActions.setBackgroundTolerance(newTolerance);
    dispatch('settingsChanged', { backgroundTolerance: newTolerance });
  }
  
</script>

<div class="controls-container">
  <!-- Controls header -->
  <div class="controls-header">
    <h3 class="controls-title">Settings</h3>
  </div>
  
  <!-- Controls content -->
  <div class="controls-content">
    
    <!-- Brush Size Control -->
    <div class="control-group">
      <div class="control-header">
        <label for="brush-size" class="control-label">Brush Size</label>
        <span class="control-value">{brushSize}px</span>
      </div>
      
      <div class="slider-container">
        <input
          id="brush-size"
          type="range"
          min="1"
          max="100"
          step="1"
          value={brushSize}
          on:input={handleBrushSizeChange}
          class="slider"
        />
      </div>
      
    </div>
    
    <!-- Background Sensitivity (for background tools) -->
    {#if toolConfig.needsBackgroundSensitivity}
      <div class="control-group">
        <div class="control-header">
          <label for="bg-sensitivity" class="control-label">Background Sensitivity</label>
          <span class="control-value">{backgroundSensitivity}%</span>
        </div>
        
        <div class="slider-container">
          <input
            id="bg-sensitivity"
            type="range"
            min="0"
            max="100"
            step="1"
            value={backgroundSensitivity}
            on:input={handleBackgroundSensitivityChange}
            class="slider"
          />
        </div>
        
        <div class="control-description">
          Higher values detect more similar colors
        </div>
      </div>
    {/if}
    
    <!-- Edge Refinement (for edge refine tool) -->
    {#if toolConfig.needsEdgeRefinement}
      <div class="control-group">
        <div class="control-header">
          <label for="edge-refinement" class="control-label">Edge Refinement</label>
          <span class="control-value">{edgeRefinement}%</span>
        </div>
        
        <div class="slider-container">
          <input
            id="edge-refinement"
            type="range"
            min="0"
            max="100"
            step="1"
            value={edgeRefinement}
            on:input={handleEdgeRefinementChange}
            class="slider"
          />
        </div>
        
        <div class="control-description">
          Higher values create smoother edges
        </div>
      </div>
    {/if}
    
    <!-- Background Tolerance (for all background tools) -->
    {#if toolConfig.needsBackgroundSensitivity}
      <div class="control-group">
        <div class="control-header">
          <label for="bg-tolerance" class="control-label">Background Tolerance</label>
          <span class="control-value">{backgroundTolerance}%</span>
        </div>
        
        <div class="slider-container">
          <input
            id="bg-tolerance"
            type="range"
            min="1"
            max="50"
            step="1"
            value={backgroundTolerance}
            on:input={handleBackgroundToleranceChange}
            class="slider"
          />
        </div>
        
        <div class="control-description">
          Tolerance for background color variation
        </div>
      </div>
    {/if}
    
    <!-- Performance Toggle -->
    <div class="control-group">
      <div class="control-header">
        <span class="control-label">Performance Mode</span>
      </div>
      
      <label class="toggle-container">
        <input
          type="checkbox"
          checked={currentState.performanceMode}
          on:change={(e) => {
            refinementActions.setPerformanceMode(e.target.checked);
            dispatch('settingsChanged', { performanceMode: e.target.checked });
          }}
          class="toggle-input"
        />
        <span class="toggle-slider"></span>
        <span class="toggle-label">
          {currentState.performanceMode ? 'Enabled' : 'Disabled'}
        </span>
      </label>
      
      <div class="control-description">
        Reduces quality for better performance on slower devices
      </div>
    </div>
    
  </div>
</div>

<style>
  .controls-container {
    background: var(--color-dark-surface);
    border-radius: 8px;
    overflow: visible; /* Allow content to be fully visible */
  }
  
  /* Desktop optimization */
  @media (min-width: 768px) {
    .controls-container {
      background: transparent;
      border-radius: 0;
    }
    
    .controls-header {
      background: var(--color-dark-surface);
      border-bottom: 1px solid var(--color-dark-border);
      border-radius: 0;
      padding: 1.25rem 1.5rem;
    }
    
    .controls-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-magic-400);
    }
    
    .controls-content {
      background: var(--color-dark-surface);
      padding: 1.5rem;
      gap: 2rem;
    }
    
    .control-group {
      padding: 1rem;
      background: var(--color-dark-bg);
      border-radius: 8px;
      border: 1px solid var(--color-dark-border);
      gap: 1rem;
    }
    
    .control-label {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--color-dark-text);
    }
    
    .control-description {
      font-size: 0.85rem;
      color: var(--color-dark-text-secondary);
      margin-top: 0.5rem;
      line-height: 1.4;
    }
    
    .control-slider {
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(to right, var(--color-magic-400), var(--color-magic-600));
    }
    
    .control-slider::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      border: 2px solid var(--color-magic-400);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    .control-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      border: 2px solid var(--color-magic-400);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    .preset-buttons {
      gap: 0.5rem;
    }
    
    .preset-button {
      padding: 0.6rem 1rem;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 6px;
      border: 2px solid var(--color-dark-border);
      background: var(--color-dark-bg);
      transition: all 0.2s ease;
    }
    
    .preset-button:hover {
      border-color: var(--color-magic-400);
      background: var(--color-dark-hover);
    }
    
    .preset-button.active {
      background: var(--color-magic-400);
      border-color: var(--color-magic-400);
      color: white;
    }
    
    .performance-toggle {
      padding: 1rem;
      background: var(--color-dark-hover);
      border-radius: 8px;
      border: 1px solid var(--color-dark-border);
    }
    
    .toggle-label-text {
      font-weight: 600;
      color: var(--color-dark-text);
    }
    
    .toggle-slider {
      width: 48px;
      height: 26px;
      border-radius: 13px;
      background: var(--color-dark-border);
      transition: all 0.3s ease;
    }
    
    .toggle-input:checked + .toggle-slider {
      background: var(--color-magic-400);
    }
    
    .toggle-slider::before {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }
    
    .toggle-input:checked + .toggle-slider::before {
      transform: translateX(22px);
    }
  }
  
  /* Large desktop enhancements */
  @media (min-width: 1024px) {
    .controls-content {
      padding: 2rem;
      gap: 2.5rem;
    }
    
    .control-group {
      padding: 1.5rem;
    }
  }
  
  .controls-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-dark-border);
    background: var(--color-dark-bg);
  }
  
  .controls-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-dark-text);
    margin: 0;
  }
  
  .controls-content {
    padding: 1rem 1rem 2rem 1rem; /* Extra bottom padding to prevent cutoff */
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .control-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-dark-text);
  }
  
  .control-value {
    font-size: 0.875rem;
    color: var(--color-magic-400);
    font-weight: 600;
    font-family: monospace;
  }
  
  .slider-container {
    position: relative;
  }
  
  .slider {
    width: 100%;
    height: 6px;
    background: var(--color-dark-border);
    outline: none;
    border-radius: 3px;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: var(--color-magic-400);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: var(--color-magic-500);
    transform: scale(1.1);
  }
  
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: var(--color-magic-400);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .slider::-moz-range-thumb:hover {
    background: var(--color-magic-500);
    transform: scale(1.1);
  }
  
  .preset-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .preset-btn {
    padding: 0.375rem 0.75rem;
    background: var(--color-dark-bg);
    border: 1px solid var(--color-dark-border);
    border-radius: 4px;
    color: var(--color-dark-text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 32px;
  }
  
  .preset-btn:hover {
    background: var(--color-dark-hover);
    border-color: var(--color-magic-400);
    color: var(--color-dark-text);
  }
  
  .preset-btn.active {
    background: var(--color-magic-400);
    border-color: var(--color-magic-400);
    color: white;
  }
  
  .control-description {
    font-size: 0.75rem;
    color: var(--color-dark-text-muted);
    line-height: 1.3;
    font-style: italic;
  }
  
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }
  
  .toggle-input {
    display: none;
  }
  
  .toggle-slider {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--color-dark-border);
    border-radius: 12px;
    transition: all 0.3s ease;
  }
  
  .toggle-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .toggle-input:checked + .toggle-slider {
    background: var(--color-magic-400);
  }
  
  .toggle-input:checked + .toggle-slider::before {
    transform: translateX(20px);
  }
  
  .toggle-label {
    font-size: 0.875rem;
    color: var(--color-dark-text-secondary);
  }
  
  .toggle-input:checked ~ .toggle-label {
    color: var(--color-magic-400);
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .controls-content {
      padding: 0.75rem;
      gap: 1.25rem;
    }
    
    .control-group {
      gap: 0.5rem;
    }
    
    .slider::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
    }
    
    .slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
    }
    
    .preset-buttons {
      gap: 0.375rem;
    }
    
    .preset-btn {
      padding: 0.5rem 0.625rem;
      min-width: 36px;
    }
  }
  
  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .slider::-webkit-slider-thumb {
      width: 28px;
      height: 28px;
    }
    
    .slider::-moz-range-thumb {
      width: 28px;
      height: 28px;
    }
    
    .preset-btn {
      min-height: 44px;
      min-width: 44px;
    }
    
    .toggle-slider {
      width: 52px;
      height: 28px;
      border-radius: 14px;
    }
    
    .toggle-slider::before {
      width: 24px;
      height: 24px;
      top: 2px;
      left: 2px;
    }
    
    .toggle-input:checked + .toggle-slider::before {
      transform: translateX(24px);
    }
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .slider::-webkit-slider-thumb,
    .slider::-moz-range-thumb,
    .toggle-slider,
    .toggle-slider::before,
    .preset-btn {
      transition: none;
    }
    
    .slider::-webkit-slider-thumb:hover,
    .slider::-moz-range-thumb:hover {
      transform: none;
    }
  }
</style>