"""
Input validation utilities for secure image processing
"""

import io
import logging
from PIL import Image
from fastapi import UploadFile
from typing import Set, Tuple

from ..models.responses import ValidationResult

logger = logging.getLogger(__name__)

# Configuration constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DIMENSION = 4096  # 4K max
MIN_DIMENSION = 32   # Minimum viable size
ALLOWED_FORMATS: Set[str] = {"JPEG", "PNG", "WEBP", "BMP", "TIFF"}
ALLOWED_MIME_TYPES: Set[str] = {
    "image/jpeg", 
    "image/png", 
    "image/webp", 
    "image/bmp", 
    "image/tiff"
}

async def validate_image_file(file: UploadFile) -> ValidationResult:
    """
    Comprehensive image validation for security and processing requirements
    Implements input sanitization and abuse prevention
    """
    try:
        # Check file size
        if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
            return ValidationResult(
                is_valid=False,
                error=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Check MIME type
        if file.content_type not in ALLOWED_MIME_TYPES:
            return ValidationResult(
                is_valid=False,
                error=f"Unsupported file type: {file.content_type}"
            )
        
        # Read and validate image data
        image_data = await file.read()
        
        # Reset file pointer for subsequent reads
        await file.seek(0)
        
        # Check actual file size after reading
        if len(image_data) > MAX_FILE_SIZE:
            return ValidationResult(
                is_valid=False,
                error=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Validate image integrity and format
        try:
            image = Image.open(io.BytesIO(image_data))
            image.verify()  # Verify image integrity
            
            # Re-open for dimension checks (verify() closes the image)
            image = Image.open(io.BytesIO(image_data))
            
            width, height = image.size
            format_name = image.format
            
            # Check format against whitelist
            if format_name not in ALLOWED_FORMATS:
                return ValidationResult(
                    is_valid=False,
                    error=f"Unsupported image format: {format_name}"
                )
            
            # Check dimensions
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                return ValidationResult(
                    is_valid=False,
                    error=f"Image dimensions too small. Minimum: {MIN_DIMENSION}x{MIN_DIMENSION}px"
                )
            
            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                return ValidationResult(
                    is_valid=False,
                    error=f"Image dimensions too large. Maximum: {MAX_DIMENSION}x{MAX_DIMENSION}px"
                )
            
            # Check for suspicious image characteristics
            if _is_suspicious_image(image):
                return ValidationResult(
                    is_valid=False,
                    error="Image failed security validation"
                )
            
            return ValidationResult(
                is_valid=True,
                file_size=len(image_data),
                dimensions=(width, height),
                format=format_name
            )
            
        except Exception as img_error:
            logger.warning(f"Image validation failed: {str(img_error)}")
            return ValidationResult(
                is_valid=False,
                error="Invalid or corrupted image file"
            )
            
    except Exception as e:
        logger.error(f"File validation error: {str(e)}")
        return ValidationResult(
            is_valid=False,
            error="File validation failed"
        )

def _is_suspicious_image(image: Image.Image) -> bool:
    """
    Check for suspicious image characteristics that might indicate malicious content
    """
    try:
        # Check for extremely unusual aspect ratios
        width, height = image.size
        aspect_ratio = width / height
        
        if aspect_ratio > 50 or aspect_ratio < 0.02:  # Extremely thin images
            return True
        
        # Check for unusual color modes that might hide malicious data
        if image.mode in ['1', 'P'] and min(image.size) < 100:
            # Very small palette or binary images can be suspicious
            return True
        
        # Check for excessive metadata
        if hasattr(image, '_getexif'):
            exif = image._getexif()
            if exif and len(str(exif)) > 10000:  # Excessive EXIF data
                return True
        
        return False
        
    except Exception:
        # If we can't analyze, err on the side of caution
        return True

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    """
    import re
    
    # Remove path separators and dangerous characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '', filename)
    
    # Limit length
    if len(sanitized) > 100:
        name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
        sanitized = name[:95] + ('.' + ext if ext else '')
    
    return sanitized or 'image'

def is_animated_image(image_data: bytes) -> bool:
    """
    Check if image is animated (GIF, APNG, etc.)
    Animated images require special handling
    """
    try:
        image = Image.open(io.BytesIO(image_data))
        return getattr(image, 'is_animated', False)
    except Exception:
        return False