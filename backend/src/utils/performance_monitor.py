"""
Enhanced Performance Monitoring & Alerting System
Implements real-time tracking of <5 second processing target with alerts
Critical component for "Performance as a Feature" principle
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from collections import deque, defaultdict
import statistics
import json
import os

from .monitoring import metrics, log_system_health

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Single performance measurement"""
    timestamp: datetime
    processing_time: float
    library: str
    model: str
    success: bool
    input_size: int
    output_size: int
    session_hash: str
    processing_id: str

@dataclass
class PerformanceAlert:
    """Performance alert configuration"""
    alert_id: str
    condition: str
    threshold: float
    window_minutes: int
    alert_callback: Callable[[Dict[str, Any]], None]
    enabled: bool = True

class PerformanceMonitor:
    """
    Real-time performance monitoring with alerting
    Tracks <5 second processing requirement and library performance
    """
    
    def __init__(self):
        self.metrics_buffer = deque(maxlen=1000)  # Keep last 1000 metrics
        self.alerts: Dict[str, PerformanceAlert] = {}
        self.performance_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'under_5_seconds': 0,
            'average_processing_time': 0.0,
            'library_performance': defaultdict(list),
            'hourly_stats': defaultdict(int)
        }
        
        # Background task for continuous monitoring
        self._monitoring_task = None
        self._setup_default_alerts()
        
    def _setup_default_alerts(self):
        """Setup default performance alerts"""
        
        # Critical: Processing time exceeding 5 seconds
        self.add_alert(
            alert_id="processing_time_critical",
            condition="average_processing_time",
            threshold=5.0,
            window_minutes=5,
            alert_callback=self._handle_processing_time_alert
        )
        
        # Warning: Processing time approaching limit
        self.add_alert(
            alert_id="processing_time_warning", 
            condition="average_processing_time",
            threshold=4.0,
            window_minutes=3,
            alert_callback=self._handle_processing_warning
        )
        
        # Critical: Success rate below 95%
        self.add_alert(
            alert_id="success_rate_critical",
            condition="success_rate",
            threshold=0.95,
            window_minutes=10,
            alert_callback=self._handle_success_rate_alert
        )
        
        # Performance degradation alert
        self.add_alert(
            alert_id="performance_degradation",
            condition="performance_degradation",
            threshold=0.2,  # 20% increase in processing time
            window_minutes=15,
            alert_callback=self._handle_degradation_alert
        )
    
    def add_alert(
        self, 
        alert_id: str, 
        condition: str, 
        threshold: float, 
        window_minutes: int,
        alert_callback: Callable[[Dict[str, Any]], None]
    ):
        """Add performance alert"""
        self.alerts[alert_id] = PerformanceAlert(
            alert_id=alert_id,
            condition=condition,
            threshold=threshold,
            window_minutes=window_minutes,
            alert_callback=alert_callback
        )
        logger.info(f"Added performance alert: {alert_id}")
    
    async def record_processing_metric(
        self,
        processing_id: str,
        processing_time: float,
        library: str,
        model: str,
        success: bool,
        input_size: int,
        output_size: int,
        session_hash: str
    ):
        """Record a processing metric and trigger alert checks"""
        
        metric = PerformanceMetric(
            timestamp=datetime.utcnow(),
            processing_time=processing_time,
            library=library,
            model=model,
            success=success,
            input_size=input_size,
            output_size=output_size,
            session_hash=session_hash,
            processing_id=processing_id
        )
        
        self.metrics_buffer.append(metric)
        await self._update_stats(metric)
        await self._check_alerts()
        
        # Log performance metric
        logger.info(
            f"Performance metric recorded: {processing_id} - "
            f"{processing_time:.3f}s using {library}/{model} - "
            f"{'SUCCESS' if success else 'FAILED'}"
        )
    
    async def _update_stats(self, metric: PerformanceMetric):
        """Update running performance statistics"""
        self.performance_stats['total_requests'] += 1
        
        if metric.success:
            self.performance_stats['successful_requests'] += 1
            
            if metric.processing_time < 5.0:
                self.performance_stats['under_5_seconds'] += 1
            
            # Update library performance tracking
            library_key = f"{metric.library}/{metric.model}"
            self.performance_stats['library_performance'][library_key].append(metric.processing_time)
            
            # Keep only recent performance data per library
            if len(self.performance_stats['library_performance'][library_key]) > 50:
                self.performance_stats['library_performance'][library_key] = \
                    self.performance_stats['library_performance'][library_key][-50:]
        
        # Update hourly stats
        hour_key = metric.timestamp.strftime('%Y-%m-%d-%H')  
        self.performance_stats['hourly_stats'][hour_key] += 1
        
        # Calculate rolling average
        successful_metrics = [m for m in self.metrics_buffer if m.success]
        if successful_metrics:
            self.performance_stats['average_processing_time'] = statistics.mean(
                [m.processing_time for m in successful_metrics[-50:]]  # Last 50 successful
            )
    
    async def _check_alerts(self):
        """Check all active alerts against current metrics"""
        if not self.metrics_buffer:
            return
            
        for alert in self.alerts.values():
            if not alert.enabled:
                continue
                
            try:
                should_alert = await self._evaluate_alert_condition(alert)
                if should_alert:
                    alert_data = await self._prepare_alert_data(alert)
                    alert.alert_callback(alert_data)
                    
            except Exception as e:
                logger.error(f"Error checking alert {alert.alert_id}: {str(e)}")
    
    async def _evaluate_alert_condition(self, alert: PerformanceAlert) -> bool:
        """Evaluate if alert condition is met"""
        window_start = datetime.utcnow() - timedelta(minutes=alert.window_minutes)
        recent_metrics = [m for m in self.metrics_buffer if m.timestamp >= window_start]
        
        if not recent_metrics:
            return False
            
        if alert.condition == "average_processing_time":
            successful_metrics = [m for m in recent_metrics if m.success]
            if successful_metrics:
                avg_time = statistics.mean([m.processing_time for m in successful_metrics])
                return avg_time > alert.threshold
                
        elif alert.condition == "success_rate":
            success_rate = len([m for m in recent_metrics if m.success]) / len(recent_metrics)
            return success_rate < alert.threshold
            
        elif alert.condition == "performance_degradation":
            # Compare recent performance to baseline
            successful_metrics = [m for m in recent_metrics if m.success]
            if len(successful_metrics) >= 5:
                recent_avg = statistics.mean([m.processing_time for m in successful_metrics])
                baseline_avg = self.performance_stats['average_processing_time']
                if baseline_avg > 0:
                    degradation = (recent_avg - baseline_avg) / baseline_avg
                    return degradation > alert.threshold
        
        return False
    
    async def _prepare_alert_data(self, alert: PerformanceAlert) -> Dict[str, Any]:
        """Prepare alert data for callback"""
        window_start = datetime.utcnow() - timedelta(minutes=alert.window_minutes)
        recent_metrics = [m for m in self.metrics_buffer if m.timestamp >= window_start]
        
        successful_metrics = [m for m in recent_metrics if m.success]
        
        alert_data = {
            'alert_id': alert.alert_id,
            'timestamp': datetime.utcnow().isoformat(),
            'condition': alert.condition,
            'threshold': alert.threshold,
            'window_minutes': alert.window_minutes,
            'total_requests': len(recent_metrics),
            'successful_requests': len(successful_metrics),
            'current_stats': self.get_current_stats()
        }
        
        if successful_metrics:
            processing_times = [m.processing_time for m in successful_metrics]
            alert_data.update({
                'average_processing_time': statistics.mean(processing_times),
                'max_processing_time': max(processing_times),
                'under_5_seconds_ratio': len([t for t in processing_times if t < 5.0]) / len(processing_times)
            })
        
        return alert_data
    
    async def _handle_processing_time_alert(self, alert_data: Dict[str, Any]):
        """Handle critical processing time alert"""
        logger.critical(
            f"CRITICAL ALERT: Average processing time ({alert_data['average_processing_time']:.3f}s) "
            f"exceeds 5-second target in last {alert_data['window_minutes']} minutes"
        )
        
        await log_system_health(
            component="background_removal",
            status="unhealthy",
            response_time=alert_data.get('average_processing_time'),
            additional_data={
                'alert_type': 'processing_time_critical',
                'under_5_seconds_ratio': alert_data.get('under_5_seconds_ratio', 0)
            }
        )
    
    async def _handle_processing_warning(self, alert_data: Dict[str, Any]):
        """Handle processing time warning"""
        logger.warning(
            f"WARNING: Average processing time ({alert_data['average_processing_time']:.3f}s) "
            f"approaching 5-second limit"
        )
        
        await log_system_health(
            component="background_removal",
            status="degraded",
            response_time=alert_data.get('average_processing_time'),
            additional_data={'alert_type': 'processing_time_warning'}
        )
    
    async def _handle_success_rate_alert(self, alert_data: Dict[str, Any]):
        """Handle success rate alert"""
        success_rate = alert_data['successful_requests'] / alert_data['total_requests']
        logger.critical(
            f"CRITICAL ALERT: Success rate ({success_rate:.1%}) below 95% target"
        )
        
        await log_system_health(
            component="background_removal",
            status="unhealthy",
            additional_data={
                'alert_type': 'success_rate_critical',
                'success_rate': success_rate
            }
        )
    
    async def _handle_degradation_alert(self, alert_data: Dict[str, Any]):
        """Handle performance degradation alert"""
        logger.warning(
            f"WARNING: Performance degradation detected - "
            f"processing time increased significantly"
        )
        
        await log_system_health(
            component="background_removal",
            status="degraded",
            additional_data={'alert_type': 'performance_degradation'}
        )
    
    def get_current_stats(self) -> Dict[str, Any]:
        """Get current performance statistics"""
        stats = dict(self.performance_stats)
        
        # Calculate derived metrics
        if stats['total_requests'] > 0:
            stats['success_rate'] = stats['successful_requests'] / stats['total_requests']
            stats['under_5_seconds_rate'] = stats['under_5_seconds'] / stats['successful_requests'] if stats['successful_requests'] > 0 else 0
        else:
            stats['success_rate'] = 0
            stats['under_5_seconds_rate'] = 0
        
        # Recent performance metrics
        if self.metrics_buffer:
            recent_successful = [m for m in list(self.metrics_buffer)[-20:] if m.success]
            if recent_successful:
                recent_times = [m.processing_time for m in recent_successful]
                stats['recent_average_time'] = statistics.mean(recent_times)
                stats['recent_max_time'] = max(recent_times)
                stats['recent_min_time'] = min(recent_times)
        
        return stats
    
    def get_library_performance_comparison(self) -> Dict[str, Dict[str, float]]:
        """Get comparative performance statistics by library"""
        comparison = {}
        
        for library_key, times in self.performance_stats['library_performance'].items():
            if times:
                comparison[library_key] = {
                    'average_time': statistics.mean(times),
                    'median_time': statistics.median(times),
                    'min_time': min(times),
                    'max_time': max(times),
                    'std_dev': statistics.stdev(times) if len(times) > 1 else 0,
                    'sample_count': len(times),
                    'under_5_seconds_rate': len([t for t in times if t < 5.0]) / len(times),
                    'performance_grade': 'A' if statistics.mean(times) < 2.0 
                                       else 'B' if statistics.mean(times) < 4.0 
                                       else 'C' if statistics.mean(times) < 6.0 
                                       else 'D'
                }
        
        return comparison
    
    async def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        stats = self.get_current_stats()
        library_comparison = self.get_library_performance_comparison()
        
        # Performance health assessment
        health_status = "healthy"
        if stats['success_rate'] < 0.95:
            health_status = "unhealthy"
        elif stats['average_processing_time'] > 5.0:
            health_status = "unhealthy"
        elif stats['average_processing_time'] > 4.0 or stats['under_5_seconds_rate'] < 0.9:
            health_status = "degraded"
        
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'health_status': health_status,
            'performance_summary': {
                'meets_5_second_target': stats['under_5_seconds_rate'] >= 0.9,
                'meets_success_target': stats['success_rate'] >= 0.95,
                'average_processing_time': stats['average_processing_time'],
                'success_rate': stats['success_rate'],
                'under_5_seconds_rate': stats['under_5_seconds_rate']
            },
            'detailed_stats': stats,
            'library_performance': library_comparison,
            'recommendations': self._generate_recommendations(stats, library_comparison)
        }
        
        return report
    
    def _generate_recommendations(
        self, 
        stats: Dict[str, Any], 
        library_comparison: Dict[str, Dict[str, float]]
    ) -> List[str]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        if stats['under_5_seconds_rate'] < 0.9:
            recommendations.append(
                "CRITICAL: <90% of requests complete under 5 seconds. "
                "Consider optimizing image preprocessing or switching to faster library."
            )
        
        if stats['success_rate'] < 0.95:
            recommendations.append(
                "CRITICAL: Success rate below 95% target. "
                "Review error patterns and improve fallback mechanisms."
            )
        
        # Library-specific recommendations
        if library_comparison:
            best_library = min(library_comparison.keys(), 
                             key=lambda k: library_comparison[k]['average_time'])
            worst_library = max(library_comparison.keys(), 
                              key=lambda k: library_comparison[k]['average_time'])
            
            best_time = library_comparison[best_library]['average_time']
            worst_time = library_comparison[worst_library]['average_time']
            
            if worst_time > best_time * 1.5:
                recommendations.append(
                    f"Consider prioritizing {best_library} (avg: {best_time:.2f}s) "
                    f"over {worst_library} (avg: {worst_time:.2f}s) for better performance."
                )
        
        if stats.get('recent_max_time', 0) > 10.0:
            recommendations.append(
                "Some requests taking >10 seconds. Implement processing timeout mechanisms."
            )
        
        return recommendations

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

# Convenience functions for easy integration
async def record_processing_performance(
    processing_id: str,
    processing_time: float,
    library: str,
    model: str,
    success: bool,
    input_size: int,
    output_size: int,
    session_hash: str
):
    """Record processing performance metric"""
    await performance_monitor.record_processing_metric(
        processing_id=processing_id,
        processing_time=processing_time,
        library=library,
        model=model,
        success=success,
        input_size=input_size,
        output_size=output_size,
        session_hash=session_hash
    )

async def get_performance_health() -> Dict[str, Any]:
    """Get current performance health status"""
    return performance_monitor.get_current_stats()

async def get_performance_report() -> Dict[str, Any]:
    """Get comprehensive performance report"""
    return await performance_monitor.generate_performance_report()