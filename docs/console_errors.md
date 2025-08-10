 📊 Analytics Event: Object
 🔍 UnifiedInput component mounted
 🔍 Clipboard supported: true
 📊 Analytics Event: Object
 🔍 triggerFileInput called
 🔍 disabled: false
 🔍 fileInput: 
 🔍 File input clicked
 🔍 handleFileInputChange called
 🔍 fileInput.files: FileList
 🔍 handleFiles called with 1 files
 🔍 Processing file: icon-main-character.jpg image/jpeg 1862076
 🔍 File processed, size: 1862076
 🔍 Image data created: Object
 🔍 FRONTEND DEBUG: handleImageSelected called
 🔍 File details: icon-main-character.jpg 1862076 image/jpeg
 Input state: idle -> processing (FILE_SELECTED)
 📊 Analytics Event: Object
 🔍 imageSelected event dispatched
 🔍 FRONTEND DEBUG: About to call processWithRecovery
 🔍 Session ID: session_1754794753139_j3snscb9o
 🔍 ERROR RECOVERY DEBUG: processWithRecovery started
 🔍 ERROR RECOVERY DEBUG: File: icon-main-character.jpg 1862076 image/jpeg
 🔍 ERROR RECOVERY DEBUG: Session ID: session_1754794753139_j3snscb9o
 🔍 Progress update: 10 Processing your image... 1
 🔍 ERROR RECOVERY DEBUG: Attempt 1 using strategy: retry_original
 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
 🔍 Progress update: 16 Uploading image... 1
 🔍 API DEBUG: === API REQUEST START ===
 🔍 API DEBUG: URL: http://localhost:8000/simple-process
 🔍 API DEBUG: Method: POST
 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
 🔍 API DEBUG: Session ID: session_1754794753139_j3snscb9o
 Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
F @ 2.dc342a34.js:5
localhost:8000/simple-process:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
 === API REQUEST FAILED ===
 Error type: TypeError
 Error message: Failed to fetch
 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-eight-alpha.vercel.app/_app/immutable/entry/start.ca53ff30.js:1:1477)
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:13505)
    at El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19761)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
 Processing time: 2344
 Processing metrics: Object
 🔍 ERROR RECOVERY DEBUG: Attempt 1 failed with error: 
 🔍 ERROR RECOVERY DEBUG: Error type: object
 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
 🔍 ERROR RECOVERY DEBUG: Error message: Network error: Failed to fetch
 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:16049)
    at async El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19752)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
 🔍 ERROR RECOVERY DEBUG: Classifying error message: Network error: Failed to fetch
 🔍 ERROR RECOVERY DEBUG: Error classification: Object
 Recovery attempt 1 failed with strategy retry_original: Network error: Failed to fetch
overrideMethod @ installHook.js:1
 Error classification: Object
 Scanline processing phase completed
 Scanline processing phase completed
 🔍 Progress update: 30 Retrying original image... 2
 🔍 ERROR RECOVERY DEBUG: Attempt 2 using strategy: retry_original
 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
 🔍 Progress update: 36 Uploading image... 2
 🔍 API DEBUG: === API REQUEST START ===
 🔍 API DEBUG: URL: http://localhost:8000/simple-process
 🔍 API DEBUG: Method: POST
 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
 🔍 API DEBUG: Session ID: session_1754794753139_j3snscb9o
localhost:8000/simple-process:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
2.dc342a34.js:50 === API REQUEST FAILED ===
2.dc342a34.js:50 Error type: TypeError
2.dc342a34.js:50 Error message: Failed to fetch
2.dc342a34.js:50 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-eight-alpha.vercel.app/_app/immutable/entry/start.ca53ff30.js:1:1477)
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:13505)
    at El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19761)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
2.dc342a34.js:50 Processing time: 2321
2.dc342a34.js:50 Processing metrics: Object
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 2 failed with error: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (2.dc342a34.js:50:16049)
    at async El.processWithRecovery (2.dc342a34.js:50:19752)
    at async Ci.T (2.dc342a34.js:54:5480)
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error type: object
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error message: Network error: Failed to fetch
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:16049)
    at async El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19752)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Classifying error message: Network error: Failed to fetch
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error classification: Object
hook.js:608 Recovery attempt 2 failed with strategy retry_original: Network error: Failed to fetch
overrideMethod @ hook.js:608
2.dc342a34.js:50 Error classification: Object
2.dc342a34.js:54 🔍 Progress update: 50 Retrying original image... 3
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 3 using strategy: retry_original
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
2.dc342a34.js:54 🔍 Progress update: 56 Uploading image... 3
2.dc342a34.js:50 🔍 API DEBUG: === API REQUEST START ===
2.dc342a34.js:50 🔍 API DEBUG: URL: http://localhost:8000/simple-process
2.dc342a34.js:50 🔍 API DEBUG: Method: POST
2.dc342a34.js:50 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
2.dc342a34.js:50 🔍 API DEBUG: Session ID: session_1754794753139_j3snscb9o
localhost:8000/simple-process:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
2.dc342a34.js:50 === API REQUEST FAILED ===
2.dc342a34.js:50 Error type: TypeError
2.dc342a34.js:50 Error message: Failed to fetch
2.dc342a34.js:50 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-eight-alpha.vercel.app/_app/immutable/entry/start.ca53ff30.js:1:1477)
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:13505)
    at El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19761)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
