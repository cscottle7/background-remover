"""
Ultra-lightweight Vercel Function using external background removal API
Fits well under 250MB limit by using external service
"""

from http.server import BaseHTTPRequestHandler
import json
import time
import uuid
import base64
from datetime import datetime, timedelta
import logging
import cgi
import io
import requests
from PIL import Image

# Configure minimal logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

def process_with_removebg_api(image_data):
    """Use Remove.bg free API (or fallback to mock)"""
    try:
        # For demo purposes - you'd need a Remove.bg API key for production
        # This creates a mock transparent PNG for now
        
        # Load image with PIL
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(image_data))
        
        # Create a simple mock by making white pixels transparent
        # This is just for demo - replace with actual API call
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Simple mock: make lighter pixels more transparent
        data = image.getdata()
        newData = []
        for item in data:
            # Make white/light pixels transparent (simple demo)
            if item[0] > 200 and item[1] > 200 and item[2] > 200:
                newData.append((item[0], item[1], item[2], 0))  # Transparent
            else:
                newData.append(item)  # Keep original
        
        image.putdata(newData)
        
        # Convert back to bytes
        output = io.BytesIO()
        image.save(output, format='PNG')
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
        
    def do_POST(self):
        """Handle image processing with size optimizations"""
        start_time = time.time()
        processing_id = str(uuid.uuid4())
        
        try:
            # Quick validation
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error_response(400, "Invalid content type")
                return
            
            # Size limit check
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 5 * 1024 * 1024:  # 5MB limit for serverless
                self.send_error_response(400, "File too large. Max 5MB for serverless.")
                return
            
            # Read and parse form data efficiently
            post_data = self.rfile.read(content_length)
            form_data = cgi.FieldStorage(
                fp=io.BytesIO(post_data),
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )
            
            if 'file' not in form_data:
                self.send_error_response(400, "No file provided")
                return
            
            file_item = form_data['file']
            if not file_item.file:
                self.send_error_response(400, "Invalid file")
                return
            
            image_data = file_item.file.read()
            
            # Process image with lightweight external API
            try:
                processed_image_bytes = process_with_removebg_api(image_data)
                
            except Exception as e:
                logger.error(f"Processing failed: {e}")
                self.send_error_response(503, f"Processing failed: {str(e)}")
                return
            
            processing_time = time.time() - start_time
            
            # Create efficient response
            processed_image_b64 = base64.b64encode(processed_image_bytes).decode('utf-8')
            
            response_data = {
                "processing_id": processing_id,
                "session_id": str(uuid.uuid4()),
                "download_url": f"data:image/png;base64,{processed_image_b64}",
                "processing_time": processing_time,
                "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z",
                "processor": "lightweight-demo"
            }
            
            # Send response with CORS
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response_json = json.dumps(response_data)
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Request failed: {str(e)}")
            self.send_error_response(500, f"Internal error: {str(e)}")
    
    def send_error_response(self, status_code, message):
        """Send JSON error with CORS"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        error_data = {"detail": message, "timestamp": datetime.utcnow().isoformat()}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))