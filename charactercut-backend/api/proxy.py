"""
Lightweight proxy endpoint for external ML service
"""
import json
import requests
from http.server import BaseHTTPRequestHandler
import logging

# Configure your external ML service URL (we'll use Railway for now)
ML_SERVICE_URL = "https://charactercut-ml-production.up.railway.app/api/process"

logger = logging.getLogger(__name__)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
    def do_POST(self):
        """Proxy requests to external ML service"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 10 * 1024 * 1024:  # 10MB limit
                self.send_error_response(400, "File too large")
                return
                
            post_data = self.rfile.read(content_length)
            
            # Forward request to ML service with timeout
            response = requests.post(
                ML_SERVICE_URL,
                data=post_data,
                headers={'Content-Type': self.headers.get('Content-Type')},
                timeout=30
            )
            
            # Return ML service response
            self.send_response(response.status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(response.content)
            
        except requests.exceptions.Timeout:
            self.send_error_response(504, "ML service timeout")
        except requests.exceptions.ConnectionError:
            self.send_error_response(503, "ML service unavailable")
        except Exception as e:
            logger.error(f"Proxy error: {e}")
            self.send_error_response(500, f"Processing failed: {str(e)}")
    
    def send_error_response(self, status_code, message):
        """Send JSON error response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        error_data = {
            "detail": message,
            "status": "error"
        }
        
        error_json = json.dumps(error_data)
        self.wfile.write(error_json.encode('utf-8'))