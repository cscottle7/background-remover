"""
Ultra-lightweight Vercel Function for background removal
Optimized for <250MB limit using minimal dependencies
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
import os

# Configure minimal logging
logging.basicConfig(level=logging.WARNING)  # Reduce log overhead
logger = logging.getLogger(__name__)

# Global session for reuse (memory optimization)
_rembg_session = None

def get_rembg_session():
    """Get or create minimal rembg session"""
    global _rembg_session
    if _rembg_session is None:
        try:
            # Import only when needed (cold start optimization)
            from rembg import new_session
            # Use only the smallest, fastest model
            _rembg_session = new_session("u2netp")  # Smallest model ~11MB
            logger.info("Initialized minimal u2netp model")
        except Exception as e:
            logger.error(f"Failed to initialize rembg: {e}")
            raise
    return _rembg_session

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
            
            # Process image with minimal model
            try:
                # Lazy import for cold start optimization
                from rembg import remove
                
                session = get_rembg_session()
                processed_image_bytes = remove(
                    image_data,
                    session=session,
                    force_return_bytes=True
                )
                
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
                "model_used": "u2netp"
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