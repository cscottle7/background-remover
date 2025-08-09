/**
 * Image Session Manager
 * Handles session-based image data transfer between main page and /refine page
 * Uses sessionStorage with automatic cleanup and compression
 */

export interface ImageSessionData {
  originalImage: string;
  processedImage: string;
  imageId: string;
  returnPath: string;
  timestamp: number;
  hasRefinedResult?: boolean;
  lastModified?: number;
  
  // For large images, store minimal data and use alternative storage
  isLargeImage?: boolean;
  originalImageSize?: number;
  processedImageSize?: number;
}

export interface CompressedSessionData {
  data: string;
  compressed: boolean;
  version: number;
}

// Global memory store that persists across component instances
const globalMemoryStore = new Map<string, ImageSessionData>();

export class ImageSessionManager {
  private readonly SESSION_PREFIX = 'img_session_';
  private readonly CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
  private readonly MAX_SESSION_AGE = 1000 * 60 * 60; // 1 hour
  private readonly COMPRESSION_THRESHOLD = 1024 * 100; // 100KB
  private readonly STORAGE_SIZE_LIMIT = 1024 * 1024 * 2; // 2MB limit for sessionStorage
  private readonly VERSION = 1;
  
  // Use global memory store that persists across page navigation
  private get memoryStore() {
    return globalMemoryStore;
  }
  
  constructor() {
    this.scheduleCleanup();
  }
  
  /**
   * Create a new image session
   */
  async createSession(
    originalImage: string,
    processedImage: string,
    returnPath: string = '/'
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const imageId = this.generateImageId();
    
    // Estimate size of image data
    const estimatedSize = originalImage.length + processedImage.length;
    const isLargeImage = estimatedSize > this.STORAGE_SIZE_LIMIT;
    
    console.log(`Image data size: ${estimatedSize} bytes, Large image: ${isLargeImage}`);
    
    const sessionData: ImageSessionData = {
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
        // Store large images in memory with minimal sessionStorage metadata
        console.log(`Using memory storage for large image session: ${sessionId}`);
        
        this.memoryStore.set(sessionId, sessionData);
        console.log(`Memory store now has ${this.memoryStore.size} sessions`);
        console.log(`Memory store keys:`, Array.from(this.memoryStore.keys()));
        
        // Store minimal metadata in sessionStorage
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
        // Standard sessionStorage for smaller images
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
      console.error('Failed to create image session:', error);
      throw new Error(`Failed to store image session data: ${error.message}`);
    }
  }
  
