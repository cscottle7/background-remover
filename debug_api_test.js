// Manual API testing script to debug processing failures
const https = require('https');
const http = require('http');
const fs = require('fs');

console.log('Starting CharacterCut API Debug Test...\n');

// Test the main application URL
function testMainPage() {
    return new Promise((resolve, reject) => {
        console.log('Testing main application page...');
        
        const options = {
            hostname: 'background-remover-jet.vercel.app',
            port: 443,
            path: '/',
            method: 'GET',
            headers: {
                'User-Agent': 'CharacterCut-Debug-Test/1.0'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`Main page status: ${res.statusCode}`);
            console.log(`Main page headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`Main page response length: ${data.length} characters`);
                
                // Look for API endpoints in the response
                const apiMatches = data.match(/\/api\/[^"'\s]*/g);
                if (apiMatches) {
                    console.log('Found API endpoints:', apiMatches);
                }
                
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                    apiEndpoints: apiMatches || []
                });
            });
        });

        req.on('error', (e) => {
            console.error(`Main page error: ${e.message}`);
            reject(e);
        });

        req.setTimeout(10000, () => {
            console.error('Main page request timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Test common API endpoints that might be used for image processing
function testApiEndpoints() {
    const commonEndpoints = [
        '/api/process',
        '/api/remove-background',
        '/api/upload',
        '/api/process-image',
        '/api/rembg'
    ];
    
    return Promise.all(commonEndpoints.map(endpoint => {
        return new Promise((resolve) => {
            console.log(`Testing endpoint: ${endpoint}`);
            
            const options = {
                hostname: 'background-remover-jet.vercel.app',
                port: 443,
                path: endpoint,
                method: 'GET',
                headers: {
                    'User-Agent': 'CharacterCut-Debug-Test/1.0'
                }
            };

            const req = https.request(options, (res) => {
                console.log(`${endpoint} status: ${res.statusCode}`);
                
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        headers: res.headers,
                        body: data.substring(0, 200) // First 200 chars only
                    });
                });
            });

            req.on('error', (e) => {
                console.error(`${endpoint} error: ${e.message}`);
                resolve({
                    endpoint,
                    error: e.message
                });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve({
                    endpoint,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }));
}

// Create a simple test image
function createTestImage() {
    // 1x1 pixel PNG in base64
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return Buffer.from(pngData, 'base64');
}

// Test image upload to discovered endpoints
function testImageUpload(endpoints) {
    const testImage = createTestImage();
    const uploadEndpoints = endpoints.filter(ep => 
        ep.includes('process') || ep.includes('upload') || ep.includes('remove')
    );
    
    if (uploadEndpoints.length === 0) {
        console.log('No upload endpoints found to test');
        return Promise.resolve([]);
    }
    
    return Promise.all(uploadEndpoints.map(endpoint => {
        return new Promise((resolve) => {
            console.log(`Testing image upload to: ${endpoint}`);
            
            const boundary = '----CharacterCutDebugBoundary';
            const formData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="image"; filename="test.png"',
                'Content-Type: image/png',
                '',
                testImage.toString('binary'),
                `--${boundary}--`
            ].join('\r\n');
            
            const options = {
                hostname: 'background-remover-jet.vercel.app',
                port: 443,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': Buffer.byteLength(formData),
                    'User-Agent': 'CharacterCut-Debug-Test/1.0'
                }
            };

            const req = https.request(options, (res) => {
                console.log(`Upload to ${endpoint} status: ${res.statusCode}`);
                
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        headers: res.headers,
                        body: data.substring(0, 500) // First 500 chars
                    });
                });
            });

            req.on('error', (e) => {
                console.error(`Upload to ${endpoint} error: ${e.message}`);
                resolve({
                    endpoint,
                    error: e.message
                });
            });

            req.setTimeout(15000, () => {
                req.destroy();
                resolve({
                    endpoint,
                    error: 'Upload timeout'
                });
            });

            req.write(formData);
            req.end();
        });
    }));
}

// Main execution
async function runDebugTests() {
    try {
        console.log('='.repeat(50));
        console.log('CharacterCut Processing Failure Debug');
        console.log('='.repeat(50));
        
        // Test main page
        const mainPageResult = await testMainPage();
        console.log('\n' + '='.repeat(30));
        console.log('MAIN PAGE RESULTS');
        console.log('='.repeat(30));
        console.log(`Status: ${mainPageResult.status}`);
        console.log(`API Endpoints Found: ${mainPageResult.apiEndpoints.length}`);
        mainPageResult.apiEndpoints.forEach(ep => console.log(`  - ${ep}`));
        
        // Test API endpoints
        console.log('\n' + '='.repeat(30));
        console.log('API ENDPOINT TESTS');
        console.log('='.repeat(30));
        const apiResults = await testApiEndpoints();
        apiResults.forEach(result => {
            if (result.error) {
                console.log(`❌ ${result.endpoint}: ${result.error}`);
            } else {
                console.log(`✅ ${result.endpoint}: ${result.status}`);
            }
        });
        
        // Test image uploads
        console.log('\n' + '='.repeat(30));
        console.log('IMAGE UPLOAD TESTS');
        console.log('='.repeat(30));
        const allEndpoints = [...mainPageResult.apiEndpoints, '/api/process', '/api/remove-background'];
        const uploadResults = await testImageUpload(allEndpoints);
        uploadResults.forEach(result => {
            if (result.error) {
                console.log(`❌ Upload to ${result.endpoint}: ${result.error}`);
            } else {
                console.log(`✅ Upload to ${result.endpoint}: ${result.status}`);
                if (result.status >= 400) {
                    console.log(`   Response: ${result.body}`);
                }
            }
        });
        
        console.log('\n' + '='.repeat(50));
        console.log('DEBUG TEST COMPLETE');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('Debug test failed:', error);
    }
}

// Run the tests
runDebugTests();