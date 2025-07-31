analytics.ts:80 📊 Analytics Event: {event_type: 'session_start', session_hash: 'session_r9if4j', timestamp: '2025-07-30T14:16:21.835Z', data: {…}}
browserCompatibility.ts:92 Starting comprehensive browser compatibility test...
analytics.ts:80 📊 Analytics Event: {event_type: 'unique_session', session_hash: 'session_r9if4j', timestamp: '2025-07-30T14:16:21.873Z', data: {…}}
browserCompatibility.ts:126 Browser compatibility test completed: {browser: 'Chrome 138', timestamp: '2025-07-30T14:16:21.869Z', overallCompatibility: 'good', score: 89, capabilities: {…}, …}
gracefulDegradation.ts:79 Graceful degradation initialized: {compatibility: 'good', score: 89, fallbacks: {…}}
inputState.ts:122 Input state: idle -> active (UPLOAD_CLICK)
inputState.ts:122 Input state: active -> processing (FILE_SELECTED)
inputState.ts:122 Input state: processing -> success (PROCESS_COMPLETE)
analytics.ts:80 📊 Analytics Event: {event_type: 'processing_start', session_hash: 'session_r9if4j', timestamp: '2025-07-30T14:16:27.905Z', data: {…}}
api.ts:65 === API REQUEST START ===
api.ts:66 URL: http://localhost:8000/process
api.ts:67 Method: POST
api.ts:68 FormData file: currency-token.jpg image/jpeg 1616352
ScanlineProcessor.svelte:338 Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
drawBackgroundDissolution @ ScanlineProcessor.svelte:338
drawFrame @ ScanlineProcessor.svelte:170
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
requestAnimationFrame
drawFrame @ ScanlineProcessor.svelte:174
+page.svelte:524 Scanline processing phase completed
+page.svelte:524 Scanline processing phase completed
api.ts:70  POST http://localhost:8000/process 500 (Internal Server Error)
window.fetch @ fetcher.js?v=b0fd4a4b:62
processImageWithSession @ api.ts:70
processWithRecovery @ errorRecovery.ts:87
await in processWithRecovery
handleImageSelected @ +page.svelte:97
await in handleImageSelected
(anonymous) @ chunk-ZOAWO7US.js?v=b0fd4a4b:1253
(anonymous) @ chunk-ZOAWO7US.js?v=b0fd4a4b:1252
handleFiles @ UnifiedInput.svelte:99
await in handleFiles
handleFileInputChange @ UnifiedInput.svelte:156
api.ts:82 === API RESPONSE RECEIVED ===
api.ts:83 Status: 500 Internal Server Error
api.ts:84 Content-Type: application/json
api.ts:85 Content-Length: 55
api.ts:86 All headers: {content-length: '55', content-type: 'application/json'}
api.ts:89 === ERROR RESPONSE ===
api.ts:91 Error data: {detail: 'Image processing failed. Please try again.'}
api.ts:130 === API REQUEST FAILED ===
api.ts:131 Error type: APIError
api.ts:132 Error message: Image processing failed. Please try again.
api.ts:133 Error stack: APIError: Image processing failed. Please try again.
    at APIService.processImageWithSession (http://localhost:3001/src/lib/services/api.ts:62:15)
    at async ProgressiveErrorRecovery.processWithRecovery (http://localhost:3001/src/lib/services/errorRecovery.ts:37:24)
    at async UnifiedInput.handleImageSelected (http://localhost:3001/src/routes/+page.svelte:1910:27)
api.ts:134 Processing time: 13404
api.ts:137 APIError status: 500
api.ts:138 APIError response: {detail: 'Image processing failed. Please try again.'}
api.ts:281 Processing metrics: {processingId: 'failed', processingTime: 13404, success: false, error: 'Image processing failed. Please try again.', timestamp: '2025-07-30T14:16:41.361Z', …}
errorRecovery.ts:138 Recovery attempt 1 failed with strategy retry_original: Image processing failed. Please try again.
overrideMethod @ hook.js:608
warn @ client.js?v=b0fd4a4b:2098
processWithRecovery @ errorRecovery.ts:138
await in processWithRecovery
handleImageSelected @ +page.svelte:97
await in handleImageSelected
(anonymous) @ chunk-ZOAWO7US.js?v=b0fd4a4b:1253
(anonymous) @ chunk-ZOAWO7US.js?v=b0fd4a4b:1252
handleFiles @ UnifiedInput.svelte:99
await in handleFiles
handleFileInputChange @ UnifiedInput.svelte:156
errorRecovery.ts:139 Error classification: {category: 'processing_failure', severity: 'medium', userMessage: 'Processing failed. This sometimes happens with complex images.', technicalMessage: 'Image processing failed. Please try again.', recoverable: true, …}
api.ts:65 === API REQUEST START ===
api.ts:66 URL: http://localhost:8000/process
api.ts:67 Method: POST
api.ts:68 FormData file: currency-token.jpg image/jpeg 443004
api.ts:70  POST http://localhost:8000/process 500 (Internal Server Error)
window.fetch @ fetcher.js?v=b0fd4a4b:62
processImageWithSession @ api.ts:70
processWithRecovery @ errorRecovery.ts:87
await in processWithRecovery
handleImageSelected @ +page.svelte:97
await in handleImageSelected
(anonymous) @ chunk-ZOAWO7US.js?v=b0fd4a4b:1253
(anonymous) @ chunk-ZOAWO7US.js?v=b0fd4a4b:1252
handleFiles @ UnifiedInput.svelte:99
await in handleFiles
handleFileInputChange @ UnifiedInput.svelte:156
api.ts:82 === API RESPONSE RECEIVED ===
api.ts:83 Status: 500 Internal Server Error
api.ts:84 Content-Type: application/json
api.ts:85 Content-Length: 55
api.ts:86 All headers: {content-length: '55', content-type: 'application/json'}
api.ts:89 === ERROR RESPONSE ===
api.ts:91 Error data: {detail: 'Image processing failed. Please try again.'}
api.ts:130 === API REQUEST FAILED ===
api.ts:131 Error type: APIError
api.ts:132 Error message: Image processing failed. Please try again.
api.ts:133 Error stack: APIError: Image processing failed. Please try again.
    at APIService.processImageWithSession (http://localhost:3001/src/lib/services/api.ts:62:15)
    at async ProgressiveErrorRecovery.processWithRecovery (http://localhost:3001/src/lib/services/errorRecovery.ts:37:24)
    at async UnifiedInput.handleImageSelected (http://localhost:3001/src/routes/+page.svelte:1910:27)
api.ts:134 Processing time: 10358
api.ts:137 APIError status: 500
api.ts:138 APIError response: {detail: 'Image processing failed. Please try again.'}
api.ts:281 Processing metrics: {processingId: 'failed', processingTime: 10358, success: false, error: 'Image processing failed. Please try again.', timestamp: '2025-07-30T14:16:54.578Z', …}
errorRecovery.ts:138 Recovery attempt 2 failed with strategy compress_image: Image processing failed. Please try again.
overrideMethod @ hook.js:608
warn @ client.js?v=b0fd4a4b:2098
processWithRecovery @ errorRecovery.ts:138
await in processWithRecovery
handleImageSelected @ +page.svelte:97
errorRecovery.ts:139 Error classification: {category: 'processing_failure', severity: 'high', userMessage: "We're having trouble processing this image. The AI…l might be struggling with this particular image.", technicalMessage: 'Image processing failed. Please try again.', recoverable: false, …}
inputState.ts:108 Invalid transition: success -> PROCESS_ERROR
overrideMethod @ hook.js:608
warn @ client.js?v=b0fd4a4b:2098
(anonymous) @ inputState.ts:108
update @ chunk-LTWQQ7UU.js?v=b0fd4a4b:38
transition @ inputState.ts:102
errorProcessing @ inputState.ts:213
handleImageSelected @ +page.svelte:166
analytics.ts:80 📊 Analytics Event: {event_type: 'task_completion', session_hash: 'session_r9if4j', timestamp: '2025-07-30T14:16:54.584Z', data: {…}}
sessionContinuity.ts:233 Session continuity event: {type: 'image_failed', timestamp: 1753885014615, sessionId: null, data: {…}}
browserCompatibility.ts:92 Starting comprehensive browser compatibility test...
browserCompatibility.ts:126 Browser compatibility test completed: {browser: 'Chrome 138', timestamp: '2025-07-30T14:16:54.635Z', overallCompatibility: 'good', score: 89, capabilities: {…}, …}
gracefulDegradation.ts:79 Graceful degradation initialized: {compatibility: 'good', score: 89, fallbacks: {…}}
