"""
Multi-Library Background Removal Processor
Implements fallback architecture strategy for risk mitigation
"""

import io
import time
import logging
import asyncio
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
from enum import Enum

from .modnet_processor import MODNetProcessor
from .bgmattingv2_processor import BackgroundMattingV2Processor, FastBGMattingProcessor
from ..utils.monitoring import track_processing_performance

logger = logging.getLogger(__name__)

class ProcessorTier(Enum):
    """Processing tier definitions"""
    PRIMARY = "primary"
    HIGH_QUALITY = "high_quality"
    INTERACTIVE = "interactive"

class ProcessorStatus(Enum):
    """Processor status definitions"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    UNKNOWN = "unknown"

class MultiLibraryProcessor:
    """
    Multi-library background removal processor with automatic fallback
    Implements Phase 0 requirement for eliminating single point of failure
    """
    
    def __init__(self):
        self.processors = self._initialize_processors()
        self.processor_health = {}
        self.performance_history = {}
        self.failover_threshold = 5.0  # seconds
        self.max_retries = 3
        
    def _initialize_processors(self) -> Dict[str, Dict[str, Any]]:
        """Initialize all available processors with tier assignments"""
        return {
            # Tier 1: Primary Processing (Fast, reliable)
            'rembg_isnet': {
                'processor': None,  # Will be initialized from existing service
                'tier': ProcessorTier.PRIMARY,
                'expected_time': 2.0,
                'priority': 1,
                'strengths': ['Fast', 'Reliable', 'AI-character optimized'],
                'init_func': self._init_rembg_isnet
            },
            'modnet': {
                'processor': MODNetProcessor(),
                'tier': ProcessorTier.PRIMARY,
                'expected_time': 1.5,
                'priority': 2,
                'strengths': ['Very fast', 'Portrait optimized', 'Trimap-free'],
                'init_func': None
            },
            
            # Tier 2: High-Quality Fallback (Quality over speed)
            'bgmatting_v2': {
                'processor': BackgroundMattingV2Processor(),
                'tier': ProcessorTier.HIGH_QUALITY,
                'expected_time': 3.0,
                'priority': 3,
                'strengths': ['High quality', 'Complex backgrounds', 'Edge detail'],
                'init_func': None
            },
            'fast_bgmatting': {
                'processor': FastBGMattingProcessor(),
                'tier': ProcessorTier.HIGH_QUALITY,
                'expected_time': 2.5,
                'priority': 4,
                'strengths': ['Good quality', 'Faster than full BGMatting'],
                'init_func': None
            },
            
            # Tier 3: Baseline fallback (rembg alternatives)
            'rembg_u2net': {
                'processor': None,  # Will be initialized from existing service
                'tier': ProcessorTier.PRIMARY,
                'expected_time': 2.5,
                'priority': 5,
                'strengths': ['Reliable baseline', 'Well-tested'],
                'init_func': self._init_rembg_u2net
            }
        }
    
    def _init_rembg_isnet(self):
        """Initialize rembg with isnet-general-use model"""
        # This would interface with existing rembg service
        pass
    
    def _init_rembg_u2net(self):
        """Initialize rembg with u2net model"""
        # This would interface with existing rembg service
        pass
    
    async def initialize_all_processors(self) -> Dict[str, bool]:
        """Initialize all processors and check their health"""
        initialization_results = {}
        
        for name, config in self.processors.items():
            try:
                processor = config['processor']
                if processor and hasattr(processor, 'initialize'):
                    success = await processor.initialize()
                    initialization_results[name] = success
                    self.processor_health[name] = ProcessorStatus.HEALTHY if success else ProcessorStatus.FAILED
                else:
                    # For rembg processors, assume they're available
                    initialization_results[name] = True
                    self.processor_health[name] = ProcessorStatus.HEALTHY
                    
            except Exception as e:
                logger.error(f"Failed to initialize {name}: {str(e)}")
                initialization_results[name] = False
                self.processor_health[name] = ProcessorStatus.FAILED
        
        healthy_count = sum(1 for success in initialization_results.values() if success)
        logger.info(f"Initialized {healthy_count}/{len(self.processors)} processors successfully")
        
        return initialization_results
    
    async def process_with_fallback(
        self, 
        image_data: bytes, 
        processing_id: str,
        preferred_tier: Optional[ProcessorTier] = None,
        quality_mode: bool = False
    ) -> Tuple[bytes, str, float]:
        """
        Process image with automatic fallback strategy
        
        Args:
            image_data: Input image bytes
            processing_id: Unique processing identifier
            preferred_tier: Preferred processing tier
            quality_mode: If True, prioritize quality over speed
            
        Returns:
            Tuple of (processed_image_bytes, processor_used, processing_time)
        """
        start_time = time.time()
        
        # Get ordered list of processors to try
        processor_order = self._get_processor_order(preferred_tier, quality_mode)
        
        last_error = None
        attempts = 0
        
        for processor_name in processor_order:
            if attempts >= self.max_retries:
                logger.warning(f"Max retries ({self.max_retries}) reached for processing_id {processing_id}")
                break
            
            config = self.processors[processor_name]
            processor = config['processor']
            
            # Skip if processor is known to be failed
            if self.processor_health.get(processor_name) == ProcessorStatus.FAILED:
                logger.debug(f"Skipping failed processor: {processor_name}")
                continue
            
            try:
                logger.info(f"Attempting processing with {processor_name} (attempt {attempts + 1})")
                
                # Process with timeout
                process_start = time.time()
                
                if processor_name.startswith('rembg_'):
                    # Handle rembg processors through existing service
                    result = await self._process_with_rembg(image_data, processor_name)
                else:
                    # Handle alternative processors
                    result = await asyncio.wait_for(
                        processor.process_image(image_data),
                        timeout=self.failover_threshold + 2.0
                    )
                
                process_time = time.time() - process_start
                total_time = time.time() - start_time
                
                # Update performance tracking
                await self._update_performance_tracking(
                    processor_name, process_time, True, processing_id
                )
                
                # Check if processing time is acceptable
                if process_time <= self.failover_threshold:
                    logger.info(f"Successfully processed with {processor_name} in {process_time:.2f}s")
                    self.processor_health[processor_name] = ProcessorStatus.HEALTHY
                    return result, processor_name, total_time
                else:
                    logger.warning(f"{processor_name} processed in {process_time:.2f}s (above threshold)")
                    self.processor_health[processor_name] = ProcessorStatus.DEGRADED
                    
                    # Continue to next processor if time threshold exceeded
                    continue
                
            except asyncio.TimeoutError:
                process_time = self.failover_threshold + 2.0
                logger.warning(f"{processor_name} timed out after {process_time:.2f}s")
                self.processor_health[processor_name] = ProcessorStatus.DEGRADED
                last_error = f"Timeout after {process_time:.2f}s"
                
            except Exception as e:
                process_time = time.time() - process_start if 'process_start' in locals() else 0
                logger.error(f"{processor_name} failed: {str(e)}")
                self.processor_health[processor_name] = ProcessorStatus.FAILED
                last_error = str(e)
                
                await self._update_performance_tracking(
                    processor_name, process_time, False, processing_id, str(e)
                )
            
            attempts += 1
        
        # All processors failed
        total_time = time.time() - start_time
        error_msg = f"All processors failed. Last error: {last_error}"
        logger.error(error_msg)
        
        raise Exception(error_msg)
    
    def _get_processor_order(
        self, 
        preferred_tier: Optional[ProcessorTier], 
        quality_mode: bool
    ) -> List[str]:
        """Get ordered list of processors to try based on preferences"""
        
        # Filter healthy processors
        available_processors = [
            name for name, status in self.processor_health.items()
            if status != ProcessorStatus.FAILED
        ]
        
        if not available_processors:
            # If no health data, assume all are available
            available_processors = list(self.processors.keys())
        
        # Sort by priority and tier preference
        def sort_key(processor_name):
            config = self.processors[processor_name]
            
            # Base priority
            priority_score = config['priority']
            
            # Tier preference bonus
            if preferred_tier and config['tier'] == preferred_tier:
                priority_score -= 10  # Lower number = higher priority
            
            # Quality mode adjustments
            if quality_mode:
                if config['tier'] == ProcessorTier.HIGH_QUALITY:
                    priority_score -= 5
                elif processor_name == 'bgmatting_v2':
                    priority_score -= 8  # Highest quality
            else:
                # Speed mode - prefer faster processors
                if config['expected_time'] <= 2.0:
                    priority_score -= 3
            
            # Health status adjustment
            health_status = self.processor_health.get(processor_name, ProcessorStatus.UNKNOWN)
            if health_status == ProcessorStatus.DEGRADED:
                priority_score += 5
            elif health_status == ProcessorStatus.FAILED:
                priority_score += 100  # Should be filtered out, but just in case
            
            return priority_score
        
        sorted_processors = sorted(available_processors, key=sort_key)
        
        logger.debug(f"Processor order: {sorted_processors}")
        return sorted_processors
    
    async def _process_with_rembg(self, image_data: bytes, processor_name: str) -> bytes:
        """Process image using existing rembg service"""
        # This would interface with the existing BackgroundRemovalService
        # For now, simulate the call
        from .background_removal import BackgroundRemovalService
        
        rembg_service = BackgroundRemovalService()
        
        # Set appropriate model based on processor name
        if processor_name == 'rembg_isnet':
            rembg_service.primary_model = 'isnet-general-use'
        elif processor_name == 'rembg_u2net':
            rembg_service.primary_model = 'u2net'
        
        # Generate a processing ID for rembg service
        rembg_processing_id = f"multi_lib_{int(time.time())}"
        
        return await rembg_service.remove_background(
            image_data, 
            rembg_processing_id, 
            retry_count=0
        )
    
    async def _update_performance_tracking(
        self, 
        processor_name: str, 
        processing_time: float, 
        success: bool, 
        processing_id: str,
        error: Optional[str] = None
    ):
        """Update performance tracking for processor"""
        
        # Update local performance history
        if processor_name not in self.performance_history:
            self.performance_history[processor_name] = {
                'total_attempts': 0,
                'successful_attempts': 0,
                'average_time': 0.0,
                'recent_times': []
            }
        
        history = self.performance_history[processor_name]
        history['total_attempts'] += 1
        
        if success:
            history['successful_attempts'] += 1
            history['recent_times'].append(processing_time)
            
            # Keep only last 10 times for rolling average
            if len(history['recent_times']) > 10:
                history['recent_times'] = history['recent_times'][-10:]
            
            history['average_time'] = sum(history['recent_times']) / len(history['recent_times'])
        
        # Track with monitoring system
        await track_processing_performance(
            processing_id=processing_id,
            library=processor_name,
            model=processor_name,
            processing_time=processing_time,
            input_size=0,  # Not tracking input size in this context
            output_size=0,  # Not tracking output size in this context
            success=success,
            error=error
        )
    
    async def get_processor_health_report(self) -> Dict[str, Any]:
        """Get comprehensive health report for all processors"""
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'processors': {},
            'summary': {
                'total_processors': len(self.processors),
                'healthy_processors': 0,
                'degraded_processors': 0,
                'failed_processors': 0
            }
        }
        
        for name, config in self.processors.items():
            status = self.processor_health.get(name, ProcessorStatus.UNKNOWN)
            performance = self.performance_history.get(name, {})
            
            processor_info = {
                'status': status.value,
                'tier': config['tier'].value,
                'expected_time': config['expected_time'],
                'priority': config['priority'],
                'strengths': config['strengths'],
                'performance': performance
            }
            
            # Add health check if processor supports it
            if config['processor'] and hasattr(config['processor'], 'health_check'):
                try:
                    is_healthy = await config['processor'].health_check()
                    processor_info['health_check'] = is_healthy
                    if not is_healthy and status == ProcessorStatus.HEALTHY:
                        self.processor_health[name] = ProcessorStatus.DEGRADED
                        processor_info['status'] = ProcessorStatus.DEGRADED.value
                except Exception as e:
                    processor_info['health_check_error'] = str(e)
            
            report['processors'][name] = processor_info
            
            # Update summary
            if status == ProcessorStatus.HEALTHY:
                report['summary']['healthy_processors'] += 1
            elif status == ProcessorStatus.DEGRADED:
                report['summary']['degraded_processors'] += 1
            elif status == ProcessorStatus.FAILED:
                report['summary']['failed_processors'] += 1
        
        return report
    
    async def reset_processor_health(self, processor_name: Optional[str] = None):
        """Reset health status for processors"""
        if processor_name:
            if processor_name in self.processor_health:
                self.processor_health[processor_name] = ProcessorStatus.UNKNOWN
                logger.info(f"Reset health status for {processor_name}")
        else:
            self.processor_health.clear()
            logger.info("Reset health status for all processors")
    
    def get_recommended_processor(
        self, 
        image_complexity: str = "medium",
        time_preference: str = "fast"
    ) -> str:
        """Get recommended processor based on requirements"""
        
        if time_preference == "fast":
            if image_complexity == "simple":
                return "modnet"
            else:
                return "rembg_isnet"
        elif time_preference == "quality":
            if image_complexity == "complex":
                return "bgmatting_v2"
            else:
                return "fast_bgmatting"
        else:
            return "rembg_isnet"  # Default fallback