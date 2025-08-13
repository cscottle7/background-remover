const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Enhanced error detection and logging for debugging processing failures

test.describe('CharacterCut Processing Failure Debug', () => {
  test('Investigate processing failure workflow', async ({ page }) => {
    // Enable request/response logging
    const requests = [];
    const responses = [];
    const consoleMessages = [];
    
    // Capture all network requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    // Capture all network responses
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
      console.log(`← ${response.status()} ${response.url()}`);
    });
    
    // Capture console messages
    page.on('console', message => {
      const msgText = message.text();
      consoleMessages.push({
        type: message.type(),
        text: msgText,
        timestamp: new Date().toISOString()
      });
      console.log(`Console ${message.type()}: ${msgText}`);
    });
    
    // Navigate to the CharacterCut application
    console.log('Navigating to CharacterCut application...');
    await page.goto('https://background-remover-jet.vercel.app/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take screenshot of initial page
    await page.screenshot({ 
      path: 'debug_initial_page.png', 
      fullPage: true 
    });
    console.log('Initial page screenshot captured');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Look for upload elements
    const uploadElements = await page.locator('input[type="file"], [data-testid*="upload"], [class*="upload"], [class*="drop"]').all();
    console.log(`Found ${uploadElements.length} potential upload elements`);
    
    // Take screenshot after page load
    await page.screenshot({ 
      path: 'debug_page_loaded.png', 
      fullPage: true 
    });
    
    // Create a simple test image for upload
    const testImageBuffer = Buffer.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='.split(',')[1], 'base64');
    const testImagePath = path.join(__dirname, 'test_image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    try {
      // Method 1: Try file input upload
      console.log('Attempting file input upload...');
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        console.log('File input found, attempting upload...');
        await fileInput.setInputFiles(testImagePath);
        
        // Wait for any processing to start
        await page.waitForTimeout(2000);
        
        // Take screenshot after upload attempt
        await page.screenshot({ 
          path: 'debug_after_upload.png', 
          fullPage: true 
        });
        
        // Look for processing indicators
        const processingElements = await page.locator('[class*="process"], [class*="loading"], [data-testid*="process"]').all();
        console.log(`Found ${processingElements.length} processing indicators`);
        
        // Wait for processing to complete or error
        await page.waitForTimeout(10000);
        
        // Take screenshot after processing
        await page.screenshot({ 
          path: 'debug_after_processing.png', 
          fullPage: true 
        });
      }
      
      // Method 2: Try drag and drop area
      console.log('Looking for drag and drop area...');
      const dropZone = page.locator('[class*="drop"], [data-testid*="drop"], [class*="upload"]').first();
      
      if (await dropZone.count() > 0) {
        console.log('Drop zone found, attempting drag and drop...');
        
        // Create a file for drag and drop
        const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
        await page.dispatchEvent(dropZone, 'drop', { dataTransfer });
        
        await page.waitForTimeout(2000);
        await page.screenshot({ 
          path: 'debug_after_dragdrop.png', 
          fullPage: true 
        });
      }
      
      // Method 3: Try paste functionality (if available)
      console.log('Testing paste functionality...');
      await page.keyboard.press('Control+V');
      await page.waitForTimeout(2000);
      
      // Look for error messages
      const errorElements = await page.locator('[class*="error"], [data-testid*="error"], .alert, [role="alert"]').all();
      console.log(`Found ${errorElements.length} error elements`);
      
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`Test execution error: ${error.message}`);
      await page.screenshot({ 
        path: 'debug_error_state.png', 
        fullPage: true 
      });
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'debug_final_state.png', 
      fullPage: true 
    });
    
    // Log all captured data for analysis
    console.log('\n=== NETWORK REQUESTS ===');
    requests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
    });
    
    console.log('\n=== NETWORK RESPONSES ===');
    responses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} ${res.url} at ${res.timestamp}`);
    });
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text} at ${msg.timestamp}`);
    });
    
    // Look for failed API calls
    const failedRequests = responses.filter(res => res.status >= 400);
    console.log(`\n=== FAILED REQUESTS (${failedRequests.length}) ===`);
    failedRequests.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} ${res.url}`);
    });
    
    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });
});