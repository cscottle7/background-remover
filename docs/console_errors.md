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
 🔍 Session ID: session_1754823303429_7xkcefq8u
 🔍 ERROR RECOVERY DEBUG: processWithRecovery started
 🔍 ERROR RECOVERY DEBUG: File: icon-main-character.jpg 1862076 image/jpeg
 🔍 ERROR RECOVERY DEBUG: Session ID: session_1754823303429_7xkcefq8u
 🔍 Progress update: 10 Processing your image... 1
 🔍 ERROR RECOVERY DEBUG: Attempt 1 using strategy: retry_original
 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
 🔍 Progress update: 16 Uploading image... 1
 🔍 API DEBUG: === API REQUEST START ===
 🔍 API DEBUG: URL: https://background-remover-eight-alpha.vercel.app/simple-process
 🔍 API DEBUG: Method: POST
 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
 🔍 API DEBUG: Session ID: session_1754823303429_7xkcefq8u
 Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
F @ 2.781aa3f1.js:5
background-remover-woad.vercel.app/:1 Access to fetch at 'https://background-remover-eight-alpha.vercel.app/simple-process' from origin 'https://background-remover-woad.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
background-remover-eight-alpha.vercel.app/simple-process:1  Failed to load resource: net::ERR_FAILED
 === API REQUEST FAILED ===
 Error type: TypeError
 Error message: Failed to fetch
 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-woad.vercel.app/_app/immutable/entry/start.3b2e653a.js:1:1477)
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:13516)
    at Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20144)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
 Processing time: 1397
 Processing metrics: Object
 🔍 ERROR RECOVERY DEBUG: Attempt 1 failed with error: 
 🔍 ERROR RECOVERY DEBUG: Error type: object
 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
 🔍 ERROR RECOVERY DEBUG: Error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20135)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
 🔍 ERROR RECOVERY DEBUG: Classifying error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
 🔍 ERROR RECOVERY DEBUG: Error classification: Object
 Recovery attempt 1 failed with strategy retry_original: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
overrideMethod @ installHook.js:1
 Error classification: Object
 🔍 Progress update: 30 Retrying original image... 2
 🔍 ERROR RECOVERY DEBUG: Attempt 2 using strategy: retry_original
 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
 🔍 Progress update: 36 Uploading image... 2
 🔍 API DEBUG: === API REQUEST START ===
 🔍 API DEBUG: URL: https://background-remover-eight-alpha.vercel.app/simple-process
 🔍 API DEBUG: Method: POST
 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
 🔍 API DEBUG: Session ID: session_1754823303429_7xkcefq8u
background-remover-woad.vercel.app/:1 Access to fetch at 'https://background-remover-eight-alpha.vercel.app/simple-process' from origin 'https://background-remover-woad.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
background-remover-eight-alpha.vercel.app/simple-process:1  Failed to load resource: net::ERR_FAILED
 === API REQUEST FAILED ===
2.781aa3f1.js:50 Error type: TypeError
2.781aa3f1.js:50 Error message: Failed to fetch
2.781aa3f1.js:50 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-woad.vercel.app/_app/immutable/entry/start.3b2e653a.js:1:1477)
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:13516)
    at Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20144)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 Processing time: 1085
2.781aa3f1.js:50 Processing metrics: Object
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 2 failed with error: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (2.781aa3f1.js:50:20135)
    at async Ci.T (2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error type: object
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20135)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Classifying error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error classification: Object
hook.js:608 Recovery attempt 2 failed with strategy retry_original: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
overrideMethod @ hook.js:608
2.781aa3f1.js:50 Error classification: Object
2.781aa3f1.js:54 🔍 Progress update: 50 Retrying original image... 3
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 3 using strategy: retry_original
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
2.781aa3f1.js:54 🔍 Progress update: 56 Uploading image... 3
2.781aa3f1.js:50 🔍 API DEBUG: === API REQUEST START ===
2.781aa3f1.js:50 🔍 API DEBUG: URL: https://background-remover-eight-alpha.vercel.app/simple-process
2.781aa3f1.js:50 🔍 API DEBUG: Method: POST
2.781aa3f1.js:50 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
2.781aa3f1.js:50 🔍 API DEBUG: Session ID: session_1754823303429_7xkcefq8u
background-remover-woad.vercel.app/:1 Access to fetch at 'https://background-remover-eight-alpha.vercel.app/simple-process' from origin 'https://background-remover-woad.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
background-remover-eight-alpha.vercel.app/simple-process:1  Failed to load resource: net::ERR_FAILED
2.781aa3f1.js:50 === API REQUEST FAILED ===
2.781aa3f1.js:50 Error type: TypeError
2.781aa3f1.js:50 Error message: Failed to fetch
2.781aa3f1.js:50 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-woad.vercel.app/_app/immutable/entry/start.3b2e653a.js:1:1477)
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:13516)
    at Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20144)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 Processing time: 886
