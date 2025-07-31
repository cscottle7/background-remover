"""
A/B Testing Framework for Background Removal Libraries
Implements performance comparison and automatic optimization
Critical for Phase 0 alternative library research validation
"""

import asyncio
import logging
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict, deque
import statistics
import random

from ..utils.performance_monitor import performance_monitor
from ..utils.monitoring import metrics

logger = logging.getLogger(__name__)

class TestVariant(Enum):
    """Test variant identifiers"""
    CONTROL = "control"          # rembg with isnet-general-use
    VARIANT_A = "variant_a"      # rembg with birefnet-general
    VARIANT_B = "variant_b"      # MODNet processor  
    VARIANT_C = "variant_c"      # BackgroundMattingV2 processor

@dataclass
class ABTestConfig:
    """A/B test configuration"""
    test_id: str
    name: str
    description: str
    traffic_allocation: Dict[TestVariant, float]  # Percentage of traffic per variant
    success_metrics: List[str]  # Metrics to track for success
    minimum_sample_size: int
    confidence_level: float
    start_date: datetime
    end_date: Optional[datetime]
    enabled: bool = True

@dataclass
class TestResult:
    """Individual test result"""
    test_id: str
    variant: TestVariant
    processing_id: str
    session_hash: str
    processing_time: float
    success: bool
    input_size: int
    output_size: int
    library: str
    model: str
    timestamp: datetime
    error_type: Optional[str] = None

@dataclass
class VariantPerformance:
    """Performance statistics for a test variant"""
    variant: TestVariant
    sample_count: int
    success_rate: float
    average_processing_time: float
    median_processing_time: float
    p95_processing_time: float
    under_5_seconds_rate: float
    error_rate: float
    confidence_interval: Tuple[float, float]
    statistical_significance: bool

