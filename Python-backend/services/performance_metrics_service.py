"""
Performance Metrics Service for Real-time Cognitive Monitoring.

This service provides comprehensive performance tracking including:
- Real-time performance metrics calculation
- Cognitive load assessment
- Response time analysis
- Accuracy and efficiency metrics
- Learning progress tracking
- Performance prediction models
- Adaptive difficulty adjustment
- Benchmarking against historical data
"""
from typing import Optional, Dict, Any, List, Tuple
import logging
import time
import statistics
from collections import deque
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    import numpy as np
    _HAS_NUMPY = True
except Exception:
    _HAS_NUMPY = False

class PerformanceMetricsService:
    """Advanced performance metrics tracking and analysis"""

    def __init__(self):
        self.performance_history = deque(maxlen=1000)
        self.response_times = deque(maxlen=500)
        self.accuracy_history = deque(maxlen=500)
        self.task_completion_times = deque(maxlen=200)

        # Performance benchmarks
        self.benchmarks = {
            'response_time': {'excellent': 0.5, 'good': 1.0, 'fair': 2.0, 'poor': 5.0},
            'accuracy': {'excellent': 0.95, 'good': 0.85, 'fair': 0.75, 'poor': 0.6},
            'cognitive_load': {'low': 0.3, 'medium': 0.6, 'high': 0.8, 'overload': 0.9},
            'learning_efficiency': {'excellent': 0.9, 'good': 0.75, 'fair': 0.6, 'poor': 0.4}
        }

        # Adaptive thresholds
        self.adaptive_thresholds = {
            'attention_threshold': 0.7,
            'fatigue_threshold': 0.3,
            'performance_drop_threshold': 0.15
        }

    def record_performance_metric(self, metric_type: str, value: float,
                                timestamp: Optional[float] = None,
                                context: Optional[Dict[str, Any]] = None):
        """Record a performance metric"""
        if timestamp is None:
            timestamp = time.time()

        metric_entry = {
            'timestamp': timestamp,
            'datetime': datetime.fromtimestamp(timestamp),
            'type': metric_type,
            'value': value,
            'context': context or {}
        }

        self.performance_history.append(metric_entry)

        # Update specific metric histories
        if metric_type == 'response_time':
            self.response_times.append(value)
        elif metric_type == 'accuracy':
            self.accuracy_history.append(value)
        elif metric_type == 'task_completion':
            self.task_completion_times.append(value)

    def calculate_realtime_metrics(self) -> Dict[str, Any]:
        """Calculate real-time performance metrics"""
        if len(self.performance_history) < 5:
            return {'status': 'insufficient_data'}

        try:
            # Get recent metrics (last 10 entries)
            recent_metrics = list(self.performance_history)[-10:]

            # Calculate basic statistics
            response_times = [m['value'] for m in recent_metrics if m['type'] == 'response_time']
            accuracies = [m['value'] for m in recent_metrics if m['type'] == 'accuracy']
            task_times = [m['value'] for m in recent_metrics if m['type'] == 'task_completion']

            metrics = {
                'timestamp': time.time(),
                'response_time': self._calculate_response_metrics(response_times),
                'accuracy': self._calculate_accuracy_metrics(accuracies),
                'task_completion': self._calculate_task_metrics(task_times),
                'overall_performance': self._calculate_overall_performance(response_times, accuracies),
                'cognitive_load': self._estimate_cognitive_load(response_times, accuracies),
                'performance_trend': self._calculate_performance_trend(),
                'efficiency_score': self._calculate_efficiency_score(response_times, accuracies)
            }

            return metrics

        except Exception as e:
            logger.error(f"Real-time metrics calculation failed: {e}")
            return {'status': 'error', 'error': str(e)}

    def _calculate_response_metrics(self, response_times: List[float]) -> Dict[str, Any]:
        """Calculate response time metrics"""
        if not response_times:
            return {'average': 0.0, 'median': 0.0, 'min': 0.0, 'max': 0.0, 'rating': 'unknown'}

        try:
            avg_response = statistics.mean(response_times)
            median_response = statistics.median(response_times)
            min_response = min(response_times)
            max_response = max(response_times)

            # Rate performance
            rating = self._rate_performance(avg_response, self.benchmarks['response_time'])

            return {
                'average': avg_response,
                'median': median_response,
                'min': min_response,
                'max': max_response,
                'rating': rating,
                'variability': statistics.stdev(response_times) if len(response_times) > 1 else 0.0
            }

        except Exception as e:
            logger.debug(f"Response metrics calculation failed: {e}")
            return {'average': 0.0, 'rating': 'error'}

    def _calculate_accuracy_metrics(self, accuracies: List[float]) -> Dict[str, Any]:
        """Calculate accuracy metrics"""
        if not accuracies:
            return {'average': 0.0, 'trend': 'stable', 'rating': 'unknown'}

        try:
            avg_accuracy = statistics.mean(accuracies)

            # Calculate trend
            if len(accuracies) >= 3:
                recent_avg = statistics.mean(accuracies[-3:])
                earlier_avg = statistics.mean(accuracies[:-3])
                if recent_avg > earlier_avg + 0.05:
                    trend = 'improving'
                elif recent_avg < earlier_avg - 0.05:
                    trend = 'declining'
                else:
                    trend = 'stable'
            else:
                trend = 'stable'

            rating = self._rate_performance(avg_accuracy, self.benchmarks['accuracy'])

            return {
                'average': avg_accuracy,
                'trend': trend,
                'rating': rating,
                'consistency': 1.0 - (statistics.stdev(accuracies) if len(accuracies) > 1 else 0.0)
            }

        except Exception as e:
            logger.debug(f"Accuracy metrics calculation failed: {e}")
            return {'average': 0.0, 'trend': 'error', 'rating': 'error'}

    def _calculate_task_metrics(self, task_times: List[float]) -> Dict[str, Any]:
        """Calculate task completion metrics"""
        if not task_times:
            return {'average': 0.0, 'efficiency': 0.0, 'rating': 'unknown'}

        try:
            avg_completion = statistics.mean(task_times)

            # Estimate efficiency (inverse of time, normalized)
            efficiency = min(1.0, 10.0 / max(avg_completion, 0.1))

            rating = 'good' if efficiency > 0.7 else 'fair' if efficiency > 0.5 else 'poor'

            return {
                'average': avg_completion,
                'efficiency': efficiency,
                'rating': rating,
                'total_tasks': len(task_times)
            }

        except Exception as e:
            logger.debug(f"Task metrics calculation failed: {e}")
            return {'average': 0.0, 'efficiency': 0.0, 'rating': 'error'}

    def _calculate_overall_performance(self, response_times: List[float], accuracies: List[float]) -> Dict[str, Any]:
        """Calculate overall performance score"""
        if not response_times or not accuracies:
            return {'score': 0.5, 'rating': 'unknown'}

        try:
            # Normalize response time (lower is better)
            avg_response = statistics.mean(response_times)
            response_score = min(1.0, 2.0 / max(avg_response, 0.1))

            # Accuracy score (higher is better)
            avg_accuracy = statistics.mean(accuracies)

            # Weighted combination
            overall_score = (response_score * 0.4) + (avg_accuracy * 0.6)

            # Rate overall performance
            if overall_score > 0.85:
                rating = 'excellent'
            elif overall_score > 0.7:
                rating = 'good'
            elif overall_score > 0.55:
                rating = 'fair'
            else:
                rating = 'poor'

            return {
                'score': overall_score,
                'rating': rating,
                'response_contribution': response_score * 0.4,
                'accuracy_contribution': avg_accuracy * 0.6
            }

        except Exception as e:
            logger.debug(f"Overall performance calculation failed: {e}")
            return {'score': 0.5, 'rating': 'error'}

    def _estimate_cognitive_load(self, response_times: List[float], accuracies: List[float]) -> Dict[str, Any]:
        """Estimate cognitive load based on performance metrics"""
        if not response_times or not accuracies:
            return {'level': 0.5, 'rating': 'unknown'}

        try:
            avg_response = statistics.mean(response_times)
            avg_accuracy = statistics.mean(accuracies)

            # Cognitive load estimation
            # Higher response times and lower accuracy indicate higher cognitive load
            response_load = min(1.0, avg_response / 3.0)  # Normalize response time
            accuracy_load = 1.0 - avg_accuracy  # Invert accuracy (lower accuracy = higher load)

            cognitive_load = (response_load * 0.6) + (accuracy_load * 0.4)

            # Rate cognitive load
            rating = self._rate_performance(cognitive_load, self.benchmarks['cognitive_load'], reverse=True)

            return {
                'level': cognitive_load,
                'rating': rating,
                'response_factor': response_load,
                'accuracy_factor': accuracy_load
            }

        except Exception as e:
            logger.debug(f"Cognitive load estimation failed: {e}")
            return {'level': 0.5, 'rating': 'error'}

    def _calculate_performance_trend(self) -> Dict[str, Any]:
        """Calculate performance trend over time"""
        if len(self.performance_history) < 20:
            return {'trend': 'insufficient_data', 'slope': 0.0}

        try:
            # Get performance scores over time
            performance_scores = []
            timestamps = []

            for entry in list(self.performance_history)[-50:]:
                if entry['type'] in ['accuracy', 'response_time']:
                    score = entry['value']
                    # Normalize different metric types
                    if entry['type'] == 'response_time':
                        score = min(1.0, 2.0 / max(score, 0.1))
                    elif entry['type'] == 'accuracy':
                        score = score  # Already 0-1

                    performance_scores.append(score)
                    timestamps.append(entry['timestamp'])

            if len(performance_scores) < 5:
                return {'trend': 'insufficient_data', 'slope': 0.0}

            # Calculate trend using simple linear regression
            if _HAS_NUMPY:
                x = np.array(timestamps)
                y = np.array(performance_scores)
                slope = np.polyfit(x, y, 1)[0]
            else:
                # Manual calculation
                x_mean = sum(timestamps) / len(timestamps)
                y_mean = sum(performance_scores) / len(performance_scores)
                numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(timestamps, performance_scores))
                denominator = sum((x - x_mean) ** 2 for x in timestamps)
                slope = numerator / denominator if denominator != 0 else 0

            # Determine trend
            if slope > 0.001:
                trend = 'improving'
            elif slope < -0.001:
                trend = 'declining'
            else:
                trend = 'stable'

            return {
                'trend': trend,
                'slope': slope,
                'data_points': len(performance_scores)
            }

        except Exception as e:
            logger.debug(f"Performance trend calculation failed: {e}")
            return {'trend': 'error', 'slope': 0.0}

    def _calculate_efficiency_score(self, response_times: List[float], accuracies: List[float]) -> Dict[str, Any]:
        """Calculate learning efficiency score"""
        if not response_times or not accuracies:
            return {'score': 0.5, 'rating': 'unknown'}

        try:
            avg_response = statistics.mean(response_times)
            avg_accuracy = statistics.mean(accuracies)

            # Efficiency combines speed and accuracy
            # Lower response time and higher accuracy = higher efficiency
            speed_factor = min(1.0, 2.0 / max(avg_response, 0.1))
            accuracy_factor = avg_accuracy

            efficiency_score = (speed_factor * 0.5) + (accuracy_factor * 0.5)

            rating = self._rate_performance(efficiency_score, self.benchmarks['learning_efficiency'])

            return {
                'score': efficiency_score,
                'rating': rating,
                'speed_factor': speed_factor,
                'accuracy_factor': accuracy_factor
            }

        except Exception as e:
            logger.debug(f"Efficiency score calculation failed: {e}")
            return {'score': 0.5, 'rating': 'error'}

    def _rate_performance(self, value: float, benchmark: Dict[str, float], reverse: bool = False) -> str:
        """Rate performance based on benchmarks"""
        if reverse:
            # For metrics where lower values are better (like cognitive load)
            if value <= benchmark.get('low', 0.3):
                return 'excellent'
            elif value <= benchmark.get('medium', 0.6):
                return 'good'
            elif value <= benchmark.get('high', 0.8):
                return 'fair'
            else:
                return 'poor'
        else:
            # For metrics where higher values are better
            if value >= benchmark.get('excellent', 0.9):
                return 'excellent'
            elif value >= benchmark.get('good', 0.75):
                return 'good'
            elif value >= benchmark.get('fair', 0.6):
                return 'fair'
            else:
                return 'poor'

    def get_performance_insights(self) -> Dict[str, Any]:
        """Generate performance insights and recommendations"""
        if len(self.performance_history) < 10:
            return {'insights': [], 'recommendations': []}

        try:
            recent_metrics = self.calculate_realtime_metrics()

            insights = []
            recommendations = []

            # Analyze response time
            if 'response_time' in recent_metrics:
                rt_rating = recent_metrics['response_time'].get('rating')
                if rt_rating == 'poor':
                    insights.append('Response times are slower than optimal')
                    recommendations.append('Consider reducing task complexity or taking breaks')
                elif rt_rating == 'excellent':
                    insights.append('Excellent response times indicate good cognitive processing')

            # Analyze accuracy
            if 'accuracy' in recent_metrics:
                acc_trend = recent_metrics['accuracy'].get('trend')
                if acc_trend == 'declining':
                    insights.append('Accuracy is declining - possible fatigue or distraction')
                    recommendations.append('Take a short break to maintain accuracy')
                elif acc_trend == 'improving':
                    insights.append('Accuracy is improving - good learning progress')

            # Analyze cognitive load
            if 'cognitive_load' in recent_metrics:
                cl_rating = recent_metrics['cognitive_load'].get('rating')
                if cl_rating in ['high', 'overload']:
                    insights.append('High cognitive load detected')
                    recommendations.append('Consider breaking tasks into smaller steps')
                    recommendations.append('Take regular breaks to prevent overload')

            # Analyze overall performance
            if 'overall_performance' in recent_metrics:
                op_rating = recent_metrics['overall_performance'].get('rating')
                if op_rating == 'excellent':
                    insights.append('Outstanding overall performance')
                elif op_rating == 'poor':
                    insights.append('Performance needs improvement')
                    recommendations.append('Review current learning strategies')

            return {
                'insights': insights,
                'recommendations': recommendations,
                'timestamp': time.time()
            }

        except Exception as e:
            logger.error(f"Performance insights generation failed: {e}")
            return {'insights': [], 'recommendations': [], 'error': str(e)}

    def predict_performance(self, hours_ahead: float = 1.0) -> Dict[str, Any]:
        """Predict future performance based on current trends"""
        if len(self.performance_history) < 20:
            return {'prediction': 'insufficient_data'}

        try:
            trend = self._calculate_performance_trend()
            current_metrics = self.calculate_realtime_metrics()

            if trend['trend'] == 'insufficient_data':
                return {'prediction': 'insufficient_data'}

            # Simple linear extrapolation
            current_score = current_metrics.get('overall_performance', {}).get('score', 0.5)
            slope = trend['slope']

            # Convert hours to seconds for slope calculation
            time_change = hours_ahead * 3600
            predicted_score = current_score + (slope * time_change)

            # Bound prediction
            predicted_score = max(0.0, min(1.0, predicted_score))

            # Determine prediction confidence
            data_points = trend.get('data_points', 0)
            confidence = min(1.0, data_points / 50.0)  # More data = higher confidence

            # Generate prediction description
            if predicted_score > current_score + 0.1:
                description = 'Expected improvement'
            elif predicted_score < current_score - 0.1:
                description = 'Potential decline expected'
            else:
                description = 'Stable performance expected'

            return {
                'current_score': current_score,
                'predicted_score': predicted_score,
                'change': predicted_score - current_score,
                'description': description,
                'confidence': confidence,
                'hours_ahead': hours_ahead,
                'trend': trend['trend']
            }

        except Exception as e:
            logger.error(f"Performance prediction failed: {e}")
            return {'prediction': 'error', 'error': str(e)}

# Singleton instance
performance_service = PerformanceMetricsService()
