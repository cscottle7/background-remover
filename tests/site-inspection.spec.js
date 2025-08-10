const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('CharacterCut Live Site Inspection', () => {
  test('comprehensive site inspection for deployment verification', async ({ page }) => {
    // Enable console logging to capture any JavaScript errors
    page.on('console', msg => console.log('Console:', msg.text()));
    page.on('pageerror', error => console.log('Page Error:', error.message));

    // Navigate to live site
    console.log('1. Navigating to live site...');
    await page.goto('https://background-remover-eight-alpha.vercel.app/');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'live-site-initial.png', 
      fullPage: true 
    });
    console.log('Screenshot saved: live-site-initial.png');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check network requests and resources
    console.log('7. Checking network resources...');
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      }
    });

    // Create a test image for upload
    console.log('2. Preparing test image upload...');
    
    // Look for upload area or input
    const uploadArea = page.locator('[data-testid="upload-area"], input[type="file"], .dropzone, .upload-zone').first();
    
    if (await uploadArea.isVisible()) {
      // Create a simple test image (we'll use a data URL approach)
      const testImagePath = path.join(__dirname, 'test-character.png');
      
      // If there's a file input, use that
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        // For now, let's simulate the upload process without an actual file
        // We'll look for the upload interface elements
        console.log('Found file input element');
        
        // Take screenshot of upload interface
        await page.screenshot({ 
          path: 'upload-interface.png'
        });
        console.log('Screenshot saved: upload-interface.png');
      }
    }

    // Look for any existing processed image or refinement tools
    console.log('3. Looking for refinement tools...');
    
    // Wait a moment for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Check for refine buttons
    const refineButtons = page.locator('button:has-text("Refine"), .refine-btn, [data-testid*="refine"]');
    const refineButtonCount = await refineButtons.count();
    console.log(`Found ${refineButtonCount} refine-related buttons`);

    if (refineButtonCount > 0) {
      await page.screenshot({ 
        path: 'refine-buttons.png'
      });
      console.log('Screenshot saved: refine-buttons.png');
    }

    // Look for Cancel and Apply buttons
    console.log('4. Inspecting Cancel and Apply buttons...');
    
    const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid*="cancel"]');
    const applyButton = page.locator('button:has-text("Apply"), .apply-btn, [data-testid*="apply"]');
    
    const cancelCount = await cancelButton.count();
    const applyCount = await applyButton.count();
    
    console.log(`Found ${cancelCount} Cancel buttons and ${applyCount} Apply buttons`);

    // If buttons exist, inspect their CSS classes
    if (cancelCount > 0 || applyCount > 0) {
      await page.screenshot({ 
        path: 'action-buttons.png'
      });
      console.log('Screenshot saved: action-buttons.png');
      
      // Inspect CSS classes
      if (cancelCount > 0) {
        const cancelClasses = await cancelButton.first().getAttribute('class');
        console.log('Cancel button classes:', cancelClasses);
        
        // Check for expected classes
        const hasPadding = cancelClasses && (cancelClasses.includes('px-8') || cancelClasses.includes('py-4'));
        const hasBorderStyle = cancelClasses && cancelClasses.includes('border-dark-border');
        const hasTextStyle = cancelClasses && cancelClasses.includes('text-dark-text-secondary');
        
        console.log('Cancel button analysis:', {
          hasPadding,
          hasBorderStyle,
          hasTextStyle,
          fullClasses: cancelClasses
        });
      }
      
      if (applyCount > 0) {
        const applyClasses = await applyButton.first().getAttribute('class');
        console.log('Apply button classes:', applyClasses);
        
        const hasBtnMagic = applyClasses && applyClasses.includes('btn-magic');
        const hasPadding = applyClasses && (applyClasses.includes('px-8') || applyClasses.includes('py-4'));
        
        console.log('Apply button analysis:', {
          hasBtnMagic,
          hasPadding,
          fullClasses: applyClasses
        });
      }
    }

    // Look for tolerance slider
    console.log('5. Testing tolerance slider...');
    
    const toleranceSlider = page.locator('input[type="range"], .slider, [data-testid*="tolerance"]');
    const sliderCount = await toleranceSlider.count();
    console.log(`Found ${sliderCount} slider elements`);

    if (sliderCount > 0) {
      await page.screenshot({ 
        path: 'tolerance-slider.png'
      });
      console.log('Screenshot saved: tolerance-slider.png');
      
      // Try to interact with the slider
      try {
        await toleranceSlider.first().fill('50');
        console.log('Successfully adjusted slider value');
      } catch (error) {
        console.log('Could not adjust slider:', error.message);
      }
    }

    // Look for erase and restore tools
    console.log('6. Testing erase and restore tools...');
    
    const eraseButton = page.locator('button:has-text("Erase"), .erase-btn, [data-testid*="erase"]');
    const restoreButton = page.locator('button:has-text("Restore"), .restore-btn, [data-testid*="restore"]');
    
    const eraseCount = await eraseButton.count();
    const restoreCount = await restoreButton.count();
    
    console.log(`Found ${eraseCount} erase buttons and ${restoreCount} restore buttons`);

    if (eraseCount > 0 || restoreCount > 0) {
      await page.screenshot({ 
        path: 'editing-tools.png'
      });
      console.log('Screenshot saved: editing-tools.png');
    }

    // Inspect page source for component code
    console.log('8. Inspecting page source...');
    
    const pageContent = await page.content();
    const hasRefinedComponent = pageContent.includes('refine') || pageContent.includes('Refine');
    const hasToleranceFeature = pageContent.includes('tolerance') || pageContent.includes('Tolerance');
    const hasEditingFeatures = pageContent.includes('erase') || pageContent.includes('restore');
    
    console.log('Page content analysis:', {
      hasRefinedComponent,
      hasToleranceFeature,
      hasEditingFeatures,
      pageLength: pageContent.length
    });

    // Check for any JavaScript errors in console
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    await page.waitForTimeout(3000); // Wait to capture any delayed errors
    
    console.log('Console messages captured:', consoleMessages.length);
    if (consoleMessages.length > 0) {
      console.log('Recent console messages:', consoleMessages.slice(-5));
    }

    // Final comprehensive screenshot
    await page.screenshot({ 
      path: 'final-site-state.png', 
      fullPage: true 
    });
    console.log('Screenshot saved: final-site-state.png');

    // Summary report
    console.log('\n=== INSPECTION SUMMARY ===');
    console.log(`Site loaded successfully: ${await page.title()}`);
    console.log(`Refine buttons found: ${refineButtonCount}`);
    console.log(`Cancel buttons found: ${cancelCount}`);
    console.log(`Apply buttons found: ${applyCount}`);
    console.log(`Tolerance sliders found: ${sliderCount}`);
    console.log(`Erase tools found: ${eraseCount}`);
    console.log(`Restore tools found: ${restoreCount}`);
    console.log(`Network responses captured: ${responses.length}`);
    console.log('========================');

    // The test passes if we can navigate and inspect the site
    expect(await page.title()).toBeTruthy();
  });
});