class ABTestingFramework:
    """
    A/B testing framework for library performance comparison
    Implements statistical rigor and automated decision making
    """
    
    def __init__(self):
        self.active_tests: Dict[str, ABTestConfig] = {}
        self.test_results: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10000))
        self.variant_assignments: Dict[str, TestVariant] = {}  # session -> variant mapping
        
        # Setup default library comparison test
        self._setup_default_library_test()
    
    def _setup_default_library_test(self):
        """Setup default A/B test for library performance comparison"""
        default_test = ABTestConfig(
            test_id="library_performance_comparison",
            name="Background Removal Library Performance Test",
            description="Compare performance of different background removal libraries",
            traffic_allocation={
                TestVariant.CONTROL: 0.4,    # 40% rembg isnet-general-use
                TestVariant.VARIANT_A: 0.3,  # 30% rembg birefnet-general  
                TestVariant.VARIANT_B: 0.2,  # 20% MODNet
                TestVariant.VARIANT_C: 0.1   # 10% BackgroundMattingV2
            },
            success_metrics=["processing_time", "success_rate", "under_5_seconds_rate"],
            minimum_sample_size=100,
            confidence_level=0.95,
            start_date=datetime.utcnow(),
            end_date=None,  # Run indefinitely
            enabled=True
        )
        
        self.active_tests[default_test.test_id] = default_test
        logger.info(f"Initialized default A/B test: {default_test.test_id}")
    
    def assign_variant(self, session_hash: str, test_id: str) -> TestVariant:
        """
        Assign user to test variant using deterministic hashing
        Ensures consistent experience across session
        """
        if session_hash in self.variant_assignments:
            return self.variant_assignments[session_hash]
        
        test_config = self.active_tests.get(test_id)
        if not test_config or not test_config.enabled:
            return TestVariant.CONTROL
        
        # Use hash-based assignment for consistency
        hash_input = f"{session_hash}_{test_id}".encode()
        hash_value = int(hashlib.md5(hash_input).hexdigest()[:8], 16)
        random_value = (hash_value % 10000) / 10000.0  # 0.0 to 1.0
        
        # Determine variant based on traffic allocation
        cumulative_allocation = 0.0
        for variant, allocation in test_config.traffic_allocation.items():
            cumulative_allocation += allocation
            if random_value <= cumulative_allocation:
                self.variant_assignments[session_hash] = variant
                logger.debug(f"Assigned session {session_hash[:8]} to variant {variant.value}")
                return variant
        
        # Fallback to control
        self.variant_assignments[session_hash] = TestVariant.CONTROL
        return TestVariant.CONTROL
    
    def get_library_config_for_variant(self, variant: TestVariant) -> Dict[str, str]:
        """Get library configuration for test variant"""
        variant_configs = {
            TestVariant.CONTROL: {
                "library": "rembg",
                "model": "isnet-general-use",
                "processor": "primary"
            },
            TestVariant.VARIANT_A: {
                "library": "rembg", 
                "model": "birefnet-general",
                "processor": "fallback"
            },
            TestVariant.VARIANT_B: {
                "library": "modnet",
                "model": "modnet-photographic-portrait",
                "processor": "modnet"
            },
            TestVariant.VARIANT_C: {
                "library": "backgroundmattingv2",
                "model": "bgmv2-general",
                "processor": "bgmv2"
            }
        }
        
        return variant_configs.get(variant, variant_configs[TestVariant.CONTROL])
    
    async def record_test_result(
        self,
        test_id: str,
        variant: TestVariant,
        processing_id: str,
        session_hash: str,
        processing_time: float,
        success: bool,
        input_size: int,
        output_size: int,
        library: str,
        model: str,
        error_type: Optional[str] = None
    ):
        """Record A/B test result"""
        result = TestResult(
            test_id=test_id,
            variant=variant,
            processing_id=processing_id,
            session_hash=session_hash,
            processing_time=processing_time,
            success=success,
            input_size=input_size,
            output_size=output_size,
            library=library,
            model=model,
            timestamp=datetime.utcnow(),
            error_type=error_type
        )
        
        self.test_results[test_id].append(result)
        
        # Log A/B test metric
        metrics.log_metric('ab_test_result', {
            'test_id': test_id,
            'variant': variant.value,
            'processing_time': processing_time,
            'success': success,
            'library': library,
            'model': model,
            'under_5_seconds': processing_time < 5.0
        })
        
        logger.debug(f"Recorded A/B test result: {test_id}/{variant.value} - {processing_time:.3f}s")
    
    def calculate_variant_performance(
        self, 
        test_id: str, 
        variant: TestVariant,
        window_hours: int = 24
    ) -> Optional[VariantPerformance]:
        """Calculate performance statistics for a variant"""
        if test_id not in self.test_results:
            return None
        
        # Filter results for variant and time window
        cutoff_time = datetime.utcnow() - timedelta(hours=window_hours)
        variant_results = [
            r for r in self.test_results[test_id] 
            if r.variant == variant and r.timestamp >= cutoff_time
        ]
        
        if not variant_results:
            return None
        
        # Calculate basic metrics
        sample_count = len(variant_results)
        successful_results = [r for r in variant_results if r.success]
        success_rate = len(successful_results) / sample_count
        
        if successful_results:
            processing_times = [r.processing_time for r in successful_results]
            average_processing_time = statistics.mean(processing_times)
            median_processing_time = statistics.median(processing_times)
            p95_processing_time = self._calculate_percentile(processing_times, 95)
            under_5_seconds_rate = len([t for t in processing_times if t < 5.0]) / len(processing_times)
        else:
            average_processing_time = 0.0
            median_processing_time = 0.0
            p95_processing_time = 0.0
            under_5_seconds_rate = 0.0
        
        error_rate = 1.0 - success_rate
        
        # Calculate confidence interval for processing time
        confidence_interval = self._calculate_confidence_interval(
            [r.processing_time for r in successful_results] if successful_results else []
        )
        
        # Check statistical significance (simplified)
        statistical_significance = sample_count >= self.active_tests[test_id].minimum_sample_size
        
        return VariantPerformance(
            variant=variant,
            sample_count=sample_count,
            success_rate=success_rate,
            average_processing_time=average_processing_time,
            median_processing_time=median_processing_time,
            p95_processing_time=p95_processing_time,
            under_5_seconds_rate=under_5_seconds_rate,
            error_rate=error_rate,
            confidence_interval=confidence_interval,
            statistical_significance=statistical_significance
        )
    
    def _calculate_percentile(self, values: List[float], percentile: int) -> float:
        """Calculate percentile value"""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        index = int((percentile / 100.0) * len(sorted_values))
        return sorted_values[min(index, len(sorted_values) - 1)]
    
    def _calculate_confidence_interval(
        self, 
        values: List[float], 
        confidence: float = 0.95
    ) -> Tuple[float, float]:
        """Calculate confidence interval for mean"""
        if len(values) < 2:
            return (0.0, 0.0)
        
        mean = statistics.mean(values)
        std_dev = statistics.stdev(values)
        
        # Simplified confidence interval calculation
        # In production, would use proper t-distribution
        margin_of_error = 1.96 * (std_dev / (len(values) ** 0.5))
        
        return (mean - margin_of_error, mean + margin_of_error)
    
    async def analyze_test_performance(
        self, 
        test_id: str,
        window_hours: int = 24
    ) -> Dict[str, Any]:
        """Analyze A/B test performance across all variants"""
        test_config = self.active_tests.get(test_id)
        if not test_config:
            return {"error": f"Test {test_id} not found"}
        
        # Calculate performance for each variant
        variant_performances = {}
        for variant in test_config.traffic_allocation.keys():
            performance = self.calculate_variant_performance(test_id, variant, window_hours)
            if performance:
                variant_performances[variant.value] = asdict(performance)
        
        if not variant_performances:
            return {"error": "No test data available"}
        
        # Determine winning variant
        winning_variant = self._determine_winning_variant(variant_performances)
        
        # Generate recommendations
        recommendations = self._generate_test_recommendations(variant_performances, test_config)
        
        analysis = {
            "test_id": test_id,
            "test_name": test_config.name,
            "analysis_window_hours": window_hours,
            "timestamp": datetime.utcnow().isoformat(),
            "variant_performances": variant_performances,
            "winning_variant": winning_variant,
            "recommendations": recommendations,
            "statistical_confidence": all(
                perf.get('statistical_significance', False) 
                for perf in variant_performances.values()
            )
        }
        
        return analysis
    
    def _determine_winning_variant(
        self, 
        variant_performances: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Determine winning variant based on multiple criteria"""
        
        # Primary criteria: under_5_seconds_rate (performance target)
        # Secondary criteria: success_rate
        # Tertiary criteria: average_processing_time
        
        best_variant = None
        best_score = -1
        
        for variant_name, performance in variant_performances.items():
            # Calculate composite score
            under_5_score = performance.get('under_5_seconds_rate', 0) * 0.5
            success_score = performance.get('success_rate', 0) * 0.3
            speed_score = max(0, (5.0 - performance.get('average_processing_time', 5.0)) / 5.0) * 0.2
            
            composite_score = under_5_score + success_score + speed_score
            
            if composite_score > best_score:
                best_score = composite_score
                best_variant = variant_name
        
        winning_info = {
            "variant": best_variant,
            "composite_score": best_score,
            "criteria": {
                "primary": "under_5_seconds_rate",
                "secondary": "success_rate", 
                "tertiary": "average_processing_time"
            }
        }
        
        if best_variant:
            winning_info["performance"] = variant_performances[best_variant]
        
        return winning_info
    
    def _generate_test_recommendations(
        self,
        variant_performances: Dict[str, Dict[str, Any]],
        test_config: ABTestConfig
    ) -> List[str]:
        """Generate actionable recommendations from A/B test results"""
        recommendations = []
        
        # Check if any variant significantly outperforms control
        control_performance = variant_performances.get('control')
        if control_performance:
            control_under_5 = control_performance.get('under_5_seconds_rate', 0)
            
            for variant_name, performance in variant_performances.items():
                if variant_name == 'control':
                    continue
                    
                variant_under_5 = performance.get('under_5_seconds_rate', 0)
                improvement = (variant_under_5 - control_under_5) / control_under_5 if control_under_5 > 0 else 0
                
                if improvement > 0.1:  # 10% improvement
                    recommendations.append(
                        f"Consider switching to {variant_name}: {improvement:.1%} improvement "
                        f"in 5-second completion rate"
                    )
                elif improvement < -0.1:  # 10% degradation
                    recommendations.append(
                        f"Reduce traffic to {variant_name}: {abs(improvement):.1%} degradation "
                        f"in 5-second completion rate"
                    )
        
        # Check for statistical significance
        significant_results = [
            variant for variant, perf in variant_performances.items()
            if perf.get('statistical_significance', False)
        ]
        
        if len(significant_results) < len(variant_performances):
            missing = len(variant_performances) - len(significant_results)
            recommendations.append(
                f"Collect more data: {missing} variants need more samples "
                f"for statistical significance (min: {test_config.minimum_sample_size})"
            )
        
        # Performance-specific recommendations
        poor_performers = [
            variant for variant, perf in variant_performances.items()
            if perf.get('under_5_seconds_rate', 0) < 0.8
        ]
        
        if poor_performers:
            recommendations.append(
                f"Poor performance detected in {', '.join(poor_performers)}. "
                f"Consider removing or optimizing these variants."
            )
        
        return recommendations
    
    async def get_test_summary(self, test_id: str) -> Dict[str, Any]:
        """Get comprehensive test summary"""
        analysis = await self.analyze_test_performance(test_id)
        
        if "error" in analysis:
            return analysis
        
        # Add traffic allocation info
        test_config = self.active_tests[test_id]
        analysis["traffic_allocation"] = {
            variant.value: allocation 
            for variant, allocation in test_config.traffic_allocation.items()
        }
        
        # Add test configuration
        analysis["test_config"] = {
            "minimum_sample_size": test_config.minimum_sample_size,
            "confidence_level": test_config.confidence_level,
            "success_metrics": test_config.success_metrics,
            "start_date": test_config.start_date.isoformat(),
            "enabled": test_config.enabled
        }
        
        return analysis

# Global A/B testing framework instance
ab_testing_framework = ABTestingFramework()

# Convenience functions for easy integration
async def assign_processing_variant(session_hash: str) -> Tuple[TestVariant, Dict[str, str]]:
    """Assign variant and return library configuration"""
    variant = ab_testing_framework.assign_variant(
        session_hash, 
        "library_performance_comparison"
    )
    config = ab_testing_framework.get_library_config_for_variant(variant)
    return variant, config

async def record_ab_test_result(
    variant: TestVariant,
    processing_id: str,
    session_hash: str,
    processing_time: float,
    success: bool,
    input_size: int,
    output_size: int,
    library: str,
    model: str,
    error_type: Optional[str] = None
):
    """Record A/B test result"""
    await ab_testing_framework.record_test_result(
        test_id="library_performance_comparison",
        variant=variant,
        processing_id=processing_id,
        session_hash=session_hash,
        processing_time=processing_time,
        success=success,
        input_size=input_size,
        output_size=output_size,
        library=library,
        model=model,
        error_type=error_type
    )

async def get_ab_test_analysis() -> Dict[str, Any]:
    """Get current A/B test analysis"""
    return await ab_testing_framework.analyze_test_performance("library_performance_comparison")