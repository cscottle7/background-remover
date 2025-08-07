# CharacterCut UI Design Specification
## Comprehensive Interface Refactoring Guide

### Executive Summary

This specification addresses the identified interface issues including inconsistent button sizes, disorganized layout, poor visual hierarchy, and items appearing incorrectly positioned under the header. The refactored design follows modern UI principles while maintaining the magical, developer-focused brand identity.

---

## 1. High-Level Layout Structure

### Primary Layout System
- **CSS Grid** for main layout zones with fallback to Flexbox
- **12-column responsive grid** for content organization
- **Sticky header** with consistent z-index layering
- **Full-height viewport** utilization with proper content flow

### Layout Architecture
```css
.app-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header"
    "main"
    "footer";
  min-height: 100vh;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: 
    "hero"
    "interface"
    "features";
  gap: 2rem;
  padding: 0 1rem;
  max-width: 1200px;
  margin: 0 auto;
}
```

### Responsive Breakpoints
- **Mobile**: 0-640px (single column)
- **Tablet**: 641-1024px (adaptive layout)
- **Desktop**: 1025px+ (full layout with sidebars)

---

## 2. Color Palette & Design Tokens

### Core Brand Colors
```css
:root {
  /* Primary Brand Colors */
  --brand-primary: #1e40af;      /* Blue-800 - Main brand */
  --brand-secondary: #3b82f6;    /* Blue-600 - Interactive elements */
  --brand-accent: #60a5fa;       /* Blue-400 - Highlights */
  --brand-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  
  /* Background System */
  --bg-primary: #0a0a0a;         /* Main background */
  --bg-secondary: #151515;       /* Card/surface background */
  --bg-elevated: #1f1f1f;        /* Elevated components */
  --bg-overlay: rgba(26, 26, 26, 0.95); /* Modal/overlay */
  
  /* Text Hierarchy */
  --text-primary: #ffffff;       /* Main text */
  --text-secondary: #b3b3b3;     /* Secondary text */
  --text-muted: #666666;         /* Muted/helper text */
  --text-inverse: #0a0a0a;       /* Text on light backgrounds */
  
  /* Border System */
  --border-primary: #333333;     /* Main borders */
  --border-secondary: #404040;   /* Subtle borders */
  --border-focus: #1e40af;       /* Focus/active borders */
  --border-error: #ef4444;       /* Error states */
  --border-success: #10b981;     /* Success states */
  
  /* Status Colors */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
  --status-info: #3b82f6;
  
  /* Interactive States */
  --hover-overlay: rgba(255, 255, 255, 0.05);
  --active-overlay: rgba(255, 255, 255, 0.1);
  --focus-ring: 0 0 0 3px rgba(30, 64, 175, 0.3);
}
```

---

## 3. Component Specifications

### 3.1 Header Component
```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 64px;
  background: var(--bg-overlay);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-primary);
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: var(--brand-gradient);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 600;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

### 3.2 Button System
```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  user-select: none;
}

/* Primary Button */
.btn-primary {
  background: var(--brand-gradient);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(30, 64, 175, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.btn-secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--border-secondary);
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--brand-secondary);
  border-color: var(--brand-secondary);
}

.btn-outline:hover {
  background: var(--brand-secondary);
  color: white;
}

/* Size Variants */
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}

/* Icon Buttons */
.btn-icon {
  padding: 0.75rem;
  width: 40px;
  height: 40px;
}

.btn-icon-sm {
  padding: 0.5rem;
  width: 32px;
  height: 32px;
}
```

### 3.3 Card Components
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--border-secondary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-header {
  padding: 1.5rem 1.5rem 0;
}

.card-content {
  padding: 1.5rem;
}

.card-footer {
  padding: 0 1.5rem 1.5rem;
  margin-top: auto;
}

/* Glass Effect Cards */
.card-glass {
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 3.4 Input Components
```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.input-field {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}

.input-field:invalid {
  border-color: var(--border-error);
}

