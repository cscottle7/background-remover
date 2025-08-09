/**
 * Focus Management Service
 * Provides logical focus flow and accessibility features for the refinement page
 */

export interface FocusableElement {
  id: string;
  element: HTMLElement;
  priority: number;
  group: string;
  description?: string;
}

export interface FocusGroup {
  name: string;
  elements: FocusableElement[];
  currentIndex: number;
  isActive: boolean;
}

export class FocusManagementService {
  private focusGroups = new Map<string, FocusGroup>();
  private currentGroup: string | null = null;
  private isEnabled = true;
  private boundKeyHandler: (event: KeyboardEvent) => void;
  private focusHistory: string[] = [];
  
  constructor() {
    this.boundKeyHandler = this.handleKeyNavigation.bind(this);
    this.attachEventListeners();
  }
  
  /**
   * Register a focusable element
   */
  registerElement(element: FocusableElement): void {
    if (!this.focusGroups.has(element.group)) {
      this.focusGroups.set(element.group, {
        name: element.group,
        elements: [],
        currentIndex: 0,
        isActive: false
      });
    }
    
    const group = this.focusGroups.get(element.group)!;
    
    // Remove existing element with same ID
    group.elements = group.elements.filter(el => el.id !== element.id);
    
    // Add element in priority order
    group.elements.push(element);
    group.elements.sort((a, b) => a.priority - b.priority);
    
    // Update indices after sorting
    this.updateGroupIndices(element.group);
  }
  
  /**
   * Unregister a focusable element
   */
  unregisterElement(elementId: string, groupName: string): void {
    const group = this.focusGroups.get(groupName);
    if (group) {
      group.elements = group.elements.filter(el => el.id !== elementId);
      this.updateGroupIndices(groupName);
    }
  }
  
  /**
   * Set active focus group
   */
  setActiveGroup(groupName: string): void {
    // Deactivate current group
    if (this.currentGroup) {
      const currentGroup = this.focusGroups.get(this.currentGroup);
      if (currentGroup) {
        currentGroup.isActive = false;
      }
    }
    
    // Activate new group
    const newGroup = this.focusGroups.get(groupName);
    if (newGroup) {
      newGroup.isActive = true;
      this.currentGroup = groupName;
      
      // Focus first element in group
      if (newGroup.elements.length > 0) {
        this.focusElementAt(groupName, 0);
      }
    }
  }
  
  /**
   * Focus specific element by ID
   */
  focusElement(elementId: string): boolean {
    for (const [groupName, group] of this.focusGroups) {
      const elementIndex = group.elements.findIndex(el => el.id === elementId);
      if (elementIndex !== -1) {
        this.setActiveGroup(groupName);
        return this.focusElementAt(groupName, elementIndex);
      }
    }
    return false;
  }
  
  /**
   * Focus first element in a group
   */
  focusFirstInGroup(groupName: string): boolean {
    const group = this.focusGroups.get(groupName);
    if (group && group.elements.length > 0) {
      this.setActiveGroup(groupName);
      return this.focusElementAt(groupName, 0);
    }
    return false;
  }
  
  /**
   * Focus last element in a group
   */
  focusLastInGroup(groupName: string): boolean {
    const group = this.focusGroups.get(groupName);
    if (group && group.elements.length > 0) {
      this.setActiveGroup(groupName);
      return this.focusElementAt(groupName, group.elements.length - 1);
    }
    return false;
  }
  
  /**
   * Move focus to next element in current group
   */
  focusNext(): boolean {
    if (!this.currentGroup) return false;
    
    const group = this.focusGroups.get(this.currentGroup);
    if (!group || group.elements.length === 0) return false;
    
    const nextIndex = (group.currentIndex + 1) % group.elements.length;
    return this.focusElementAt(this.currentGroup, nextIndex);
  }
  
  /**
   * Move focus to previous element in current group
   */
  focusPrevious(): boolean {
    if (!this.currentGroup) return false;
    
    const group = this.focusGroups.get(this.currentGroup);
    if (!group || group.elements.length === 0) return false;
    
    const prevIndex = group.currentIndex === 0 
      ? group.elements.length - 1 
      : group.currentIndex - 1;
    return this.focusElementAt(this.currentGroup, prevIndex);
  }
  
