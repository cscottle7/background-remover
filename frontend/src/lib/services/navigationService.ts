/**
 * Navigation Service - Advanced navigation management for the refinement workflow
 * Handles complex navigation flows, state preservation, and history management
 */

import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { ImageSessionManager } from './imageSessionManager';

export interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  entryPoint: 'main-page' | 'direct-link' | 'refresh' | 'external';
  sessionData: any;
  hasUnsavedChanges: boolean;
  navigationHistory: NavigationHistoryEntry[];
}

export interface NavigationHistoryEntry {
  route: string;
  timestamp: number;
  sessionId?: string;
  metadata?: any;
}

export interface NavigationOptions {
  preserveSession?: boolean;
  replaceHistory?: boolean;
  confirmUnsaved?: boolean;
  beforeNavigate?: () => Promise<boolean>;
  afterNavigate?: () => void;
}

export class NavigationService {
  private state: NavigationState;
  private imageSessionManager: ImageSessionManager;
  private beforeUnloadListener: ((event: BeforeUnloadEvent) => void) | null = null;
  private popstateListener: ((event: PopStateEvent) => void) | null = null;
  
  constructor() {
    this.imageSessionManager = new ImageSessionManager();
    this.state = {
      currentRoute: '',
      previousRoute: null,
      entryPoint: 'main-page',
      sessionData: null,
      hasUnsavedChanges: false,
      navigationHistory: []
    };
    
    this.initializeNavigation();
  }
  
  /**
   * Navigate to the refinement page with image data
   */
  async navigateToRefinement(
    originalImage: string,
    processedImage: string,
    options: NavigationOptions = {}
  ): Promise<void> {
    try {
      // Check for unsaved changes
      if (options.confirmUnsaved && this.state.hasUnsavedChanges) {
        const confirmed = await this.confirmUnsavedChanges();
        if (!confirmed) return;
      }
      
      // Execute before navigate hook
      if (options.beforeNavigate) {
        const shouldContinue = await options.beforeNavigate();
        if (!shouldContinue) return;
      }
      
      // Create session for image data
      const sessionId = await this.imageSessionManager.createSession(
        originalImage,
        processedImage,
        this.getCurrentRoute()
      );
      
      // Update navigation state
      this.updateNavigationState('/refine', 'main-page', { sessionId });
      
      // Navigate to refinement page
      const url = `/refine?session=${sessionId}&source=main`;
      if (options.replaceHistory) {
        await goto(url, { replaceState: true });
      } else {
        await goto(url);
      }
      
      // Execute after navigate hook
      if (options.afterNavigate) {
        options.afterNavigate();
      }
      
    } catch (error) {
      console.error('Navigation to refinement failed:', error);
      throw new Error('Failed to navigate to refinement page');
    }
  }
  
  /**
   * Return from refinement page to main page
   */
  async returnFromRefinement(
    refinedImage?: string,
    options: NavigationOptions = {}
  ): Promise<void> {
    try {
      // Execute before navigate hook
      if (options.beforeNavigate) {
        const shouldContinue = await options.beforeNavigate();
        if (!shouldContinue) return;
      }
      
      const returnUrl = this.state.sessionData?.returnPath || '/';
      
      // Handle refined image result
      if (refinedImage && this.state.sessionData?.sessionId) {
        await this.storeRefinementResult(this.state.sessionData.sessionId, refinedImage);
      }
      
      // Update navigation state
      this.updateNavigationState(returnUrl, 'refinement');
      
      // Navigate back
      if (options.replaceHistory) {
        await goto(returnUrl, { replaceState: true });
      } else {
        await goto(returnUrl);
      }
      
      // Clear unsaved changes flag
      this.setUnsavedChanges(false);
      
      // Execute after navigate hook
      if (options.afterNavigate) {
        options.afterNavigate();
      }
      
    } catch (error) {
      console.error('Return from refinement failed:', error);
      throw new Error('Failed to return from refinement page');
    }
  }
  
  /**
   * Handle browser back/forward navigation
   */
  async handleBrowserNavigation(event: PopStateEvent): Promise<void> {
    const currentPath = window.location.pathname;
    const isLeavingRefinement = this.state.currentRoute.includes('/refine') && !currentPath.includes('/refine');
    
    if (isLeavingRefinement && this.state.hasUnsavedChanges) {
      // Prevent navigation and ask for confirmation
      history.pushState(null, '', this.state.currentRoute);
      
      const confirmed = await this.confirmUnsavedChanges();
      if (confirmed) {
        this.setUnsavedChanges(false);
        history.back();
      }
    } else {
      // Allow normal navigation
      this.updateNavigationState(currentPath, 'browser-navigation');
    }
  }
  
  /**
   * Set unsaved changes state
   */
  setUnsavedChanges(hasChanges: boolean): void {
    this.state.hasUnsavedChanges = hasChanges;
    
    if (hasChanges && !this.beforeUnloadListener) {
      this.addBeforeUnloadListener();
    } else if (!hasChanges && this.beforeUnloadListener) {
      this.removeBeforeUnloadListener();
    }
  }
  