/* Dropzone Component */
.dropzone {
  border: 2px dashed var(--border-primary);
  border-radius: 12px;
  padding: 3rem 1.5rem;
  text-align: center;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone:hover {
  border-color: var(--brand-secondary);
  background: rgba(59, 130, 246, 0.05);
}

.dropzone.active {
  border-color: var(--brand-primary);
  border-style: solid;
  background: rgba(30, 64, 175, 0.1);
  transform: scale(1.02);
}
```

---

## 4. Visual Hierarchy Guidelines

### 4.1 Typography Scale
```css
/* Typography System */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-6xl { font-size: 3.75rem; line-height: 1; }

/* Font Weights */
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

### 4.2 Spacing System
```css
/* Spacing Scale (rem units) */
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}

/* Component Spacing */
.component-padding { padding: var(--space-6); }
.component-margin { margin: var(--space-4); }
.section-spacing { margin: var(--space-16) 0; }
```

### 4.3 Focus States & Interactions
```css
/* Focus Management */
.focusable {
  outline: none;
  transition: all 0.2s ease;
}

.focusable:focus-visible {
  box-shadow: var(--focus-ring);
}

/* Interactive States */
.interactive {
  cursor: pointer;
  transition: all 0.2s ease;
}

.interactive:hover {
  background: var(--hover-overlay);
}

.interactive:active {
  background: var(--active-overlay);
  transform: scale(0.98);
}
```

---

## 5. Layout Zones

### 5.1 Main Canvas Area
```css
.canvas-container {
  grid-area: interface;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-8);
  position: relative;
}

.canvas-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* Processing State Container */
.processing-container {
  position: relative;
  width: 100%;
  min-height: 400px;
  background: var(--bg-overlay);
  border: 1px solid rgba(30, 64, 175, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

/* Result Display Container */
.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-8);
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-primary);
}
```

### 5.2 Tools Sidebar (Future Enhancement)
```css
.tools-sidebar {
  position: fixed;
  right: 0;
  top: 64px;
  width: 280px;
  height: calc(100vh - 64px);
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-primary);
  padding: var(--space-6);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 100;
}

.tools-sidebar.open {
  transform: translateX(0);
}

.tool-section {
  margin-bottom: var(--space-8);
}

.tool-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}
```

### 5.3 Status/Feedback Areas
```css
.status-bar {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.feedback-container {
  background: var(--bg-overlay);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 400px;
}

/* Toast Notifications */
.toast {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  background: var(--bg-overlay);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: var(--space-4);
  max-width: 320px;
  animation: slideInFromRight 0.3s ease;
  z-index: 1100;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## 6. State-Specific Layouts

### 6.1 Initial State (Upload Interface)
```css
.upload-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-6);
}

.upload-dropzone {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16 / 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
}

.upload-actions {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}
```

### 6.2 Processing State
```css
.processing-state {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.processing-preview {
  position: relative;
  max-width: 600px;
  max-height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.processing-overlay {
  position: absolute;
  bottom: var(--space-4);
  left: var(--space-4);
  right: var(--space-4);
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: var(--space-4);
}
```

### 6.3 Results State
```css
.results-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8);
}

.result-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  width: 100%;
  max-width: 800px;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  justify-content: center;
}

@media (max-width: 768px) {
  .result-preview {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-direction: column;
    width: 100%;
  }
}
```

---

## 7. Animation & Transition Guidelines

### 7.1 Standard Transitions
```css
/* Standard transition timing */
:root {
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
  --transition-bounce: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Common transition patterns */
.transition-all {
  transition: all var(--transition-base);
}

.transition-transform {
  transition: transform var(--transition-base);
}

.transition-opacity {
  transition: opacity var(--transition-base);
}
```

### 7.2 Loading Animations
```css
@keyframes scanline {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  10%, 90% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

---

## 8. Accessibility Considerations

### 8.1 Focus Management
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border-primary: #666666;
    --text-secondary: #cccccc;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus visible polyfill */
.focus-visible-polyfill:focus:not(.focus-visible) {
  outline: none;
}
```

### 8.2 Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 8px;
  border-radius: 4px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)
1. Implement new CSS custom properties system
2. Refactor button components with standardized sizes
3. Fix header positioning and z-index issues
4. Implement basic grid layout structure

### Phase 2: Component System (Week 2)
1. Standardize all card components
2. Implement new input/dropzone styling
3. Create consistent spacing system
4. Add proper focus states throughout

### Phase 3: Layout Optimization (Week 3)
1. Implement responsive grid system
2. Optimize state-specific layouts
3. Add smooth transitions between states
4. Implement accessibility improvements

### Phase 4: Polish & Testing (Week 4)
1. Cross-browser testing and fixes
2. Performance optimization
3. Accessibility audit and improvements
4. User testing and iterations

---

## 10. Browser Compatibility

### Supported Browsers
- **Chrome**: 88+
- **Firefox**: 84+
- **Safari**: 14+
- **Edge**: 88+

### Fallbacks
```css
/* CSS Grid fallback */
@supports not (display: grid) {
  .grid-container {
    display: flex;
    flex-direction: column;
  }
}

/* Backdrop filter fallback */
@supports not (backdrop-filter: blur(12px)) {
  .glass-card {
    background: var(--bg-secondary);
  }
}
```

---

This specification provides a comprehensive foundation for refactoring the CharacterCut interface to address all identified issues while maintaining the magical, developer-focused brand identity. The systematic approach ensures consistency, accessibility, and maintainability across the application.