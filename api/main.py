"""
CharacterCut Backend API - Render FastAPI Version
Background removal service using rembg
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import base64
from datetime import datetime, timedelta
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="CharacterCut API",
    description="Background removal service for AI-generated characters",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global session cache
_rembg_session = None

def get_rembg_session():
    """Initialize and cache rembg session"""
    global _rembg_session
    if _rembg_session is None:
        try:
            from rembg import new_session
            # Use u2net model for good quality
            _rembg_session = new_session("u2net")
            logger.info("Initialized rembg session with u2net model")
        except Exception as e:
            logger.error(f"Failed to initialize rembg: {e}")
            raise Exception(f"Model initialization failed: {str(e)}")
    return _rembg_session

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "CharacterCut API", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        session = get_rembg_session()
        return {
            "status": "healthy",
            "rembg_ready": session is not None,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.post("/api/process")
async def process_image(file: UploadFile = File(...)):
    """Process image for background removal"""
    start_time = time.time()
    processing_id = str(uuid.uuid4())
    
    try:
        # Validate file
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check file size (10MB limit)
        image_data = await file.read()
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        logger.info(f"Processing image: {file.filename}, size: {len(image_data)} bytes")
        
        # Process image with rembg
        try:
            from rembg import remove
            session = get_rembg_session()
            
            processed_image_bytes = remove(
                image_data,
                session=session,
                force_return_bytes=True
            )
            
            logger.info("Image processing completed successfully")
            
        except Exception as e:
            logger.error(f"rembg processing failed: {e}")
            raise HTTPException(status_code=503, detail=f"Background removal failed: {str(e)}")
        
        processing_time = time.time() - start_time
        
        # Convert to base64 for response
        processed_image_b64 = base64.b64encode(processed_image_bytes).decode('utf-8')
        data_url = f"data:image/png;base64,{processed_image_b64}"
        
        # Create response
        response_data = {
            "processing_id": processing_id,
            "session_id": str(uuid.uuid4()),
            "download_url": data_url,
            "processing_time": processing_time,
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z",
            "model": "u2net",
            "status": "completed"
        }
        
        logger.info(f"Successfully processed in {processing_time:.2f}s")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Request failed after {processing_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)