2.dc342a34.js:50 Processing time: 2358
2.dc342a34.js:50 Processing metrics: Object
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 3 failed with error: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (2.dc342a34.js:50:16049)
    at async El.processWithRecovery (2.dc342a34.js:50:19752)
    at async Ci.T (2.dc342a34.js:54:5480)
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error type: object
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error message: Network error: Failed to fetch
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:16049)
    at async El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19752)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Classifying error message: Network error: Failed to fetch
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error classification: Object
hook.js:608 Recovery attempt 3 failed with strategy retry_original: Network error: Failed to fetch
overrideMethod @ hook.js:608
2.dc342a34.js:50 Error classification: Object
2.dc342a34.js:54 🔍 Progress update: 70 Retrying original image... 4
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 4 using strategy: retry_original
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
2.dc342a34.js:54 🔍 Progress update: 76 Uploading image... 4
2.dc342a34.js:50 🔍 API DEBUG: === API REQUEST START ===
2.dc342a34.js:50 🔍 API DEBUG: URL: http://localhost:8000/simple-process
2.dc342a34.js:50 🔍 API DEBUG: Method: POST
2.dc342a34.js:50 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
2.dc342a34.js:50 🔍 API DEBUG: Session ID: session_1754794753139_j3snscb9o
localhost:8000/simple-process:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
2.dc342a34.js:50 === API REQUEST FAILED ===
2.dc342a34.js:50 Error type: TypeError
2.dc342a34.js:50 Error message: Failed to fetch
2.dc342a34.js:50 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-eight-alpha.vercel.app/_app/immutable/entry/start.ca53ff30.js:1:1477)
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:13505)
    at El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19761)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
2.dc342a34.js:50 Processing time: 2341
2.dc342a34.js:50 Processing metrics: Object
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 4 failed with error: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (2.dc342a34.js:50:16049)
    at async El.processWithRecovery (2.dc342a34.js:50:19752)
    at async Ci.T (2.dc342a34.js:54:5480)
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error type: object
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error message: Network error: Failed to fetch
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Network error: Failed to fetch
    at yl.processImageWithSession (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:16049)
    at async El.processWithRecovery (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:50:19752)
    at async Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:5480)
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Classifying error message: Network error: Failed to fetch
2.dc342a34.js:50 🔍 ERROR RECOVERY DEBUG: Error classification: Object
hook.js:608 Recovery attempt 4 failed with strategy retry_original: Network error: Failed to fetch
overrideMethod @ hook.js:608
2.dc342a34.js:50 Error classification: Object
2.dc342a34.js:54 🔍 FRONTEND DEBUG: processWithRecovery completed
2.dc342a34.js:54 🔍 Recovery result: Object
2.dc342a34.js:54 🔍 FRONTEND DEBUG: Caught error in handleImageSelected
2.dc342a34.js:54 🔍 Error object: Error: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Network error: Failed to fetch
    at Ci.T (2.dc342a34.js:54:6158)
2.dc342a34.js:54 🔍 Error type: object
2.dc342a34.js:54 🔍 Error instanceof Error: true
2.dc342a34.js:54 🔍 Error message: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Network error: Failed to fetch
2.dc342a34.js:54 🔍 Error stack: Error: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Network error: Failed to fetch
    at Ci.T (https://background-remover-eight-alpha.vercel.app/_app/immutable/nodes/2.dc342a34.js:54:6158)
2.dc342a34.js:54 🔍 Final error message set to: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Network error: Failed to fetch
2.dc342a34.js:50 Input state: processing -> error (PROCESS_ERROR)
2.dc342a34.js:10 📊 Analytics Event: Object
2.dc342a34.js:50 Session continuity event: Object
2.dc342a34.js:5 🔍 UnifiedInput component mounted
2.dc342a34.js:5 🔍 Clipboard supported: true
