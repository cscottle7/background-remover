/**
 * Keyboard Service - Comprehensive keyboard shortcuts for desktop productivity
 * Handles global keyboard shortcuts with proper event management and conflict resolution
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'tool' | 'navigation' | 'canvas' | 'ui';
  disabled?: boolean;
}

export interface KeyboardServiceConfig {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: HTMLElement | 'window';
}

export class KeyboardService {
  private shortcuts = new Map<string, KeyboardShortcut>();
  private isEnabled = true;
  private config: KeyboardServiceConfig;
  private boundHandler: (event: KeyboardEvent) => void;
  
  constructor(config: KeyboardServiceConfig = {}) {
    this.config = {
      preventDefault: true,
      stopPropagation: true,
      target: 'window',
      ...config
    };
    
    this.boundHandler = this.handleKeyDown.bind(this);
    this.attachEventListeners();
  }
  
  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const keyCombo = this.createKeyCombo(shortcut);
    this.shortcuts.set(keyCombo, shortcut);
  }
  
  /**
   * Register multiple shortcuts at once
   */
  registerMany(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(shortcut => this.register(shortcut));
  }
  
  /**
   * Unregister a shortcut
   */
  unregister(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}): void {
    const keyCombo = this.createKeyComboFromString(key, modifiers);
    this.shortcuts.delete(keyCombo);
  }
  
  /**
   * Enable/disable the keyboard service
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Get all registered shortcuts grouped by category
   */
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const categories: Record<string, KeyboardShortcut[]> = {
      tool: [],
      navigation: [],
      canvas: [],
      ui: []
    };
    
    this.shortcuts.forEach(shortcut => {
      categories[shortcut.category].push(shortcut);
    });
    
    return categories;
  }
  
  /**
   * Get all shortcuts as a flat array
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * Check if a key combination is already registered
   */
  isRegistered(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}): boolean {
    const keyCombo = this.createKeyComboFromString(key, modifiers);
    return this.shortcuts.has(keyCombo);
  }
  
  /**
   * Enable/disable specific shortcut
   */
  setShortcutEnabled(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean }, enabled: boolean): void {
    const keyCombo = this.createKeyComboFromString(key, modifiers);
    const shortcut = this.shortcuts.get(keyCombo);
    if (shortcut) {
      shortcut.disabled = !enabled;
    }
  }
  
  /**
   * Cleanup and remove event listeners
   */
  destroy(): void {
    this.detachEventListeners();
    this.shortcuts.clear();
  }
  
  // Private methods
  
  private attachEventListeners(): void {
    const target = this.config.target === 'window' ? window : this.config.target as HTMLElement;
    if (target) {
      target.addEventListener('keydown', this.boundHandler);
    }
  }
  
  private detachEventListeners(): void {
    const target = this.config.target === 'window' ? window : this.config.target as HTMLElement;
    if (target) {
      target.removeEventListener('keydown', this.boundHandler);
    }
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    // Don't intercept shortcuts when user is typing in form elements
    const target = event.target as HTMLElement;
    if (this.isInputElement(target)) {
      // Only allow specific shortcuts in input elements
      if (!this.isAllowedInInput(event)) {
        return;
      }
    }
    
    const keyCombo = this.createKeyComboFromEvent(event);
    const shortcut = this.shortcuts.get(keyCombo);
    
    if (shortcut && !shortcut.disabled) {
      if (this.config.preventDefault) {
        event.preventDefault();
      }
      if (this.config.stopPropagation) {
        event.stopPropagation();
      }
      
      try {
        shortcut.action();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }
  
  private createKeyCombo(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }
  
  private createKeyComboFromString(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
    const parts = [];
    if (modifiers.ctrl) parts.push('ctrl');
    if (modifiers.shift) parts.push('shift');
    if (modifiers.alt) parts.push('alt');
    parts.push(key.toLowerCase());
    return parts.join('+');
  }
  
  private createKeyComboFromEvent(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl'); // Treat Cmd as Ctrl on Mac
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    
    // Handle special keys
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    
    parts.push(key);
    return parts.join('+');
  }
  
  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.contentEditable === 'true' ||
      element.hasAttribute('contenteditable')
    );
  }
  
  private isAllowedInInput(event: KeyboardEvent): boolean {
    // Allow certain shortcuts even in input elements
    const allowedShortcuts = [
      'ctrl+z', 'ctrl+y', 'ctrl+c', 'ctrl+v', 'ctrl+x', 'ctrl+a',
      'escape', 'ctrl+enter', 'shift+enter'
    ];
    
    const keyCombo = this.createKeyComboFromEvent(event);
    return allowedShortcuts.includes(keyCombo);
  }
}

// Helper function to format key combinations for display
export function formatKeyCombo(shortcut: KeyboardShortcut): string {
  const parts = [];
  if (shortcut.ctrl) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  
  let key = shortcut.key;
  const keyMappings: Record<string, string> = {
    'space': '⎵',
    'enter': '↵',
    'escape': 'Esc',
    'up': '↑',
    'down': '↓',
    'left': '←',
    'right': '→',
    'backspace': '⌫',
    'delete': '⌦',
    'tab': '⇥'
  };
  
  if (keyMappings[key.toLowerCase()]) {
    key = keyMappings[key.toLowerCase()];
  } else {
    key = key.toUpperCase();
  }
  
  parts.push(key);
  return parts.join(' + ');
}

// Predefined shortcut categories for common actions
export const ShortcutCategories = {
  TOOL: 'tool' as const,
  NAVIGATION: 'navigation' as const,
  CANVAS: 'canvas' as const,
  UI: 'ui' as const
};