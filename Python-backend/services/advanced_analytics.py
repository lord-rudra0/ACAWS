import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import json

logger = logging.getLogger(__name__)

class AdvancedAnalyticsService:
    """Advanced analytics service for deep insights and predictions"""
    
    def __init__(self):
        self.user_clusters = {}
        self.learning_patterns = {}
        self.wellness_correlations = {}
        self.performance_predictors = {}
        
    async def analyze_learning_patterns(self, user_id: str, session_data: List[Dict]) -> Dict:
        """Analyze complex learning patterns using ML"""
        try:
            if len(session_data) < 10:
                return {"error": "Insufficient data for pattern analysis"}
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(session_data)
            
            # Feature engineering
            features = self._extract_learning_features(df)
            
            # Cluster analysis
            clusters = self._perform_clustering_analysis(features)
            
            # Temporal pattern analysis
            temporal_patterns = self._analyze_temporal_patterns(df)
            
            # Performance correlation analysis
            correlations = self._analyze_performance_correlations(df)
            
            # Generate insights
            insights = self._generate_learning_insights(clusters, temporal_patterns, correlations)
            
            return {
                "user_id": user_id,
                "analysis_date": datetime.now().isoformat(),
                "data_points": len(session_data),
                "learning_clusters": clusters,
                "temporal_patterns": temporal_patterns,
                "performance_correlations": correlations,
                "insights": insights,
                "recommendations": self._generate_advanced_recommendations(insights)
            }
            
        except Exception as e:
            logger.error(f"Learning pattern analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_learning_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract features for learning pattern analysis"""
        try:
            features = []
            
            for _, row in df.iterrows():
                feature_vector = [
                    row.get('attention_score', 50) / 100,
                    row.get('confusion_level', 0) / 100,
                    row.get('engagement_score', 50) / 100,
                    row.get('fatigue_level', 0) / 100,
                    row.get('session_duration', 30) / 120,  # Normalize to 2 hours max
                    row.get('completion_rate', 80) / 100,
                    row.get('interaction_count', 10) / 50,  # Normalize interactions
                    row.get('break_frequency', 2) / 10,  # Breaks per session
                    row.get('difficulty_level', 2) / 4,  # Difficulty 1-4
                    row.get('performance_score', 70) / 100
                ]
                features.append(feature_vector)
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return np.array([])
    
    def _perform_clustering_analysis(self, features: np.ndarray) -> Dict:
        """Perform clustering analysis to identify learning patterns"""
        try:
            if len(features) < 5:
                return {"error": "Insufficient data for clustering"}
            
            # Standardize features
            scaler = StandardScaler()
            scaled_features = scaler.fit_transform(features)
            
            # Determine optimal number of clusters
            optimal_k = self._find_optimal_clusters(scaled_features)
            
            # Perform clustering
            kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(scaled_features)
            
            # Analyze clusters
            cluster_analysis = self._analyze_clusters(features, cluster_labels, optimal_k)
            
            return {
                "optimal_clusters": optimal_k,
                "cluster_labels": cluster_labels.tolist(),
                "cluster_centers": kmeans.cluster_centers_.tolist(),
                "cluster_analysis": cluster_analysis,
                "silhouette_score": float(silhouette_score(scaled_features, cluster_labels))
            }
            
        except Exception as e:
            logger.error(f"Clustering analysis failed: {e}")
            return {"error": str(e)}
    
    def _find_optimal_clusters(self, features: np.ndarray) -> int:
        """Find optimal number of clusters using elbow method"""
        try:
            max_k = min(8, len(features) // 2)
            if max_k < 2:
                return 2
            
            inertias = []
            k_range = range(2, max_k + 1)
            
            for k in k_range:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                kmeans.fit(features)
                inertias.append(kmeans.inertia_)
            
            # Find elbow point
            if len(inertias) >= 3:
                # Calculate rate of change
                deltas = np.diff(inertias)
                delta_deltas = np.diff(deltas)
                
                # Find point where rate of change decreases most
                elbow_idx = np.argmax(delta_deltas) + 2
                return k_range[elbow_idx] if elbow_idx < len(k_range) else k_range[-1]
            
            return 3  # Default
            
        except Exception as e:
            logger.error(f"Optimal cluster finding failed: {e}")
            return 3
    
    def _analyze_clusters(self, features: np.ndarray, labels: np.ndarray, n_clusters: int) -> Dict:
        """Analyze characteristics of each cluster"""
        try:
            cluster_analysis = {}
            feature_names = [
                'attention', 'confusion', 'engagement', 'fatigue', 
                'duration', 'completion', 'interactions', 'breaks', 
                'difficulty', 'performance'
            ]
            
            for cluster_id in range(n_clusters):
                cluster_mask = labels == cluster_id
                cluster_features = features[cluster_mask]
                
                if len(cluster_features) == 0:
                    continue
                
                # Calculate cluster statistics
                cluster_stats = {}
                for i, feature_name in enumerate(feature_names):
                    feature_values = cluster_features[:, i]
                    cluster_stats[feature_name] = {
                        'mean': float(np.mean(feature_values)),
                        'std': float(np.std(feature_values)),
                        'min': float(np.min(feature_values)),
                        'max': float(np.max(feature_values))
                    }
                
                # Characterize cluster
                cluster_characteristics = self._characterize_cluster(cluster_stats)
                
                cluster_analysis[f"cluster_{cluster_id}"] = {
                    "size": int(np.sum(cluster_mask)),
                    "percentage": float(np.sum(cluster_mask) / len(labels) * 100),
                    "statistics": cluster_stats,
                    "characteristics": cluster_characteristics,
                    "dominant_features": self._find_dominant_features(cluster_stats)
                }
            
            return cluster_analysis
            
        except Exception as e:
            logger.error(f"Cluster analysis failed: {e}")
            return {}
    
    def _characterize_cluster(self, stats: Dict) -> str:
        """Characterize cluster based on dominant features"""
        attention_mean = stats['attention']['mean']
        confusion_mean = stats['confusion']['mean']
        engagement_mean = stats['engagement']['mean']
        fatigue_mean = stats['fatigue']['mean']
        
        if attention_mean > 0.8 and confusion_mean < 0.3:
            return "High Performers"
        elif confusion_mean > 0.6 or fatigue_mean > 0.7:
            return "Struggling Learners"
        elif engagement_mean > 0.8:
            return "Highly Engaged"
        elif attention_mean < 0.5:
            return "Attention Challenged"
        else:
            return "Average Learners"
    
    def _find_dominant_features(self, stats: Dict) -> List[str]:
        """Find features that dominate this cluster"""
        dominant = []
        
        for feature, values in stats.items():
            if values['mean'] > 0.7:
                dominant.append(f"High {feature}")
            elif values['mean'] < 0.3:
                dominant.append(f"Low {feature}")
        
        return dominant[:3]  # Top 3 dominant features
    
    def _analyze_temporal_patterns(self, df: pd.DataFrame) -> Dict:
        """Analyze temporal learning patterns"""
        try:
            # Convert timestamps
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            
            # Hourly patterns
            hourly_performance = df.groupby('hour').agg({
                'attention_score': 'mean',
                'performance_score': 'mean',
                'engagement_score': 'mean'
            }).to_dict()
            
            # Daily patterns
            daily_performance = df.groupby('day_of_week').agg({
                'attention_score': 'mean',
                'performance_score': 'mean',
                'session_duration': 'mean'
            }).to_dict()
            
            # Find optimal study times
            optimal_hours = self._find_optimal_study_times(hourly_performance)
            optimal_days = self._find_optimal_study_days(daily_performance)
            
            return {
                "hourly_patterns": hourly_performance,
                "daily_patterns": daily_performance,
                "optimal_study_hours": optimal_hours,
                "optimal_study_days": optimal_days,
                "peak_performance_time": self._find_peak_performance_time(df)
            }
            
        except Exception as e:
            logger.error(f"Temporal pattern analysis failed: {e}")
            return {}
    
    def _find_optimal_study_times(self, hourly_data: Dict) -> List[int]:
        """Find optimal study hours based on performance"""
        try:
            attention_scores = hourly_data.get('attention_score', {})
            performance_scores = hourly_data.get('performance_score', {})
            
            # Combine attention and performance scores
            combined_scores = {}
            for hour in range(24):
                if hour in attention_scores and hour in performance_scores:
                    combined_scores[hour] = (attention_scores[hour] + performance_scores[hour]) / 2
            
            # Find top 3 hours
            sorted_hours = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
            return [hour for hour, score in sorted_hours[:3]]
            
        except Exception as e:
            logger.error(f"Optimal time finding failed: {e}")
            return [9, 14, 19]  # Default times
    
    def _find_optimal_study_days(self, daily_data: Dict) -> List[str]:
        """Find optimal study days"""
        try:
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            attention_scores = daily_data.get('attention_score', {})
            
            # Find top performing days
            sorted_days = sorted(attention_scores.items(), key=lambda x: x[1], reverse=True)
            optimal_day_indices = [day for day, score in sorted_days[:3]]
            
            return [day_names[i] for i in optimal_day_indices if i < len(day_names)]
            
        except Exception as e:
            logger.error(f"Optimal day finding failed: {e}")
            return ['Monday', 'Wednesday', 'Friday']
    
    def _find_peak_performance_time(self, df: pd.DataFrame) -> str:
        """Find the specific time when performance peaks"""
        try:
            # Group by hour and calculate average performance
            hourly_avg = df.groupby('hour')['performance_score'].mean()
            peak_hour = hourly_avg.idxmax()
            
            return f"{peak_hour:02d}:00"
            
        except Exception as e:
            logger.error(f"Peak time finding failed: {e}")
            return "10:00"
    
    def _analyze_performance_correlations(self, df: pd.DataFrame) -> Dict:
        """Analyze correlations between different metrics"""
        try:
            # Select numeric columns for correlation
            numeric_cols = [
                'attention_score', 'confusion_level', 'engagement_score', 
                'fatigue_level', 'performance_score', 'session_duration'
            ]
            
            # Calculate correlation matrix
            correlation_matrix = df[numeric_cols].corr()
            
            # Find strong correlations
            strong_correlations = self._find_strong_correlations(correlation_matrix)
            
            # Analyze specific relationships
            attention_performance = self._analyze_relationship(df, 'attention_score', 'performance_score')
            mood_learning = self._analyze_relationship(df, 'mood_score', 'attention_score')
            
            return {
                "correlation_matrix": correlation_matrix.to_dict(),
                "strong_correlations": strong_correlations,
                "attention_performance_relationship": attention_performance,
                "mood_learning_relationship": mood_learning,
                "key_insights": self._extract_correlation_insights(strong_correlations)
            }
            
        except Exception as e:
            logger.error(f"Correlation analysis failed: {e}")
            return {}
    
    def _find_strong_correlations(self, corr_matrix: pd.DataFrame) -> List[Dict]:
        """Find correlations above threshold"""
        strong_correlations = []
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                
                if abs(corr_value) > 0.6:  # Strong correlation threshold
                    strong_correlations.append({
                        "feature_1": corr_matrix.columns[i],
                        "feature_2": corr_matrix.columns[j],
                        "correlation": float(corr_value),
                        "strength": "strong" if abs(corr_value) > 0.8 else "moderate",
                        "direction": "positive" if corr_value > 0 else "negative"
                    })
        
        return sorted(strong_correlations, key=lambda x: abs(x['correlation']), reverse=True)
    
    def _analyze_relationship(self, df: pd.DataFrame, feature1: str, feature2: str) -> Dict:
        """Analyze relationship between two specific features"""
        try:
            if feature1 not in df.columns or feature2 not in df.columns:
                return {"error": f"Features {feature1} or {feature2} not found"}
            
            x = df[feature1].values
            y = df[feature2].values
            
            # Calculate correlation
            correlation = np.corrcoef(x, y)[0, 1]
            
            # Fit linear regression
            coefficients = np.polyfit(x, y, 1)
            
            # Calculate R-squared
            y_pred = np.polyval(coefficients, x)
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
            
            return {
                "correlation": float(correlation),
                "slope": float(coefficients[0]),
                "intercept": float(coefficients[1]),
                "r_squared": float(r_squared),
                "relationship_strength": self._categorize_correlation(correlation),
                "interpretation": self._interpret_relationship(feature1, feature2, correlation, coefficients[0])
            }
            
        except Exception as e:
            logger.error(f"Relationship analysis failed: {e}")
            return {"error": str(e)}
    
    def _categorize_correlation(self, correlation: float) -> str:
        """Categorize correlation strength"""
        abs_corr = abs(correlation)
        
        if abs_corr >= 0.8:
            return "very_strong"
        elif abs_corr >= 0.6:
            return "strong"
        elif abs_corr >= 0.4:
            return "moderate"
        elif abs_corr >= 0.2:
            return "weak"
        else:
            return "very_weak"
    
    def _interpret_relationship(self, feature1: str, feature2: str, correlation: float, slope: float) -> str:
        """Generate human-readable interpretation of relationship"""
        direction = "increases" if slope > 0 else "decreases"
        strength = self._categorize_correlation(correlation)
        
        return f"When {feature1} increases, {feature2} {direction}. This is a {strength} relationship."
    
    def _generate_learning_insights(self, clusters: Dict, temporal: Dict, correlations: Dict) -> List[Dict]:
        """Generate actionable insights from analysis"""
        insights = []
        
        try:
            # Cluster insights
            if "cluster_analysis" in clusters:
                for cluster_name, cluster_data in clusters["cluster_analysis"].items():
                    if cluster_data["percentage"] > 20:  # Significant cluster
                        insights.append({
                            "type": "learning_pattern",
                            "category": cluster_data["characteristics"],
                            "description": f"You belong to the '{cluster_data['characteristics']}' learning pattern ({cluster_data['percentage']:.1f}% of sessions)",
                            "recommendations": self._get_cluster_recommendations(cluster_data["characteristics"]),
                            "priority": "medium"
                        })
            
            # Temporal insights
            if "optimal_study_hours" in temporal:
                optimal_hours = temporal["optimal_study_hours"]
                insights.append({
                    "type": "timing_optimization",
                    "category": "study_schedule",
                    "description": f"Your peak performance hours are {', '.join(map(str, optimal_hours))}",
                    "recommendations": [f"Schedule challenging topics during {optimal_hours[0]}:00-{optimal_hours[0]+2}:00"],
                    "priority": "high"
                })
            
            # Correlation insights
            if "strong_correlations" in correlations:
                for corr in correlations["strong_correlations"][:2]:  # Top 2 correlations
                    insights.append({
                        "type": "performance_correlation",
                        "category": "optimization",
                        "description": f"Strong {corr['direction']} correlation between {corr['feature_1']} and {corr['feature_2']}",
                        "recommendations": self._get_correlation_recommendations(corr),
                        "priority": "medium"
                    })
            
            return insights
            
        except Exception as e:
            logger.error(f"Insight generation failed: {e}")
            return []
    
    def _get_cluster_recommendations(self, cluster_type: str) -> List[str]:
        """Get recommendations based on cluster type"""
        recommendations = {
            "High Performers": [
                "Continue current study methods",
                "Consider mentoring other students",
                "Try more challenging content"
            ],
            "Struggling Learners": [
                "Take more frequent breaks",
                "Use simplified explanations",
                "Consider study group participation"
            ],
            "Highly Engaged": [
                "Leverage your engagement with interactive content",
                "Share your enthusiasm in community discussions",
                "Try teaching concepts to others"
            ],
            "Attention Challenged": [
                "Use attention-focusing techniques",
                "Minimize distractions in study environment",
                "Try shorter, more frequent study sessions"
            ],
            "Average Learners": [
                "Experiment with different study techniques",
                "Track what works best for you",
                "Set specific improvement goals"
            ]
        }
        
        return recommendations.get(cluster_type, ["Continue monitoring your learning patterns"])
    
    def _get_correlation_recommendations(self, correlation: Dict) -> List[str]:
        """Get recommendations based on correlation findings"""
        feature1 = correlation['feature_1']
        feature2 = correlation['feature_2']
        direction = correlation['direction']
        
        if feature1 == 'attention_score' and feature2 == 'performance_score' and direction == 'positive':
            return [
                "Focus on improving attention to boost performance",
                "Use attention-tracking feedback during study",
                "Eliminate distractions during learning sessions"
            ]
        elif feature1 == 'fatigue_level' and direction == 'negative':
            return [
                "Monitor fatigue levels closely",
                "Take breaks before fatigue impacts performance",
                "Optimize sleep schedule for better learning"
            ]
        else:
            return [f"Monitor the relationship between {feature1} and {feature2}"]
    
    def _generate_advanced_recommendations(self, insights: List[Dict]) -> List[Dict]:
        """Generate advanced, personalized recommendations"""
        recommendations = []
        
        # Prioritize recommendations
        high_priority = [insight for insight in insights if insight.get('priority') == 'high']
        medium_priority = [insight for insight in insights if insight.get('priority') == 'medium']
        
        # Add high priority recommendations first
        for insight in high_priority:
            for rec in insight.get('recommendations', []):
                recommendations.append({
                    "recommendation": rec,
                    "category": insight['category'],
                    "priority": "high",
                    "evidence": insight['description'],
                    "implementation": self._get_implementation_steps(rec)
                })
        
        # Add medium priority recommendations
        for insight in medium_priority[:3]:  # Limit to avoid overwhelming
            for rec in insight.get('recommendations', []):
                recommendations.append({
                    "recommendation": rec,
                    "category": insight['category'],
                    "priority": "medium",
                    "evidence": insight['description'],
                    "implementation": self._get_implementation_steps(rec)
                })
        
        return recommendations
    
    def _get_implementation_steps(self, recommendation: str) -> List[str]:
        """Get specific implementation steps for recommendation"""
        implementation_map = {
            "Schedule challenging topics": [
                "Identify your most challenging subjects",
                "Block time during peak performance hours",
                "Set specific learning objectives for each session"
            ],
            "Take more frequent breaks": [
                "Set a timer for every 25 minutes",
                "Use the 5-minute break for light movement",
                "Track break effectiveness"
            ],
            "Use attention-tracking feedback": [
                "Enable real-time attention monitoring",
                "Set attention threshold alerts",
                "Review attention patterns weekly"
            ]
        }
        
        # Find matching implementation
        for key, steps in implementation_map.items():
            if key.lower() in recommendation.lower():
                return steps
        
        return ["Monitor progress and adjust as needed"]

    async def generate_predictive_insights(self, user_id: str, historical_data: List[Dict]) -> Dict:
        """Generate predictive insights for future performance"""
        try:
            if len(historical_data) < 20:
                return {"error": "Insufficient data for predictive analysis"}
            
            # Prepare time series data
            df = pd.DataFrame(historical_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Predict next session performance
            next_performance = self._predict_next_performance(df)
            
            # Predict optimal study schedule
            optimal_schedule = self._predict_optimal_schedule(df)
            
            # Predict wellness trends
            wellness_prediction = self._predict_wellness_trends(df)
            
            # Risk assessment
            risk_assessment = self._assess_learning_risks(df)
            
            return {
                "user_id": user_id,
                "prediction_date": datetime.now().isoformat(),
                "next_session_performance": next_performance,
                "optimal_schedule": optimal_schedule,
                "wellness_prediction": wellness_prediction,
                "risk_assessment": risk_assessment,
                "confidence_score": self._calculate_prediction_confidence(df)
            }
            
        except Exception as e:
            logger.error(f"Predictive insights generation failed: {e}")
            return {"error": str(e)}
    
    def _predict_next_performance(self, df: pd.DataFrame) -> Dict:
        """Predict performance for next learning session"""
        try:
            # Use recent trend to predict next performance
            recent_performance = df['performance_score'].tail(5).values
            
            if len(recent_performance) < 3:
                return {"predicted_score": 75, "confidence": 0.5}
            
            # Simple trend analysis
            trend = np.polyfit(range(len(recent_performance)), recent_performance, 1)[0]
            last_performance = recent_performance[-1]
            predicted = last_performance + trend
            
            # Bound prediction
            predicted = max(0, min(100, predicted))
            
            return {
                "predicted_score": float(predicted),
                "trend": "improving" if trend > 1 else "declining" if trend < -1 else "stable",
                "confidence": min(0.9, 0.6 + abs(trend) / 10),
                "factors": self._identify_performance_factors(df.tail(5))
            }
            
        except Exception as e:
            logger.error(f"Performance prediction failed: {e}")
            return {"predicted_score": 75, "confidence": 0.5}
    
    def _predict_optimal_schedule(self, df: pd.DataFrame) -> Dict:
        """Predict optimal study schedule"""
        try:
            # Analyze historical patterns
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            
            # Find best performing time slots
            hourly_performance = df.groupby('hour')['performance_score'].mean()
            daily_performance = df.groupby('day_of_week')['performance_score'].mean()
            
            # Generate schedule recommendations
            best_hours = hourly_performance.nlargest(3).index.tolist()
            best_days = daily_performance.nlargest(3).index.tolist()
            
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            
            return {
                "recommended_hours": [f"{hour:02d}:00" for hour in best_hours],
                "recommended_days": [day_names[day] for day in best_days if day < len(day_names)],
                "optimal_session_length": self._calculate_optimal_session_length(df),
                "recommended_break_frequency": self._calculate_optimal_break_frequency(df)
            }
            
        except Exception as e:
            logger.error(f"Schedule prediction failed: {e}")
            return {
                "recommended_hours": ["09:00", "14:00", "19:00"],
                "recommended_days": ["Monday", "Wednesday", "Friday"],
                "optimal_session_length": 45,
                "recommended_break_frequency": 25
            }
    
    def _calculate_optimal_session_length(self, df: pd.DataFrame) -> int:
        """Calculate optimal session length based on performance"""
        try:
            # Group by session duration ranges and find best performing range
            df['duration_range'] = pd.cut(df['session_duration'], bins=[0, 30, 45, 60, 90, 120], labels=['0-30', '30-45', '45-60', '60-90', '90-120'])
            duration_performance = df.groupby('duration_range')['performance_score'].mean()
            
            best_range = duration_performance.idxmax()
            
            # Map range to specific duration
            range_mapping = {
                '0-30': 25,
                '30-45': 40,
                '45-60': 50,
                '60-90': 75,
                '90-120': 105
            }
            
            return range_mapping.get(best_range, 45)
            
        except Exception as e:
            logger.error(f"Optimal session length calculation failed: {e}")
            return 45
    
    def _calculate_optimal_break_frequency(self, df: pd.DataFrame) -> int:
        """Calculate optimal break frequency"""
        try:
            # Analyze relationship between break frequency and performance
            break_performance = df.groupby('break_frequency')['performance_score'].mean()
            optimal_frequency = break_performance.idxmax()
            
            return int(optimal_frequency) if not pd.isna(optimal_frequency) else 25
            
        except Exception as e:
            logger.error(f"Break frequency calculation failed: {e}")
            return 25
    
    def _predict_wellness_trends(self, df: pd.DataFrame) -> Dict:
        """Predict wellness trends"""
        try:
            # Analyze wellness metrics over time
            wellness_cols = ['mood_score', 'stress_level', 'energy_level']
            wellness_trends = {}
            
            for col in wellness_cols:
                if col in df.columns:
                    values = df[col].tail(10).values
                    if len(values) >= 3:
                        trend = np.polyfit(range(len(values)), values, 1)[0]
                        wellness_trends[col] = {
                            "trend": "improving" if trend > 0.1 else "declining" if trend < -0.1 else "stable",
                            "slope": float(trend),
                            "current_value": float(values[-1]) if len(values) > 0 else 5.0
                        }
            
            # Overall wellness prediction
            overall_trend = np.mean([trend_data["slope"] for trend_data in wellness_trends.values()])
            
            return {
                "individual_trends": wellness_trends,
                "overall_trend": "improving" if overall_trend > 0.1 else "declining" if overall_trend < -0.1 else "stable",
                "wellness_score_prediction": self._predict_wellness_score(wellness_trends),
                "intervention_needed": any(trend["trend"] == "declining" for trend in wellness_trends.values())
            }
            
        except Exception as e:
            logger.error(f"Wellness prediction failed: {e}")
            return {"error": str(e)}
    
    def _predict_wellness_score(self, trends: Dict) -> float:
        """Predict overall wellness score"""
        try:
            if not trends:
                return 75.0
            
            # Weight different factors
            weights = {
                'mood_score': 0.4,
                'stress_level': 0.3,  # Inverse relationship
                'energy_level': 0.3
            }
            
            weighted_score = 0
            total_weight = 0
            
            for metric, trend_data in trends.items():
                if metric in weights:
                    current_value = trend_data["current_value"]
                    
                    # Invert stress level (lower stress = better wellness)
                    if metric == 'stress_level':
                        current_value = 10 - current_value
                    
                    weighted_score += current_value * weights[metric]
                    total_weight += weights[metric]
            
            if total_weight > 0:
                return (weighted_score / total_weight) * 10  # Scale to 0-100
            
            return 75.0
            
        except Exception as e:
            logger.error(f"Wellness score prediction failed: {e}")
            return 75.0
    
    def _assess_learning_risks(self, df: pd.DataFrame) -> Dict:
        """Assess potential learning risks"""
        try:
            risks = []
            
            # Check for declining performance
            recent_performance = df['performance_score'].tail(5)
            if len(recent_performance) >= 3:
                trend = np.polyfit(range(len(recent_performance)), recent_performance, 1)[0]
                if trend < -2:  # Declining by more than 2 points per session
                    risks.append({
                        "type": "performance_decline",
                        "severity": "medium",
                        "description": "Performance has been declining in recent sessions",
                        "mitigation": "Review study methods and consider additional support"
                    })
            
            # Check for high fatigue patterns
            recent_fatigue = df['fatigue_level'].tail(5).mean()
            if recent_fatigue > 70:
                risks.append({
                    "type": "chronic_fatigue",
                    "severity": "high",
                    "description": "Consistently high fatigue levels detected",
                    "mitigation": "Adjust study schedule and prioritize rest"
                })
            
            # Check for low engagement
            recent_engagement = df['engagement_score'].tail(5).mean()
            if recent_engagement < 40:
                risks.append({
                    "type": "low_engagement",
                    "severity": "medium",
                    "description": "Low engagement levels may impact learning effectiveness",
                    "mitigation": "Try more interactive content and varied learning methods"
                })
            
            return {
                "risks_identified": len(risks),
                "risk_details": risks,
                "overall_risk_level": self._calculate_overall_risk(risks),
                "immediate_actions": [risk["mitigation"] for risk in risks if risk["severity"] == "high"]
            }
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
            return {"error": str(e)}
    
    def _calculate_overall_risk(self, risks: List[Dict]) -> str:
        """Calculate overall risk level"""
        if not risks:
            return "low"
        
        high_risks = sum(1 for risk in risks if risk["severity"] == "high")
        medium_risks = sum(1 for risk in risks if risk["severity"] == "medium")
        
        if high_risks > 0:
            return "high"
        elif medium_risks > 1:
            return "medium"
        else:
            return "low"
    
    def _identify_performance_factors(self, recent_df: pd.DataFrame) -> List[Dict]:
        """Identify factors affecting recent performance"""
        factors = []
        
        try:
            # Analyze each metric's impact
            metrics = ['attention_score', 'confusion_level', 'engagement_score', 'fatigue_level']
            
            for metric in metrics:
                if metric in recent_df.columns:
                    values = recent_df[metric].values
                    avg_value = np.mean(values)
                    
                    impact = "positive" if metric != 'confusion_level' and metric != 'fatigue_level' else "negative"
                    
                    if (impact == "positive" and avg_value > 70) or (impact == "negative" and avg_value < 30):
                        factors.append({
                            "factor": metric,
                            "impact": "positive",
                            "strength": "high" if avg_value > 80 or avg_value < 20 else "medium",
                            "average_value": float(avg_value)
                        })
                    elif (impact == "positive" and avg_value < 50) or (impact == "negative" and avg_value > 70):
                        factors.append({
                            "factor": metric,
                            "impact": "negative",
                            "strength": "high" if avg_value < 30 or avg_value > 80 else "medium",
                            "average_value": float(avg_value)
                        })
            
            return factors
            
        except Exception as e:
            logger.error(f"Performance factor identification failed: {e}")
            return []
    
    def _calculate_prediction_confidence(self, df: pd.DataFrame) -> float:
        """Calculate overall confidence in predictions"""
        try:
            # Base confidence on data quality and quantity
            base_confidence = 0.5
            
            # Increase confidence with more data
            data_bonus = min(0.3, len(df) / 100)
            
            # Increase confidence with data consistency
            performance_std = df['performance_score'].std()
            consistency_bonus = max(0, 0.2 - performance_std / 100)
            
            # Increase confidence with recent data
            recent_data_ratio = len(df.tail(10)) / len(df)
            recency_bonus = recent_data_ratio * 0.1
            
            total_confidence = base_confidence + data_bonus + consistency_bonus + recency_bonus
            
            return min(0.95, total_confidence)
            
        except Exception as e:
            logger.error(f"Confidence calculation failed: {e}")
            return 0.6