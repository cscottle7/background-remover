<!--
  Analytics Dashboard Component
  For monitoring Phase 5 success metrics and KPIs
  Internal-facing component for development/admin use
-->

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { analyticsService } from '../services/analytics';
  
  export let visible: boolean = false;
  export let isDevMode: boolean = false;
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  // Dashboard state
  let sessionMetrics = analyticsService.metrics;
  let refreshInterval: ReturnType<typeof setInterval>;
  
  // KPI Targets (from Phase 5 requirements)
  const kpiTargets = {
    uniqueActiveUsers: 250,
    taskCompletionRate: 95, // percentage
    sessionContinuityRate: 15, // percentage of sessions with 2+ images
    avgProcessingTime: 5, // seconds
    npsScore: 0, // positive score target
    feedbackSubmissions: 15
  };
  
  // Mock analytics data (in real implementation, this would come from API)
  let analyticsData = {
    uniqueActiveUsers: 0,
    totalSessions: 0,
    totalImages: 0,
    successfulProcessings: 0,
    failedProcessings: 0,
    avgProcessingTime: 0,
    under5SecondRate: 0,
    sessionContinuityCount: 0,
    npsResponses: [],
    feedbackSubmissions: 0,
    topReferrers: [] as Array<{source: string, count: number}>,
    errorCategories: {} as Record<string, number>,
    hourlyMetrics: []
  };
  
  // Computed metrics
  $: taskCompletionRate = analyticsData.totalImages > 0 
    ? (analyticsData.successfulProcessings / analyticsData.totalImages) * 100 
    : 0;
    
  $: sessionContinuityRate = analyticsData.totalSessions > 0
    ? (analyticsData.sessionContinuityCount / analyticsData.totalSessions) * 100
    : 0;
    
  $: averageNPS = analyticsData.npsResponses.length > 0
    ? analyticsData.npsResponses.reduce((sum, score) => sum + score, 0) / analyticsData.npsResponses.length
    : 0;
  
  onMount(() => {
    if (visible && isDevMode) {
      // Refresh metrics every 5 seconds in dev mode
      refreshInterval = setInterval(() => {
        sessionMetrics = analyticsService.metrics;
        // In real implementation, fetch latest analytics data from API
      }, 5000);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });
  
  function getStatusColor(current: number, target: number, isPercentage: boolean = false): string {
    const percentage = isPercentage ? current : (current / target) * 100;
    
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-red-400';
  }
  
  function getProgressWidth(current: number, target: number): number {
    return Math.min((current / target) * 100, 100);
  }
  
  // Export analytics data (for development)
  function exportAnalytics() {
    const exportData = {
      timestamp: new Date().toISOString(),
      sessionMetrics,
      analyticsData,
      kpiTargets
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `charactercut-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if visible && isDevMode}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    
    <div class="analytics-dashboard bg-dark-elevated border border-magic-400/20 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-magic-gradient mb-2">
              CharacterCut Analytics Dashboard
            </h2>
            <p class="text-sm text-dark-text-secondary">
              Phase 5 Success Metrics Tracking • Dev Mode
            </p>
          </div>
          
          <div class="flex items-center space-x-3">
            <button
              on:click={exportAnalytics}
              class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white px-4 py-2 rounded text-sm"
            >
              Export Data
            </button>
            <button
              on:click={() => dispatch('close')}
              class="text-dark-text-muted hover:text-dark-text p-2 rounded transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Current Session Metrics -->
      <div class="p-6 border-b border-gray-700">
        <h3 class="text-lg font-semibold text-dark-text mb-4">Current Session</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div class="metric-card bg-dark-base/50 rounded-lg p-4">
            <div class="text-2xl font-bold text-magic-400">
              {sessionMetrics.images_processed}
            </div>
            <div class="text-sm text-dark-text-muted">Images Processed</div>
          </div>
          
          <div class="metric-card bg-dark-base/50 rounded-lg p-4">
            <div class="text-2xl font-bold {sessionMetrics.meets_continuity_target ? 'text-green-400' : 'text-yellow-400'}">
              {sessionMetrics.meets_continuity_target ? '✅' : '⏳'}
            </div>
            <div class="text-sm text-dark-text-muted">Continuity Target</div>
          </div>
          
          <div class="metric-card bg-dark-base/50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-400">
              {Math.round(sessionMetrics.session_duration / 1000)}s
            </div>
            <div class="text-sm text-dark-text-muted">Session Duration</div>
          </div>
          
          <div class="metric-card bg-dark-base/50 rounded-lg p-4">
            <div class="text-2xl font-bold {sessionMetrics.failed_attempts === 0 ? 'text-green-400' : 'text-red-400'}">
              {sessionMetrics.successful_completions}/{sessionMetrics.successful_completions + sessionMetrics.failed_attempts}
            </div>
            <div class="text-sm text-dark-text-muted">Success Rate</div>
          </div>
        </div>
      </div>
      
      <!-- KPI Dashboard -->
      <div class="p-6">
        <h3 class="text-lg font-semibold text-dark-text mb-6">Phase 5 KPIs Progress</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Unique Active Users -->
          <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-dark-text">Unique Active Users</h4>
              <span class="{getStatusColor(analyticsData.uniqueActiveUsers, kpiTargets.uniqueActiveUsers)} text-sm font-medium">
                {analyticsData.uniqueActiveUsers}/{kpiTargets.uniqueActiveUsers}
              </span>
            </div>
            
            <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2">
              <div 
                class="bg-magic-400 h-2 rounded-full transition-all duration-500"
                style="width: {getProgressWidth(analyticsData.uniqueActiveUsers, kpiTargets.uniqueActiveUsers)}%"
              />
            </div>
            
            <div class="text-xs text-dark-text-muted">
              {((analyticsData.uniqueActiveUsers / kpiTargets.uniqueActiveUsers) * 100).toFixed(1)}% of target
            </div>
          </div>
          
          <!-- Task Completion Rate -->
          <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-dark-text">Task Completion Rate</h4>
              <span class="{getStatusColor(taskCompletionRate, kpiTargets.taskCompletionRate, true)} text-sm font-medium">
                {taskCompletionRate.toFixed(1)}%
              </span>
            </div>
            
            <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2">
              <div 
                class="bg-green-400 h-2 rounded-full transition-all duration-500"
                style="width: {Math.min(taskCompletionRate, 100)}%"
              />
            </div>
            
            <div class="text-xs text-dark-text-muted">
              Target: {kpiTargets.taskCompletionRate}%
            </div>
          </div>
          
          <!-- Average Processing Time -->
          <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-dark-text">Avg Processing Time</h4>
              <span class="{analyticsData.avgProcessingTime <= kpiTargets.avgProcessingTime ? 'text-green-400' : 'text-red-400'} text-sm font-medium">
                {analyticsData.avgProcessingTime.toFixed(2)}s
              </span>
            </div>
            
            <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2">
              <div 
                class="bg-blue-400 h-2 rounded-full transition-all duration-500"
                style="width: {Math.min((kpiTargets.avgProcessingTime / Math.max(analyticsData.avgProcessingTime, kpiTargets.avgProcessingTime)) * 100, 100)}%"
              />
            </div>
            
            <div class="text-xs text-dark-text-muted">
              Target: &lt;{kpiTargets.avgProcessingTime}s • {analyticsData.under5SecondRate.toFixed(1)}% under 5s
            </div>
          </div>
          
          <!-- Session Continuity -->
          <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-dark-text">Session Continuity</h4>
              <span class="{getStatusColor(sessionContinuityRate, kpiTargets.sessionContinuityRate, true)} text-sm font-medium">
                {sessionContinuityRate.toFixed(1)}%
              </span>
            </div>
            
            <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2">
              <div 
                class="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                style="width: {Math.min(sessionContinuityRate, 100)}%"
              />
            </div>
            
            <div class="text-xs text-dark-text-muted">
              {analyticsData.sessionContinuityCount} sessions with 2+ images
            </div>
          </div>
          
          <!-- NPS Score -->
          <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-dark-text">NPS Score</h4>
              <span class="{averageNPS >= 0 ? 'text-green-400' : 'text-red-400'} text-sm font-medium">
                {averageNPS > 0 ? '+' : ''}{averageNPS.toFixed(1)}
              </span>
            </div>
            
            <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2">
              <div 
                class="bg-purple-400 h-2 rounded-full transition-all duration-500"
                style="width: {((averageNPS + 10) / 20) * 100}%"
              />
            </div>
            
            <div class="text-xs text-dark-text-muted">
              {analyticsData.npsResponses.length} responses • Target: positive
            </div>
          </div>
          
          <!-- Feedback Submissions -->
          <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-dark-text">Feedback Submissions</h4>
              <span class="{getStatusColor(analyticsData.feedbackSubmissions, kpiTargets.feedbackSubmissions)} text-sm font-medium">
                {analyticsData.feedbackSubmissions}/{kpiTargets.feedbackSubmissions}
              </span>
            </div>
            
            <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2">
              <div 
                class="bg-orange-400 h-2 rounded-full transition-all duration-500"
                style="width: {getProgressWidth(analyticsData.feedbackSubmissions, kpiTargets.feedbackSubmissions)}%"
              />
            </div>
            
            <div class="text-xs text-dark-text-muted">
              Detailed qualitative feedback
            </div>
          </div>
          
        </div>
        
        <!-- Additional Insights -->
        <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Top Referrers -->
          <div class="insights-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <h4 class="font-medium text-dark-text mb-4">Top Referrers</h4>
            <div class="space-y-2">
              {#each analyticsData.topReferrers.slice(0, 5) as referrer}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-dark-text-secondary">{referrer.source}</span>
                  <span class="text-magic-400">{referrer.count}</span>
                </div>
              {:else}
                <div class="text-sm text-dark-text-muted">No referrer data available</div>
              {/each}
            </div>
          </div>
          
          <!-- Error Categories -->
          <div class="insights-card bg-dark-base/30 rounded-lg p-6 border border-gray-700">
            <h4 class="font-medium text-dark-text mb-4">Error Categories</h4>
            <div class="space-y-2">
              {#each Object.entries(analyticsData.errorCategories).slice(0, 5) as [category, count]}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-dark-text-secondary">{category}</span>
                  <span class="text-red-400">{count}</span>
                </div>
              {:else}
                <div class="text-sm text-dark-text-muted">No error data (good!)</div>
              {/each}
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
    
  </div>
{/if}

<style>
  .analytics-dashboard {
    backdrop-filter: blur(10px);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  .metric-card,
  .kpi-card,
  .insights-card {
    transition: all 0.2s ease;
  }
  
  .metric-card:hover,
  .kpi-card:hover,
  .insights-card:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 255, 136, 0.3);
  }
  
  .progress-bar {
    overflow: hidden;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .analytics-dashboard {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
    
    .grid.grid-cols-2.md\\:grid-cols-4 {
      grid-template-columns: 1fr 1fr;
    }
    
    .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
      grid-template-columns: 1fr;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .metric-card,
    .kpi-card,
    .insights-card {
      transition: none;
    }
    
    .metric-card:hover,
    .kpi-card:hover,
    .insights-card:hover {
      transform: none;
    }
    
    .progress-bar div {
      transition: none;
    }
  }
</style>