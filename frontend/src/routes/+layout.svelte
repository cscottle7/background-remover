<!--
  Main layout for CharacterCut application
  Implements dark theme and layout structure for Chloe's developer experience
-->

<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { appActions } from '$lib/stores/appState';
  
  // Ensure dark theme is applied
  onMount(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
  });
</script>

<svelte:head>
  <title>CharacterCut - AI-Powered Background Removal for Developers</title>
  <meta name="description" content="Transform your character assets with one-click magic. Remove backgrounds instantly for AI-generated characters." />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Preload fonts for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  
  <!-- Favicons and meta -->
  <meta name="theme-color" content="#0f0f0f" />
  <meta name="robots" content="index, follow" />
</svelte:head>

<div class="app min-h-screen bg-dark-bg">
  
  <!-- Header -->
  <header class="border-b border-dark-border bg-dark-surface/50 backdrop-blur-sm sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        
        <!-- Logo and brand -->
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-magic-400 to-magic-600 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-semibold text-magic-gradient">CharacterCut</h1>
            <p class="text-xs text-dark-text-secondary">R&D Initiative</p>
          </div>
        </div>
        
        <!-- Status indicator (for development) -->
        <div class="hidden sm:flex items-center space-x-2 text-sm text-dark-text-secondary">
          <div class="w-2 h-2 rounded-full bg-green-400"></div>
          <span>System Online</span>
        </div>
        
      </div>
    </div>
  </header>
  
  <!-- Main content -->
  <main class="flex-1">
    <slot />
  </main>
  
  <!-- Footer -->
  <footer class="border-t border-dark-border bg-dark-surface/30 mt-auto">
    <div class="container mx-auto px-4 py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        
        <div class="text-sm text-dark-text-muted">
          <p>&copy; 2025 CharacterCut. Research & Development Initiative.</p>
        </div>
        
        <div class="flex items-center space-x-6 text-sm text-dark-text-secondary">
          <a href="/privacy" class="hover:text-magic-400 transition-colors">Privacy Policy</a>
          <a href="/terms" class="hover:text-magic-400 transition-colors">Terms</a>
          <div class="flex items-center space-x-1">
            <span>Made for</span>
            <span class="text-magic-400 font-medium">Australian Developers</span>
          </div>
        </div>
        
      </div>
    </div>
  </footer>
  
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  /* Container utility matching the design system */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  @media (min-width: 640px) {
    .container {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
  }
</style>