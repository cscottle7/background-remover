const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDeployment() {
  const BASE_URL = 'https://background-remover-eight-alpha.vercel.app';
  let browser;
  
  try {
    console.log('🚀 Starting Vercel deployment test...\n');
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    console.log('1. Testing health endpoint...');
    
    // Test health endpoint - first attempt
    let healthResponse;
    try {
      healthResponse = await page.request.get(`${BASE_URL}/api/health`);
      console.log(`   First attempt - Status: ${healthResponse.status()}`);
    } catch (error) {
      console.log(`   First attempt failed: ${error.message}`);
    }
    
    // If first attempt fails, wait and retry
    if (!healthResponse || healthResponse.status() === 404) {
      console.log('   Health endpoint not ready, waiting 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      try {
        healthResponse = await page.request.get(`${BASE_URL}/api/health`);
        console.log(`   Second attempt - Status: ${healthResponse.status()}`);
      } catch (error) {
        console.log(`   Second attempt failed: ${error.message}`);
        throw error;
      }
    }
    
    // Verify health response
    if (healthResponse.status() === 200) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health endpoint working!');
      console.log('   Response:', JSON.stringify(healthData, null, 2));
      
      if (healthData.status === 'healthy') {
        console.log('   ✅ Service status is healthy');
      } else {
        console.log('   ⚠️  Service status is not healthy');
      }
    } else {
      console.log(`   ❌ Health endpoint failed with status: ${healthResponse.status()}`);
    }
    
    console.log('\n2. Testing frontend...');
    
    // Test frontend
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    const title = await page.title();
    console.log(`   Page title: "${title}"`);
    
    // Take screenshot
    const screenshotPath = path.join(screenshotsDir, 'frontend-deployment.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`   ✅ Frontend screenshot saved: ${screenshotPath}`);
    
    // Check for upload elements
    const uploadElements = await page.locator('input[type="file"], .upload-area, [data-testid="upload-area"]').count();
    if (uploadElements > 0) {
      console.log('   ✅ Upload interface found');
    } else {
      console.log('   ⚠️  Upload interface not found');
    }
    
    console.log('\n3. Testing API structure...');
    
    // Test API routing
    const notFoundResponse = await page.request.get(`${BASE_URL}/api/nonexistent`);
    console.log(`   Non-existent endpoint status: ${notFoundResponse.status()}`);
    
    const processResponse = await page.request.get(`${BASE_URL}/api/process`);
    console.log(`   Process endpoint GET status: ${processResponse.status()}`);
    
    console.log('\n🎉 Deployment test completed!');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Health endpoint: ${healthResponse.status() === 200 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Frontend: ✅ LOADED`);
    console.log(`   API routing: ${[404, 405].includes(notFoundResponse.status()) ? '✅ WORKING' : '⚠️  UNKNOWN'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDeployment();