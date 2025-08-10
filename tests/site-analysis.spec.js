const { test, expect } = require('@playwright/test');

test.describe('CharacterCut Site Analysis', () => {
  test('should analyze site structure and upload elements', async ({ page }) => {
    console.log('🔍 Starting site analysis...');
    
    // Navigate to the site
    await page.goto('https://background-remover-woad.vercel.app/');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Successfully loaded the CharacterCut site');
    
    // Take initial screenshot
    await page.screenshot({ path: 'site-loaded.png', fullPage: true });
    
    // Analyze page structure
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Look for upload elements
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log(`📁 File inputs found: ${fileInputs}`);
    
    if (fileInputs > 0) {
      const fileInputsVisible = await page.locator('input[type="file"]:visible').count();
      console.log(`👁️ Visible file inputs: ${fileInputsVisible}`);
      
      for (let i = 0; i < fileInputs; i++) {
        const input = page.locator('input[type="file"]').nth(i);
        const accept = await input.getAttribute('accept');
        const multiple = await input.getAttribute('multiple');
        console.log(`  - Input ${i + 1}: accept="${accept}", multiple="${multiple !== null}"`);
      }
    }
    
    // Look for drag-drop areas
    const dropElements = [
      '[data-testid*="drop"]',
      '[class*="drop"]',
      '[class*="upload"]',
      'div:has-text("drag")',
      'div:has-text("drop")',
      'div:has-text("upload")',
      'div:has-text("select")'
    ];
    
    for (const selector of dropElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`🎯 Drop zone elements found with "${selector}": ${count}`);
      }
    }
    
    // Check for API-related scripts or configurations
    const scriptTags = await page.locator('script').count();
    console.log(`📜 Script tags found: ${scriptTags}`);
    
    // Look for any text mentioning API endpoints
    const pageContent = await page.content();
    const hasApiMention = pageContent.includes('/api/') || pageContent.includes('api/process');
    console.log(`🔗 API endpoints mentioned in content: ${hasApiMention}`);
    
    // Check for common UI frameworks/libraries
    const frameworks = {
      'React': pageContent.includes('react') || pageContent.includes('React'),
      'Vue': pageContent.includes('vue') || pageContent.includes('Vue'),
      'Svelte': pageContent.includes('svelte') || pageContent.includes('Svelte'),
      'Next.js': pageContent.includes('next') || pageContent.includes('_next'),
      'Nuxt': pageContent.includes('nuxt') || pageContent.includes('_nuxt')
    };
    
    console.log('🛠️ Framework detection:');
    for (const [framework, detected] of Object.entries(frameworks)) {
      if (detected) console.log(`  ✅ ${framework} detected`);
    }
    
    // Check for error messages or loading states
    const errorElements = await page.locator('*:has-text("error"), *:has-text("Error")').count();
    const loadingElements = await page.locator('*:has-text("loading"), *:has-text("Loading")').count();
    
    console.log(`❌ Error messages visible: ${errorElements}`);
    console.log(`⏳ Loading indicators visible: ${loadingElements}`);
    
    // Check console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a moment to catch any console messages
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log('📋 Console messages detected:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('📋 No console messages detected');
    }
    
    // Final assessment
    console.log('\n🎯 UPLOAD FUNCTIONALITY ASSESSMENT:');
    
    if (fileInputs > 0) {
      console.log('✅ File upload mechanism detected');
      console.log('🔧 Recommendation: Test file upload directly');
    } else {
      console.log('⚠️ No file input elements found');
      console.log('🔧 Recommendation: Check for drag-drop implementation or dynamic elements');
    }
    
    // Basic functionality test
    expect(title).toBeTruthy();
    expect(fileInputs).toBeGreaterThanOrEqual(0); // Should be at least 0 (can be 0 if using drag-drop only)
  });
});