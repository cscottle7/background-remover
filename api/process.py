"""
Vercel Function for CharacterCut background removal
Simplified serverless function without FastAPI to reduce cold start time
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
        
    def do_POST(self):
        """Handle POST requests for image processing"""
        start_time = time.time()
        processing_id = str(uuid.uuid4())
        
        try:
            # Parse multipart form data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error_response(400, "Content-Type must be multipart/form-data")
                return
            
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 10 * 1024 * 1024:  # 10MB limit
                self.send_error_response(400, "File too large. Maximum size is 10MB.")
                return
            
            # Read POST data
            post_data = self.rfile.read(content_length)
            
            # Parse form data
            try:
                form_data = cgi.FieldStorage(
                    fp=io.BytesIO(post_data),
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST'}
                )
                
                # Get file from form data
                if 'file' not in form_data:
                    self.send_error_response(400, "No file provided")
                    return
                
                file_item = form_data['file']
                if not file_item.file:
                    self.send_error_response(400, "Invalid file")
                    return
                
                # Read image data
                image_data = file_item.file.read()
                filename = file_item.filename or "unknown"
                
            except Exception as parse_error:
                logger.error(f"Failed to parse form data: {parse_error}")
                self.send_error_response(400, "Failed to parse form data")
                return
            
            logger.info(f"Processing image: {filename}, size: {len(image_data)} bytes")
            
            # Import and initialize rembg here to avoid cold start issues
            try:
                from rembg import remove, new_session
                logger.info("Initializing rembg session...")
                
                # Try lightweight models first for serverless
                models = ["u2netp", "u2net", "silueta"]
                rembg_session = None
                
                for model_name in models:
                    try:
                        rembg_session = new_session(model_name)
                        logger.info(f"Initialized {model_name} model successfully")
                        break
                    except Exception as model_error:
                        logger.warning(f"Failed to load {model_name}: {model_error}")
                        continue
                
                if rembg_session is None:
                    raise Exception("No models could be loaded")
                
                # Process image
                processed_image_bytes = remove(
                    image_data,
                    session=rembg_session,
                    force_return_bytes=True
                )
                
            except Exception as rembg_error:
                logger.error(f"rembg processing failed: {rembg_error}")
                self.send_error_response(503, "Background removal service temporarily unavailable")
                return
            
            processing_time = time.time() - start_time
            logger.info(f"Processing completed in {processing_time:.2f}s")
            
            # Convert to base64 data URL
            processed_image_b64 = base64.b64encode(processed_image_bytes).decode('utf-8')
            data_url = f"data:image/png;base64,{processed_image_b64}"
            
            # Create response
            response_data = {
                "processing_id": processing_id,
                "session_id": str(uuid.uuid4()),
                "download_url": data_url,
                "processing_time": processing_time,
                "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()
            
            response_json = json.dumps(response_data)
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Request failed after {processing_time:.2f}s: {str(e)}")
            self.send_error_response(500, f"Processing failed: {str(e)}")
    
    def send_error_response(self, status_code, message):
        """Send JSON error response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
        
        error_data = {"detail": message}
        error_json = json.dumps(error_data)
        self.wfile.write(error_json.encode('utf-8'))