2.781aa3f1.js:50 Processing metrics: Object
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 3 failed with error: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (2.781aa3f1.js:50:20135)
    at async Ci.T (2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error type: object
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20135)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Classifying error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error classification: Object
hook.js:608 Recovery attempt 3 failed with strategy retry_original: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
overrideMethod @ hook.js:608
2.781aa3f1.js:50 Error classification: Object
2.781aa3f1.js:54 🔍 Progress update: 70 Retrying original image... 4
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 4 using strategy: retry_original
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Applied recovery strategy, file size: 1862076
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Calling apiService.processImageWithSession...
2.781aa3f1.js:54 🔍 Progress update: 76 Uploading image... 4
2.781aa3f1.js:50 🔍 API DEBUG: === API REQUEST START ===
2.781aa3f1.js:50 🔍 API DEBUG: URL: https://background-remover-eight-alpha.vercel.app/simple-process
2.781aa3f1.js:50 🔍 API DEBUG: Method: POST
2.781aa3f1.js:50 🔍 API DEBUG: FormData file: icon-main-character.jpg image/jpeg 1862076
2.781aa3f1.js:50 🔍 API DEBUG: Session ID: session_1754823303429_7xkcefq8u
background-remover-woad.vercel.app/:1 Access to fetch at 'https://background-remover-eight-alpha.vercel.app/simple-process' from origin 'https://background-remover-woad.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
background-remover-eight-alpha.vercel.app/simple-process:1  Failed to load resource: net::ERR_FAILED
2.781aa3f1.js:50 === API REQUEST FAILED ===
2.781aa3f1.js:50 Error type: TypeError
2.781aa3f1.js:50 Error message: Failed to fetch
2.781aa3f1.js:50 Error stack: TypeError: Failed to fetch
    at window.fetch (https://background-remover-woad.vercel.app/_app/immutable/entry/start.3b2e653a.js:1:1477)
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:13516)
    at Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20144)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 Processing time: 792
2.781aa3f1.js:50 Processing metrics: Object
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Attempt 4 failed with error: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (2.781aa3f1.js:50:20135)
    at async Ci.T (2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error type: object
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error instanceof Error: true
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error stack: APIError: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Cl.processImageWithSession (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:16303)
    at async Dl.processWithRecovery (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:50:20135)
    at async Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:5480)
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Classifying error message: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 🔍 ERROR RECOVERY DEBUG: Error classification: Object
hook.js:608 Recovery attempt 4 failed with strategy retry_original: Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
overrideMethod @ hook.js:608
2.781aa3f1.js:50 Error classification: Object
2.781aa3f1.js:54 🔍 FRONTEND DEBUG: processWithRecovery completed
2.781aa3f1.js:54 🔍 Recovery result: Object
2.781aa3f1.js:54 🔍 FRONTEND DEBUG: Caught error in handleImageSelected
2.781aa3f1.js:54 🔍 Error object: Error: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Ci.T (2.781aa3f1.js:54:6158)
2.781aa3f1.js:54 🔍 Error type: object
2.781aa3f1.js:54 🔍 Error instanceof Error: true
2.781aa3f1.js:54 🔍 Error message: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:54 🔍 Error stack: Error: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
    at Ci.T (https://background-remover-woad.vercel.app/_app/immutable/nodes/2.781aa3f1.js:54:6158)
2.781aa3f1.js:54 🔍 Final error message set to: Processing failed after 4 attempts (retry_original, retry_original, retry_original, retry_original). Backend deployment is in progress. Please try again in a few minutes or run the app locally for immediate testing.
2.781aa3f1.js:50 Input state: processing -> error (PROCESS_ERROR)
2.781aa3f1.js:10 📊 Analytics Event: Object
2.781aa3f1.js:50 Session continuity event: Object
2.781aa3f1.js:5 🔍 UnifiedInput component mounted
2.781aa3f1.js:5 🔍 Clipboard supported: true
2.781aa3f1.js:54 Scanline processing phase completed
