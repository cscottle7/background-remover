"""
Health check endpoint for Vercel deployment
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from mangum import Mangum
import time

app = FastAPI()

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "timestamp": time.time(),
            "version": "1.0.0-production",
            "environment": "vercel"
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.options("/api/health")
async def options_health():
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