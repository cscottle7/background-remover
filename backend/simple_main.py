"""
Simplified CharacterCut Backend API for Development
Minimal FastAPI application using only rembg for background removal
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import io
from PIL import Image
from rembg import remove, new_session
import logging
import time
import uuid
import base64
from datetime import datetime, timedelta
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CharacterCut API - Simple",
    description="Simplified AI-powered background removal for character assets",
    version="1.0.0-dev"
)

# CORS middleware disabled - using manual handling instead

# Handle CORS manually as backup - more reliable
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Handle preflight OPTIONS requests
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response
    
    # Handle regular requests
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response

# Initialize rembg session once at startup
try:
    rembg_session = new_session("isnet-general-use")
    logger.info("Successfully initialized rembg session with isnet-general-use model")
except Exception as e:
    logger.warning(f"Failed to initialize isnet-general-use, falling back to u2net: {e}")
    rembg_session = new_session("u2net")

# Simple in-memory storage for processed images (dev only)
processed_images = {}

@app.options("/{path:path}")
async def options_handler(path: str):
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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    import json
    content = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0-dev"
    }
    response = Response(
        content=json.dumps(content),
        media_type="application/json",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )
    logger.info("Health check: Added CORS headers to response")
    return response

@app.post("/process")
async def process_image(file: UploadFile = File(...), session_id: Optional[str] = None):
    """
    Process image to remove background
    Returns JSON response matching frontend expectations
    """
    start_time = time.time()
    processing_id = str(uuid.uuid4())
    
    # DEBUG: Log incoming request details
    logger.info(f"=== PROCESS REQUEST START ===")
    logger.info(f"Processing ID: {processing_id}")
    logger.info(f"File: {file.filename}")
    logger.info(f"Content Type: {file.content_type}")
    logger.info(f"Session ID provided: {session_id}")
    
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
        
        if len(image_data) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 50MB."
            )
        
        logger.info(f"Processing image: {file.filename}, size: {len(image_data)} bytes")
        
        # Process with rembg - more robust error handling
        try:
            processed_image_bytes = remove(
                image_data,
                session=rembg_session,
                force_return_bytes=True
            )
            logger.info(f"rembg processing successful, output size: {len(processed_image_bytes)} bytes")
        except Exception as rembg_error:
            logger.error(f"rembg processing failed: {str(rembg_error)}")
            # Try without session as fallback
            try:
                processed_image_bytes = remove(image_data)
                logger.info(f"rembg fallback processing successful")
            except Exception as fallback_error:
                logger.error(f"rembg fallback also failed: {str(fallback_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Background removal failed: {str(fallback_error)}"
                )
        
        processing_time = time.time() - start_time
        logger.info(f"Image processed successfully in {processing_time:.2f} seconds")
        
        # Store processed image in memory with expiration
        expires_at = datetime.utcnow() + timedelta(hours=1)
        processed_images[processing_id] = {
            "data": processed_image_bytes,
            "expires_at": expires_at,
            "filename": f"processed_{file.filename}.png"
        }
        
        # Return JSON response matching ProcessingResponse interface
        response_data = {
            "processing_id": processing_id,
            "session_id": session_id,
            "download_url": f"http://localhost:8000/download/{processing_id}",
            "processing_time": processing_time,
            "expires_at": expires_at.isoformat() + "Z"
        }
        
        # DEBUG: Log successful response
        logger.info(f"=== PROCESS REQUEST SUCCESS ===")
        logger.info(f"Returning JSON response: {response_data}")
        logger.info(f"Response type: application/json")
        
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

@app.get("/download/{processing_id}")
async def download_image(processing_id: str):
    """Download processed image by ID"""
    try:
        # Check if image exists and hasn't expired
        if processing_id not in processed_images:
            raise HTTPException(status_code=404, detail="Image not found or expired")
        
        image_info = processed_images[processing_id]
        
        # Check expiration
        if datetime.utcnow() > image_info["expires_at"]:
            # Clean up expired image
            del processed_images[processing_id]
            raise HTTPException(status_code=404, detail="Image has expired")
        
        return Response(
            content=image_info["data"],
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename={image_info['filename']}",
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed for {processing_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Download failed")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CharacterCut API - Development Server",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "process": "/process (POST with image file)",
            "download": "/download/{processing_id}",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)