"""
Image refinement endpoint for Vercel deployment
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from mangum import Mangum
import time
import uuid
import base64
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI()

@app.post("/api/refine")
async def refine_image(
    refined_image: UploadFile = File(...),
    original_processing_id: str = Form(None)
):
    """
    Refine processed image with manual corrections - Vercel Function version
    """
    start_time = time.time()
    processing_id = str(uuid.uuid4())
    
    try:
        # Validate file type
        if not refined_image.content_type or not refined_image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read refined image data
        refined_image_data = await refined_image.read()
        
        if len(refined_image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB."
            )
        
        processing_time = time.time() - start_time
        
        # Convert to base64 data URL for immediate use
        refined_image_b64 = base64.b64encode(refined_image_data).decode('utf-8')
        data_url = f"data:image/png;base64,{refined_image_b64}"
        
        # Return JSON response matching ProcessingResponse interface
        response_data = {
            "processing_id": processing_id,
            "session_id": original_processing_id or "refined",
            "download_url": data_url,
            "processing_time": processing_time,
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
        }
        
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
        raise HTTPException(
            status_code=500,
            detail=f"Image refinement failed: {str(e)}"
        )

@app.options("/api/refine")
async def options_refine():
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