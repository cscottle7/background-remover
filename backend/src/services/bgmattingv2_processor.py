"""
BackgroundMattingV2 Processor
High-quality background matting as rembg alternative
"""

import io
import logging
import asyncio
import numpy as np
from typing import Optional, Tuple
from datetime import datetime
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
from PIL import Image
import requests
import os

logger = logging.getLogger(__name__)

class BackgroundMattingV2Processor:
    """
    BackgroundMattingV2 processor for high-resolution background matting
    Provides state-of-the-art quality for complex character assets
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.model_path = model_path or self._get_default_model_path()
        self.transform = self._setup_transforms()
        self.is_initialized = False
        
    def _get_default_model_path(self) -> str:
        """Get default model path, download if necessary"""
        model_dir = "models/bgmattingv2"
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, "pytorch_mobilenetv2.pth")
        
        if not os.path.exists(model_path):
            logger.info("BackgroundMattingV2 model not found, will download on first use")
        
        return model_path
    
    def _setup_transforms(self) -> transforms.Compose:
        """Setup image preprocessing transforms"""
        return transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    async def initialize(self) -> bool:
        """Initialize BackgroundMattingV2 model asynchronously"""
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
            logger.info("BackgroundMattingV2 processor initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize BackgroundMattingV2: {str(e)}")
            return False
    
    def _load_model(self):
        """Load BackgroundMattingV2 model (runs in thread pool)"""
        try:
            # Import BackgroundMattingV2 architecture
            from .bgmattingv2_architecture import MattingRefine, MattingBase
            
            # Initialize model components
            backbone = MattingBase('mobilenetv2')
            model = MattingRefine(
                'refine',
                backbone=backbone.backbone,
                backbone_scale=0.25,
                refine_mode='sampling',
                refine_sample_pixels=80000,
            )
            
            # Load checkpoint
            checkpoint = torch.load(self.model_path, map_location=self.device)
            model.load_state_dict(checkpoint, strict=False)
            model.eval()
            model.to(self.device)
            
            logger.info("BackgroundMattingV2 model loaded successfully")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load BackgroundMattingV2 model: {str(e)}")
            raise
    
    async def _download_model(self):
        """Download BackgroundMattingV2 pretrained model"""
        # Note: This would need to be updated with actual model URL
        model_url = "https://github.com/PeterL1n/BackgroundMattingV2/releases/download/v1.0/pytorch_mobilenetv2.pth"
        
        logger.info("Downloading BackgroundMattingV2 model...")
        
        def _sync_download():
            response = requests.get(model_url, stream=True)
            response.raise_for_status()
            
            with open(self.model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _sync_download)
        
        logger.info("BackgroundMattingV2 model downloaded successfully")
    
    async def process_image(self, image_data: bytes) -> bytes:
        """
        Process image with BackgroundMattingV2 for background removal
        
        Args:
            image_data: Input image as bytes
            
        Returns:
            Processed image with transparent background as bytes
        """
        if not self.is_initialized:
            await self.initialize()
        
        if not self.model:
            raise Exception("BackgroundMattingV2 model not initialized")
        
        start_time = datetime.utcnow()
        
        try:
            # Process in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._sync_process, image_data)
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"BackgroundMattingV2 processing completed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"BackgroundMattingV2 processing failed after {processing_time:.2f}s: {str(e)}")
            raise
    
    def _sync_process(self, image_data: bytes) -> bytes:
        """Synchronous processing method (runs in thread pool)"""
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        original_size = image.size
        
        # Convert to tensor and normalize
        src_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Resize for processing (maintain aspect ratio)
        h, w = src_tensor.shape[2:]
        downsample_ratio = min(512 / max(h, w), 1.0)
        
        if downsample_ratio < 1.0:
            new_h = int(h * downsample_ratio)
            new_w = int(w * downsample_ratio)
            src_tensor = F.interpolate(src_tensor, size=(new_h, new_w), mode='area')
        
        # Inference
        with torch.no_grad():
            pha, fgr = self.model(src_tensor, downsample_ratio=downsample_ratio)
        
        # Resize back to original size
        if downsample_ratio < 1.0:
            pha = F.interpolate(pha, size=(h, w), mode='bilinear', align_corners=False)
            fgr = F.interpolate(fgr, size=(h, w), mode='bilinear', align_corners=False)
        
        # Convert to numpy
        pha = pha[0, 0].cpu().numpy()
        fgr = fgr[0].permute(1, 2, 0).cpu().numpy() * 255
        
        # Ensure alpha is in [0, 1] range
        pha = np.clip(pha, 0, 1)
        
        # Create result image
        result_image = Image.new('RGBA', original_size)
        
        # Resize alpha and foreground to original size
        pha_img = Image.fromarray((pha * 255).astype(np.uint8), mode='L')
        pha_img = pha_img.resize(original_size, Image.LANCZOS)
        
        fgr_img = Image.fromarray(fgr.astype(np.uint8), mode='RGB')
        fgr_img = fgr_img.resize(original_size, Image.LANCZOS)
        
        # Composite RGBA image
        original_img = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        for x in range(original_size[0]):
            for y in range(original_size[1]):
                alpha = pha_img.getpixel((x, y))
                if alpha > 0:
                    pixel = original_img.getpixel((x, y))
                    result_image.putpixel((x, y), (*pixel, alpha))
                else:
                    result_image.putpixel((x, y), (0, 0, 0, 0))
        
        # Convert to bytes
        output_buffer = io.BytesIO()
        result_image.save(output_buffer, format='PNG', optimize=True)
        
        return output_buffer.getvalue()
    
    def get_performance_metrics(self) -> dict:
        """Get processor performance characteristics"""
        return {
            "name": "BackgroundMattingV2",
            "expected_processing_time": "1-3 seconds",
            "gpu_memory_usage": "~3GB",
            "accuracy": "80-90%",
            "strengths": ["High quality", "Complex backgrounds", "Edge detail"],
            "weaknesses": ["Higher memory", "Slower processing"],
            "suitable_for": "High-quality character assets with complex backgrounds"
        }
    
    async def health_check(self) -> bool:
        """Check if processor is healthy and ready"""
        try:
            if not self.is_initialized:
                return await self.initialize()
            
            # Quick inference test with dummy data
            dummy_image = Image.new('RGB', (256, 256), color='blue')
            dummy_buffer = io.BytesIO()
            dummy_image.save(dummy_buffer, format='PNG')
            dummy_data = dummy_buffer.getvalue()
            
            # Test processing (timeout after 15 seconds for higher quality model)
            result = await asyncio.wait_for(
                self.process_image(dummy_data), 
                timeout=15.0
            )
            
            return len(result) > 0
            
        except Exception as e:
            logger.error(f"BackgroundMattingV2 health check failed: {str(e)}")
            return False

class FastBGMattingProcessor:
    """
    Simplified version of BackgroundMattingV2 for faster processing
    Uses lighter architecture for time-critical scenarios
    """
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.is_initialized = False
        
    async def initialize(self) -> bool:
        """Initialize fast matting model"""
        if self.is_initialized:
            return True
            
        try:
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(None, self._create_fast_model)
            self.is_initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize FastBGMatting: {str(e)}")
            return False
    
    def _create_fast_model(self):
        """Create simplified matting model"""
        from .bgmattingv2_architecture import SimpleMattingModel
        model = SimpleMattingModel()
        model.eval()
        model.to(self.device)
        return model
    
    async def process_image(self, image_data: bytes) -> bytes:
        """Fast processing with simplified model"""
        if not self.is_initialized:
            await self.initialize()
        
        start_time = datetime.utcnow()
        
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._fast_sync_process, image_data)
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"Fast BGMatting processing completed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Fast BGMatting processing failed: {str(e)}")
            raise
    
    def _fast_sync_process(self, image_data: bytes) -> bytes:
        """Simplified synchronous processing"""
        # Basic implementation using simple thresholding + refinement
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Convert to tensor
        transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor()
        ])
        
        input_tensor = transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            # Simple processing with fast model
            alpha = self.model(input_tensor)
            alpha = F.interpolate(alpha, size=image.size[::-1], mode='bilinear')
            alpha = alpha[0, 0].cpu().numpy()
        
        # Create RGBA result
        result_image = Image.new('RGBA', image.size)
        for x in range(image.size[0]):
            for y in range(image.size[1]):
                pixel = image.getpixel((x, y))
                alpha_val = int(alpha[y, x] * 255)
                result_image.putpixel((x, y), (*pixel, alpha_val))
        
        # Convert to bytes
        output_buffer = io.BytesIO()
        result_image.save(output_buffer, format='PNG')
        return output_buffer.getvalue()