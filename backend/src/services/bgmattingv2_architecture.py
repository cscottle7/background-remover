"""
Simplified BackgroundMattingV2 Architecture Implementation
Based on BackgroundMattingV2: Real-Time High-Resolution Background Matting
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

class MattingBase(nn.Module):
    """
    Base matting network with backbone feature extraction
    """
    
    def __init__(self, backbone='mobilenetv2'):
        super(MattingBase, self).__init__()
        
        if backbone == 'mobilenetv2':
            self.backbone = models.mobilenet_v2(pretrained=True).features
            self.channels = [16, 24, 32, 96, 320]
        elif backbone == 'resnet50':
            resnet = models.resnet50(pretrained=True)
            self.backbone = nn.Sequential(
                resnet.conv1, resnet.bn1, resnet.relu, resnet.maxpool,
                resnet.layer1, resnet.layer2, resnet.layer3, resnet.layer4
            )
            self.channels = [64, 256, 512, 1024, 2048]
        else:
            raise ValueError(f"Unsupported backbone: {backbone}")
    
    def forward(self, x):
        """Extract features at multiple scales"""
        features = []
        for i, layer in enumerate(self.backbone):
            x = layer(x)
            if isinstance(self.backbone, nn.Sequential):
                # ResNet layers
                if i in [0, 4, 5, 6, 7]:
                    features.append(x)
            else:
                # MobileNetV2 layers
                if i in [1, 3, 6, 13, 17]:
                    features.append(x)
        
        return features

class MattingRefine(nn.Module):
    """
    Refine network for high-quality matting
    Simplified version of BackgroundMattingV2 architecture
    """
    
    def __init__(self, refine_mode, backbone, backbone_scale=1/4, 
                 refine_mode='sampling', refine_sample_pixels=80000):
        super(MattingRefine, self).__init__()
        
        self.backbone = backbone
        self.backbone_scale = backbone_scale
        self.refine_mode = refine_mode
        self.refine_sample_pixels = refine_sample_pixels
        
        # Decoder for coarse prediction
        self.decoder = self._make_decoder()
        
        # Refinement network
        if refine_mode == 'sampling':
            self.refiner = self._make_refiner()
        
    def _make_decoder(self):
        """Create decoder network"""
        return nn.Sequential(
            # Upsample and reduce channels
            nn.ConvTranspose2d(1280, 512, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            
            nn.ConvTranspose2d(512, 256, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            
            nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            
            # Final prediction layers
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, kernel_size=1),  # Alpha channel
            nn.Sigmoid()
        )
    
    def _make_refiner(self):
        """Create refinement network"""
        return nn.Sequential(
            nn.Conv2d(4, 64, kernel_size=3, padding=1),  # Image + coarse alpha
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid()
        )
    
    def forward(self, src, downsample_ratio=1):
        """
        Forward pass through matting network
        
        Args:
            src: Source image [B, 3, H, W]
            downsample_ratio: Ratio for backbone processing
            
        Returns:
            tuple: (alpha, foreground)
        """
        # Extract features with backbone
        src_sm = F.interpolate(src, scale_factor=downsample_ratio, 
                              mode='bilinear', align_corners=False)
        
        features = self.backbone(src_sm)
        
        # Decode coarse alpha
        coarse_alpha = self.decoder(features[-1])
        
        # Upsample coarse alpha to input size
        if downsample_ratio != 1:
            coarse_alpha = F.interpolate(coarse_alpha, size=src.shape[2:], 
                                       mode='bilinear', align_corners=False)
        
        # Refine alpha if refinement is enabled
        if hasattr(self, 'refiner') and self.refine_mode == 'sampling':
            refined_alpha = self._refine_alpha(src, coarse_alpha)
        else:
            refined_alpha = coarse_alpha
        
        # Generate foreground (simplified approach)
        foreground = src * refined_alpha + (1 - refined_alpha) * 0  # Black background
        
        return refined_alpha, foreground
    
    def _refine_alpha(self, src, coarse_alpha):
        """Refine alpha using sampling-based approach"""
        # Simplified refinement: just apply refinement network
        refine_input = torch.cat([src, coarse_alpha], dim=1)
        
        # Apply refinement network
        refined = self.refiner(refine_input)
        
        # Combine coarse and refined predictions
        alpha = coarse_alpha + refined - coarse_alpha * refined
        
        return torch.clamp(alpha, 0, 1)

class SimpleMattingModel(nn.Module):
    """
    Ultra-simplified matting model for fast processing
    Uses basic U-Net architecture
    """
    
    def __init__(self):
        super(SimpleMattingModel, self).__init__()
        
        # Encoder
        self.enc1 = self._conv_block(3, 64)
        self.enc2 = self._conv_block(64, 128)
        self.enc3 = self._conv_block(128, 256)
        self.enc4 = self._conv_block(256, 512)
        
        # Bottleneck
        self.bottleneck = self._conv_block(512, 1024)
        
        # Decoder
        self.dec4 = self._upconv_block(1024, 512)
        self.dec3 = self._upconv_block(512, 256)
        self.dec2 = self._upconv_block(256, 128)
        self.dec1 = self._upconv_block(128, 64)
        
        # Final layer
        self.final = nn.Sequential(
            nn.Conv2d(64, 1, kernel_size=1),
            nn.Sigmoid()
        )
        
        self.pool = nn.MaxPool2d(2, 2)
    
    def _conv_block(self, in_channels, out_channels):
        """Basic convolution block"""
        return nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    
    def _upconv_block(self, in_channels, out_channels):
        """Upsampling convolution block"""
        return nn.Sequential(
            nn.ConvTranspose2d(in_channels, out_channels, kernel_size=2, stride=2),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    
    def forward(self, x):
        """Forward pass through simple U-Net"""
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        
        # Bottleneck
        b = self.bottleneck(self.pool(e4))
        
        # Decoder with skip connections
        d4 = self.dec4(b) + e4
        d3 = self.dec3(d4) + e3
        d2 = self.dec2(d3) + e2
        d1 = self.dec1(d2) + e1
        
        # Final alpha prediction
        alpha = self.final(d1)
        
        return alpha

class MattingNetwork(nn.Module):
    """
    Combined matting network with multiple processing modes
    """
    
    def __init__(self, mode='fast'):
        super(MattingNetwork, self).__init__()
        
        self.mode = mode
        
        if mode == 'fast':
            self.model = SimpleMattingModel()
        elif mode == 'quality':
            backbone = MattingBase('mobilenetv2')
            self.model = MattingRefine('sampling', backbone.backbone)
        else:
            raise ValueError(f"Unsupported mode: {mode}")
    
    def forward(self, x, **kwargs):
        """Forward pass with mode-specific processing"""
        if self.mode == 'fast':
            return self.model(x)
        else:
            return self.model(x, **kwargs)
    
    def switch_mode(self, mode):
        """Switch between processing modes"""
        if mode != self.mode:
            self.mode = mode
            # Reinitialize model if needed
            if mode == 'fast':
                self.model = SimpleMattingModel()
            elif mode == 'quality':
                backbone = MattingBase('mobilenetv2')
                self.model = MattingRefine('sampling', backbone.backbone)