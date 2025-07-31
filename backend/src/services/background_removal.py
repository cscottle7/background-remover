"""
Background removal service with modular architecture for library switching
Implements primary rembg integration with fallback capabilities
"""

import io
import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime
import asyncio
from PIL import Image
from rembg import remove, new_session

from ..utils.monitoring import track_processing_performance
from ..utils.performance_monitor import record_processing_performance
from ..models.responses import ProcessingStatus
from .multi_library_processor import MultiLibraryProcessor
from .ab_testing_framework import assign_processing_variant, record_ab_test_result, TestVariant

logger = logging.getLogger(__name__)

class BackgroundRemovalService:
    """
    Core background removal service with modular architecture
    Implements 2025 rembg patterns with session optimization for <5 second processing
    """
    
    def __init__(self):
        # Primary model optimized for AI-generated characters (CLAUDE.md requirement)
        self.primary_model = "isnet-general-use"
        self.processing_status: Dict[str, ProcessingStatus] = {}
        
        # Fallback models with quality progression
        self.fallback_models = ["birefnet-general", "u2net", "sam"]
        
        # Session management for performance optimization
        self._sessions: Dict[str, Any] = {}
        self._initialize_sessions()
        
        # Multi-library processor for Phase 0 fallback capabilities
        self.multi_processor = MultiLibraryProcessor()
        self._multi_processor_initialized = False
        
    def _initialize_sessions(self):
        """Initialize rembg sessions for performance optimization"""
        try:
            # Primary session for fastest processing
            self._sessions[self.primary_model] = new_session(self.primary_model)
            logger.info(f"Initialized primary session: {self.primary_model}")
            
            # Initialize fallback sessions if enabled
            if os.getenv("REMBG_SESSION_REUSE", "false").lower() == "true":
                for model in self.fallback_models:
                    try:
                        self._sessions[model] = new_session(model)
                        logger.info(f"Initialized fallback session: {model}")
                    except Exception as e:
                        logger.warning(f"Failed to initialize session for {model}: {e}")
                        
        except Exception as e:
            logger.error(f"Session initialization failed: {e}")
            # Continue without sessions - will create per-request
        
    async def remove_background(
        self, 
        image_data: bytes, 
        processing_id: str,
        session_hash: Optional[str] = None,
        retry_count: int = 0
    ) -> bytes:
        """
        Remove background from image with automatic retry and fallback
        Implements <5 second processing requirement with progress tracking
        Enhanced with A/B testing and performance monitoring
        """
        start_time = datetime.utcnow()
        
        # A/B testing: Assign processing variant if session provided
        ab_variant = TestVariant.CONTROL
        library_config = {"library": "rembg", "model": self.primary_model, "processor": "primary"}
        
        if session_hash:
            ab_variant, library_config = await assign_processing_variant(session_hash)
            logger.info(f"A/B test assignment: {processing_id} -> {ab_variant.value} ({library_config['library']}/{library_config['model']})")
        
        try:
            # Update status to processing
            await self._update_processing_status(
                processing_id, 
                "processing", 
                10, 
                "Initializing background removal..."
            )
            
            # Load and validate input image
            input_image = Image.open(io.BytesIO(image_data))
            if input_image.mode not in ["RGB", "RGBA"]:
                input_image = input_image.convert("RGB")
            
            await self._update_processing_status(
                processing_id, 
                "processing", 
                30, 
                "Processing image..."
            )
            
            # Primary processing with rembg
            try:
                processed_image_data = await self._process_with_rembg(
                    image_data, 
                    processing_id
                )
                
                await self._update_processing_status(
                    processing_id, 
                    "processing", 
                    80, 
                    "Finalizing image..."
                )
                
                # Final validation and optimization
                final_image = await self._optimize_output(processed_image_data)
                
                await self._update_processing_status(
                    processing_id, 
                    "completed", 
                    100, 
                    "Processing complete"
                )
                
                # Track performance metrics with enhanced monitoring
                processing_time = (datetime.utcnow() - start_time).total_seconds()
                
                # Enhanced performance monitoring
                await record_processing_performance(
                    processing_id=processing_id,
                    processing_time=processing_time,
                    library=library_config["library"],
                    model=library_config["model"],
                    success=True,
                    input_size=len(image_data),
                    output_size=len(final_image),
                    session_hash=session_hash or "unknown"
                )
                
                # A/B testing result recording
                if session_hash:
                    await record_ab_test_result(
                        variant=ab_variant,
                        processing_id=processing_id,
                        session_hash=session_hash,
                        processing_time=processing_time,
                        success=True,
                        input_size=len(image_data),
                        output_size=len(final_image),
                        library=library_config["library"],
                        model=library_config["model"]
                    )
                
                # Legacy tracking for compatibility
                await track_processing_performance(
                    processing_id=processing_id,
                    library=library_config["library"],
                    model=library_config["model"],
                    processing_time=processing_time,
                    input_size=len(image_data),
                    output_size=len(final_image),
                    success=True
                )
                
                return final_image
                
            except Exception as primary_error:
                logger.warning(f"Primary processing failed: {str(primary_error)}")
                
                # Try rembg fallback models first
                if retry_count < len(self.fallback_models):
                    await self._update_processing_status(
                        processing_id, 
                        "processing", 
                        50, 
                        f"Retrying with alternative method..."
                    )
                    
                    return await self._process_with_fallback(
                        image_data, 
                        processing_id, 
                        retry_count
                    )
                else:
                    # If all rembg models fail, try multi-library fallback
                    await self._update_processing_status(
                        processing_id, 
                        "processing", 
                        70, 
                        f"Trying alternative processing libraries..."
                    )
                    
                    return await self._process_with_multi_library_fallback(
                        image_data, 
                        processing_id
                    )
                    
        except Exception as e:
            await self._update_processing_status(
                processing_id, 
                "failed", 
                0, 
                f"Processing failed: {str(e)}"
            )
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            await track_processing_performance(
                processing_id=processing_id,
                library="rembg",
                model=self.primary_model,
                processing_time=processing_time,
                input_size=len(image_data),
                output_size=0,
                success=False,
                error=str(e)
            )
            
            raise e
    
    async def _process_with_rembg(self, image_data: bytes, processing_id: str) -> bytes:
        """Process image using optimized rembg session-based approach"""
        
        def _sync_process():
            # Use session for optimal performance (2025 rembg pattern)
            session = self._sessions.get(self.primary_model)
            if session:
                return remove(
                    image_data, 
                    session=session,
                    force_return_bytes=True  # Consistent response handling
                )
            else:
                # Fallback to model-based processing
                return remove(image_data, model_name=self.primary_model)
        
        # Run in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        processed_data = await loop.run_in_executor(None, _sync_process)
        
        return processed_data
    
    async def _process_with_fallback(
        self, 
        image_data: bytes, 
        processing_id: str, 
        retry_count: int
    ) -> bytes:
        """Process with fallback model using session optimization"""
        fallback_model = self.fallback_models[retry_count]
        
        try:
            def _sync_fallback_process():
                # Use session if available, fallback to model name
                session = self._sessions.get(fallback_model)
                if session:
                    return remove(
                        image_data, 
                        session=session,
                        force_return_bytes=True
                    )
                else:
                    # Create temporary session for this request
                    try:
                        temp_session = new_session(fallback_model)
                        return remove(
                            image_data, 
                            session=temp_session,
                            force_return_bytes=True
                        )
                    except Exception:
                        # Fallback to legacy approach
                        return remove(image_data, model_name=fallback_model)
            
            loop = asyncio.get_event_loop()
            processed_data = await loop.run_in_executor(None, _sync_fallback_process)
            
            final_image = await self._optimize_output(processed_data)
            
            # Track fallback success
            logger.info(f"Fallback processing successful with {fallback_model}")
            
            return final_image
            
        except Exception as fallback_error:
            if retry_count + 1 < len(self.fallback_models):
                # Try next fallback
                return await self._process_with_fallback(
                    image_data, 
                    processing_id, 
                    retry_count + 1
                )
            else:
                # All fallbacks exhausted
                raise Exception(f"All processing methods failed. Last error: {str(fallback_error)}")
    
    async def _process_with_multi_library_fallback(
        self, 
        image_data: bytes, 
        processing_id: str
    ) -> bytes:
        """Process with multi-library fallback (Phase 0 architecture)"""
        try:
            # Initialize multi-processor if not already done
            if not self._multi_processor_initialized:
                await self.multi_processor.initialize_all_processors()
                self._multi_processor_initialized = True
            
            # Use multi-library processor with fallback
            processed_image, processor_used, processing_time = await self.multi_processor.process_with_fallback(
                image_data,
                processing_id,
                quality_mode=False  # Prioritize speed for MVP
            )
            
            # Optimize output
            final_image = await self._optimize_output(processed_image)
            
            logger.info(f"Multi-library processing successful with {processor_used} in {processing_time:.2f}s")
            return final_image
            
        except Exception as multi_error:
            logger.error(f"Multi-library processing failed: {str(multi_error)}")
            raise Exception(f"All processing methods exhausted. Last error: {str(multi_error)}")
    
    async def _optimize_output(self, image_data: bytes) -> bytes:
        """Optimize output image for web delivery"""
        image = Image.open(io.BytesIO(image_data))
        
        # Ensure RGBA mode for transparency
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        
        # Compress while maintaining quality
        output_buffer = io.BytesIO()
        image.save(
            output_buffer, 
            format="PNG", 
            optimize=True, 
            compress_level=6
        )
        
        return output_buffer.getvalue()
    
    async def _update_processing_status(
        self, 
        processing_id: str, 
        status: str, 
        progress: int, 
        message: str
    ):
        """Update processing status for real-time tracking"""
        self.processing_status[processing_id] = ProcessingStatus(
            processing_id=processing_id,
            status=status,
            progress=progress,
            message=message,
            estimated_completion=datetime.utcnow() if status == "completed" else None
        )
    
    async def get_processing_status(self, processing_id: str) -> Dict[str, Any]:
        """Get current processing status"""
        status = self.processing_status.get(processing_id)
        if not status:
            return {
                "processing_id": processing_id,
                "status": "not_found",
                "progress": 0,
                "message": "Processing ID not found"
            }
        
        return status.dict()
    
    def cleanup_status(self, processing_id: str):
        """Clean up status tracking for completed/failed processes"""
        if processing_id in self.processing_status:
            del self.processing_status[processing_id]