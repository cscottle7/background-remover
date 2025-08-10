import { test, expect } from '@playwright/test';

test.describe('Vercel Deployment Verification', () => {
  const BASE_URL = 'https://background-remover-eight-alpha.vercel.app';
  
  test('Health endpoint should return healthy status', async ({ page }) => {
    console.log('Testing health endpoint...');
    
    // First attempt
    let response;
    try {
      response = await page.request.get(`${BASE_URL}/api/health`);
      console.log(`First attempt - Status: ${response.status()}`);
    } catch (error) {
      console.log(`First attempt failed: ${error.message}`);
    }
    
    // If first attempt fails or returns 404, wait 30 seconds and retry
    if (!response || response.status() === 404) {
      console.log('Health endpoint not ready yet, waiting 30 seconds...');
      await page.waitForTimeout(30000);
      
      try {
        response = await page.request.get(`${BASE_URL}/api/health`);
        console.log(`Second attempt - Status: ${response.status()}`);
      } catch (error) {
        console.log(`Second attempt failed: ${error.message}`);
        throw error;
      }
    }
    
    // Verify response
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    console.log('Health endpoint response:', responseBody);
    
    expect(responseBody).toHaveProperty('status', 'healthy');
    expect(responseBody).toHaveProperty('timestamp');
    expect(responseBody).toHaveProperty('service', 'CharacterCut API');
  });
  
  test('Frontend should load correctly', async ({ page }) => {
    console.log('Testing frontend...');
    
    await page.goto(BASE_URL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title or key elements
    await expect(page).toHaveTitle(/CharacterCut|Remove/i);
    
    // Take screenshot of the frontend
    await page.screenshot({ 
      path: 'C:\\Users\\cscot\\Documents\\Apps\\Remove background\\tests\\screenshots\\frontend-deployment.png',
      fullPage: true 
    });
    
    console.log('Frontend screenshot saved to: tests/screenshots/frontend-deployment.png');
    
    // Check for key elements (adjust selectors based on your actual frontend)
    const uploadArea = page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]').first();
    if (await uploadArea.count() > 0) {
      console.log('Upload area found - frontend appears to be working');
    } else {
      console.log('Upload area not found - checking for other key elements');
    }
  });
  
  test('API endpoint structure verification', async ({ page }) => {
    console.log('Testing API endpoint structure...');
    
    // Test non-existent endpoint to verify API routing is working
    const notFoundResponse = await page.request.get(`${BASE_URL}/api/nonexistent`);
    console.log(`Non-existent endpoint status: ${notFoundResponse.status()}`);
    
    // Should return 404 or 405, not a frontend page
    expect([404, 405]).toContain(notFoundResponse.status());
    
    // Test if process endpoint exists (should return 405 for GET request)
    const processResponse = await page.request.get(`${BASE_URL}/api/process`);
    console.log(`Process endpoint GET status: ${processResponse.status()}`);
    
    // Process endpoint should exist but not accept GET requests
    expect([405, 501]).toContain(processResponse.status());
  });
});