  /**
   * Get current navigation state
   */
  getNavigationState(): NavigationState {
    return { ...this.state };
  }
  
  /**
   * Get navigation history
   */
  getNavigationHistory(): NavigationHistoryEntry[] {
    return [...this.state.navigationHistory];
  }
  
  /**
   * Check if there are refinement results available
   */
  async checkForRefinementResult(): Promise<{
    hasResult: boolean;
    sessionId?: string;
    refinedImage?: string;
    timestamp?: number;
  }> {
    try {
      const resultData = sessionStorage.getItem('refinement_result');
      if (!resultData) {
        return { hasResult: false };
      }
      
      const result = JSON.parse(resultData);
      const { sessionId, refinedImage, timestamp } = result;
      
      // Verify session exists and is valid
      const sessionData = this.imageSessionManager.getSession(sessionId);
      if (!sessionData) {
        sessionStorage.removeItem('refinement_result');
        return { hasResult: false };
      }
      
      return {
        hasResult: true,
        sessionId,
        refinedImage,
        timestamp
      };
      
    } catch (error) {
      console.error('Failed to check refinement result:', error);
      sessionStorage.removeItem('refinement_result');
      return { hasResult: false };
    }
  }
  
  /**
   * Clear refinement result
   */
  clearRefinementResult(): void {
    sessionStorage.removeItem('refinement_result');
  }
  
  /**
   * Initialize deep linking support
   */
  initializeDeepLinking(currentPath: string, searchParams: URLSearchParams): void {
    if (currentPath.includes('/refine')) {
      const sessionId = searchParams.get('session');
      const source = searchParams.get('source');
      
      if (sessionId) {
        const sessionData = this.imageSessionManager.getSession(sessionId);
        this.updateNavigationState(currentPath, source as any || 'direct-link', {
          sessionId,
          sessionData
        });
      } else {
        // Invalid refinement URL, redirect to main page
        goto('/', { replaceState: true });
      }
    } else {
      this.updateNavigationState(currentPath, 'main-page');
    }
  }
  
  /**
   * Cleanup navigation service
   */
  destroy(): void {
    this.removeBeforeUnloadListener();
    this.removePopstateListener();
  }
  
  // Private methods
  
  private initializeNavigation(): void {
    if (!browser) return;
    
    this.addPopstateListener();
    
    // Initialize with current route
    this.state.currentRoute = window.location.pathname;
  }
  
  private updateNavigationState(
    newRoute: string,
    entryPoint: NavigationState['entryPoint'],
    sessionData?: any
  ): void {
    this.state.previousRoute = this.state.currentRoute;
    this.state.currentRoute = newRoute;
    this.state.entryPoint = entryPoint;
    
    if (sessionData) {
      this.state.sessionData = sessionData;
    }
    
    // Add to navigation history
    this.state.navigationHistory.push({
      route: newRoute,
      timestamp: Date.now(),
      sessionId: sessionData?.sessionId,
      metadata: { entryPoint, previousRoute: this.state.previousRoute }
    });
    
    // Keep history limited to last 10 entries
    if (this.state.navigationHistory.length > 10) {
      this.state.navigationHistory = this.state.navigationHistory.slice(-10);
    }
  }
  
  private async confirmUnsavedChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      // Use native confirm for now, could be enhanced with custom modal
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      resolve(confirmed);
    });
  }
  
  private async storeRefinementResult(sessionId: string, refinedImage: string): Promise<void> {
    try {
      // Update session with refined result
      this.imageSessionManager.updateSession(sessionId, {
        processedImage: refinedImage,
        hasRefinedResult: true,
        lastModified: Date.now()
      });
      
      // Store result for main page pickup
      sessionStorage.setItem('refinement_result', JSON.stringify({
        sessionId,
        refinedImage,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Failed to store refinement result:', error);
    }
  }
  
  private getCurrentRoute(): string {
    return browser ? window.location.pathname : '/';
  }
  
  private addBeforeUnloadListener(): void {
    if (!browser || this.beforeUnloadListener) return;
    
    this.beforeUnloadListener = (event: BeforeUnloadEvent) => {
      if (this.state.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', this.beforeUnloadListener);
  }
  
  private removeBeforeUnloadListener(): void {
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }
  }
  
  private addPopstateListener(): void {
    if (!browser || this.popstateListener) return;
    
    this.popstateListener = (event: PopStateEvent) => {
      this.handleBrowserNavigation(event);
    };
    
    window.addEventListener('popstate', this.popstateListener);
  }
  
  private removePopstateListener(): void {
    if (this.popstateListener) {
      window.removeEventListener('popstate', this.popstateListener);
      this.popstateListener = null;
    }
  }
}

// Singleton instance
export const navigationService = new NavigationService();