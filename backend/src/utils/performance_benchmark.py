"""
Performance Benchmarking Suite for Background Removal Libraries
Tests processing time, accuracy, and reliability across alternatives
"""

import io
import os
import time
import json
import asyncio
import logging
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
from PIL import Image, ImageDraw
import numpy as np

from ..services.multi_library_processor import MultiLibraryProcessor
from ..services.modnet_processor import MODNetProcessor
from ..services.bgmattingv2_processor import BackgroundMattingV2Processor

logger = logging.getLogger(__name__)

class PerformanceBenchmark:
    """
    Comprehensive benchmarking suite for background removal processors
    Measures speed, accuracy, and reliability for Phase 0 validation
    """
    
    def __init__(self, output_dir: str = "benchmark_results"):
        self.output_dir = output_dir
        self.multi_processor = MultiLibraryProcessor()
        self.test_images = {}
        self.benchmark_results = {}
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_test_images(self) -> Dict[str, bytes]:
        """Generate synthetic test images for consistent benchmarking"""
        test_images = {}
        
        # Simple character - solid background
        simple_img = Image.new('RGB', (512, 512), color='white')
        draw = ImageDraw.Draw(simple_img)
        draw.ellipse([150, 150, 350, 350], fill='red', outline='black', width=3)
        draw.rectangle([200, 100, 300, 150], fill='blue')  # Head
        test_images['simple_character'] = self._image_to_bytes(simple_img)
        
        # Medium complexity - gradient background
        medium_img = Image.new('RGB', (512, 512), color='white')
        # Create gradient background
        for y in range(512):
            for x in range(512):
                color_val = int(255 * (x + y) / (512 + 512))
                medium_img.putpixel((x, y), (color_val, 255 - color_val, 128))
        
        draw = ImageDraw.Draw(medium_img)
        # Character silhouette
        draw.polygon([(256, 100), (200, 200), (180, 300), (220, 400), 
                      (256, 450), (292, 400), (332, 300), (312, 200)], 
                     fill='darkred', outline='black', width=2)
        test_images['medium_character'] = self._image_to_bytes(medium_img)
        
        # Complex character - detailed background
        complex_img = Image.new('RGB', (512, 512), color='white')
        draw = ImageDraw.Draw(complex_img)
        
        # Complex background pattern
        for i in range(0, 512, 20):
            for j in range(0, 512, 20):
                color = (i % 255, j % 255, (i + j) % 255)
                draw.rectangle([i, j, i + 10, j + 10], fill=color)
        
        # Detailed character with fine edges
        draw.polygon([(256, 50), (220, 120), (180, 200), (160, 300), 
                      (200, 400), (256, 460), (312, 400), (352, 300),
                      (332, 200), (292, 120)], 
                     fill='purple', outline='yellow', width=1)
        
        # Add fine details (hair-like strokes)
        for angle in range(0, 360, 30):
            x_offset = int(30 * np.cos(np.radians(angle)))
            y_offset = int(30 * np.sin(np.radians(angle)))
            draw.line([(256, 50), (256 + x_offset, 50 + y_offset)], fill='orange', width=1)
        
        test_images['complex_character'] = self._image_to_bytes(complex_img)
        
        # AI-style character (geometric shapes)
        ai_img = Image.new('RGB', (512, 512), color='lightblue')
        draw = ImageDraw.Draw(ai_img)
        
        # Geometric character design
        draw.polygon([(256, 80), (300, 150), (280, 250), (320, 350), 
                      (256, 420), (192, 350), (232, 250), (212, 150)], 
                     fill='cyan', outline='darkblue', width=3)
        
        # Add geometric details
        draw.ellipse([230, 180, 270, 220], fill='blue')
        draw.rectangle([240, 280, 272, 320], fill='darkblue')
        
        test_images['ai_character'] = self._image_to_bytes(ai_img)
        
        logger.info(f"Generated {len(test_images)} test images")
        return test_images
    
    def _image_to_bytes(self, image: Image.Image) -> bytes:
        """Convert PIL Image to bytes"""
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        return buffer.getvalue()
    
    async def run_comprehensive_benchmark(self) -> Dict[str, Any]:
        """Run comprehensive benchmark across all processors and test cases"""
        logger.info("Starting comprehensive benchmark...")
        
        # Initialize processors
        await self.multi_processor.initialize_all_processors()
        
        # Generate test images
        self.test_images = self.generate_test_images()
        
        # Run benchmarks
        results = {
            'benchmark_timestamp': datetime.utcnow().isoformat(),
            'test_images': list(self.test_images.keys()),
            'processors_tested': list(self.multi_processor.processors.keys()),
            'individual_results': {},
            'summary_metrics': {},
            'recommendations': {}
        }
        
        # Test each processor with each test image
        for processor_name in self.multi_processor.processors.keys():
            logger.info(f"Benchmarking processor: {processor_name}")
            
            processor_results = {
                'processor_name': processor_name,
                'test_results': {},
                'average_processing_time': 0,
                'success_rate': 0,
                'quality_score': 0,
                'reliability_score': 0
            }
            
            total_time = 0
            successful_tests = 0
            total_tests = 0
            
            for test_name, test_image_data in self.test_images.items():
                logger.info(f"  Testing {test_name}")
                
                test_result = await self._benchmark_single_test(
                    processor_name, test_name, test_image_data
                )
                
                processor_results['test_results'][test_name] = test_result
                total_tests += 1
                
                if test_result['success']:
                    successful_tests += 1
                    total_time += test_result['processing_time']
            
            # Calculate summary metrics
            if successful_tests > 0:
                processor_results['average_processing_time'] = total_time / successful_tests
                processor_results['success_rate'] = successful_tests / total_tests
                processor_results['reliability_score'] = self._calculate_reliability_score(processor_results)
                processor_results['quality_score'] = self._calculate_quality_score(processor_results)
            
            results['individual_results'][processor_name] = processor_results
        
        # Generate summary metrics and recommendations
        results['summary_metrics'] = self._generate_summary_metrics(results['individual_results'])
        results['recommendations'] = self._generate_recommendations(results['individual_results'])
        
        # Save results
        await self._save_benchmark_results(results)
        
        logger.info("Comprehensive benchmark completed")
        return results
    
    async def _benchmark_single_test(
        self, 
        processor_name: str, 
        test_name: str, 
        image_data: bytes
    ) -> Dict[str, Any]:
        """Benchmark a single processor with a single test image"""
        
        test_result = {
            'processor_name': processor_name,
            'test_name': test_name,
            'success': False,
            'processing_time': 0,
            'memory_usage': 0,
            'output_quality': 0,
            'error_message': None,
            'meets_time_requirement': False
        }
        
        start_time = time.time()
        
        try:
            # Force specific processor for testing
            if processor_name.startswith('rembg_'):
                # Test rembg variants through multi-processor
                result_data, used_processor, processing_time = await self.multi_processor.process_with_fallback(
                    image_data, 
                    f"bench_{processor_name}_{test_name}",
                    preferred_tier=None
                )
            else:
                # Test alternative processors directly
                processor_config = self.multi_processor.processors[processor_name]
                processor = processor_config['processor']
                
                if not hasattr(processor, 'process_image'):
                    raise Exception(f"Processor {processor_name} does not support direct processing")
                
                result_data = await asyncio.wait_for(
                    processor.process_image(image_data),
                    timeout=10.0  # 10 second timeout for benchmarking
                )
                processing_time = time.time() - start_time
            
            # Validate result
            if result_data and len(result_data) > 0:
                test_result['success'] = True
                test_result['processing_time'] = processing_time
                test_result['meets_time_requirement'] = processing_time < 5.0
                test_result['output_quality'] = self._assess_output_quality(result_data, test_name)
                
                # Save result image for manual inspection
                await self._save_result_image(result_data, processor_name, test_name)
            else:
                test_result['error_message'] = "Empty result"
        
        except asyncio.TimeoutError:
            test_result['error_message'] = "Processing timeout (>10s)"
            test_result['processing_time'] = 10.0
        
        except Exception as e:
            test_result['error_message'] = str(e)
            test_result['processing_time'] = time.time() - start_time
        
        return test_result
    
    def _assess_output_quality(self, result_data: bytes, test_name: str) -> float:
        """Assess output quality (simplified heuristic)"""
        try:
            result_image = Image.open(io.BytesIO(result_data))
            
            if result_image.mode != 'RGBA':
                return 0.3  # Poor quality if not transparent
            
            # Check for transparency
            alpha_channel = np.array(result_image)[:, :, 3]
            transparency_ratio = np.sum(alpha_channel == 0) / alpha_channel.size
            
            # Quality heuristics based on test type
            if test_name == 'simple_character':
                # Simple character should have good transparency separation
                if 0.3 < transparency_ratio < 0.7:
                    return 0.9
                else:
                    return 0.6
            
            elif test_name == 'medium_character':
                # Medium complexity should handle gradients
                if 0.2 < transparency_ratio < 0.8:
                    return 0.8
                else:
                    return 0.5
            
            elif test_name == 'complex_character':
                # Complex should preserve fine details
                if 0.1 < transparency_ratio < 0.9:
                    return 0.7
                else:
                    return 0.4
            
            else:
                return 0.7  # Default quality score
        
        except Exception:
            return 0.1  # Very poor quality if can't be processed
    
    def _calculate_reliability_score(self, processor_results: Dict[str, Any]) -> float:
        """Calculate reliability score based on success rate and consistency"""
        success_rate = processor_results['success_rate']
        
        # Check consistency of processing times
        times = []
        for test_result in processor_results['test_results'].values():
            if test_result['success']:
                times.append(test_result['processing_time'])
        
        if len(times) < 2:
            time_consistency = 1.0
        else:
            time_std = np.std(times)
            time_mean = np.mean(times)
            time_consistency = max(0, 1 - (time_std / time_mean)) if time_mean > 0 else 0
        
        # Combine success rate and time consistency
        reliability_score = (success_rate * 0.7) + (time_consistency * 0.3)
        return round(reliability_score, 3)
    
    def _calculate_quality_score(self, processor_results: Dict[str, Any]) -> float:
        """Calculate average quality score"""
        quality_scores = []
        for test_result in processor_results['test_results'].values():
            if test_result['success']:
                quality_scores.append(test_result['output_quality'])
        
        return round(np.mean(quality_scores), 3) if quality_scores else 0.0
    
    def _generate_summary_metrics(self, individual_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary metrics across all processors"""
        summary = {
            'fastest_processor': None,
            'most_reliable_processor': None,
            'highest_quality_processor': None,
            'best_overall_processor': None,
            'processors_meeting_time_requirement': [],
            'average_metrics': {}
        }
        
        fastest_time = float('inf')
        highest_reliability = 0
        highest_quality = 0
        best_overall_score = 0
        
        for processor_name, results in individual_results.items():
            avg_time = results['average_processing_time']
            reliability = results['reliability_score']
            quality = results['quality_score']
            
            # Track best performers
            if avg_time < fastest_time and results['success_rate'] > 0:
                fastest_time = avg_time
                summary['fastest_processor'] = processor_name
            
            if reliability > highest_reliability:
                highest_reliability = reliability
                summary['most_reliable_processor'] = processor_name
            
            if quality > highest_quality:
                highest_quality = quality
                summary['highest_quality_processor'] = processor_name
            
            # Overall score (balanced)
            overall_score = (reliability * 0.4) + (quality * 0.3) + (min(avg_time, 5) / 5 * 0.3)
            if overall_score > best_overall_score:
                best_overall_score = overall_score
                summary['best_overall_processor'] = processor_name
            
            # Check time requirement
            if avg_time < 5.0 and results['success_rate'] > 0.8:
                summary['processors_meeting_time_requirement'].append(processor_name)
        
        # Calculate average metrics
        all_times = [r['average_processing_time'] for r in individual_results.values() if r['success_rate'] > 0]
        all_reliability = [r['reliability_score'] for r in individual_results.values()]
        all_quality = [r['quality_score'] for r in individual_results.values()]
        
        summary['average_metrics'] = {
            'average_processing_time': round(np.mean(all_times), 3) if all_times else 0,
            'average_reliability': round(np.mean(all_reliability), 3),
            'average_quality': round(np.mean(all_quality), 3)
        }
        
        return summary
    
    def _generate_recommendations(self, individual_results: Dict[str, Any]) -> Dict[str, str]:
        """Generate recommendations based on benchmark results"""
        recommendations = {}
        
        # Find processors meeting <5s requirement
        fast_processors = [
            name for name, results in individual_results.items()
            if results['average_processing_time'] < 5.0 and results['success_rate'] > 0.8
        ]
        
        if fast_processors:
            # Sort by reliability * quality
            fast_processors.sort(
                key=lambda name: individual_results[name]['reliability_score'] * individual_results[name]['quality_score'],
                reverse=True
            )
            
            recommendations['primary_recommendation'] = fast_processors[0]
            recommendations['primary_reason'] = "Best balance of speed, reliability, and quality while meeting <5s requirement"
            
            if len(fast_processors) > 1:
                recommendations['secondary_recommendation'] = fast_processors[1]
                recommendations['secondary_reason'] = "Strong alternative for fallback scenarios"
        
        # Quality recommendation
        quality_processors = sorted(
            individual_results.items(),
            key=lambda x: x[1]['quality_score'],
            reverse=True
        )
        
        if quality_processors:
            recommendations['quality_recommendation'] = quality_processors[0][0]
            recommendations['quality_reason'] = "Highest quality output for complex scenarios"
        
        # Reliability recommendation
        reliability_processors = sorted(
            individual_results.items(),
            key=lambda x: x[1]['reliability_score'],
            reverse=True
        )
        
        if reliability_processors:
            recommendations['reliability_recommendation'] = reliability_processors[0][0]
            recommendations['reliability_reason'] = "Most consistent and reliable processing"
        
        return recommendations
    
    async def _save_result_image(self, result_data: bytes, processor_name: str, test_name: str):
        """Save result image for manual inspection"""
        filename = f"{processor_name}_{test_name}_result.png"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(result_data)
    
    async def _save_benchmark_results(self, results: Dict[str, Any]):
        """Save benchmark results to JSON file"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"benchmark_results_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Benchmark results saved to {filepath}")
    
    async def quick_performance_test(self) -> Dict[str, Any]:
        """Run a quick performance test with minimal test cases"""
        logger.info("Running quick performance test...")
        
        # Generate only simple test image
        simple_img = Image.new('RGB', (256, 256), color='white')
        draw = ImageDraw.Draw(simple_img)
        draw.ellipse([50, 50, 200, 200], fill='red')
        
        test_image_data = self._image_to_bytes(simple_img)
        
        # Test key processors
        key_processors = ['rembg_isnet', 'modnet', 'bgmatting_v2']
        results = {}
        
        for processor_name in key_processors:
            if processor_name in self.multi_processor.processors:
                start_time = time.time()
                try:
                    result_data, used_processor, processing_time = await self.multi_processor.process_with_fallback(
                        test_image_data,
                        f"quick_test_{processor_name}"
                    )
                    
                    results[processor_name] = {
                        'success': True,
                        'processing_time': processing_time,
                        'meets_requirement': processing_time < 5.0
                    }
                except Exception as e:
                    results[processor_name] = {
                        'success': False,
                        'error': str(e),
                        'processing_time': time.time() - start_time
                    }
        
        logger.info("Quick performance test completed")
        return results