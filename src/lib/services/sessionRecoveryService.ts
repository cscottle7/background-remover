/**
 * Session Recovery Service - Auto-save and recovery for work-in-progress
 * Handles automatic saving and restoration of editing sessions
 */

import { browser } from '$app/environment';

export interface EditingSession {
  sessionId: string;
  originalImage: string;
  processedImage: string;
  currentState: string; // Current canvas state as base64
  editingHistory: EditAction[];
  toolSettings: ToolSettings;
  timestamp: number;
  lastSaved: number;
  version: number;
}

export interface EditAction {
  id: string;
  type: 'brush-stroke' | 'tool-change' | 'setting-change' | 'undo' | 'redo';
  data: any;
  timestamp: number;
  canUndo: boolean;
}

export interface ToolSettings {
  currentTool: string;
  brushSize: number;
  backgroundSensitivity: number;
  edgeRefinement: number;
  backgroundTolerance: number;
  performanceMode: boolean;
}

export interface RecoveryOptions {
  autoSaveInterval?: number; // milliseconds
  maxHistorySize?: number;
  maxSessionAge?: number; // milliseconds
  compressionEnabled?: boolean;
}

export class SessionRecoveryService {
  private sessions = new Map<string, EditingSession>();
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private options: Required<RecoveryOptions>;
  private readonly STORAGE_PREFIX = 'editing_session_';
  private readonly RECOVERY_KEY = 'recovery_sessions';
  
  constructor(options: RecoveryOptions = {}) {
    this.options = {
      autoSaveInterval: 10000, // 10 seconds
      maxHistorySize: 50,
      maxSessionAge: 1000 * 60 * 60 * 24, // 24 hours
      compressionEnabled: true,
      ...options
    };
    
    this.initializeService();
  }
  
  /**
   * Create a new editing session
   */
  createSession(
    sessionId: string,
    originalImage: string,
    processedImage: string,
    initialToolSettings: ToolSettings
  ): EditingSession {
    const session: EditingSession = {
      sessionId,
      originalImage,
      processedImage,
      currentState: processedImage,
      editingHistory: [],
      toolSettings: { ...initialToolSettings },
      timestamp: Date.now(),
      lastSaved: Date.now(),
      version: 1
    };
    
    this.sessions.set(sessionId, session);
    this.saveSessionToStorage(session);
    this.startAutoSave();
    
    return session;
  }
  
  /**
   * Get an existing session
   */
  getSession(sessionId: string): EditingSession | null {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Try to load from storage
      session = this.loadSessionFromStorage(sessionId);
      if (session) {
        this.sessions.set(sessionId, session);
      }
    }
    
