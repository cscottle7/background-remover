const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Playwright test execution...');
console.log('Current directory:', process.cwd());

// Run the Playwright test
const testProcess = spawn('npx', [
  'playwright', 'test', 
  'tests/upload-functionality.spec.js',
  '--reporter=line',
  '--timeout=60000'
], {
  stdio: 'pipe',
  shell: true,
  cwd: path.resolve(__dirname)
});

testProcess.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

testProcess.stderr.on('data', (data) => {
  console.log(`STDERR: ${data}`);
});

testProcess.on('close', (code) => {
  console.log(`\nTest process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Test execution completed successfully');
  } else {
    console.log('❌ Test execution failed or had issues');
  }
});

testProcess.on('error', (error) => {
  console.log(`❌ Failed to start test process: ${error.message}`);
});

// Set a timeout to prevent hanging
setTimeout(() => {
  if (!testProcess.killed) {
    console.log('Terminating test process due to timeout...');
    testProcess.kill();
  }
}, 90000); // 90 second timeout