  /**
   * Get session data by ID
   */
  getSession(sessionId: string): ImageSessionData | null {
    try {
      console.log(`Looking for session: ${sessionId}`);
      console.log(`Memory store has ${this.memoryStore.size} sessions`);
      console.log(`Memory store keys:`, Array.from(this.memoryStore.keys()));
      console.log(`Memory store has this session:`, this.memoryStore.has(sessionId));
      
      // First check memory store for large images
      if (this.memoryStore.has(sessionId)) {
        const sessionData = this.memoryStore.get(sessionId)!;
        
        // Check if session has expired
        if (this.isSessionExpired(sessionData)) {
          console.warn(`Memory session expired: ${sessionId}`);
          this.memoryStore.delete(sessionId);
          this.removeSession(sessionId); // Also remove metadata from sessionStorage
          return null;
        }
        
        console.log(`Retrieved large image session from memory: ${sessionId}`);
        return sessionData;
      }
      
      // Check sessionStorage for regular or metadata
      const storedData = sessionStorage.getItem(`${this.SESSION_PREFIX}${sessionId}`);
      if (!storedData) {
        console.warn(`Session not found: ${sessionId}`);
        return null;
      }
      
      const parsedData = JSON.parse(storedData);
      
      // Check if this is just metadata for a large image
      if (parsedData.isLargeImage && !this.memoryStore.has(sessionId)) {
        console.warn(`Large image session data not found in memory: ${sessionId}`);
        this.removeSession(sessionId);
        return null;
      }
      
      // Handle regular sessionStorage data
      const compressedData: CompressedSessionData = parsedData;
      const sessionData = this.decompressSessionData(compressedData);
      
      // Check if session has expired
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
  updateSession(sessionId: string, updates: Partial<ImageSessionData>): boolean {
    try {
      const existingData = this.getSession(sessionId);
      if (!existingData) {
        console.warn(`Cannot update non-existent session: ${sessionId}`);
        return false;
      }
      
      const updatedData: ImageSessionData = {
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
  removeSession(sessionId: string): boolean {
    try {
      // Remove from memory store if present
      if (this.memoryStore.has(sessionId)) {
        this.memoryStore.delete(sessionId);
        console.log(`Removed session from memory: ${sessionId}`);
      }
      
      // Remove from sessionStorage
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
  getAllSessionIds(): string[] {
    const sessionIds: string[] = [];
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.SESSION_PREFIX)) {
          sessionIds.push(key.substring(this.SESSION_PREFIX.length));
        }
      }
    } catch (error) {
      console.error('Failed to get session IDs:', error);
    }
    
    return sessionIds;
  }
  
  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    return this.cleanup();
  }
  
  /**
   * Clean up expired sessions
   */
  cleanup(): number {
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
  getStorageStats(): {
    sessionCount: number;
    totalSize: number;
    oldestSession: number | null;
    newestSession: number | null;
  } {
    const sessionIds = this.getAllSessionIds();
    let totalSize = 0;
    let oldestSession: number | null = null;
    let newestSession: number | null = null;
    
    for (const sessionId of sessionIds) {
      try {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        const data = sessionStorage.getItem(key);
        if (data) {
          totalSize += data.length * 2; // Rough estimate (UTF-16)
          
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
  
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  private isSessionExpired(sessionData: ImageSessionData): boolean {
    return Date.now() - sessionData.timestamp > this.MAX_SESSION_AGE;
  }
  
  private async compressSessionData(sessionData: ImageSessionData): Promise<CompressedSessionData> {
    const jsonString = JSON.stringify(sessionData);
    
    // Temporarily disable compression to avoid storage issues
    console.log(`Session data size: ${jsonString.length} bytes`);
    
    return {
      data: jsonString,
      compressed: false,
      version: this.VERSION
    };
  }
  
  private decompressSessionData(compressedData: CompressedSessionData): ImageSessionData {
    if (compressedData.compressed) {
      try {
        const decompressed = this.decompressString(compressedData.data);
        return JSON.parse(decompressed);
      } catch (error) {
        console.error('Decompression failed:', error);
        throw new Error('Failed to decompress session data');
      }
    }
    
    return JSON.parse(compressedData.data);
  }
  
  private async compressString(str: string): Promise<string> {
    // Use simple LZ-string style compression for better browser compatibility
    // Since CompressionStream has limited browser support
    try {
      const encoded = encodeURIComponent(str);
      const compressed = this.lzCompress(encoded);
      return btoa(compressed);
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return btoa(str);
    }
  }
  
  private decompressString(compressedStr: string): string {
    try {
      const decompressed = atob(compressedStr);
      const decoded = this.lzDecompress(decompressed);
      return decodeURIComponent(decoded);
    } catch (error) {
      // Fallback: try to decode as uncompressed
      try {
        return atob(compressedStr);
      } catch (fallbackError) {
        console.error('Decompression failed:', error);
        throw new Error('Failed to decompress session data');
      }
    }
  }
  
  // Simple LZ77-style compression for better browser compatibility
  private lzCompress(str: string): string {
    const dict: { [key: string]: number } = {};
    const data = str.split('');
    const result = [];
    let dictSize = 256;
    let phrase = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const curr = data[i];
      const temp = phrase + curr;
      
      if (dict[temp] !== undefined) {
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
  
  private lzDecompress(str: string): string {
    const dict: { [key: number]: string } = {};
    const data = str.split('').map(char => char.charCodeAt(0));
    let dictSize = 256;
    let phrase = String.fromCharCode(data[0]);
    const result = [phrase];
    
    for (let i = 1; i < data.length; i++) {
      const code = data[i];
      let entry: string;
      
      if (dict[code] !== undefined) {
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
    
    return result.join('');
  }
  
  private scheduleCleanup(): void {
    // Run cleanup on initialization
    setTimeout(() => this.cleanup(), 1000);
    
    // Schedule periodic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }
}

// Singleton instance
export const imageSessionManager = new ImageSessionManager();