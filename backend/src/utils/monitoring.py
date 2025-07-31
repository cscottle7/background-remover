"""
Privacy-compliant monitoring and analytics utilities
Implements minimal data collection for success metrics tracking
"""

import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
import hashlib
import os

logger = logging.getLogger(__name__)

class PrivacyCompliantMetrics:
    """
    Privacy-first metrics collection
    Only collects essential data for success metrics measurement
    """
    
    def __init__(self):
        self.stage = os.getenv('STAGE', 'dev')
        self.metrics_enabled = os.getenv('METRICS_ENABLED', 'true').lower() == 'true'
    
    def anonymize_session_id(self, session_id: str) -> str:
        """Create anonymous hash of session ID for privacy"""
        return hashlib.sha256(session_id.encode()).hexdigest()[:16]
    
    def log_metric(self, metric_type: str, data: Dict[str, Any]):
        """Log metric with privacy compliance"""
        if not self.metrics_enabled:
            return
        
        # Add common metadata
        metric_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'stage': self.stage,
            'metric_type': metric_type,
            **data
        }
        
        # In production, this would send to CloudWatch or similar
        logger.info(f"METRIC: {json.dumps(metric_data)}")

# Global metrics instance
metrics = PrivacyCompliantMetrics()

async def log_processing_metrics(
    processing_id: str,
    session_id: str,
    processing_time: float,
    input_size: int,
    output_size: int,
    success: bool,
    error: Optional[str] = None
):
    """
    Log processing metrics for KPI measurement
    Anonymizes personal identifiers while preserving analytics value
    """
    try:
        metric_data = {
            'processing_id': processing_id,  # UUID, not personally identifiable
            'session_hash': metrics.anonymize_session_id(session_id),
            'processing_time_seconds': round(processing_time, 3),
            'input_size_bytes': input_size,
            'output_size_bytes': output_size,
            'compression_ratio': round(output_size / input_size, 3) if input_size > 0 else 0,
            'success': success,
            'under_5_seconds': processing_time < 5.0,  # Key performance metric
        }
        
        if error:
            metric_data['error_type'] = _classify_error(error)
        
        metrics.log_metric('image_processing', metric_data)
        
    except Exception as e:
        logger.error(f"Failed to log processing metrics: {str(e)}")

async def track_processing_performance(
    processing_id: str,
    library: str,
    model: str,
    processing_time: float,
    input_size: int,
    output_size: int,
    success: bool,
    error: Optional[str] = None
):
    """
    Track performance metrics for library comparison and optimization
    Supports Phase 0 alternative library research requirements
    """
    try:
        performance_data = {
            'processing_id': processing_id,
            'library': library,
            'model': model,
            'processing_time_seconds': round(processing_time, 3),
            'input_size_bytes': input_size,
            'output_size_bytes': output_size,
            'success': success,
            'performance_tier': _categorize_performance(processing_time),
        }
        
        if error:
            performance_data['error_category'] = _classify_error(error)
        
        metrics.log_metric('library_performance', performance_data)
        
    except Exception as e:
        logger.error(f"Failed to track performance metrics: {str(e)}")

async def log_user_journey_event(
    session_hash: str,
    event_type: str,
    additional_data: Optional[Dict[str, Any]] = None
):
    """
    Log user journey events for retention and engagement analysis
    Essential for measuring success metrics like session continuity
    """
    try:
        journey_data = {
            'session_hash': session_hash,
            'event_type': event_type,  # 'session_start', 'process_image', 'download', 'process_another'
        }
        
        if additional_data:
            journey_data.update(additional_data)
        
        metrics.log_metric('user_journey', journey_data)
        
    except Exception as e:
        logger.error(f"Failed to log journey event: {str(e)}")

async def log_system_health(
    component: str,
    status: str,
    response_time: Optional[float] = None,
    additional_data: Optional[Dict[str, Any]] = None
):
    """
    Log system health metrics for monitoring and alerting
    """
    try:
        health_data = {
            'component': component,
            'status': status,  # 'healthy', 'degraded', 'unhealthy'
        }
        
        if response_time is not None:
            health_data['response_time_seconds'] = round(response_time, 3)
        
        if additional_data:
            health_data.update(additional_data)
        
        metrics.log_metric('system_health', health_data)
        
    except Exception as e:
        logger.error(f"Failed to log health metric: {str(e)}")

def _classify_error(error: str) -> str:
    """Classify errors into categories for analytics without exposing sensitive info"""
    error_lower = error.lower()
    
    if 'timeout' in error_lower or 'time' in error_lower:
        return 'timeout'
    elif 'memory' in error_lower or 'oom' in error_lower:
        return 'memory'
    elif 'format' in error_lower or 'decode' in error_lower:
        return 'format_error'
    elif 'size' in error_lower or 'dimension' in error_lower:
        return 'size_error'
    elif 'network' in error_lower or 'connection' in error_lower:
        return 'network'
    elif 'permission' in error_lower or 'access' in error_lower:
        return 'permission'
    else:
        return 'unknown'

def _categorize_performance(processing_time: float) -> str:
    """Categorize processing time for performance analysis"""
    if processing_time < 2.0:
        return 'excellent'
    elif processing_time < 5.0:
        return 'good'
    elif processing_time < 10.0:
        return 'acceptable'
    else:
        return 'poor'

# Success metrics tracking functions
async def track_unique_user(session_hash: str, referrer: Optional[str] = None):
    """Track unique active users (KPI requirement)"""
    await log_user_journey_event(
        session_hash=session_hash,
        event_type='unique_session',
        additional_data={'referrer': referrer} if referrer else None
    )

async def track_task_completion(session_hash: str, success: bool, completion_time: float):
    """Track task completion rate (95% target)"""
    await log_user_journey_event(
        session_hash=session_hash,
        event_type='task_completion',
        additional_data={
            'success': success,
            'completion_time_seconds': round(completion_time, 3)
        }
    )

async def track_session_continuity(session_hash: str, images_processed: int):
    """Track session continuity (2+ images per session target)"""
    await log_user_journey_event(
        session_hash=session_hash,
        event_type='session_continuity',
        additional_data={
            'images_processed': images_processed,
            'meets_continuity_target': images_processed >= 2
        }
    )