"""
Simplified CharacterCut Backend API for Development
Minimal FastAPI application using only rembg for background removal
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
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
from typing import Optional, List
import asyncio

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

# Initialize rembg session once at startup with fallback models
FALLBACK_MODELS = ["u2net", "silueta", "u2netp"]
rembg_session = None
current_model = None

for model_name in ["u2net"] + FALLBACK_MODELS:
    try:
        logger.info(f"Attempting to initialize rembg session with {model_name} model...")
        rembg_session = new_session(model_name)
        current_model = model_name
        logger.info(f"Successfully initialized rembg session with {model_name} model")
        break
    except Exception as e:
        logger.warning(f"Failed to initialize {model_name} model: {e}")
        if model_name == FALLBACK_MODELS[-1]:  # Last fallback model
            logger.error("All model initialization attempts failed!")
            rembg_session = None
        continue

if rembg_session is None:
    logger.error("CRITICAL: No rembg models could be initialized")

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
        
        # Check if we have a working model
        if rembg_session is None:
            logger.error("No rembg model is available for processing")
            raise HTTPException(
                status_code=503,
                detail="Background removal service is currently unavailable. Please try again later."
            )
        
        # Process with rembg - more robust error handling
        try:
            logger.info(f"Processing with {current_model} model...")
            processed_image_bytes = remove(
                image_data,
                session=rembg_session,
                force_return_bytes=True
            )
            logger.info(f"rembg processing successful with {current_model}, output size: {len(processed_image_bytes)} bytes")
        except Exception as rembg_error:
            logger.error(f"rembg processing failed with {current_model}: {str(rembg_error)}")
            
            # Try to reinitialize with a different model if current one fails
            logger.info("Attempting to reinitialize with fallback models...")
            for fallback_model in FALLBACK_MODELS:
                if fallback_model == current_model:
                    continue  # Skip the model that just failed
                try:
                    logger.info(f"Trying fallback model: {fallback_model}")
                    fallback_session = new_session(fallback_model)
                    processed_image_bytes = remove(
                        image_data,
                        session=fallback_session,
                        force_return_bytes=True
                    )
                    logger.info(f"Fallback processing successful with {fallback_model}")
                    # Update global session to the working one
                    globals()['rembg_session'] = fallback_session
                    globals()['current_model'] = fallback_model
                    break
                except Exception as fallback_error:
                    logger.warning(f"Fallback model {fallback_model} also failed: {fallback_error}")
                    continue
            else:
                # If we get here, all models failed
                logger.error("All models failed to process the image")
                raise HTTPException(
                    status_code=500,
                    detail=f"Processing failed: {str(rembg_error)}"
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
            "download_url": f"/download/{processing_id}",
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

@app.post("/simple-process")
async def simple_process_image(file: UploadFile = File(...), session_id: Optional[str] = None):
    """
    Simple process endpoint - alias for /process to match frontend expectations
    """
    return await process_image(file, session_id)

@app.post("/refine")
async def refine_image(
    refined_image: UploadFile = File(...),
    original_processing_id: str = Form(None)
):
    """
    Refine processed image with manual corrections
    Accepts the refined image data from canvas editing
    """
    start_time = time.time()
    processing_id = str(uuid.uuid4())
    
    logger.info(f"=== REFINE REQUEST START ===")
    logger.info(f"Processing ID: {processing_id}")
    logger.info(f"Original Processing ID: {original_processing_id}")
    logger.info(f"Refined file: {refined_image.filename}")
    logger.info(f"Content Type: {refined_image.content_type}")
    
    try:
        # Validate file type
        if not refined_image.content_type or not refined_image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read refined image data
        refined_image_data = await refined_image.read()
        
        if len(refined_image_data) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 50MB."
            )
        
        logger.info(f"Processing refined image: {refined_image.filename}, size: {len(refined_image_data)} bytes")
        
        # For refinement, we just store the refined image as-is since it's already processed
        # The frontend has already done the canvas editing and created the final result
        processing_time = time.time() - start_time
        logger.info(f"Refined image processed successfully in {processing_time:.2f} seconds")
        
        # Store refined image in memory with expiration
        expires_at = datetime.utcnow() + timedelta(hours=1)
        processed_images[processing_id] = {
            "data": refined_image_data,
            "expires_at": expires_at,
            "filename": f"refined_{refined_image.filename}"
        }
        
        # Return JSON response matching ProcessingResponse interface
        response_data = {
            "processing_id": processing_id,
            "session_id": original_processing_id or "refined",
            "download_url": f"/download/{processing_id}",
            "processing_time": processing_time,
            "expires_at": expires_at.isoformat() + "Z"
        }
        
        logger.info(f"=== REFINE REQUEST SUCCESS ===")
        logger.info(f"Returning JSON response: {response_data}")
        
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
        logger.error(f"Refinement failed after {processing_time:.2f}s: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Image refinement failed: {str(e)}"
        )

@app.post("/process-batch")
async def process_batch_images(
    request: Request,
    files: List[UploadFile] = File(...)
):
    """
    Process multiple images to remove backgrounds
    Implements concurrent processing with individual error handling
    Maximum 10 images per batch to maintain performance
    """
    start_time = datetime.utcnow()
    batch_id = str(uuid.uuid4())
    
    logger.info(f"=== BATCH PROCESSING REQUEST ===")
    logger.info(f"Batch ID: {batch_id}")
    logger.info(f"Number of files: {len(files)}")
    
    # Validate batch size
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 images allowed per batch"
        )
    
    if len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one image is required"
        )
    
    try:
        # Process all images concurrently
        async def process_single_image(file: UploadFile, index: int):
            processing_id = f"{batch_id}_{index}"
            
            try:
                # Basic validation
                if not file.content_type or not file.content_type.startswith('image/'):
                    return {
                        "index": index,
                        "processing_id": processing_id,
                        "success": False,
                        "error": "Invalid file type",
                        "filename": file.filename
                    }
                
                # Read image data
                image_data = await file.read()
                
                if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
                    return {
                        "index": index,
                        "processing_id": processing_id,
                        "success": False,
                        "error": "File too large (max 10MB)",
                        "filename": file.filename
                    }
                
                # Process with rembg
                if rembg_session is None:
                    return {
                        "index": index,
                        "processing_id": processing_id,
                        "success": False,
                        "error": "Background removal service unavailable",
                        "filename": file.filename
                    }
                
                processed_image_bytes = remove(
                    image_data,
                    session=rembg_session,
                    force_return_bytes=True
                )
                
                # Store in memory (simplified)
                expires_at = datetime.utcnow() + timedelta(hours=1)
                simple_processed_images[processing_id] = {
                    "data": processed_image_bytes,
                    "expires_at": expires_at,
                    "filename": f"processed_{file.filename}.png"
                }
                
                return {
                    "index": index,
                    "processing_id": processing_id,
                    "success": True,
                    "download_url": f"/download/{processing_id}",
                    "filename": file.filename,
                    "expires_at": expires_at.isoformat() + "Z"
                }
                
            except Exception as e:
                logger.error(f"Batch processing failed for image {index}: {str(e)}")
                return {
                    "index": index,
                    "processing_id": processing_id,
                    "success": False,
                    "error": str(e),
                    "filename": file.filename
                }
        
        # Execute all processing tasks concurrently
        results = await asyncio.gather(
            *[process_single_image(file, i) for i, file in enumerate(files)],
            return_exceptions=True
        )
        
        # Handle any exceptions from gather
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "index": i,
                    "processing_id": f"{batch_id}_{i}",
                    "success": False,
                    "error": str(result),
                    "filename": files[i].filename if i < len(files) else f"image_{i}"
                })
            else:
                processed_results.append(result)
        
        # Calculate metrics
        total_processing_time = (datetime.utcnow() - start_time).total_seconds()
        successful_count = sum(1 for r in processed_results if r["success"])
        
        logger.info(f"Batch processing completed: {successful_count}/{len(files)} successful in {total_processing_time:.2f}s")
        
        return JSONResponse(content={
            "batch_id": batch_id,
            "session_id": "batch-session",
            "total_images": len(files),
            "successful_count": successful_count,
            "failed_count": len(files) - successful_count,
            "processing_time": total_processing_time,
            "results": processed_results
        })
        
    except Exception as e:
        logger.error(f"Batch processing failed for {batch_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Batch processing failed. Please try again."
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CharacterCut API - Development Server",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "process": "/process (POST with image file)",
            "process-batch": "/process-batch (POST with multiple image files)",
            "refine": "/refine (POST with refined image)",
            "download": "/download/{processing_id}",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)