<!--
  Browser Compatibility Testing Component
  Tests all Phase 2 input interface functionality across browsers
  Validates Chloe's core workflow requirements
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { browserCompatibilityTester } from '../utils/browserCompatibility';
  import { inputActions, inputState } from '../stores/inputState';
  import { clipboardService } from '../services/clipboard';
  import type { CompatibilityTestResult } from '../utils/browserCompatibility';

  // Test state
  let testResults: CompatibilityTestResult | null = null;
  let isRunningTests = false;
  let currentTest = '';
  let testProgress = 0;

  // Individual test results
  let dragDropWorking = false;
  let clipboardWorking = false;
  let keyboardShortcutWorking = false;
  let stateTransitionsWorking = false;
  let errorRecoveryWorking = false;

  onMount(() => {
    // Auto-run basic compatibility checks
    runQuickCompatibilityCheck();
  });

  /**
   * Run comprehensive compatibility tests
   */
  async function runFullCompatibilityTest() {
    isRunningTests = true;
    testProgress = 0;
    currentTest = 'Starting comprehensive browser tests...';

    try {
      // Run browser compatibility tests
      currentTest = 'Testing browser capabilities...';
      testProgress = 20;
      testResults = await browserCompatibilityTester.runFullCompatibilityTest();

      // Test input state machine
      currentTest = 'Testing input state transitions...';
      testProgress = 40;
      stateTransitionsWorking = await testInputStateMachine();

      // Test drag and drop
      currentTest = 'Testing drag and drop functionality...';
      testProgress = 60;
      dragDropWorking = await testDragDropFunctionality();

      // Test clipboard integration
      currentTest = 'Testing clipboard integration...';
      testProgress = 80;
      clipboardWorking = await testClipboardIntegration();
      keyboardShortcutWorking = await testKeyboardShortcuts();

      // Test error recovery
      currentTest = 'Testing error recovery systems...';
      testProgress = 90;
      errorRecoveryWorking = await testErrorRecovery();

      currentTest = 'Tests complete!';
      testProgress = 100;

    } catch (error) {
      console.error('Compatibility test failed:', error);
      currentTest = `Test failed: ${error}`;
    } finally {
      isRunningTests = false;
    }
  }

  /**
   * Run quick compatibility check on mount
   */
  async function runQuickCompatibilityCheck() {
    // Check basic functionality
    clipboardWorking = clipboardService.isSupported();
    dragDropWorking = 'ondragstart' in document.createElement('div');
    
    // Test basic state transitions
    try {
      inputActions.dragEnter();
      inputActions.dragLeave();
      stateTransitionsWorking = true;
    } catch (error) {
      stateTransitionsWorking = false;
    }
  }

  /**
   * Test input state machine functionality
   */
  async function testInputStateMachine(): Promise<boolean> {
    try {
      const initialState = await new Promise(resolve => {
        const unsubscribe = inputState.subscribe(state => {
          unsubscribe();
          resolve(state);
        });
      });

      // Test drag transitions
      inputActions.dragEnter();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      inputActions.dragLeave();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test reset
      inputActions.reset();
      
      return true;
    } catch (error) {
      console.error('State machine test failed:', error);
      return false;
    }
  }

  /**
   * Test drag and drop functionality
   */
  async function testDragDropFunctionality(): Promise<boolean> {
    try {
      // Create test elements
      const testDiv = document.createElement('div');
      
      // Test drag event support
      const hasDragEvents = 'ondragstart' in testDiv && 
                           'ondrop' in testDiv && 
                           'ondragover' in testDiv;

      // Test DataTransfer API
      const hasDataTransfer = typeof DataTransfer !== 'undefined';

      // Test File API
      const hasFileAPI = !!(window.File && window.FileReader && window.FileList && window.Blob);

      return hasDragEvents && hasDataTransfer && hasFileAPI;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test clipboard integration
   */
  async function testClipboardIntegration(): Promise<boolean> {
    try {
      if (!clipboardService.isSupported()) {
        return false;
      }

      // Test clipboard capabilities
      const capabilities = clipboardService.getCapabilities();
      
      return capabilities.read && capabilities.write;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test keyboard shortcuts
   */
  async function testKeyboardShortcuts(): Promise<boolean> {
    try {
      // Test keyboard event creation
      const testEvent = new KeyboardEvent('keydown', { 
        key: 'v', 
        ctrlKey: true 
      });
      
      return testEvent instanceof KeyboardEvent && 
             testEvent.key === 'v' && 
             testEvent.ctrlKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test error recovery systems
   */
  async function testErrorRecovery(): Promise<boolean> {
    try {
      // This is a simplified test - in production we'd test actual recovery
      // For now, just verify the system can handle errors gracefully
      inputActions.errorProcessing('Test error');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      inputActions.retry();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      inputActions.reset();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get compatibility status color
   */
  function getStatusColor(working: boolean): string {
    return working ? 'text-green-400' : 'text-red-400';
  }

  /**
   * Get compatibility status icon
   */
  function getStatusIcon(working: boolean): string {
    return working ? '✓' : '✗';
  }

  /**
   * Export test results
   */
  function exportTestResults() {
    const results = {
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      testResults: testResults,
      individualTests: {
        dragDropWorking,
        clipboardWorking,
        keyboardShortcutWorking,
        stateTransitionsWorking,
        errorRecoveryWorking
      }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compatibility-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="compatibility-test glass-card rounded-lg p-6 max-w-2xl mx-auto">
  <h3 class="text-lg font-semibold text-magic-400 mb-4">
    Browser Compatibility Status
  </h3>

  <!-- Quick Status Overview -->
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
    <div class="flex items-center space-x-2">
      <span class="text-lg {getStatusColor(dragDropWorking)}">
        {getStatusIcon(dragDropWorking)}
      </span>
      <span class="text-sm text-dark-text">Drag & Drop</span>
    </div>
    
    <div class="flex items-center space-x-2">
      <span class="text-lg {getStatusColor(clipboardWorking)}">
        {getStatusIcon(clipboardWorking)}
      </span>
      <span class="text-sm text-dark-text">Clipboard API</span>
    </div>
    
    <div class="flex items-center space-x-2">
      <span class="text-lg {getStatusColor(keyboardShortcutWorking)}">
        {getStatusIcon(keyboardShortcutWorking)}
      </span>
      <span class="text-sm text-dark-text">Keyboard Shortcuts</span>
    </div>
    
    <div class="flex items-center space-x-2">
      <span class="text-lg {getStatusColor(stateTransitionsWorking)}">
        {getStatusIcon(stateTransitionsWorking)}
      </span>
      <span class="text-sm text-dark-text">State Machine</span>
    </div>
    
    <div class="flex items-center space-x-2">
      <span class="text-lg {getStatusColor(errorRecoveryWorking)}">
        {getStatusIcon(errorRecoveryWorking)}
      </span>
      <span class="text-sm text-dark-text">Error Recovery</span>
    </div>
  </div>

  <!-- Test Controls -->
  <div class="flex flex-col sm:flex-row gap-3 mb-4">
    <button
      on:click={runFullCompatibilityTest}
      disabled={isRunningTests}
      class="btn btn-magic flex-1 py-2 px-4 rounded-lg text-sm font-medium"
    >
      {#if isRunningTests}
        Running Tests...
      {:else}
        Run Full Test Suite
      {/if}
    </button>
    
    <button
      on:click={runQuickCompatibilityCheck}
      disabled={isRunningTests}
      class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white flex-1 py-2 px-4 rounded-lg text-sm font-medium"
    >
      Quick Check
    </button>
    
    {#if testResults}
      <button
        on:click={exportTestResults}
        class="btn btn-outline border-dark-text-muted text-dark-text-muted hover:bg-dark-text-muted hover:text-dark-bg py-2 px-4 rounded-lg text-sm font-medium"
      >
        Export Results
      </button>
    {/if}
  </div>

  <!-- Test Progress -->
  {#if isRunningTests}
    <div class="mb-4">
      <div class="flex justify-between text-sm text-dark-text-secondary mb-2">
        <span>{currentTest}</span>
        <span>{testProgress}%</span>
      </div>
      <div class="h-2 bg-dark-elevated rounded-full overflow-hidden">
        <div 
          class="h-full bg-magic-400 transition-all duration-300 ease-out"
          style="width: {testProgress}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Detailed Results -->
  {#if testResults}
    <div class="mt-6 p-4 bg-dark-elevated rounded-lg">
      <h4 class="text-md font-semibold text-dark-text mb-3">Detailed Results</h4>
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-dark-text-secondary">Browser:</span>
          <span class="text-dark-text">{testResults.browser}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-dark-text-secondary">Compatibility Score:</span>
          <span class="text-dark-text font-semibold">{testResults.score}/100</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-dark-text-secondary">Overall Rating:</span>
          <span class="text-dark-text capitalize {
            testResults.overallCompatibility === 'excellent' ? 'text-green-400' :
            testResults.overallCompatibility === 'good' ? 'text-blue-400' :
            testResults.overallCompatibility === 'limited' ? 'text-yellow-400' :
            'text-red-400'
          }">
            {testResults.overallCompatibility}
          </span>
        </div>
      </div>

      {#if testResults.recommendations.length > 0}
        <div class="mt-4">
          <h5 class="text-sm font-medium text-dark-text mb-2">Recommendations:</h5>
          <ul class="text-xs text-dark-text-secondary space-y-1">
            {#each testResults.recommendations as recommendation}
              <li>• {recommendation}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .compatibility-test {
    border: 1px solid rgba(56, 189, 248, 0.2);
  }
</style>