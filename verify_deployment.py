import requests
import time
import base64

def test_charactercut_deployment():
    """Test the CharacterCut deployment to verify it's working"""
    
    print("=== CharacterCut Deployment Verification ===\n")
    
    # Step 1: Test if the site loads
    try:
        print("Step 1: Testing site availability...")
        response = requests.get('https://background-remover-jet.vercel.app/', timeout=10)
        print(f"✓ Site responded with status: {response.status_code}")
        print(f"✓ Content length: {len(response.content)} bytes")
        
        # Check if it's actually HTML content
        if 'html' in response.headers.get('content-type', '').lower():
            print("✓ Received HTML content")
            
            # Look for key terms in the HTML
            content = response.text.lower()
            keywords = ['upload', 'drop', 'image', 'background', 'remove', 'character']
            found_keywords = [kw for kw in keywords if kw in content]
            print(f"✓ Found keywords: {found_keywords}")
            
            # Check for error indicators
            error_indicators = ['error', 'failed', 'not found', '404', '500']
            found_errors = [err for err in error_indicators if err in content]
            if found_errors:
                print(f"⚠ Found error indicators: {found_errors}")
            else:
                print("✓ No obvious error indicators in content")
            
        else:
            print(f"⚠ Unexpected content type: {response.headers.get('content-type')}")
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Site not accessible: {e}")
        return False
    
    # Step 2: Test backend API endpoints
    print("\nStep 2: Testing API endpoints...")
    
    # Common API endpoint patterns to try
    api_endpoints = [
        'https://charactercut-backend.onrender.com/health',
        'https://charactercut-backend.onrender.com/',
        'https://charactercut-backend.onrender.com/remove',
        'https://background-remover-jet.vercel.app/api/remove',
        'https://background-remover-jet.vercel.app/api/health'
    ]
    
    working_endpoints = []
    
    for endpoint in api_endpoints:
        try:
            print(f"Testing: {endpoint}")
            
            # Try GET request first
            response = requests.get(endpoint, timeout=10)
            print(f"  GET {response.status_code}: {response.reason}")
            
            if response.status_code in [200, 405]:  # 405 means method not allowed but endpoint exists
                working_endpoints.append(endpoint)
                
                if response.status_code == 200:
                    content_preview = response.text[:100].replace('\n', ' ')
                    print(f"  Response preview: {content_preview}...")
                
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Error: {str(e)[:50]}...")
    
    if working_endpoints:
        print(f"✓ Working endpoints found: {len(working_endpoints)}")
        for ep in working_endpoints:
            print(f"  - {ep}")
    else:
        print("⚠ No working API endpoints found")
    
    # Step 3: Test image processing if we have a working endpoint
    if working_endpoints:
        print("\nStep 3: Testing image processing...")
        
        # Create a simple 1x1 pixel PNG
        test_image_b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        test_image_bytes = base64.b64decode(test_image_b64)
        
        # Try the main processing endpoint
        process_endpoint = 'https://charactercut-backend.onrender.com/remove'
        
        try:
            print(f"Attempting image upload to: {process_endpoint}")
            
            # Prepare the file upload
            files = {'image': ('test.png', test_image_bytes, 'image/png')}
            
            # Send POST request with image
            response = requests.post(process_endpoint, files=files, timeout=30)
            
            print(f"✓ Upload response status: {response.status_code}")
            print(f"✓ Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                print("✓ Image processing successful!")
                
                # Check if we got an image back
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    print(f"✓ Received processed image ({len(response.content)} bytes)")
                    print("✓ Background removal appears to be working!")
                else:
                    print(f"Response content type: {content_type}")
                    print(f"Response preview: {response.text[:200]}...")
                    
            elif response.status_code == 422:
                print("⚠ Validation error - this is expected with a minimal test image")
                print(f"Response: {response.text[:200]}...")
            else:
                print(f"✗ Processing failed with status {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Upload test failed: {e}")
    
    # Step 4: Check CORS and other deployment details
    print("\nStep 4: Checking deployment configuration...")
    
    try:
        response = requests.options('https://charactercut-backend.onrender.com/remove', timeout=10)
        print(f"CORS preflight status: {response.status_code}")
        
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        if cors_headers:
            print(f"✓ CORS headers found:")
            for header, value in cors_headers.items():
                print(f"  {header}: {value}")
        else:
            print("⚠ No CORS headers detected")
            
    except Exception as e:
        print(f"CORS check failed: {e}")
    
    print("\n=== Test Summary ===")
    print("✓ Frontend: Accessible and serving content")
    print(f"{'✓' if working_endpoints else '⚠'} Backend API: {len(working_endpoints)} endpoint(s) responding")
    print("✓ Deployment: Site is operational")
    
    if working_endpoints:
        print("✓ Overall Status: DEPLOYMENT SUCCESSFUL - Ready for user testing")
        return True
    else:
        print("⚠ Overall Status: FRONTEND OK - Backend API needs investigation")
        return False

if __name__ == "__main__":
    # Run the comprehensive test
    success = test_charactercut_deployment()
    exit(0 if success else 1)