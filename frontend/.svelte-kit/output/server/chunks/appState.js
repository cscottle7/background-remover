import { w as writable, d as derived } from "./index.js";
const sessionId = writable(generateSessionId());
const sessionData = writable({
  imagesProcessed: 0,
  startTime: /* @__PURE__ */ new Date(),
  lastActivity: /* @__PURE__ */ new Date()
});
const processingState = writable({
  status: "idle",
  // 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: 0,
  message: "",
  processingId: null,
  error: null
});
const currentImage = writable(null);
const processedImage = writable(null);
const showPreview = writable(false);
const isDropzoneActive = writable(false);
const clipboardSupported = writable(false);
derived(
  [sessionData, processingState],
  ([$sessionData, $processingState]) => ({
    shouldShowProcessAnother: $sessionData.imagesProcessed > 0 && $processingState.status === "completed",
    meetsTarget: $sessionData.imagesProcessed >= 2,
    sessionDuration: Date.now() - $sessionData.startTime.getTime()
  })
);
derived(
  [processingState, sessionData],
  ([$processingState, $sessionData]) => ({
    isUnder5Seconds: $processingState.processingTime ? $processingState.processingTime < 5e3 : null,
    averageProcessingTime: $sessionData.totalProcessingTime ? $sessionData.totalProcessingTime / $sessionData.imagesProcessed : null,
    successRate: $sessionData.imagesProcessed > 0 ? ($sessionData.successfulProcesses || 0) / $sessionData.imagesProcessed : null
  })
);
const appState = derived(
  [processingState, currentImage, processedImage, isDropzoneActive, clipboardSupported],
  ([$processingState, $currentImage, $processedImage, $isDropzoneActive, $clipboardSupported]) => ({
    processingState: $processingState,
    currentImage: $currentImage,
    processedImage: $processedImage,
    isDropzoneActive: $isDropzoneActive,
    clipboardSupported: $clipboardSupported
  })
);
const appActions = {
  // Session management
  updateSessionActivity() {
    sessionData.update((data) => ({
      ...data,
      lastActivity: /* @__PURE__ */ new Date()
    }));
  },
  incrementImagesProcessed(processingTime, success = true) {
    sessionData.update((data) => ({
      ...data,
      imagesProcessed: data.imagesProcessed + 1,
      totalProcessingTime: (data.totalProcessingTime || 0) + processingTime,
      successfulProcesses: success ? (data.successfulProcesses || 0) + 1 : data.successfulProcesses || 0,
      lastActivity: /* @__PURE__ */ new Date()
    }));
  },
  // Processing state management
  setProcessingState(updates) {
    processingState.update((state) => ({ ...state, ...updates }));
  },
  setProcessingStatus(status) {
    processingState.update((state) => ({ ...state, status }));
  },
  // Complete reset for session continuity
  reset() {
    appActions.resetProcessing();
    sessionId.set(generateSessionId());
  },
  startProcessing(processingId) {
    processingState.set({
      status: "processing",
      progress: 0,
      message: "Initializing background removal...",
      processingId,
      error: null,
      startTime: Date.now()
    });
  },
  updateProgress(progress, message) {
    processingState.update((state) => ({
      ...state,
      progress,
      message
    }));
  },
  completeProcessing(downloadUrl, processingTime) {
    processingState.update((state) => ({
      ...state,
      status: "completed",
      progress: 100,
      message: "Processing complete!",
      downloadUrl,
      processingTime
    }));
    appActions.incrementImagesProcessed(processingTime, true);
  },
  setError(error) {
    processingState.update((state) => ({
      ...state,
      status: "error",
      error,
      message: "Processing failed"
    }));
    appActions.incrementImagesProcessed(0, false);
  },
  resetProcessing() {
    processingState.set({
      status: "idle",
      progress: 0,
      message: "",
      processingId: null,
      error: null
    });
    currentImage.set(null);
    processedImage.set(null);
    showPreview.set(false);
  },
  // Image management
  setCurrentImage(image) {
    currentImage.set(image);
    appActions.updateSessionActivity();
  },
  setProcessedImage(image) {
    processedImage.set(image);
  },
  // UI state management
  setDropzoneActive(active) {
    isDropzoneActive.set(active);
  },
  setClipboardSupported(supported) {
    clipboardSupported.set(supported);
  },
  togglePreview() {
    showPreview.update((show) => !show);
  }
};
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function detectClipboardSupport() {
  return !!(navigator.clipboard && navigator.clipboard.read);
}
if (typeof window !== "undefined") {
  appActions.setClipboardSupported(detectClipboardSupport());
}
export {
  appState as a
};
