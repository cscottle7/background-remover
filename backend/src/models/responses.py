"""
Response models for the CharacterCut API
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    version: str

class ProcessingResponse(BaseModel):
    """Response for successful image processing"""
    processing_id: str
    session_id: str
    download_url: str
    processing_time: float
    expires_at: datetime

class ValidationResult(BaseModel):
    """Image validation result"""
    is_valid: bool
    error: Optional[str] = None
    file_size: Optional[int] = None
    dimensions: Optional[tuple] = None
    format: Optional[str] = None

class ProcessingStatus(BaseModel):
    """Processing status for real-time updates"""
    processing_id: str
    status: str  # 'queued', 'processing', 'completed', 'failed'
    progress: int  # 0-100
    message: Optional[str] = None
    estimated_completion: Optional[datetime] = None