"""
Simplified MODNet Architecture Implementation
Based on MODNet: Real-Time Trimap-Free Portrait Matting via Objective Decomposition
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

class MODNet(nn.Module):
    """
    Simplified MODNet architecture for proof-of-concept
    Original paper: https://arxiv.org/abs/2011.11961
    """
    
    def __init__(self, backbone_pretrained=True):
        super(MODNet, self).__init__()
        
        # Backbone (MobileNetV2)
        mobilenet = models.mobilenet_v2(pretrained=backbone_pretrained)
        self.backbone = mobilenet.features
        
        # Low-resolution branch for semantic estimation
        self.lr_branch = self._make_lr_branch()
        
        # High-resolution branch for detail prediction
        self.hr_branch = self._make_hr_branch()
        
        # Fusion branch for final matte
        self.f_branch = self._make_f_branch()
        
    def _make_lr_branch(self):
        """Low-resolution branch for semantic estimation"""
        return nn.Sequential(
            nn.Conv2d(1280, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 1, kernel_size=1),
            nn.Sigmoid()
        )
    
    def _make_hr_branch(self):
        """High-resolution branch for detail prediction"""
        return nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid()
        )
    
    def _make_f_branch(self):
        """Fusion branch for final matte"""
        return nn.Sequential(
            nn.Conv2d(2, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid()
        )
    
    def forward(self, x, inference=False):
        """
        Forward pass through MODNet
        
        Args:
            x: Input image tensor [B, 3, H, W]
            inference: Whether this is inference mode
            
        Returns:
            tuple: (semantic_pred, detail_pred, matte_pred)
        """
        # Get input dimensions
        _, _, h, w = x.shape
        
        # Backbone feature extraction
        features = []
        for i, layer in enumerate(self.backbone):
            x = layer(x)
            if i in [1, 3, 6, 13, 17]:  # Extract features at different stages
                features.append(x)
        
        # Low-resolution semantic estimation
        lr_feature = features[-1]  # Last feature map
        semantic_pred = self.lr_branch(lr_feature)
        semantic_pred = F.interpolate(semantic_pred, size=(h, w), mode='bilinear', align_corners=False)
        
        # High-resolution detail prediction
        hr_feature = features[1]  # Early feature map for details
        detail_pred = self.hr_branch(hr_feature)
        detail_pred = F.interpolate(detail_pred, size=(h, w), mode='bilinear', align_corners=False)
        
        # Fusion for final matte
        if inference:
            # During inference, use predicted semantic and detail
            fused_input = torch.cat([semantic_pred, detail_pred], dim=1)
        else:
            # During training, might use ground truth (simplified for POC)
            fused_input = torch.cat([semantic_pred, detail_pred], dim=1)
        
        matte_pred = self.f_branch(fused_input)
        
        return semantic_pred, detail_pred, matte_pred
    
    def freeze_backbone(self):
        """Freeze backbone parameters for fine-tuning"""
        for param in self.backbone.parameters():
            param.requires_grad = False
    
    def unfreeze_backbone(self):
        """Unfreeze backbone parameters"""
        for param in self.backbone.parameters():
            param.requires_grad = True

class SimplifiedMODNet(nn.Module):
    """
    Ultra-simplified MODNet for fallback scenarios
    Faster but potentially lower quality
    """
    
    def __init__(self):
        super(SimplifiedMODNet, self).__init__()
        
        # Simplified encoder
        self.encoder = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
            
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )
        
        # Simplified decoder
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            
            nn.ConvTranspose2d(64, 32, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid()
        )
    
    def forward(self, x, inference=False):
        """Simplified forward pass"""
        features = self.encoder(x)
        matte = self.decoder(features)
        
        # Resize to input size
        matte = F.interpolate(matte, size=x.shape[2:], mode='bilinear', align_corners=False)
        
        # Return in same format as full MODNet
        return matte, matte, matte  # semantic, detail, matte (all same for simplicity)