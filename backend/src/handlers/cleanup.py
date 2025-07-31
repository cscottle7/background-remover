"""
Cleanup handler for scheduled image deletion
Implements 1-hour auto-deletion policy for privacy compliance
"""

import logging
from datetime import datetime

from ..services.image_storage import ImageStorageService
from ..utils.monitoring import log_system_health

logger = logging.getLogger(__name__)

async def handler(event, context):
    """
    AWS Lambda handler for scheduled cleanup
    Triggered hourly to remove expired images
    """
    start_time = datetime.utcnow()
    
    try:
        logger.info("Starting scheduled image cleanup")
        
        # Initialize storage service
        storage_service = ImageStorageService()
        
        # Perform cleanup
        cleaned_count = await storage_service.cleanup_expired_images()
        
        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Log success metrics
        await log_system_health(
            component='cleanup_service',
            status='healthy',
            response_time=execution_time,
            additional_data={
                'images_cleaned': cleaned_count,
                'execution_time_seconds': execution_time
            }
        )
        
        logger.info(f"Cleanup completed successfully. Removed {cleaned_count} images in {execution_time:.2f}s")
        
        return {
            'statusCode': 200,
            'body': {
                'message': 'Cleanup completed successfully',
                'images_cleaned': cleaned_count,
                'execution_time': execution_time
            }
        }
        
    except Exception as e:
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        logger.error(f"Cleanup failed: {str(e)}")
        
        # Log failure metrics
        await log_system_health(
            component='cleanup_service',
            status='unhealthy',
            response_time=execution_time,
            additional_data={
                'error': str(e),
                'execution_time_seconds': execution_time
            }
        )
        
        return {
            'statusCode': 500,
            'body': {
                'message': 'Cleanup failed',
                'error': str(e),
                'execution_time': execution_time
            }
        }