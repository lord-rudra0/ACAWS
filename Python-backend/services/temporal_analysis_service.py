"""
Temporal Analysis Service for Cognitive State Tracking.

This service provides sophisticated temporal analysis including:
- Time-series analysis of cognitive metrics
- Trend detection and pattern recognition
- Cognitive state transitions
- Performance prediction based on historical data
- Fatigue and attention drift detection
- Learning curve analysis
- Adaptive threshold adjustment
- Long-term cognitive pattern recognition
"""
from typing import Optional, Dict, Any, List, Tuple
import logging
import math
import statistics
from collections import deque
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)

try:
    import numpy as np
    from scipy import signal
    from scipy.stats import linregress
    _HAS_NUMPY_SCIPY = True
except Exception:
    _HAS_NUMPY_SCIPY = False

class TemporalAnalyzer:
    """Advanced temporal analysis for cognitive state tracking"""

    def __init__(self, max_history: int = 1000):
        self.metrics_history = deque(maxlen=max_history)
        self.state_transitions = deque(maxlen=500)
        self.performance_predictions = deque(maxlen=100)
        self.attention_baseline = 0.7
        self.fatigue_threshold = 0.3
        self.learning_rate = 0.01

        # Cognitive state definitions
        self.cognitive_states = {
            'focused': {'attention': (0.8, 1.0), 'engagement': (0.7, 1.0)},
            'distracted': {'attention': (0.0, 0.4), 'engagement': (0.0, 0.5)},
            'fatigued': {'attention': (0.0, 0.6), 'engagement': (0.0, 0.4)},
            'engaged': {'attention': (0.6, 1.0), 'engagement': (0.6, 1.0)},
            'confused': {'attention': (0.3, 0.7), 'engagement': (0.2, 0.6)},
            'learning': {'attention': (0.5, 0.9), 'engagement': (0.4, 0.8)}
        }

        # Initialize baseline values
        self.baselines = {
            'attention': 0.7,
            'engagement': 0.6,
            'fatigue': 0.2,
            'comprehension': 0.75
        }

    def add_metrics(self, metrics: Dict[str, Any], timestamp: Optional[float] = None):
        """Add new metrics to the temporal analysis"""
        if timestamp is None:
            timestamp = time.time()

        # Create comprehensive metrics entry
        entry = {
            'timestamp': timestamp,
            'datetime': datetime.fromtimestamp(timestamp),
            'attention': metrics.get('attention', 0.5),
            'engagement': metrics.get('engagement', 0.5),
            'fatigue': metrics.get('fatigue', 0.2),
            'comprehension': metrics.get('comprehension', 0.7),
            'emotion': metrics.get('emotion', 'neutral'),
            'confidence': metrics.get('confidence', 0.5),
            'performance': metrics.get('performance', 0.6),
            'reaction_time': metrics.get('reaction_time', 0.5),
            'cognitive_load': metrics.get('cognitive_load', 0.4)
        }

        self.metrics_history.append(entry)

        # Update baselines adaptively
        self._update_baselines()

    def _update_baselines(self):
        """Update baseline values based on recent history"""
        if len(self.metrics_history) < 10:
            return

        recent_metrics = list(self.metrics_history)[-50:]  # Last 50 entries

        for metric in ['attention', 'engagement', 'fatigue', 'comprehension']:
            values = [entry[metric] for entry in recent_metrics if entry[metric] is not None]
            if values:
                # Use exponential moving average for baseline
                current_baseline = self.baselines[metric]
                new_value = statistics.mean(values)
                self.baselines[metric] = current_baseline * (1 - self.learning_rate) + new_value * self.learning_rate

    def _detect_trends(self, metric_name: str, window_size: int = 20) -> Dict[str, Any]:
        """Detect trends in a specific metric"""
        if len(self.metrics_history) < window_size:
            return {'trend': 'insufficient_data', 'slope': 0.0, 'confidence': 0.0}

        try:
            recent_data = list(self.metrics_history)[-window_size:]
            values = [entry[metric_name] for entry in recent_data if entry[metric_name] is not None]
            timestamps = [entry['timestamp'] for entry in recent_data if entry[metric_name] is not None]

            if len(values) < 5:
                return {'trend': 'insufficient_data', 'slope': 0.0, 'confidence': 0.0}

            # Calculate linear regression
            if _HAS_NUMPY_SCIPY:
                slope, intercept, r_value, p_value, std_err = linregress(timestamps, values)
                confidence = abs(r_value)
            else:
                # Simple slope calculation
                x_mean = sum(timestamps) / len(timestamps)
                y_mean = sum(values) / len(values)
                numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(timestamps, values))
                denominator = sum((x - x_mean) ** 2 for x in timestamps)
                slope = numerator / denominator if denominator != 0 else 0
                confidence = 0.5  # Lower confidence without scipy

            # Determine trend direction
            if abs(slope) < 0.001:
                trend = 'stable'
            elif slope > 0.001:
                trend = 'improving' if metric_name in ['attention', 'engagement', 'comprehension'] else 'worsening'
            else:
                trend = 'declining' if metric_name in ['attention', 'engagement', 'comprehension'] else 'improving'

            return {
                'trend': trend,
                'slope': slope,
                'confidence': confidence,
                'window_size': len(values)
            }

        except Exception as e:
            logger.debug(f"Trend detection failed for {metric_name}: {e}")
            return {'trend': 'error', 'slope': 0.0, 'confidence': 0.0}

    def _analyze_cognitive_state(self) -> Dict[str, Any]:
        """Analyze current cognitive state based on metrics"""
        if len(self.metrics_history) < 5:
            return {'state': 'unknown', 'confidence': 0.0, 'metrics': {}}

        current = self.metrics_history[-1]
        attention = current['attention']
        engagement = current['engagement']

        best_state = 'unknown'
        best_confidence = 0.0
        state_metrics = {}

        for state, criteria in self.cognitive_states.items():
            att_range = criteria['attention']
            eng_range = criteria['engagement']

            # Check if current metrics fit this state
            att_fit = att_range[0] <= attention <= att_range[1]
            eng_fit = eng_range[0] <= engagement <= eng_range[1]

            if att_fit and eng_fit:
                confidence = min(1.0, (attention + engagement) / 2.0)
                if confidence > best_confidence:
                    best_state = state
                    best_confidence = confidence
                    state_metrics = {
                        'attention_fit': att_fit,
                        'engagement_fit': eng_fit,
                        'attention_level': attention,
                        'engagement_level': engagement
                    }

        return {
            'state': best_state,
            'confidence': best_confidence,
            'metrics': state_metrics
        }

    def _detect_fatigue_patterns(self) -> Dict[str, Any]:
        """Detect fatigue patterns and predict fatigue onset"""
        if len(self.metrics_history) < 20:
            return {'fatigue_level': 0.0, 'prediction': 'insufficient_data'}

        recent_data = list(self.metrics_history)[-50:]
        fatigue_values = [entry['fatigue'] for entry in recent_data]
        attention_values = [entry['attention'] for entry in recent_data]

        # Calculate current fatigue level
        current_fatigue = statistics.mean(fatigue_values[-5:])  # Last 5 readings

        # Detect fatigue patterns
        fatigue_trend = self._detect_trends('fatigue', 20)
        attention_trend = self._detect_trends('attention', 20)

        # Predict fatigue onset
        if fatigue_trend['trend'] == 'improving' and attention_trend['trend'] == 'declining':
            prediction = 'fatigue_onset_soon'
            risk_level = 'high'
        elif current_fatigue > self.fatigue_threshold:
            prediction = 'currently_fatigued'
            risk_level = 'high'
        elif fatigue_trend['slope'] > 0.001:
            prediction = 'fatigue_increasing'
            risk_level = 'medium'
        else:
            prediction = 'normal'
            risk_level = 'low'

        return {
            'fatigue_level': current_fatigue,
            'prediction': prediction,
            'risk_level': risk_level,
            'fatigue_trend': fatigue_trend,
            'attention_trend': attention_trend,
            'recommendations': self._get_fatigue_recommendations(prediction)
        }

    def _get_fatigue_recommendations(self, prediction: str) -> List[str]:
        """Get recommendations based on fatigue prediction"""
        recommendations = {
            'fatigue_onset_soon': [
                'Take a short break (2-3 minutes)',
                'Stand up and stretch',
                'Drink water and take deep breaths',
                'Consider switching to a different task'
            ],
            'currently_fatigued': [
                'Take a longer break (10-15 minutes)',
                'Get some fresh air if possible',
                'Have a healthy snack',
                'Consider rescheduling demanding tasks'
            ],
            'fatigue_increasing': [
                'Monitor your energy levels closely',
                'Plan regular short breaks',
                'Ensure adequate hydration and nutrition',
                'Consider adjusting your workload'
            ],
            'normal': [
                'Maintain current good practices',
                'Continue regular breaks',
                'Stay hydrated and well-nourished'
            ]
        }
        return recommendations.get(prediction, [])

    def _analyze_performance_patterns(self) -> Dict[str, Any]:
        """Analyze performance patterns and predict future performance"""
        if len(self.metrics_history) < 30:
            return {'pattern': 'insufficient_data', 'prediction': {}}

        recent_data = list(self.metrics_history)[-100:]
        performance_values = [entry['performance'] for entry in recent_data]
        comprehension_values = [entry['comprehension'] for entry in recent_data]

        # Detect performance patterns
        perf_trend = self._detect_trends('performance', 30)
        comp_trend = self._detect_trends('comprehension', 30)

        # Calculate learning curve
        learning_curve = self._calculate_learning_curve(performance_values)

        # Predict future performance
        if perf_trend['trend'] == 'improving' and comp_trend['trend'] == 'improving':
            prediction = 'continuing_improvement'
            expected_change = perf_trend['slope'] * 3600  # Change per hour
        elif perf_trend['trend'] == 'stable':
            prediction = 'plateau'
            expected_change = 0.0
        else:
            prediction = 'declining_performance'
            expected_change = perf_trend['slope'] * 3600

        return {
            'pattern': perf_trend['trend'],
            'prediction': prediction,
            'expected_change_per_hour': expected_change,
            'learning_curve': learning_curve,
            'performance_trend': perf_trend,
            'comprehension_trend': comp_trend,
            'insights': self._generate_performance_insights(perf_trend, comp_trend)
        }

    def _calculate_learning_curve(self, performance_values: List[float]) -> Dict[str, Any]:
        """Calculate learning curve parameters"""
        if len(performance_values) < 10:
            return {'type': 'insufficient_data'}

        try:
            # Simple learning curve analysis
            initial_performance = statistics.mean(performance_values[:5])
            final_performance = statistics.mean(performance_values[-5:])
            improvement = final_performance - initial_performance

            # Calculate learning rate (simplified)
            if initial_performance > 0:
                learning_rate = improvement / initial_performance
            else:
                learning_rate = 0

            # Determine curve type
            if learning_rate > 0.1:
                curve_type = 'rapid_learning'
            elif learning_rate > 0.05:
                curve_type = 'steady_improvement'
            elif learning_rate > 0:
                curve_type = 'slow_improvement'
            else:
                curve_type = 'plateau'

            return {
                'type': curve_type,
                'initial_performance': initial_performance,
                'final_performance': final_performance,
                'improvement': improvement,
                'learning_rate': learning_rate
            }

        except Exception as e:
            logger.debug(f"Learning curve calculation failed: {e}")
            return {'type': 'calculation_error'}

    def _generate_performance_insights(self, perf_trend: Dict, comp_trend: Dict) -> List[str]:
        """Generate insights based on performance and comprehension trends"""
        insights = []

        if perf_trend['trend'] == 'improving' and comp_trend['trend'] == 'improving':
            insights.append("Strong learning progress with good comprehension")
            insights.append("Continue current learning strategies")

        elif perf_trend['trend'] == 'improving' and comp_trend['trend'] == 'stable':
            insights.append("Performance improving but comprehension stable")
            insights.append("Consider reviewing fundamental concepts")

        elif perf_trend['trend'] == 'declining' and comp_trend['trend'] == 'declining':
            insights.append("Both performance and comprehension declining")
            insights.append("May need a break or different approach")

        elif perf_trend['trend'] == 'stable' and comp_trend['trend'] == 'stable':
            insights.append("Performance plateau reached")
            insights.append("Consider increasing difficulty or changing methods")

        return insights

    def _detect_attention_drift(self) -> Dict[str, Any]:
        """Detect attention drift patterns"""
        if len(self.metrics_history) < 20:
            return {'drift_detected': False, 'severity': 'none'}

        recent_attention = [entry['attention'] for entry in self.metrics_history][-20:]
        baseline_attention = self.baselines['attention']

        # Calculate attention variability
        attention_std = statistics.stdev(recent_attention) if len(recent_attention) > 1 else 0
        attention_mean = statistics.mean(recent_attention)

        # Detect drift patterns
        if attention_std > 0.2 and attention_mean < baseline_attention * 0.8:
            drift_detected = True
            severity = 'high'
        elif attention_std > 0.15 or attention_mean < baseline_attention * 0.9:
            drift_detected = True
            severity = 'medium'
        elif attention_std > 0.1:
            drift_detected = True
            severity = 'low'
        else:
            drift_detected = False
            severity = 'none'

        return {
            'drift_detected': drift_detected,
            'severity': severity,
            'attention_variability': attention_std,
            'current_attention': attention_mean,
            'baseline_attention': baseline_attention,
            'recommendations': self._get_attention_recommendations(severity)
        }

    def _get_attention_recommendations(self, severity: str) -> List[str]:
        """Get recommendations for attention drift"""
        recommendations = {
            'high': [
                'Take an immediate break',
                'Practice mindfulness or deep breathing',
                'Change environment or location',
                'Consider rescheduling important tasks'
            ],
            'medium': [
                'Take a short break (5 minutes)',
                'Stand up and move around',
                'Refocus on the current task',
                'Review recent work to regain context'
            ],
            'low': [
                'Maintain awareness of attention levels',
                'Take brief moments to refocus',
                'Ensure good posture and environment'
            ],
            'none': [
                'Continue current good practices',
                'Maintain regular breaks'
            ]
        }
        return recommendations.get(severity, [])

    def analyze_temporal_patterns(self) -> Dict[str, Any]:
        """Main temporal analysis function"""
        if len(self.metrics_history) < 5:
            return {'status': 'insufficient_data'}

        try:
            # Perform all temporal analyses
            trends = {}
            for metric in ['attention', 'engagement', 'fatigue', 'comprehension', 'performance']:
                trends[metric] = self._detect_trends(metric)

            cognitive_state = self._analyze_cognitive_state()
            fatigue_analysis = self._detect_fatigue_patterns()
            performance_analysis = self._analyze_performance_patterns()
            attention_drift = self._detect_attention_drift()

            # Generate overall assessment
            overall_assessment = self._generate_overall_assessment(
                trends, cognitive_state, fatigue_analysis, performance_analysis, attention_drift
            )

            return {
                'status': 'success',
                'timestamp': time.time(),
                'trends': trends,
                'cognitive_state': cognitive_state,
                'fatigue_analysis': fatigue_analysis,
                'performance_analysis': performance_analysis,
                'attention_drift': attention_drift,
                'overall_assessment': overall_assessment,
                'recommendations': self._generate_recommendations(
                    cognitive_state, fatigue_analysis, attention_drift
                )
            }

        except Exception as e:
            logger.error(f"Temporal analysis failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': time.time()
            }

    def _generate_overall_assessment(self, trends: Dict, cognitive_state: Dict,
                                   fatigue: Dict, performance: Dict, attention: Dict) -> Dict[str, Any]:
        """Generate overall cognitive assessment"""
        assessment_score = 0.5  # Base score

        # Cognitive state contribution
        if cognitive_state['state'] in ['focused', 'engaged']:
            assessment_score += 0.2
        elif cognitive_state['state'] in ['fatigued', 'distracted']:
            assessment_score -= 0.2

        # Fatigue contribution
        if fatigue['risk_level'] == 'low':
            assessment_score += 0.1
        elif fatigue['risk_level'] == 'high':
            assessment_score -= 0.3

        # Performance contribution
        if performance.get('pattern') == 'improving':
            assessment_score += 0.2
        elif performance.get('pattern') == 'declining':
            assessment_score -= 0.2

        # Attention contribution
        if not attention['drift_detected']:
            assessment_score += 0.1
        elif attention['severity'] == 'high':
            assessment_score -= 0.2

        assessment_score = max(0.0, min(1.0, assessment_score))

        # Determine overall state
        if assessment_score > 0.8:
            overall_state = 'excellent'
        elif assessment_score > 0.6:
            overall_state = 'good'
        elif assessment_score > 0.4:
            overall_state = 'fair'
        else:
            overall_state = 'needs_attention'

        return {
            'score': assessment_score,
            'state': overall_state,
            'confidence': cognitive_state['confidence']
        }

    def _generate_recommendations(self, cognitive_state: Dict, fatigue: Dict, attention: Dict) -> List[str]:
        """Generate comprehensive recommendations"""
        recommendations = []

        # Cognitive state recommendations
        if cognitive_state['state'] == 'fatigued':
            recommendations.extend([
                'Take a break to restore energy',
                'Consider rescheduling demanding tasks',
                'Practice stress-reduction techniques'
            ])
        elif cognitive_state['state'] == 'distracted':
            recommendations.extend([
                'Minimize distractions in environment',
                'Use focus techniques (Pomodoro, etc.)',
                'Break complex tasks into smaller steps'
            ])

        # Fatigue recommendations
        recommendations.extend(fatigue.get('recommendations', []))

        # Attention recommendations
        recommendations.extend(attention.get('recommendations', []))

        # Remove duplicates and limit to top 5
        unique_recommendations = list(dict.fromkeys(recommendations))
        return unique_recommendations[:5]

# Singleton instance
temporal_analyzer = TemporalAnalyzer()
