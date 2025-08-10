const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Image Upload Functionality Tests', () => {
  test('should verify image upload and backend connectivity', async ({ page }) => {
    // Track console messages and network requests
    const consoleLogs = [];
    const networkRequests = [];
    const networkResponses = [];
    
    // Listen to console events
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // Listen to network events
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    });

    // Step 1: Navigate to the site
    console.log('Navigating to CharacterCut site...');
    await page.goto('https://background-remover-woad.vercel.app/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Step 2: Look for file input or drag-drop area
    console.log('Looking for file input or drag-drop area...');
    
    // Check for various possible upload elements
    const fileInput = page.locator('input[type="file"]');
    const dropZone = page.locator('[class*="drop"], [class*="upload"], [data-testid*="drop"], [data-testid*="upload"]');
    const uploadArea = page.locator('div:has-text("drag"), div:has-text("drop"), div:has-text("upload"), div:has-text("select")');
    
    let uploadMethod = null;
    
    if (await fileInput.count() > 0) {
      uploadMethod = 'file-input';
      console.log('Found file input element');
    } else if (await dropZone.count() > 0) {
      uploadMethod = 'drop-zone';
      console.log('Found drop zone element');
    } else if (await uploadArea.count() > 0) {
      uploadMethod = 'upload-area';
      console.log('Found upload area element');
    } else {
      // Take screenshot for debugging
      await page.screenshot({ path: 'upload-element-not-found.png' });
      throw new Error('No upload mechanism found on the page');
    }

    // Step 3: Upload an image file
    console.log('Preparing to upload test image...');
    
    // Create a simple test image path (we'll use a small PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple 1x1 PNG image for testing if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal PNG file (1x1 pixel, transparent)
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00,
        0x05, 0x00, 0x01, 0xE2, 0x26, 0x05, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngData);
    }
    
    try {
      // Upload the image based on the detected method
      if (uploadMethod === 'file-input') {
        await fileInput.first().setInputFiles(testImagePath);
      } else {
        // For drop zones, we'll try to find a hidden file input or trigger click
        const hiddenInput = page.locator('input[type="file"]').first();
        if (await hiddenInput.count() > 0) {
          await hiddenInput.setInputFiles(testImagePath);
        } else {
          // Try clicking on the upload area to trigger file dialog
          if (uploadMethod === 'drop-zone') {
            await dropZone.first().click();
          } else {
            await uploadArea.first().click();
          }
          // Wait a bit and check if file input appeared
          await page.waitForTimeout(1000);
          const dynamicInput = page.locator('input[type="file"]');
          if (await dynamicInput.count() > 0) {
            await dynamicInput.first().setInputFiles(testImagePath);
          }
        }
      }
      
      console.log('Image upload initiated...');
      
      // Step 4: Check if upload starts without CORS errors
      // Wait for potential API calls
      await page.waitForTimeout(3000);
      
    } catch (error) {
      console.log('Upload attempt failed:', error.message);
      await page.screenshot({ path: 'upload-failed.png' });
    }

    // Step 5: Monitor console for errors
    console.log('Analyzing console logs...');
    const corsErrors = consoleLogs.filter(log => 
      log.text.toLowerCase().includes('cors') || 
      log.text.toLowerCase().includes('cross-origin') ||
      log.text.toLowerCase().includes('access-control-allow-origin')
    );
    
    const apiErrors = consoleLogs.filter(log => 
      log.text.toLowerCase().includes('api') && 
      (log.type === 'error' || log.text.toLowerCase().includes('error'))
    );
    
    console.log('Console logs found:', consoleLogs.length);
    console.log('CORS errors found:', corsErrors.length);
    console.log('API errors found:', apiErrors.length);

    // Step 6: Check API endpoint calls
    console.log('Analyzing network requests...');
    const apiRequests = networkRequests.filter(req => 
      req.url.includes('/api/process') || 
      req.url.includes('/api/') ||
      req.url.includes('process')
    );
    
    const apiResponses = networkResponses.filter(res => 
      res.url.includes('/api/process') || 
      res.url.includes('/api/') ||
      res.url.includes('process')
    );
    
    console.log('API requests found:', apiRequests.length);
    console.log('API responses found:', apiResponses.length);

    // Report findings
    console.log('\n=== TEST RESULTS ===');
    
    // Check for CORS errors
    if (corsErrors.length > 0) {
      console.log('❌ CORS ERRORS DETECTED:');
      corsErrors.forEach(error => {
        console.log(`  - ${error.type}: ${error.text}`);
      });
    } else {
      console.log('✅ No CORS errors detected');
    }
    
    // Check API endpoint usage
    if (apiRequests.length > 0) {
      console.log('✅ API calls detected:');
      apiRequests.forEach(req => {
        console.log(`  - ${req.method} ${req.url}`);
      });
      
      if (apiResponses.length > 0) {
        console.log('✅ API responses received:');
        apiResponses.forEach(res => {
          console.log(`  - ${res.status} ${res.url}`);
        });
      }
    } else {
      console.log('⚠️ No API calls detected');
    }
    
    // Check for general errors
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    if (errorLogs.length > 0) {
      console.log('⚠️ Console errors found:');
      errorLogs.forEach(error => {
        console.log(`  - ${error.text}`);
      });
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Verify backend connectivity
    const hasApiCalls = apiRequests.length > 0;
    const hasValidResponses = apiResponses.some(res => res.status < 500);
    const hasNoCorsErrors = corsErrors.length === 0;
    
    console.log('\n=== CONNECTIVITY ASSESSMENT ===');
    console.log(`Upload mechanism: ${uploadMethod}`);
    console.log(`API calls made: ${hasApiCalls ? 'YES' : 'NO'}`);
    console.log(`Valid responses: ${hasValidResponses ? 'YES' : 'NO'}`);
    console.log(`CORS errors: ${hasNoCorsErrors ? 'NO' : 'YES'}`);
    console.log(`Backend connected: ${hasApiCalls && hasNoCorsErrors ? 'YES' : 'NEEDS INVESTIGATION'}`);

    // Take final screenshot
    await page.screenshot({ path: 'final-state.png' });
    
    // Assertions for test validation
    expect(corsErrors.length).toBe(0); // No CORS errors should occur
    expect(uploadMethod).toBeTruthy(); // Upload mechanism should be found
    
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });
});