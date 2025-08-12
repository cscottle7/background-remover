<!--
  Model Selector Component
  Allows users to choose different AI models for background removal
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let selectedModel: string = 'isnet-general-use';
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher<{
    modelChange: { model: string };
  }>();
  
  const models = [
    {
      id: 'isnet-general-use',
      name: 'Balanced',
      description: 'Best overall quality for most images'
    },
    {
      id: 'u2net',
      name: 'Conservative',
      description: 'Less aggressive, keeps more details'
    },
    {
      id: 'birefnet-general',
      name: 'Precise',
      description: 'Better edge detection for complex subjects'
    },
    {
      id: 'sam',
      name: 'Advanced',
      description: 'Segment Anything Model for challenging cases'
    }
  ];
  
  function handleModelChange(model: string) {
    selectedModel = model;
    dispatch('modelChange', { model });
  }
</script>

<div class="model-selector">
  <label class="block text-sm font-medium text-dark-text-primary mb-2">
    Background Removal Mode
  </label>
  
  <div class="grid grid-cols-2 gap-2">
    {#each models as model}
      <button
        type="button"
        class="model-option {selectedModel === model.id ? 'selected' : ''}"
        class:disabled
        on:click={() => handleModelChange(model.id)}
        {disabled}
      >
        <div class="model-name">{model.name}</div>
        <div class="model-description">{model.description}</div>
      </button>
    {/each}
  </div>
</div>

<style>
  .model-selector {
    margin-bottom: 1rem;
  }
  
  .model-option {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 0.5rem;
    transition: all 0.2s;
  }
  
  .model-option:hover {
    border-color: rgba(0, 255, 136, 0.4);
    background-color: rgba(0, 255, 136, 0.05);
  }
  
  .model-option:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.5);
  }
  
  .model-option.selected {
    border-color: rgba(0, 255, 136, 1);
    background-color: rgba(0, 255, 136, 0.1);
  }
  
  .model-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .model-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--dark-text-primary);
  }
  
  .model-description {
    font-size: 0.75rem;
    color: var(--dark-text-secondary);
    margin-top: 0.25rem;
  }
  
  .model-option.selected .model-name {
    color: rgba(0, 255, 136, 1);
  }
</style>