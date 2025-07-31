"""
CharacterCut Backend API
Main FastAPI application for background removal service
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
# from mangum import Mangum  # Only needed for AWS Lambda
import os
import logging
from typing import Optional, List
import uuid
from datetime import datetime, timedelta
import time
import asyncio
from collections import defaultdict

from .services.background_removal import BackgroundRemovalService
from .services.image_storage import ImageStorageService
from .utils.validators import validate_image_file
from .utils.monitoring import log_processing_metrics
from .utils.performance_monitor import get_performance_health, get_performance_report
from .services.ab_testing_framework import get_ab_test_analysis
from .models.responses import ProcessingResponse, HealthResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting storage (in-memory for serverless)
rate_limit_storage = defaultdict(lambda: {"requests": 0, "reset_time": time.time() + 60})

def rate_limit_check(client_ip: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
    """Simple rate limiting for abuse prevention"""
    current_time = time.time()
    client_data = rate_limit_storage[client_ip]
    
    # Reset if window expired
    if current_time >= client_data["reset_time"]:
        client_data["requests"] = 0
        client_data["reset_time"] = current_time + window_seconds
    
    # Check limit
    if client_data["requests"] >= max_requests:
        return False
    
    client_data["requests"] += 1
    return True

# Initialize FastAPI app
app = FastAPI(
    title="CharacterCut API",
    description="AI-powered background removal for character assets",
    version="1.0.0",
    docs_url="/docs" if os.getenv("STAGE") == "dev" else None,
    redoc_url="/redoc" if os.getenv("STAGE") == "dev" else None,
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"] if os.getenv("STAGE") == "dev" else [
        "api.charactercut.com",
        "*.charactercut.com",
        "localhost"
    ]
)

# Configure CORS with proper security for production
# TEMPORARY: Allow all origins for development debugging
allowed_origins = ["*"]
# allowed_origins = ["*"] if os.getenv("STAGE") == "dev" else [
#     "https://charactercut.com",
#     "https://www.charactercut.com", 
#     "https://app.charactercut.com",
#     "http://localhost:3001",
#     "http://localhost:3002", 
#     "http://localhost:3000"
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # No credentials needed for MVP
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "User-Agent"],
    max_age=3600,  # Cache preflight requests
)

# Initialize services
background_removal_service = BackgroundRemovalService()
storage_service = ImageStorageService()

# Simple in-memory storage for /simple-process endpoint
simple_processed_images = {}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0"
    )

@app.post("/process", response_model=ProcessingResponse)
async def process_image(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session_id: Optional[str] = None,
    crop_x: Optional[float] = Form(None),
    crop_y: Optional[float] = Form(None),
    crop_width: Optional[float] = Form(None),
    crop_height: Optional[float] = Form(None)
):
    """
    Process image to remove background
    Core endpoint implementing <5 second processing requirement with security
    """
    start_time = datetime.utcnow()
    processing_id = str(uuid.uuid4())
    
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    # Rate limiting check
    if not rate_limit_check(client_ip, max_requests=5, window_seconds=60):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait before trying again."
        )
    
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Validate input file
        validation_result = await validate_image_file(file)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid image file: {validation_result.error}"
            )
        
        # Read image data
        image_data = await file.read()
        
        # Prepare crop data if provided
        crop_data = None
        if all(param is not None for param in [crop_x, crop_y, crop_width, crop_height]):
            crop_data = {
                'x': crop_x,
                'y': crop_y,
                'width': crop_width,
                'height': crop_height
            }
            logger.info(f"Crop data provided: {crop_data}")
        
        # Process image with background removal (include session for A/B testing)
        processed_image = await background_removal_service.remove_background(
            image_data,
            processing_id=processing_id,
            session_hash=session_id,
            crop_data=crop_data
        )
        
        # Store processed image with 1-hour expiration
        storage_url = await storage_service.store_image(
            processed_image,
            processing_id,
            expires_in_hours=1
        )
        
        # Schedule cleanup task
        background_tasks.add_task(
            storage_service.schedule_cleanup,
            processing_id,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        
        # Log metrics for monitoring
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        await log_processing_metrics(
            processing_id=processing_id,
            session_id=session_id,
            processing_time=processing_time,
            input_size=len(image_data),
            output_size=len(processed_image),
            success=True
        )
        
        return ProcessingResponse(
            processing_id=processing_id,
            session_id=session_id,
            download_url=storage_url,
            processing_time=processing_time,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        
    except Exception as e:
        logger.error(f"Processing failed for {processing_id}: {str(e)}")
        
        # Log error metrics
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        await log_processing_metrics(
            processing_id=processing_id,
            session_id=session_id or "unknown",
            processing_time=processing_time,
            input_size=len(image_data) if 'image_data' in locals() else 0,
            output_size=0,
            success=False,
            error=str(e)
        )
        
        raise HTTPException(
            status_code=500,
            detail="Image processing failed. Please try again."
        )

@app.post("/process-batch")
async def process_batch_images(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    session_id: Optional[str] = None
):
    """
    Process multiple images to remove backgrounds
    Implements concurrent processing with individual error handling
    Maximum 10 images per batch to maintain performance
    """
    start_time = datetime.utcnow()
    batch_id = str(uuid.uuid4())
    
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    # Enhanced rate limiting for batch processing
    if not rate_limit_check(client_ip, max_requests=2, window_seconds=120):
        raise HTTPException(
            status_code=429,
            detail="Batch processing rate limit exceeded. Please wait before trying again."
        )
    
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
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        # Process all images concurrently
        async def process_single_image(file: UploadFile, index: int):
            processing_id = f"{batch_id}_{index}"
            
            try:
                # Validate input file
                validation_result = await validate_image_file(file)
                if not validation_result.is_valid:
                    return {
                        "index": index,
                        "processing_id": processing_id,
                        "success": False,
                        "error": f"Invalid image file: {validation_result.error}",
                        "filename": file.filename
                    }
                
                # Read image data
                image_data = await file.read()
                
                # Process image with background removal
                processed_image = await background_removal_service.remove_background(
                    image_data,
                    processing_id=processing_id,
                    session_hash=session_id
                )
                
                # Store processed image with 1-hour expiration
                storage_url = await storage_service.store_image(
                    processed_image,
                    processing_id,
                    expires_in_hours=1
                )
                
                # Schedule cleanup task
                background_tasks.add_task(
                    storage_service.schedule_cleanup,
                    processing_id,
                    expires_at=datetime.utcnow() + timedelta(hours=1)
                )
                
                return {
                    "index": index,
                    "processing_id": processing_id,
                    "success": True,
                    "download_url": storage_url,
                    "filename": file.filename,
                    "expires_at": datetime.utcnow() + timedelta(hours=1)
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
        
        # Log batch metrics
        await log_processing_metrics(
            processing_id=batch_id,
            session_id=session_id,
            processing_time=total_processing_time,
            input_size=0,  # Files already processed, size would need tracking
            output_size=0,  # Would need to calculate from successful results
            success=successful_count > 0,
            batch_size=len(files),
            successful_count=successful_count
        )
        
        return JSONResponse(content={
            "batch_id": batch_id,
            "session_id": session_id,
            "total_images": len(files),
            "successful_count": successful_count,
            "failed_count": len(files) - successful_count,
            "processing_time": total_processing_time,
            "results": processed_results
        })
        
    except Exception as e:
        logger.error(f"Batch processing failed for {batch_id}: {str(e)}")
        
        # Log error metrics
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        await log_processing_metrics(
            processing_id=batch_id,
            session_id=session_id or "unknown",
            processing_time=processing_time,
            input_size=0,
            output_size=0,
            success=False,
            error=str(e),
            batch_size=len(files)
        )
        
        raise HTTPException(
            status_code=500,
            detail="Batch processing failed. Please try again."
        )

@app.get("/download/{processing_id}")
async def download_image(processing_id: str):
    """Download processed image by ID"""
    try:
        # Check simple storage first
        if processing_id in simple_processed_images:
            image_info = simple_processed_images[processing_id]
            # Check expiration
            if datetime.utcnow() > image_info["expires_at"]:
                del simple_processed_images[processing_id]
                raise HTTPException(status_code=404, detail="Image has expired")
            
            return Response(
                content=image_info["data"],
                media_type="image/png",
                headers={
                    "Content-Disposition": f"attachment; filename={image_info['filename']}",
                    "Cache-Control": "no-store, no-cache, must-revalidate"
                }
            )
        
        # Fall back to main storage service
        image_data = await storage_service.get_image(processing_id)
        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found or expired")
        
        return Response(
            content=image_data,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=character_{processing_id}.png",
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed for {processing_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Download failed")

@app.get("/status/{processing_id}")
async def get_processing_status(processing_id: str):
    """Get processing status for real-time updates"""
    try:
        status = await background_removal_service.get_processing_status(processing_id)
        return JSONResponse(content=status)
    except Exception as e:
        logger.error(f"Status check failed for {processing_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Status check failed")

@app.get("/performance/health")
async def get_performance_health_endpoint():
    """Get current performance health metrics"""
    try:
        health_data = await get_performance_health()
        return JSONResponse(content=health_data)
    except Exception as e:
        logger.error(f"Performance health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Performance health check failed")

@app.get("/performance/report")
async def get_performance_report_endpoint():
    """Get comprehensive performance report"""
    try:
        if os.getenv("STAGE") != "dev":
            raise HTTPException(status_code=404, detail="Not found")
        
        report = await get_performance_report()
        return JSONResponse(content=report)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Performance report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Performance report failed")

@app.get("/abtest/analysis")
async def get_ab_test_analysis_endpoint():
    """Get A/B test analysis (dev only)"""
    try:
        if os.getenv("STAGE") != "dev":
            raise HTTPException(status_code=404, detail="Not found")
        
        analysis = await get_ab_test_analysis()
        return JSONResponse(content=analysis)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"A/B test analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="A/B test analysis failed")

@app.post("/refine")
async def refine_image(
    request: Request,
    background_tasks: BackgroundTasks,
    original_processing_id: str = Form(...),
    refined_image: UploadFile = File(...)
):
    """
    Refine processed image with manual corrections
    Accepts the refined image data from canvas editing
    """
    start_time = datetime.utcnow()
    processing_id = str(uuid.uuid4())
    
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    # Rate limiting check
    if not rate_limit_check(client_ip, max_requests=5, window_seconds=60):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait before trying again."
        )
    
    try:
        # Validate input file
        validation_result = await validate_image_file(refined_image)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid refined image: {validation_result.error}"
            )
        
        # Read refined image data
        refined_image_data = await refined_image.read()
        
        # Store refined image with 1-hour expiration
        storage_url = await storage_service.store_image(
            refined_image_data,
            processing_id,
            expires_in_hours=1
        )
        
        # Schedule cleanup task
        background_tasks.add_task(
            storage_service.schedule_cleanup,
            processing_id,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        
        # Log metrics for monitoring
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        await log_processing_metrics(
            processing_id=processing_id,
            session_id=f"refine_{original_processing_id}",
            processing_time=processing_time,
            input_size=len(refined_image_data),
            output_size=len(refined_image_data),
            success=True
        )
        
        return ProcessingResponse(
            processing_id=processing_id,
            session_id=f"refine_{original_processing_id}",
            download_url=storage_url,
            processing_time=processing_time,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        
    except Exception as e:
        logger.error(f"Refinement failed for {processing_id}: {str(e)}")
        
        # Log error metrics
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        await log_processing_metrics(
            processing_id=processing_id,
            session_id=f"refine_{original_processing_id}",
            processing_time=processing_time,
            input_size=len(refined_image_data) if 'refined_image_data' in locals() else 0,
            output_size=0,
            success=False,
            error=str(e)
        )
        
        raise HTTPException(
            status_code=500,
            detail="Image refinement failed. Please try again."
        )

@app.post("/simple-process")
async def simple_process_image(
    file: UploadFile = File(...), 
    model: str = Form("u2net"),
    session_id: str = Form(None)
):
    """
    Simplified processing endpoint that bypasses complex services
    Direct rembg processing with model selection
    Available models: isnet-general-use, u2net, birefnet-general, sam
    """
    import io
    from datetime import datetime, timedelta
    from rembg import remove, new_session
    
    start_time = datetime.utcnow()
    processing_id = str(uuid.uuid4())
    
    # DEBUG: Log incoming request
    logger.info(f"=== SIMPLE PROCESS REQUEST ===")
    logger.info(f"Processing ID: {processing_id}")
    logger.info(f"File: {file.filename} ({file.content_type})")
    logger.info(f"Model: {model}")
    logger.info(f"Session ID: {session_id}")
    
    try:
        # Basic validation
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Read image data
        image_data = await file.read()
        
        # Validate model parameter
        valid_models = ["isnet-general-use", "u2net", "birefnet-general", "sam"]
        if model not in valid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model. Available models: {', '.join(valid_models)}"
            )
        
        # Process with rembg using selected model
        try:
            session = new_session(model)
            processed_image = remove(image_data, session=session, force_return_bytes=True)
            logger.info(f"Successfully processed with model: {model}")
        except Exception as e:
            logger.error(f"Processing failed with model {model}: {str(e)}")
            # Fallback to u2net if the selected model fails
            if model != "u2net":
                logger.info("Falling back to u2net model")
                session = new_session("u2net")
                processed_image = remove(image_data, session=session, force_return_bytes=True)
            else:
                raise e
        
        # Store in memory (simplified)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        simple_processed_images[processing_id] = {
            "data": processed_image,
            "expires_at": expires_at,
            "filename": f"processed_{file.filename}.png"
        }
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        return JSONResponse(content={
            "processing_id": processing_id,
            "session_id": "simple-test",
            "download_url": f"http://localhost:8000/download/{processing_id}",
            "processing_time": processing_time,
            "expires_at": expires_at.isoformat() + "Z"
        })
        
    except Exception as e:
        logger.error(f"Simple processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# Reference to existing storage from initialize services section

# AWS Lambda handler (only for serverless deployment)
# handler = Mangum(app, lifespan="off")