import { c as create_ssr_component, a as subscribe } from "../../../chunks/ssr.js";
import { p as page } from "../../../chunks/stores.js";
/* empty css                                                           */const globalMemoryStore = /* @__PURE__ */ new Map();
class ImageSessionManager {
  SESSION_PREFIX = "img_session_";
  CLEANUP_INTERVAL = 1e3 * 60 * 60;
  // 1 hour
  MAX_SESSION_AGE = 1e3 * 60 * 60;
  // 1 hour
  COMPRESSION_THRESHOLD = 1024 * 100;
  // 100KB
  STORAGE_SIZE_LIMIT = 1024 * 1024 * 2;
  // 2MB limit for sessionStorage
  VERSION = 1;
  // Use global memory store that persists across page navigation
  get memoryStore() {
    return globalMemoryStore;
  }
  constructor() {
    this.scheduleCleanup();
  }
  /**
   * Create a new image session
   */
  async createSession(originalImage, processedImage, returnPath = "/") {
    const sessionId = this.generateSessionId();
    const imageId = this.generateImageId();
    const estimatedSize = originalImage.length + processedImage.length;
    const isLargeImage = estimatedSize > this.STORAGE_SIZE_LIMIT;
    console.log(`Image data size: ${estimatedSize} bytes, Large image: ${isLargeImage}`);
    const sessionData = {
      originalImage,
      processedImage,
      imageId,
      returnPath,
      timestamp: Date.now(),
      hasRefinedResult: false,
      isLargeImage,
      originalImageSize: originalImage.length,
      processedImageSize: processedImage.length
    };
    try {
      if (isLargeImage) {
        console.log(`Using memory storage for large image session: ${sessionId}`);
        this.memoryStore.set(sessionId, sessionData);
        console.log(`Memory store now has ${this.memoryStore.size} sessions`);
        console.log(`Memory store keys:`, Array.from(this.memoryStore.keys()));
        const metadata = {
          sessionId,
          imageId,
          returnPath,
          timestamp: sessionData.timestamp,
          isLargeImage: true,
          originalImageSize: originalImage.length,
          processedImageSize: processedImage.length
        };
        sessionStorage.setItem(
          `${this.SESSION_PREFIX}${sessionId}`,
          JSON.stringify(metadata)
        );
        console.log(`Created large image session in memory: ${sessionId}`);
        return sessionId;
      } else {
        const compressedData = await this.compressSessionData(sessionData);
        const storageKey = `${this.SESSION_PREFIX}${sessionId}`;
        const storageValue = JSON.stringify(compressedData);
        console.log(`Using sessionStorage for regular image: ${sessionId}`);
        console.log(`Storage value size: ${storageValue.length} bytes`);
        sessionStorage.setItem(storageKey, storageValue);
        console.log(`Created image session: ${sessionId}`);
        return sessionId;
      }
    } catch (error) {
      console.error("Failed to create image session:", error);
      throw new Error(`Failed to store image session data: ${error.message}`);
    }
  }
  /**
   * Get session data by ID
   */
  getSession(sessionId) {
    try {
      console.log(`Looking for session: ${sessionId}`);
      console.log(`Memory store has ${this.memoryStore.size} sessions`);
      console.log(`Memory store keys:`, Array.from(this.memoryStore.keys()));
      console.log(`Memory store has this session:`, this.memoryStore.has(sessionId));
      if (this.memoryStore.has(sessionId)) {
        const sessionData2 = this.memoryStore.get(sessionId);
        if (this.isSessionExpired(sessionData2)) {
          console.warn(`Memory session expired: ${sessionId}`);
          this.memoryStore.delete(sessionId);
          this.removeSession(sessionId);
          return null;
        }
        console.log(`Retrieved large image session from memory: ${sessionId}`);
        return sessionData2;
      }
      const storedData = sessionStorage.getItem(`${this.SESSION_PREFIX}${sessionId}`);
      if (!storedData) {
        console.warn(`Session not found: ${sessionId}`);
        return null;
      }
      const parsedData = JSON.parse(storedData);
      if (parsedData.isLargeImage && !this.memoryStore.has(sessionId)) {
        console.warn(`Large image session data not found in memory: ${sessionId}`);
        this.removeSession(sessionId);
        return null;
      }
      const compressedData = parsedData;
      const sessionData = this.decompressSessionData(compressedData);
      if (this.isSessionExpired(sessionData)) {
        console.warn(`Session expired: ${sessionId}`);
        this.removeSession(sessionId);
        return null;
      }
      console.log(`Retrieved regular image session from sessionStorage: ${sessionId}`);
      return sessionData;
    } catch (error) {
      console.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }
  /**
   * Update existing session with new data
   */
  updateSession(sessionId, updates) {
    try {
      const existingData = this.getSession(sessionId);
      if (!existingData) {
        console.warn(`Cannot update non-existent session: ${sessionId}`);
        return false;
      }
      const updatedData = {
        ...existingData,
        ...updates,
        lastModified: Date.now()
      };
      const compressedData = this.compressSessionData(updatedData);
      sessionStorage.setItem(
        `${this.SESSION_PREFIX}${sessionId}`,
        JSON.stringify(compressedData)
      );
      console.log(`Updated session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to update session ${sessionId}:`, error);
      return false;
    }
  }
  /**
   * Remove a specific session
   */
  removeSession(sessionId) {
    try {
      if (this.memoryStore.has(sessionId)) {
        this.memoryStore.delete(sessionId);
        console.log(`Removed session from memory: ${sessionId}`);
      }
      sessionStorage.removeItem(`${this.SESSION_PREFIX}${sessionId}`);
      console.log(`Removed session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove session ${sessionId}:`, error);
      return false;
    }
  }
  /**
   * Get all active session IDs
   */
  getAllSessionIds() {
    const sessionIds = [];
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.SESSION_PREFIX)) {
          sessionIds.push(key.substring(this.SESSION_PREFIX.length));
        }
      }
    } catch (error) {
      console.error("Failed to get session IDs:", error);
    }
    return sessionIds;
  }
  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    return this.cleanup();
  }
  /**
   * Clean up expired sessions
   */
  cleanup() {
    const sessionIds = this.getAllSessionIds();
    let cleanedCount = 0;
    for (const sessionId of sessionIds) {
      const sessionData = this.getSession(sessionId);
      if (!sessionData || this.isSessionExpired(sessionData)) {
        this.removeSession(sessionId);
        cleanedCount++;
      }
    }
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
  }
  /**
   * Get storage usage statistics
   */
  getStorageStats() {
    const sessionIds = this.getAllSessionIds();
    let totalSize = 0;
    let oldestSession = null;
    let newestSession = null;
    for (const sessionId of sessionIds) {
      try {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        const data = sessionStorage.getItem(key);
        if (data) {
          totalSize += data.length * 2;
          const sessionData = this.getSession(sessionId);
          if (sessionData) {
            if (oldestSession === null || sessionData.timestamp < oldestSession) {
              oldestSession = sessionData.timestamp;
            }
            if (newestSession === null || sessionData.timestamp > newestSession) {
              newestSession = sessionData.timestamp;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing session ${sessionId}:`, error);
      }
    }
    return {
      sessionCount: sessionIds.length,
      totalSize,
      oldestSession,
      newestSession
    };
  }
  // Private methods
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  generateImageId() {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  isSessionExpired(sessionData) {
    return Date.now() - sessionData.timestamp > this.MAX_SESSION_AGE;
  }
  async compressSessionData(sessionData) {
    const jsonString = JSON.stringify(sessionData);
    console.log(`Session data size: ${jsonString.length} bytes`);
    return {
      data: jsonString,
      compressed: false,
      version: this.VERSION
    };
  }
  decompressSessionData(compressedData) {
    if (compressedData.compressed) {
      try {
        const decompressed = this.decompressString(compressedData.data);
        return JSON.parse(decompressed);
      } catch (error) {
        console.error("Decompression failed:", error);
        throw new Error("Failed to decompress session data");
      }
    }
    return JSON.parse(compressedData.data);
  }
  async compressString(str) {
    try {
      const encoded = encodeURIComponent(str);
      const compressed = this.lzCompress(encoded);
      return btoa(compressed);
    } catch (error) {
      console.warn("Compression failed, storing uncompressed:", error);
      return btoa(str);
    }
  }
  decompressString(compressedStr) {
    try {
      const decompressed = atob(compressedStr);
      const decoded = this.lzDecompress(decompressed);
      return decodeURIComponent(decoded);
    } catch (error) {
      try {
        return atob(compressedStr);
      } catch (fallbackError) {
        console.error("Decompression failed:", error);
        throw new Error("Failed to decompress session data");
      }
    }
  }
  // Simple LZ77-style compression for better browser compatibility
  lzCompress(str) {
    const dict = {};
    const data = str.split("");
    const result = [];
    let dictSize = 256;
    let phrase = data[0];
    for (let i = 1; i < data.length; i++) {
      const curr = data[i];
      const temp = phrase + curr;
      if (dict[temp] !== void 0) {
        phrase = temp;
      } else {
        result.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        dict[temp] = dictSize++;
        phrase = curr;
      }
    }
    result.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    return String.fromCharCode(...result);
  }
  lzDecompress(str) {
    const dict = {};
    const data = str.split("").map((char) => char.charCodeAt(0));
    let dictSize = 256;
    let phrase = String.fromCharCode(data[0]);
    const result = [phrase];
    for (let i = 1; i < data.length; i++) {
      const code = data[i];
      let entry;
      if (dict[code] !== void 0) {
        entry = dict[code];
      } else if (code === dictSize) {
        entry = phrase + phrase[0];
      } else {
        entry = String.fromCharCode(code);
      }
      result.push(entry);
      dict[dictSize++] = phrase + entry[0];
      phrase = entry;
    }
    return result.join("");
  }
  scheduleCleanup() {
    setTimeout(() => this.cleanup(), 1e3);
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.cleanup());
    }
  }
}
new ImageSessionManager();
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".refine-page.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;flex-direction:column;min-height:100vh;background:#f8f9fa}.refine-header.svelte-1dz9ngj.svelte-1dz9ngj{background:white;border-bottom:1px solid #e9ecef;padding:12px 16px;position:sticky;top:0;z-index:100}.header-content.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto}.breadcrumb-btn.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;align-items:center;gap:8px;padding:8px 12px;background:none;border:1px solid #dee2e6;border-radius:6px;color:#495057;cursor:pointer;transition:all 0.2s ease}.breadcrumb-btn.svelte-1dz9ngj.svelte-1dz9ngj:hover{background:#f8f9fa;border-color:#adb5bd}.breadcrumb-icon.svelte-1dz9ngj.svelte-1dz9ngj{font-size:16px}.page-title.svelte-1dz9ngj.svelte-1dz9ngj{margin:0;font-size:20px;font-weight:600;color:#212529}.view-controls.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;gap:8px}.view-btn.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;color:#495057;cursor:pointer;transition:all 0.2s ease}.view-btn.svelte-1dz9ngj.svelte-1dz9ngj:hover{background:#e9ecef}.view-btn.active.svelte-1dz9ngj.svelte-1dz9ngj{background:#007bff;border-color:#007bff;color:white}.view-icon.svelte-1dz9ngj.svelte-1dz9ngj{font-size:14px}.refine-main.svelte-1dz9ngj.svelte-1dz9ngj{flex:1;padding:16px;max-width:1200px;margin:0 auto;width:100%}.workspace.svelte-1dz9ngj.svelte-1dz9ngj{display:grid;grid-template-columns:1fr 250px;gap:16px;height:calc(100vh - 140px)}.canvas-area.svelte-1dz9ngj.svelte-1dz9ngj{background:white;border-radius:8px;border:1px solid #e9ecef;overflow:hidden;position:relative}.toolbox-area.svelte-1dz9ngj.svelte-1dz9ngj{transition:transform 0.3s ease}.toolbox-area.collapsed.svelte-1dz9ngj.svelte-1dz9ngj{transform:translateX(100%)}.loading-container.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:#6c757d}.loading-spinner.svelte-1dz9ngj.svelte-1dz9ngj{width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #007bff;border-radius:50%;animation:svelte-1dz9ngj-spin 1s linear infinite;margin-bottom:16px}.loading-text.svelte-1dz9ngj.svelte-1dz9ngj{font-size:16px;margin:0}.error-container.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;text-align:center;color:#dc3545}.error-icon.svelte-1dz9ngj.svelte-1dz9ngj{font-size:48px;margin-bottom:16px}.error-title.svelte-1dz9ngj.svelte-1dz9ngj{font-size:24px;font-weight:600;margin:0 0 8px 0}.error-message.svelte-1dz9ngj.svelte-1dz9ngj{font-size:16px;margin:0 0 24px 0;color:#6c757d}.error-retry-btn.svelte-1dz9ngj.svelte-1dz9ngj{padding:12px 24px;background:#007bff;color:white;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:500;transition:background 0.2s ease}.error-retry-btn.svelte-1dz9ngj.svelte-1dz9ngj:hover{background:#0056b3}.refine-footer.svelte-1dz9ngj.svelte-1dz9ngj{background:white;border-top:1px solid #e9ecef;padding:16px}.footer-content.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;justify-content:space-between;max-width:1200px;margin:0 auto}.action-btn.svelte-1dz9ngj.svelte-1dz9ngj{display:flex;align-items:center;gap:8px;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:500;transition:all 0.2s ease}.action-btn.secondary.svelte-1dz9ngj.svelte-1dz9ngj{background:#6c757d;color:white}.action-btn.secondary.svelte-1dz9ngj.svelte-1dz9ngj:hover{background:#545b62}.action-btn.primary.svelte-1dz9ngj.svelte-1dz9ngj{background:#007bff;color:white}.action-btn.primary.svelte-1dz9ngj.svelte-1dz9ngj:hover{background:#0056b3}.action-btn.svelte-1dz9ngj.svelte-1dz9ngj:disabled{opacity:0.6;cursor:not-allowed}.action-icon.svelte-1dz9ngj.svelte-1dz9ngj{font-size:16px}@media(max-width: 768px){.refine-page.mobile.svelte-1dz9ngj .workspace.svelte-1dz9ngj{grid-template-columns:1fr;grid-template-rows:1fr auto;height:calc(100vh - 120px)}.refine-page.mobile.svelte-1dz9ngj .toolbox-area.svelte-1dz9ngj{order:-1;transform:none}.refine-page.mobile.svelte-1dz9ngj .toolbox-area.collapsed.svelte-1dz9ngj{transform:none}.refine-page.mobile.svelte-1dz9ngj .header-content.svelte-1dz9ngj{flex-wrap:wrap;gap:12px}.refine-page.mobile.svelte-1dz9ngj .page-title.svelte-1dz9ngj{order:-1;width:100%;text-align:center;font-size:18px}.refine-page.mobile.svelte-1dz9ngj .view-controls.svelte-1dz9ngj{order:1}.refine-page.mobile.svelte-1dz9ngj .breadcrumb-text.svelte-1dz9ngj,.refine-page.mobile.svelte-1dz9ngj .view-text.svelte-1dz9ngj{display:none}.refine-page.mobile.svelte-1dz9ngj .footer-content.svelte-1dz9ngj{gap:12px}.refine-page.mobile.svelte-1dz9ngj .action-btn.svelte-1dz9ngj{flex:1;justify-content:center}}@media(min-width: 769px) and (max-width: 1024px){.workspace.svelte-1dz9ngj.svelte-1dz9ngj{grid-template-columns:1fr 220px}}@keyframes svelte-1dz9ngj-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `  ${$$result.head += `<!-- HEAD_svelte-qb2fw3_START -->${$$result.title = `<title>Refine Image - CharacterCut</title>`, ""}<meta name="description" content="Refine and perfect your character image with advanced editing tools"><!-- HEAD_svelte-qb2fw3_END -->`, ""} <div class="${[
      "refine-page svelte-1dz9ngj",
      " "
    ].join(" ").trim()}"> <header class="refine-header svelte-1dz9ngj"><div class="header-content svelte-1dz9ngj"> <nav class="breadcrumb"><button class="breadcrumb-btn svelte-1dz9ngj" data-svelte-h="svelte-24s13s"><span class="breadcrumb-icon svelte-1dz9ngj">←</span> <span class="breadcrumb-text svelte-1dz9ngj">Back to Main</span></button></nav>  <h1 class="page-title svelte-1dz9ngj" data-svelte-h="svelte-n69v3x">Refine Image</h1>  <div class="view-controls svelte-1dz9ngj"><button class="${["view-btn svelte-1dz9ngj", ""].join(" ").trim()}" title="Compare original vs processed" data-svelte-h="svelte-sh0wz3"><span class="view-icon svelte-1dz9ngj">⚖️</span> <span class="view-text svelte-1dz9ngj">Compare</span></button> <button class="${["view-btn svelte-1dz9ngj", ""].join(" ").trim()}" title="Toggle original preview" data-svelte-h="svelte-v5sg2j"><span class="view-icon svelte-1dz9ngj">👁️</span> <span class="view-text svelte-1dz9ngj">Original</span></button></div></div></header>  <main class="refine-main svelte-1dz9ngj">${` <div class="loading-container svelte-1dz9ngj" data-svelte-h="svelte-17pob47"><div class="loading-spinner svelte-1dz9ngj"></div> <p class="loading-text svelte-1dz9ngj">Loading your image...</p></div>`}</main>  <footer class="refine-footer svelte-1dz9ngj"><div class="footer-content svelte-1dz9ngj"> <button class="action-btn secondary svelte-1dz9ngj" data-svelte-h="svelte-1brmr41"><span class="action-icon svelte-1dz9ngj">✕</span> <span class="action-text">Cancel</span></button>  <button class="action-btn primary svelte-1dz9ngj" ${"disabled"}><span class="action-icon svelte-1dz9ngj" data-svelte-h="svelte-kkg5zm">💾</span> <span class="action-text" data-svelte-h="svelte-boggg6">Save &amp; Return</span></button></div></footer> </div>`;
  } while (!$$settled);
  $$unsubscribe_page();
  return $$rendered;
});
export {
  Page as default
};
