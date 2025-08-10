"""
Vercel Function for CharacterCut background removal
Simplified version of the backend optimized for serverless deployment
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from mangum import Mangum
import io
from PIL import Image
from rembg import remove, new_session
import logging
import time
import uuid
import base64
from datetime import datetime, timedelta
from typing import Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Global variables for rembg session (will be initialized on first request)
_rembg_session = None
_current_model = None

def get_rembg_session():
    """Get or initialize rembg session with fallback models"""
    global _rembg_session, _current_model
    
    if _rembg_session is not None:
        return _rembg_session
    
    # Try models in order of preference
    fallback_models = ["u2net", "silueta", "u2netp"]
    
    for model_name in fallback_models:
        try:
            logger.info(f"Attempting to initialize rembg session with {model_name} model...")
            _rembg_session = new_session(model_name)
            _current_model = model_name
            logger.info(f"Successfully initialized rembg session with {model_name} model")
            return _rembg_session
        except Exception as e:
            logger.warning(f"Failed to initialize {model_name} model: {e}")
            continue
    
    logger.error("CRITICAL: No rembg models could be initialized")
    return None

@app.post("/api/simple-process")
async def simple_process_image(file: UploadFile = File(...), session_id: Optional[str] = None):
    """
    Process image to remove background - Vercel Function version
    """
    start_time = time.time()
    processing_id = str(uuid.uuid4())
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
        logger.info(f"Generated new session ID: {session_id}")
    
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read image data
        image_data = await file.read()
        
        # Check file size (Vercel limit is 50MB, we'll use 10MB for safety)
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB."
            )
        
        logger.info(f"Processing image: {file.filename}, size: {len(image_data)} bytes")
        
        # Get rembg session
        rembg_session = get_rembg_session()
        if rembg_session is None:
            logger.error("No rembg model is available for processing")
            raise HTTPException(
                status_code=503,
                detail="Background removal service is currently unavailable. Please try again later."
            )
        
        # Process with rembg
        try:
            logger.info(f"Processing with {_current_model} model...")
            processed_image_bytes = remove(
                image_data,
                session=rembg_session,
                force_return_bytes=True
            )
            logger.info(f"rembg processing successful with {_current_model}, output size: {len(processed_image_bytes)} bytes")
        except Exception as rembg_error:
            logger.error(f"rembg processing failed: {str(rembg_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Processing failed: {str(rembg_error)}"
            )
        
        processing_time = time.time() - start_time
        logger.info(f"Image processed successfully in {processing_time:.2f} seconds")
        
        # For Vercel Functions, we'll return the image as base64 data URL
        # This avoids the need for file storage in a serverless environment
        processed_image_b64 = base64.b64encode(processed_image_bytes).decode('utf-8')
        data_url = f"data:image/png;base64,{processed_image_b64}"
        
        # Return JSON response matching ProcessingResponse interface
        response_data = {
            "processing_id": processing_id,
            "session_id": session_id,
            "download_url": data_url,  # Return as data URL for immediate use
            "processing_time": processing_time,
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
        }
        
        logger.info(f"Processing completed successfully in {processing_time:.2f}s")
        
        return JSONResponse(
            content=response_data,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Processing failed after {processing_time:.2f}s: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Image processing failed: {str(e)}"
        )

@app.options("/api/simple-process")
async def options_simple_process():
    """Handle CORS preflight requests"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        }
    )

# Mangum handler for Vercel
handler = Mangum(app, lifespan="off")