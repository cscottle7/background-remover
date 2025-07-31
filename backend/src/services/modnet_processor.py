"""
MODNet Background Removal Processor
Implements MODNet trimap-free portrait matting as rembg alternative
"""

import io
import logging
import asyncio
import numpy as np
from typing import Optional, Tuple
from datetime import datetime
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import requests
import os

logger = logging.getLogger(__name__)

class MODNetProcessor:
    """
    MODNet processor for real-time trimap-free portrait matting
    Optimized for AI-generated character assets
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.model_path = model_path or self._get_default_model_path()
        self.transform = self._setup_transforms()
        self.is_initialized = False
        
    def _get_default_model_path(self) -> str:
        """Get default model path, download if necessary"""
        model_dir = "models/modnet"
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, "modnet_photographic_portrait_matting.ckpt")
        
        if not os.path.exists(model_path):
            logger.info("MODNet model not found, will download on first use")
        
        return model_path
    
    def _setup_transforms(self) -> transforms.Compose:
        """Setup image preprocessing transforms"""
        return transforms.Compose([
            transforms.Resize((512, 512)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    async def initialize(self) -> bool:
        """Initialize MODNet model asynchronously"""
        if self.is_initialized:
            return True
            
        try:
            # Download model if not exists
            if not os.path.exists(self.model_path):
                await self._download_model()
            
            # Load model in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(None, self._load_model)
            
            self.is_initialized = True
            logger.info("MODNet processor initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize MODNet: {str(e)}")
            return False
    
    def _load_model(self):
        """Load MODNet model (runs in thread pool)"""
        try:
            # Import MODNet architecture (simplified version)
            from .modnet_architecture import MODNet
            
            # Initialize model
            modnet = MODNet(backbone_pretrained=False)
            modnet = nn.DataParallel(modnet)
            
            # Load checkpoint
            checkpoint = torch.load(self.model_path, map_location=self.device)
            modnet.load_state_dict(checkpoint['state_dict'])
            modnet.eval()
            modnet.to(self.device)
            
            logger.info("MODNet model loaded successfully")
            return modnet
            
        except Exception as e:
            logger.error(f"Failed to load MODNet model: {str(e)}")
            raise
    
    async def _download_model(self):
        """Download MODNet pretrained model"""
        model_url = "https://drive.google.com/uc?id=1mcr7ALciuAsHCpLnrtG_eop5-EYhbCmz"
        
        logger.info("Downloading MODNet model...")
        
        def _sync_download():
            response = requests.get(model_url, stream=True)
            response.raise_for_status()
            
            with open(self.model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _sync_download)
        
        logger.info("MODNet model downloaded successfully")
    
    async def process_image(self, image_data: bytes) -> bytes:
        """
        Process image with MODNet for background removal
        
        Args:
            image_data: Input image as bytes
            
        Returns:
            Processed image with transparent background as bytes
        """
        if not self.is_initialized:
            await self.initialize()
        
        if not self.model:
            raise Exception("MODNet model not initialized")
        
        start_time = datetime.utcnow()
        
        try:
            # Process in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._sync_process, image_data)
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"MODNet processing completed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"MODNet processing failed after {processing_time:.2f}s: {str(e)}")
            raise
    
    def _sync_process(self, image_data: bytes) -> bytes:
        """Synchronous processing method (runs in thread pool)"""
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        original_size = image.size
        
        # Preprocess
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            pred_semantic, pred_detail, pred_matte = self.model(input_tensor, True)
        
        # Post-process matte
        pred_matte = pred_matte.cpu().numpy()[0, 0]
        pred_matte = (pred_matte * 255).astype(np.uint8)
        
        # Resize back to original size
        matte_image = Image.fromarray(pred_matte, mode='L')
        matte_image = matte_image.resize(original_size, Image.LANCZOS)
        
        # Create RGBA image
        original_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        result_image = Image.new('RGBA', original_size)
        
        # Apply matte as alpha channel
        for x in range(original_size[0]):
            for y in range(original_size[1]):
                pixel = original_image.getpixel((x, y))
                alpha = matte_image.getpixel((x, y))
                result_image.putpixel((x, y), (*pixel, alpha))
        
        # Convert to bytes
        output_buffer = io.BytesIO()
        result_image.save(output_buffer, format='PNG', optimize=True)
        
        return output_buffer.getvalue()
    
    def get_performance_metrics(self) -> dict:
        """Get processor performance characteristics"""
        return {
            "name": "MODNet",
            "expected_processing_time": "1-2 seconds",
            "gpu_memory_usage": "~2GB",
            "accuracy": "75-85%",
            "strengths": ["Real-time performance", "Portrait optimized", "Trimap-free"],
            "weaknesses": ["Human-centric", "GPU dependent"],
            "suitable_for": "AI-generated character portraits"
        }
    
    async def health_check(self) -> bool:
        """Check if processor is healthy and ready"""
        try:
            if not self.is_initialized:
                return await self.initialize()
            
            # Quick inference test with dummy data
            dummy_image = Image.new('RGB', (256, 256), color='red')
            dummy_buffer = io.BytesIO()
            dummy_image.save(dummy_buffer, format='PNG')
            dummy_data = dummy_buffer.getvalue()
            
            # Test processing (timeout after 10 seconds)
            result = await asyncio.wait_for(
                self.process_image(dummy_data), 
                timeout=10.0
            )
            
            return len(result) > 0
            
        except Exception as e:
            logger.error(f"MODNet health check failed: {str(e)}")
            return False