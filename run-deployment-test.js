const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'tests', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log(`Created screenshots directory: ${screenshotsDir}`);
}

// Run the deployment test
try {
  console.log('Running Vercel deployment test...\n');
  
  const result = execSync('npx playwright test tests/deployment-test.spec.js --reporter=line', {
    cwd: __dirname,
    stdio: 'inherit',
    timeout: 120000
  });
  
  console.log('\nDeployment test completed successfully!');
} catch (error) {
  console.error('Deployment test failed:', error.message);
  process.exit(1);
}