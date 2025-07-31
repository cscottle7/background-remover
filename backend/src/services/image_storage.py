"""
Image storage service with 1-hour auto-deletion
Implements privacy-compliant temporary storage
"""

import boto3
import os
import logging
from typing import Optional
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger(__name__)

class ImageStorageService:
    """
    Manages temporary image storage with automatic cleanup
    Implements 1-hour retention policy for privacy compliance
    """
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = f"charactercut-assets-{os.getenv('STAGE', 'dev')}"
        
    async def store_image(
        self, 
        image_data: bytes, 
        processing_id: str, 
        expires_in_hours: int = 1
    ) -> str:
        """
        Store processed image with automatic expiration
        Returns signed URL for download
        """
        try:
            object_key = f"processed/{processing_id}.png"
            
            # Calculate expiration time
            expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
            
            # Upload to S3 with metadata
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=image_data,
                ContentType="image/png",
                Metadata={
                    'processing_id': processing_id,
                    'expires_at': expires_at.isoformat(),
                    'content_hash': self._calculate_hash(image_data)
                },
                # Server-side encryption
                ServerSideEncryption='AES256'
            )
            
            # Generate presigned URL for download (1 hour expiration)
            download_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_key
                },
                ExpiresIn=3600  # 1 hour
            )
            
            logger.info(f"Image stored successfully: {processing_id}")
            return download_url
            
        except Exception as e:
            logger.error(f"Failed to store image {processing_id}: {str(e)}")
            raise Exception(f"Storage failed: {str(e)}")
    
    async def get_image(self, processing_id: str) -> Optional[bytes]:
        """
        Retrieve stored image by processing ID
        Returns None if image not found or expired
        """
        try:
            object_key = f"processed/{processing_id}.png"
            
            # Check if object exists and get metadata
            try:
                response = self.s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=object_key
                )
                
                # Check expiration
                expires_at_str = response.get('Metadata', {}).get('expires_at')
                if expires_at_str:
                    expires_at = datetime.fromisoformat(expires_at_str)
                    if datetime.utcnow() > expires_at:
                        # Image has expired, delete it
                        await self.delete_image(processing_id)
                        return None
                        
            except self.s3_client.exceptions.NoSuchKey:
                return None
            
            # Download image data
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=object_key
            )
            
            return response['Body'].read()
            
        except Exception as e:
            logger.error(f"Failed to retrieve image {processing_id}: {str(e)}")
            return None
    
    async def delete_image(self, processing_id: str) -> bool:
        """
        Delete stored image
        Used for cleanup and privacy compliance
        """
        try:
            object_key = f"processed/{processing_id}.png"
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key
            )
            
            logger.info(f"Image deleted: {processing_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete image {processing_id}: {str(e)}")
            return False
    
    async def schedule_cleanup(self, processing_id: str, expires_at: datetime):
        """
        Schedule automatic cleanup for privacy compliance
        Called as background task after successful processing
        """
        # In production, this would integrate with a job queue
        # For now, we rely on S3 lifecycle policies and periodic cleanup
        logger.info(f"Cleanup scheduled for {processing_id} at {expires_at}")
    
    async def cleanup_expired_images(self) -> int:
        """
        Clean up all expired images
        Called by scheduled cleanup function
        """
        cleaned_count = 0
        
        try:
            # List all objects in the processed/ prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="processed/"
            )
            
            if 'Contents' not in response:
                return 0
            
            current_time = datetime.utcnow()
            
            for obj in response['Contents']:
                try:
                    # Get object metadata to check expiration
                    head_response = self.s3_client.head_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    
                    expires_at_str = head_response.get('Metadata', {}).get('expires_at')
                    if expires_at_str:
                        expires_at = datetime.fromisoformat(expires_at_str)
                        
                        # Delete if expired
                        if current_time > expires_at:
                            self.s3_client.delete_object(
                                Bucket=self.bucket_name,
                                Key=obj['Key']
                            )
                            cleaned_count += 1
                            logger.info(f"Cleaned up expired image: {obj['Key']}")
                    
                    # Also delete objects older than 2 hours as failsafe
                    elif current_time - obj['LastModified'].replace(tzinfo=None) > timedelta(hours=2):
                        self.s3_client.delete_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
                        cleaned_count += 1
                        logger.info(f"Cleaned up old image: {obj['Key']}")
                        
                except Exception as obj_error:
                    logger.error(f"Error cleaning up {obj['Key']}: {str(obj_error)}")
                    continue
            
            logger.info(f"Cleanup complete. Removed {cleaned_count} expired images.")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
            return cleaned_count
    
    def _calculate_hash(self, data: bytes) -> str:
        """Calculate SHA-256 hash for data integrity verification"""
        return hashlib.sha256(data).hexdigest()