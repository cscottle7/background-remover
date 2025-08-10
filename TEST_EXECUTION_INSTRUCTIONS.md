# Test Execution Instructions

## Prerequisites

1. Install Node.js (version 14 or higher)
2. Install Playwright and dependencies:

```bash
npm install
npx playwright install
```

## Running the Tests

### Primary Upload Functionality Test
```bash
# Run the comprehensive upload test
npm run test:upload

# Or run with debug mode
npm run test:debug
```

### Site Analysis Test
```bash
# Run site structure analysis
npx playwright test tests/site-analysis.spec.js
```

### All Tests
```bash
# Run all tests
npm test
```

## Test Coverage

### 1. Upload Functionality Test (`upload-functionality.spec.js`)
- **Purpose**: Verify image upload and backend connectivity
- **Checks**:
  - Navigation to https://background-remover-woad.vercel.app/
  - Detection of upload mechanisms (file input, drag-drop areas)
  - Image upload simulation with test file
  - CORS error detection
  - API endpoint monitoring (`/api/process`)
  - Console error analysis
  - Network request/response validation

### 2. Site Analysis Test (`site-analysis.spec.js`)
- **Purpose**: Analyze site structure and upload elements
- **Checks**:
  - Page load verification
  - Upload element detection
  - Framework identification
  - Console message monitoring
  - Error/loading state detection

## Expected Outcomes

### ✅ PASSING Criteria:
- Site loads without errors
- Upload mechanism detected (file input or drag-drop)
- No CORS errors in console
- API calls made to correct `/api/process` endpoint
- Backend responds (even if processing fails)

### ❌ FAILING Criteria:
- CORS errors prevent upload
- No upload mechanism found
- API calls go to wrong endpoint
- Backend completely unresponsive

## Manual Verification Steps

If automated tests cannot run:

1. **Navigate to site**: Open https://background-remover-woad.vercel.app/
2. **Check upload area**: Look for file input or drag-drop zone
3. **Open DevTools**: Monitor Network and Console tabs
4. **Upload test image**: Try uploading any small PNG/JPG
5. **Monitor requests**: Check for calls to `/api/process`
6. **Check CORS**: Look for cross-origin error messages

## Test Files Created

- `/tests/upload-functionality.spec.js` - Comprehensive upload test
- `/tests/site-analysis.spec.js` - Site structure analysis
- `/playwright.config.js` - Playwright configuration
- `/package.json` - Test dependencies and scripts
- `/run-test.js` - Alternative test runner