  /**
   * Save current focus for restoration later
   */
  saveFocus(): void {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.id) {
      this.focusHistory.push(activeElement.id);
    }
  }
  
  /**
   * Restore previously saved focus
   */
  restoreFocus(): boolean {
    if (this.focusHistory.length === 0) return false;
    
    const elementId = this.focusHistory.pop()!;
    return this.focusElement(elementId);
  }
  
  /**
   * Get all focusable elements in order
   */
  getFocusableElements(): FocusableElement[] {
    const allElements: FocusableElement[] = [];
    
    // Sort groups by priority (header, tools, canvas, controls, footer)
    const groupOrder = ['header', 'tools', 'canvas', 'controls', 'footer'];
    
    for (const groupName of groupOrder) {
      const group = this.focusGroups.get(groupName);
      if (group) {
        allElements.push(...group.elements);
      }
    }
    
    // Add any remaining groups not in the predefined order
    for (const [groupName, group] of this.focusGroups) {
      if (!groupOrder.includes(groupName)) {
        allElements.push(...group.elements);
      }
    }
    
    return allElements;
  }
  
  /**
   * Enable/disable focus management
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Get current focus information for debugging
   */
  getFocusInfo(): any {
    return {
      currentGroup: this.currentGroup,
      groups: Array.from(this.focusGroups.entries()).map(([name, group]) => ({
        name,
        isActive: group.isActive,
        currentIndex: group.currentIndex,
        elementCount: group.elements.length,
        elements: group.elements.map(el => ({
          id: el.id,
          priority: el.priority,
          description: el.description
        }))
      }))
    };
  }
  
  /**
   * Cleanup and remove event listeners
   */
  destroy(): void {
    this.detachEventListeners();
    this.focusGroups.clear();
    this.focusHistory = [];
  }
  
  // Private methods
  
  private focusElementAt(groupName: string, index: number): boolean {
    const group = this.focusGroups.get(groupName);
    if (!group || index < 0 || index >= group.elements.length) {
      return false;
    }
    
    const element = group.elements[index];
    if (element.element && typeof element.element.focus === 'function') {
      try {
        // Ensure element is visible and not disabled
        if (this.isElementFocusable(element.element)) {
          element.element.focus();
          group.currentIndex = index;
          this.announceToScreenReader(element.description || `Focused ${element.id}`);
          return true;
        }
      } catch (error) {
        console.warn('Failed to focus element:', element.id, error);
      }
    }
    
    return false;
  }
  
  private updateGroupIndices(groupName: string): void {
    const group = this.focusGroups.get(groupName);
    if (group) {
      // Ensure current index is still valid
      group.currentIndex = Math.min(group.currentIndex, Math.max(0, group.elements.length - 1));
    }
  }
  
  private isElementFocusable(element: HTMLElement): boolean {
    // Check if element is visible and not disabled
    const style = getComputedStyle(element);
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0';
    
    const isEnabled = !element.hasAttribute('disabled') &&
                     !element.hasAttribute('aria-disabled');
    
    const isInViewport = element.getBoundingClientRect().width > 0 &&
                        element.getBoundingClientRect().height > 0;
    
    return isVisible && isEnabled && isInViewport;
  }
  
  private handleKeyNavigation(event: KeyboardEvent): void {
    if (!this.isEnabled || !this.currentGroup) return;
    
    // Don't handle navigation if user is typing in an input
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
      return;
    }
    
    switch (event.key) {
      case 'Tab':
        // Handle Tab navigation within groups
        if (event.shiftKey) {
          if (this.focusPrevious()) {
            event.preventDefault();
          }
        } else {
          if (this.focusNext()) {
            event.preventDefault();
          }
        }
        break;
        
      case 'ArrowDown':
      case 'ArrowRight':
        if (this.focusNext()) {
          event.preventDefault();
        }
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        if (this.focusPrevious()) {
          event.preventDefault();
        }
        break;
        
      case 'Home':
        if (this.currentGroup) {
          if (this.focusElementAt(this.currentGroup, 0)) {
            event.preventDefault();
          }
        }
        break;
        
      case 'End':
        if (this.currentGroup) {
          const group = this.focusGroups.get(this.currentGroup);
          if (group && group.elements.length > 0) {
            if (this.focusElementAt(this.currentGroup, group.elements.length - 1)) {
              event.preventDefault();
            }
          }
        }
        break;
    }
  }
  
  private attachEventListeners(): void {
    document.addEventListener('keydown', this.boundKeyHandler);
  }
  
  private detachEventListeners(): void {
    document.removeEventListener('keydown', this.boundKeyHandler);
  }
  
  private announceToScreenReader(message: string): void {
    // Create a live region announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
}

// Focus group constants
export const FocusGroups = {
  HEADER: 'header',
  TOOLS: 'tools', 
  CANVAS: 'canvas',
  CONTROLS: 'controls',
  FOOTER: 'footer'
} as const;