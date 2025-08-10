const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Investigate CharacterCut live deployment and UI changes', async ({ page }) => {
  console.log('Starting investigation of live CharacterCut deployment...');
  
  // Navigate to the live site
  await page.goto('https://background-remover-eight-alpha.vercel.app/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  console.log('✓ Successfully navigated to live site');
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'screenshots/live-site-initial.png',
    fullPage: true 
  });
  
  // Check for any version/deployment indicators
  const versionInfo = await page.evaluate(() => {
    // Look for any deployment info in meta tags, data attributes, or console logs
    const metas = Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.name || m.property,
      content: m.content
    }));
    
    const buildInfo = {
      title: document.title,
      metas: metas,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    return buildInfo;
  });
  
  console.log('Deployment Info:', JSON.stringify(versionInfo, null, 2));
  
  // Check network resources and their timestamps
  const resourceTimings = await page.evaluate(() => {
    return performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      responseStart: entry.responseStart,
      transferSize: entry.transferSize
    }));
  });
  
  console.log('Key resources loaded:');
  resourceTimings
    .filter(r => r.name.includes('.js') || r.name.includes('.css'))
    .forEach(r => console.log(`  ${r.type}: ${r.name} (${r.duration.toFixed(2)}ms)`));
  
  // Look for the main upload area
  const uploadArea = await page.locator('[data-testid="upload-area"], .upload-area, .dropzone, input[type="file"]').first();
  await expect(uploadArea).toBeVisible({ timeout: 10000 });
  
  console.log('✓ Found upload area');
  
  // Create a test image for upload (simple 100x100 colored rectangle)
  const testImagePath = path.join(__dirname, 'test-character.png');
  
  // Generate a simple test image using Canvas API in the browser
  const imageDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple character-like shape
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(50, 50, 100, 150); // Body
    ctx.fillStyle = '#F5A623';
    ctx.beginPath();
    ctx.arc(100, 75, 25, 0, 2 * Math.PI); // Head
    ctx.fill();
    
    return canvas.toDataURL('image/png');
  });
  
  // Convert data URL to file and save locally for upload
  const base64Data = imageDataUrl.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(testImagePath, imageBuffer);
  
  console.log('✓ Created test image for upload');
  
  // Upload the test image
  const fileInput = await page.locator('input[type="file"]').first();
  if (await fileInput.isVisible()) {
    await fileInput.setInputFiles(testImagePath);
    console.log('✓ Uploaded test image via file input');
  } else {
    // Try drag and drop if file input not visible
    const uploadZone = await page.locator('[data-testid="upload-area"], .upload-area, .dropzone').first();
    await uploadZone.setInputFiles(testImagePath);
    console.log('✓ Uploaded test image via drag/drop zone');
  }
  
  // Wait for processing to complete
  console.log('Waiting for image processing...');
  await page.waitForTimeout(5000); // Allow processing time
  
  // Look for processed result and refinement tools
  const refineButton = await page.locator('button:has-text("Refine"), button:has-text("Refine Edge"), [data-testid="refine-button"]').first();
  
  if (await refineButton.isVisible({ timeout: 15000 })) {
    console.log('✓ Found refine button, clicking to access refinement tools');
    await refineButton.click();
    await page.waitForTimeout(2000);
    
    // Take screenshot of refinement interface
    await page.screenshot({ 
      path: 'screenshots/refinement-interface.png',
      fullPage: true 
    });
    
    // Inspect Cancel and Apply buttons
    const cancelButton = await page.locator('button:has-text("Cancel"), [data-testid="cancel-button"]').first();
    const applyButton = await page.locator('button:has-text("Apply"), [data-testid="apply-button"]').first();
    
    if (await cancelButton.isVisible()) {
      const cancelClasses = await cancelButton.getAttribute('class');
      console.log('Cancel Button Classes:', cancelClasses);
      
      const cancelStyles = await cancelButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          border: computed.border,
          borderColor: computed.borderColor,
          padding: computed.padding,
          borderRadius: computed.borderRadius,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight
        };
      });
      console.log('Cancel Button Computed Styles:', cancelStyles);
    } else {
      console.log('❌ Cancel button not found');
    }
    
    if (await applyButton.isVisible()) {
      const applyClasses = await applyButton.getAttribute('class');
      console.log('Apply Button Classes:', applyClasses);
      
      const applyStyles = await applyButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          border: computed.border,
          borderColor: computed.borderColor,
          padding: computed.padding,
          borderRadius: computed.borderRadius,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight
        };
      });
      console.log('Apply Button Computed Styles:', applyStyles);
    } else {
      console.log('❌ Apply button not found');
    }
    
    // Test erase tool functionality
    console.log('Testing erase tool...');
    const eraseButton = await page.locator('button:has-text("Erase"), [data-testid="erase-tool"], .erase-tool').first();
    if (await eraseButton.isVisible()) {
      console.log('✓ Found erase tool');
      await eraseButton.click();
      await page.waitForTimeout(1000);
      
      // Check if tool is active
      const eraseClasses = await eraseButton.getAttribute('class');
      console.log('Erase Tool Classes:', eraseClasses);
      
      // Try using the tool (click on image area)
      const canvas = await page.locator('canvas').first();
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 100, y: 100 } });
        console.log('✓ Clicked on canvas with erase tool');
      }
    } else {
      console.log('❌ Erase tool not found');
    }
    
    // Test restore tool functionality
    console.log('Testing restore tool...');
    const restoreButton = await page.locator('button:has-text("Restore"), [data-testid="restore-tool"], .restore-tool').first();
    if (await restoreButton.isVisible()) {
      console.log('✓ Found restore tool');
      await restoreButton.click();
      await page.waitForTimeout(1000);
      
      // Check if tool is active
      const restoreClasses = await restoreButton.getAttribute('class');
      console.log('Restore Tool Classes:', restoreClasses);
      
      // Try using the tool (click on image area)
      const canvas = await page.locator('canvas').first();
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 150, y: 150 } });
        console.log('✓ Clicked on canvas with restore tool');
      }
    } else {
      console.log('❌ Restore tool not found');
    }
    
    // Take final screenshot after testing tools
    await page.screenshot({ 
      path: 'screenshots/after-tool-testing.png',
      fullPage: true 
    });
    
  } else {
    console.log('❌ Could not find refine button or access refinement tools');
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'screenshots/no-refine-button.png',
      fullPage: true 
    });
    
    // Check what elements are available
    const availableButtons = await page.locator('button').allTextContents();
    console.log('Available buttons on page:', availableButtons);
  }
  
  // Check all loaded stylesheets
  const stylesheets = await page.evaluate(() => {
    return Array.from(document.styleSheets).map(sheet => {
      try {
        return {
          href: sheet.href,
          rules: sheet.cssRules ? sheet.cssRules.length : 'blocked',
          media: sheet.media ? Array.from(sheet.media) : []
        };
      } catch (e) {
        return { href: sheet.href, error: e.message };
      }
    });
  });
  
  console.log('Loaded stylesheets:');
  stylesheets.forEach(sheet => {
    console.log(`  ${sheet.href}: ${sheet.rules} rules`);
  });
  
  // Check for any CSS custom properties (variables) that might indicate our theme
  const cssVariables = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = window.getComputedStyle(root);
    const variables = {};
    
    for (let i = 0; i < styles.length; i++) {
      const property = styles[i];
      if (property.startsWith('--')) {
        variables[property] = styles.getPropertyValue(property);
      }
    }
    
    return variables;
  });
  
  console.log('CSS Variables found:');
  Object.entries(cssVariables).forEach(([prop, value]) => {
    if (prop.includes('dark') || prop.includes('border') || prop.includes('text')) {
      console.log(`  ${prop}: ${value}`);
    }
  });
  
  // Clean up test image
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
  
  console.log('Investigation complete. Check screenshots folder for visual evidence.');
});