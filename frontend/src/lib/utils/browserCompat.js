/**
 * Browser Compatibility Utilities
 * Provides feature detection and fallbacks for cross-browser support
 */

/**
 * Detect browser capabilities
 */
export const browserCapabilities = {
  // Clipboard API support
  get clipboardAPI() {
    return !!(navigator.clipboard && navigator.clipboard.read && navigator.clipboard.write);
  },

  // File API support
  get fileAPI() {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  },

  // Drag and drop support
  get dragDrop() {
    return 'draggable' in document.createElement('div') && 
           'ondragstart' in document.createElement('div') && 
           'ondrop' in document.createElement('div');
  },

  // Backdrop filter support
  get backdropFilter() {
    const div = document.createElement('div');
    div.style.backdropFilter = 'blur(10px)';
    div.style.webkitBackdropFilter = 'blur(10px)';
    return !!(div.style.backdropFilter || div.style.webkitBackdropFilter);
  },

  // CSS Grid support
  get cssGrid() {
    return CSS.supports('display', 'grid');
  },

  // Flexbox support
  get flexbox() {
    return CSS.supports('display', 'flex');
  },

  // Custom properties support
  get customProperties() {
    return CSS.supports('color', 'var(--test-var)');
  },

  // Touch events support
  get touchEvents() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Intersection Observer support
  get intersectionObserver() {
    return 'IntersectionObserver' in window;
  },

  // Web Workers support
  get webWorkers() {
    return typeof Worker !== 'undefined';
  }
};

/**
 * Browser detection
 */
export const browserInfo = {
  get name() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Edg')) return 'edge';
    return 'unknown';
  },

  get version() {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
    return match ? parseInt(match[2]) : 0;
  },

  get isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  get isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  get isSafari() {
    return this.name === 'safari';
  },

  get isFirefox() {
    return this.name === 'firefox';
  },

  get isChrome() {
    return this.name === 'chrome';
  },

  get isEdge() {
    return this.name === 'edge';
  }
};

/**
 * Enhanced clipboard service with better browser support
 */
export class CompatibleClipboardService {
  static async copy(text) {
    if (browserCapabilities.clipboardAPI) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn('Clipboard API failed, falling back to legacy method:', error);
      }
    }

    // Fallback for older browsers
    return this.fallbackCopy(text);
  }

  static async copyImage(blob) {
    if (browserCapabilities.clipboardAPI) {
      try {
        const clipboardItem = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([clipboardItem]);
        return true;
      } catch (error) {
        console.warn('Image clipboard copy failed:', error);
        // Safari often fails here due to security restrictions
        if (browserInfo.isSafari) {
          console.info('Safari clipboard restrictions detected - this is expected behavior');
        }
      }
    }

    return false;
  }

  static fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * File handling with browser compatibility
 */
export class CompatibleFileHandler {
  static isSupported() {
    return browserCapabilities.fileAPI;
  }

  static async readAsDataURL(file) {
    if (!this.isSupported()) {
      throw new Error('File API not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  static async readAsArrayBuffer(file) {
    if (!this.isSupported()) {
      throw new Error('File API not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxWidth = 4096,
      maxHeight = 4096
    } = options;

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please use JPEG, PNG, or WebP' };
    }

    return { valid: true };
  }
}

/**
 * Animation compatibility helper
 */
export class CompatibleAnimations {
  static get reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static animate(element, keyframes, options = {}) {
    if (this.reducedMotion) {
      // Skip animations for users who prefer reduced motion
      if (options.onComplete) {
        options.onComplete();
      }
      return;
    }

    if (element.animate) {
      // Use Web Animations API if available
      const animation = element.animate(keyframes, options);
      if (options.onComplete) {
        animation.addEventListener('finish', options.onComplete);
      }
      return animation;
    } else {
      // Fallback to CSS transitions
      this.fallbackAnimate(element, keyframes, options);
    }
  }

  static fallbackAnimate(element, keyframes, options) {
    const duration = options.duration || 300;
    const easing = options.easing || 'ease';
    
    // Apply final state immediately for older browsers
    const finalFrame = keyframes[keyframes.length - 1];
    Object.assign(element.style, finalFrame);
    
    if (options.onComplete) {
      setTimeout(options.onComplete, duration);
    }
  }
}

/**
 * Feature polyfills and enhancements
 */
export class BrowserPolyfills {
  static init() {
    this.polyfillCustomEvents();
    this.polyfillIntersectionObserver();
    this.enhanceFocus();
  }

  static polyfillCustomEvents() {
    if (typeof window.CustomEvent !== 'function') {
      function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      }
      window.CustomEvent = CustomEvent;
    }
  }

  static polyfillIntersectionObserver() {
    if (!browserCapabilities.intersectionObserver) {
      // Simple fallback - assumes elements are always visible
      window.IntersectionObserver = class {
        constructor(callback) {
          this.callback = callback;
        }
        
        observe(element) {
          // Immediately call callback with visible state
          this.callback([{
            target: element,
            isIntersecting: true,
            intersectionRatio: 1
          }]);
        }
        
        unobserve() {}
        disconnect() {}
      };
    }
  }

  static enhanceFocus() {
    // Add focus-visible polyfill behavior for older browsers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
}

/**
 * Initialize browser compatibility features
 */
export function initBrowserCompat() {
  console.log('Browser compatibility check:', {
    name: browserInfo.name,
    version: browserInfo.version,
    capabilities: browserCapabilities
  });

  BrowserPolyfills.init();

  // Log any missing features
  const missingFeatures = Object.entries(browserCapabilities)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature);

  if (missingFeatures.length > 0) {
    console.warn('Missing browser features (fallbacks active):', missingFeatures);
  }

  return {
    browserInfo,
    browserCapabilities,
    missingFeatures
  };
}