    return session;
  }
  
  /**
   * Update session with new state
   */
  updateSession(
    sessionId: string,
    updates: Partial<Pick<EditingSession, 'currentState' | 'toolSettings'>>
  ): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    if (updates.currentState) {
      session.currentState = updates.currentState;
    }
    
    if (updates.toolSettings) {
      session.toolSettings = { ...session.toolSettings, ...updates.toolSettings };
    }
    
    session.version++;
    session.lastSaved = Date.now();
    
    this.sessions.set(sessionId, session);
    return true;
  }
  
  /**
   * Add an edit action to the session history
   */
  addEditAction(sessionId: string, action: Omit<EditAction, 'id' | 'timestamp'>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    const editAction: EditAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...action
    };
    
    session.editingHistory.push(editAction);
    
    // Limit history size
    if (session.editingHistory.length > this.options.maxHistorySize) {
      session.editingHistory = session.editingHistory.slice(-this.options.maxHistorySize);
    }
    
    session.version++;
    this.sessions.set(sessionId, session);
    
    return true;
  }
  
  /**
   * Get undo/redo history for a session
   */
  getEditHistory(sessionId: string): EditAction[] {
    const session = this.getSession(sessionId);
    return session ? [...session.editingHistory] : [];
  }
  
  /**
   * Check if there are recoverable sessions
   */
  getRecoverableSessions(): EditingSession[] {
    this.loadAllSessionsFromStorage();
    
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(session => {
      const age = now - session.timestamp;
      return age < this.options.maxSessionAge && session.editingHistory.length > 0;
    });
  }
  
  /**
   * Recover a session from storage
   */
  recoverSession(sessionId: string): EditingSession | null {
    const session = this.loadSessionFromStorage(sessionId);
    if (session) {
      this.sessions.set(sessionId, session);
      this.startAutoSave();
    }
    return session;
  }
  
  /**
   * Save all active sessions
   */
  saveAllSessions(): void {
    this.sessions.forEach(session => {
      this.saveSessionToStorage(session);
    });
    
    this.updateRecoveryIndex();
  }
  
  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    
    if (browser) {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${sessionId}`);
      this.updateRecoveryIndex();
    }
    
    return deleted;
  }
  
  /**
   * Cleanup old sessions
   */
  cleanup(): number {
    const now = Date.now();
    const sessionsToDelete: string[] = [];
    
    this.sessions.forEach((session, sessionId) => {
      const age = now - session.timestamp;
      if (age > this.options.maxSessionAge) {
        sessionsToDelete.push(sessionId);
      }
    });
    
    sessionsToDelete.forEach(sessionId => {
      this.deleteSession(sessionId);
    });
    
    // Also cleanup storage
    if (browser) {
      this.cleanupStorage();
    }
    
    return sessionsToDelete.length;
  }
  
  /**
   * Get service statistics
   */
  getStats(): {
    activeSessions: number;
    totalEditActions: number;
    oldestSession: number | null;
    newestSession: number | null;
    storageUsage: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const totalEditActions = sessions.reduce((sum, session) => sum + session.editingHistory.length, 0);
    
    const timestamps = sessions.map(s => s.timestamp);
    const oldestSession = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestSession = timestamps.length > 0 ? Math.max(...timestamps) : null;
    
    // Rough storage usage estimate
    const storageUsage = sessions.reduce((total, session) => {
      return total + JSON.stringify(session).length * 2; // UTF-16 approximation
    }, 0);
    
    return {
      activeSessions: this.sessions.size,
      totalEditActions,
      oldestSession,
      newestSession,
      storageUsage
    };
  }
  
  /**
   * Destroy the service and cleanup
   */
  destroy(): void {
    this.stopAutoSave();
    this.saveAllSessions();
    this.sessions.clear();
  }
  
  // Private methods
  
  private initializeService(): void {
    if (browser) {
      this.loadAllSessionsFromStorage();
      this.cleanup();
      this.startAutoSave();
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.saveAllSessions();
      });
    }
  }
  
  private startAutoSave(): void {
    if (this.autoSaveTimer) return;
    
    this.autoSaveTimer = setInterval(() => {
      this.saveAllSessions();
    }, this.options.autoSaveInterval);
  }
  
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  private saveSessionToStorage(session: EditingSession): void {
    if (!browser) return;
    
    try {
      const data = this.options.compressionEnabled
        ? this.compressSession(session)
        : JSON.stringify(session);
      
      localStorage.setItem(`${this.STORAGE_PREFIX}${session.sessionId}`, data);
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  }
  
  private loadSessionFromStorage(sessionId: string): EditingSession | null {
    if (!browser) return null;
    
    try {
      const data = localStorage.getItem(`${this.STORAGE_PREFIX}${sessionId}`);
      if (!data) return null;
      
      const session = this.options.compressionEnabled
        ? this.decompressSession(data)
        : JSON.parse(data);
      
      return session;
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      return null;
    }
  }
  
  private loadAllSessionsFromStorage(): void {
    if (!browser) return;
    
    try {
      const recoveryData = localStorage.getItem(this.RECOVERY_KEY);
      if (!recoveryData) return;
      
      const sessionIds: string[] = JSON.parse(recoveryData);
      
      sessionIds.forEach(sessionId => {
        if (!this.sessions.has(sessionId)) {
          const session = this.loadSessionFromStorage(sessionId);
          if (session) {
            this.sessions.set(sessionId, session);
          }
        }
      });
    } catch (error) {
      console.error('Failed to load sessions from storage:', error);
    }
  }
  
  private updateRecoveryIndex(): void {
    if (!browser) return;
    
    try {
      const sessionIds = Array.from(this.sessions.keys());
      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(sessionIds));
    } catch (error) {
      console.error('Failed to update recovery index:', error);
    }
  }
  
  private cleanupStorage(): void {
    if (!browser) return;
    
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        const sessionId = key.substring(this.STORAGE_PREFIX.length);
        const session = this.loadSessionFromStorage(sessionId);
        
        if (session && (now - session.timestamp) > this.options.maxSessionAge) {
          localStorage.removeItem(key);
        }
      }
    }
  }
  
  private compressSession(session: EditingSession): string {
    // Simple compression - remove large data for storage
    const compressed = {
      ...session,
      currentState: session.currentState.length > 1000 ? '[compressed]' : session.currentState,
      editingHistory: session.editingHistory.slice(-10) // Keep only recent history
    };
    
    return JSON.stringify(compressed);
  }
  
  private decompressSession(data: string): EditingSession {
    return JSON.parse(data);
  }
}

// Singleton instance
export const sessionRecoveryService = new SessionRecoveryService();