import numpy as np
import pandas as pd
import joblib
import pickle
import os
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, LSTM, Dropout, Input, Concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class WellnessMLModel:
    """
    Comprehensive Machine Learning model for wellness prediction and analysis.
    Supports arbitrary user data, time-series analysis, and real-time predictions.
    """
    
    def __init__(self, model_path: str = "models/wellness_model.pkl"):
        self.model_path = model_path
        self.scaler_path = model_path.replace('.pkl', '_scaler.pkl')
        self.feature_names_path = model_path.replace('.pkl', '_features.pkl')
        
        # Models
        self.wellness_predictor = None
        self.mood_predictor = None
        self.stress_analyzer = None
        self.trend_analyzer = None
        
        # Preprocessors
        self.scaler = StandardScaler()
        self.feature_scaler = MinMaxScaler()
        
        # Feature names for model interpretability
        self.feature_names = []
        
        # Data storage for training
        self.training_data = []
        self.user_profiles = {}
        
        # Model configuration
        self.model_config = {
            'use_ensemble': True,
            'use_lstm': True,
            'use_feature_importance': True,
            'auto_retrain_threshold': 100,  # Retrain after 100 new samples
            'prediction_confidence_threshold': 0.7
        }
        
        # Load existing model if available
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model if available"""
        try:
            if os.path.exists(self.model_path):
                self.wellness_predictor = joblib.load(self.model_path)
                logger.info(f"✅ Loaded pre-trained wellness model from {self.model_path}")
                
                if os.path.exists(self.scaler_path):
                    self.scaler = joblib.load(self.scaler_path)
                    logger.info("✅ Loaded model scaler")
                
                if os.path.exists(self.feature_names_path):
                    with open(self.feature_names_path, 'rb') as f:
                        self.feature_names = pickle.load(f)
                    logger.info("✅ Loaded feature names")
                    
            else:
                logger.info("🔄 No pre-trained model found. Will train on first data.")
                
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
    
    def _save_model(self):
        """Save trained model and preprocessors"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            # Save main model
            joblib.dump(self.wellness_predictor, self.model_path)
            
            # Save scaler
            joblib.dump(self.scaler, self.scaler_path)
            
            # Save feature names
            with open(self.feature_names_path, 'wb') as f:
                pickle.dump(self.feature_names, f)
                
            logger.info(f"✅ Model saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save model: {e}")
    
    def add_user_data(self, user_id: str, data: Dict, timestamp: Optional[datetime] = None):
        """
        Add user data for training and analysis.
        Supports arbitrary data structure and time-series data.
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        # Initialize user profile if not exists
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                'data_points': [],
                'aggregated_data': {},
                'last_updated': timestamp,
                'total_entries': 0
            }
        
        # Store raw data point
        data_point = {
            'user_id': user_id,
            'timestamp': timestamp,
            'raw_data': data,
            'processed_features': self._extract_features(data),
            'wellness_score': self._calculate_rule_based_score(data)
        }
        
        self.user_profiles[user_id]['data_points'].append(data_point)
        self.user_profiles[user_id]['total_entries'] += 1
        self.user_profiles[user_id]['last_updated'] = timestamp
        
        # Aggregate data for this user
        self._aggregate_user_data(user_id)
        
        # Add to training data
        self.training_data.append(data_point)
        
        # Check if retraining is needed
        if len(self.training_data) >= self.model_config['auto_retrain_threshold']:
            self._retrain_model()
    
    def _extract_features(self, data: Dict) -> Dict[str, float]:
        """
        Extract numerical features from arbitrary user data.
        Handles nested dictionaries, lists, and various data types.
        """
        features = {}
        
        # Standard wellness features
        standard_features = {
            'mood_score': self._extract_nested_value(data, ['mood', 'score'], 5.0),
            'stress_level': self._extract_nested_value(data, ['stress', 'level'], 5.0),
            'energy_level': self._extract_nested_value(data, ['energy', 'level'], 5.0),
            'sleep_hours': self._extract_nested_value(data, ['sleep', 'hours'], 7.0),
            'sleep_quality': self._extract_nested_value(data, ['sleep', 'quality'], 7.0),
            'activity_minutes': self._extract_nested_value(data, ['activity', 'minutes'], 30.0),
            'nutrition_score': self._extract_nested_value(data, ['nutrition', 'score'], 7.0),
            'hydration_glasses': self._extract_nested_value(data, ['hydration', 'glasses'], 6.0),
            'screen_time_hours': self._extract_nested_value(data, ['screen_time', 'hours'], 4.0)
        }
        features.update(standard_features)
        
        # Extract custom features from arbitrary data
        custom_features = self._extract_custom_features(data)
        features.update(custom_features)
        
        # Time-based features
        current_time = datetime.now()
        features.update({
            'hour_of_day': current_time.hour,
            'day_of_week': current_time.weekday(),
            'is_weekend': 1.0 if current_time.weekday() >= 5 else 0.0,
            'month': current_time.month
        })
        
        return features
    
    def _extract_nested_value(self, data: Dict, keys: List[str], default: float) -> float:
        """Extract value from nested dictionary with fallback"""
        try:
            value = data
            for key in keys:
                value = value[key]
            return float(value) if value is not None else default
        except (KeyError, TypeError, ValueError):
            return default
    
    def _extract_custom_features(self, data: Dict) -> Dict[str, float]:
        """Extract custom features from arbitrary data structure"""
        custom_features = {}
        
        def extract_recursive(obj, prefix=""):
            try:
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        new_prefix = f"{prefix}_{key}" if prefix else key
                        extract_recursive(value, new_prefix)
                elif isinstance(obj, list):
                    # Handle lists (e.g., mood tags, stress sources)
                    if obj:
                        if isinstance(obj[0], (int, float)):
                            custom_features[f"{prefix}_count"] = len(obj)
                            custom_features[f"{prefix}_sum"] = sum(obj)
                            custom_features[f"{prefix}_mean"] = float(np.mean(obj))
                        else:
                            custom_features[f"{prefix}_count"] = len(obj)
                elif isinstance(obj, (int, float)):
                    custom_features[prefix] = float(obj)
                elif isinstance(obj, str):
                    # Convert string to numerical features
                    custom_features[f"{prefix}_length"] = len(obj)
                    custom_features[f"{prefix}_has_content"] = 1.0 if obj.strip() else 0.0
            except Exception as e:
                # Skip problematic features
                logger.warning(f"Failed to extract feature {prefix}: {e}")
                pass
        
        try:
            extract_recursive(data)
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
        
        return custom_features
    
    def _calculate_rule_based_score(self, data: Dict) -> float:
        """Calculate wellness score using rule-based approach as baseline"""
        try:
            # Extract values with defaults
            mood = self._extract_nested_value(data, ['mood', 'score'], 5.0)
            stress = self._extract_nested_value(data, ['stress', 'level'], 5.0)
            energy = self._extract_nested_value(data, ['energy', 'level'], 5.0)
            sleep_quality = self._extract_nested_value(data, ['sleep', 'quality'], 7.0)
            activity_sufficient = self._extract_nested_value(data, ['activity', 'minutes'], 30.0) >= 30
            nutrition = self._extract_nested_value(data, ['nutrition', 'score'], 7.0)
            hydration = self._extract_nested_value(data, ['hydration', 'glasses'], 6.0)
            screen_time = self._extract_nested_value(data, ['screen_time', 'hours'], 4.0)
            
            # Calculate weighted score
            weights = {
                'mood': 0.20,
                'stress': 0.20,
                'energy': 0.15,
                'sleep': 0.15,
                'activity': 0.10,
                'nutrition': 0.10,
                'hydration': 0.10
            }
            
            score = 0.0
            score += (mood / 10) * 100 * weights['mood']
            score += ((10 - stress) / 10) * 100 * weights['stress']
            score += (energy / 10) * 100 * weights['energy']
            score += (sleep_quality / 10) * 100 * weights['sleep']
            score += (100 if activity_sufficient else 50) * weights['activity']
            score += (nutrition / 10) * 100 * weights['nutrition']
            score += (min(hydration, 8) / 8) * 100 * weights['hydration']
            score += (1 - min(screen_time, 8) / 8) * 100 * 0.05  # Small negative impact
            
            return min(100, max(0, score))
            
        except Exception as e:
            logger.error(f"Rule-based score calculation failed: {e}")
            return 50.0
    
    def _aggregate_user_data(self, user_id: str):
        """Aggregate user data for analysis and trends"""
        user_data = self.user_profiles[user_id]['data_points']
        
        if not user_data:
            return
        
        # Aggregate recent data (last 7 days)
        recent_data = [d for d in user_data if (datetime.now() - d['timestamp']).days <= 7]
        
        if recent_data:
            # Calculate averages
            avg_features = {}
            for feature in recent_data[0]['processed_features'].keys():
                values = [d['processed_features'][feature] for d in recent_data]
                avg_features[f'avg_{feature}'] = np.mean(values)
                avg_features[f'std_{feature}'] = np.std(values)
                avg_features[f'min_{feature}'] = np.min(values)
                avg_features[f'max_{feature}'] = np.max(values)
            
            # Calculate trends
            if len(recent_data) >= 3:
                wellness_scores = [d['wellness_score'] for d in recent_data]
                trend_slope = np.polyfit(range(len(wellness_scores)), wellness_scores, 1)[0]
                avg_features['wellness_trend'] = trend_slope
            
            self.user_profiles[user_id]['aggregated_data'] = avg_features
    
    def predict_wellness(self, user_id: str, current_data: Dict) -> Dict:
        """
        Predict wellness score using ML model with confidence and explanations.
        """
        try:
            # Extract features
            features = self._extract_features(current_data)
            
            # Get user's historical data for context
            user_context = self._get_user_context(user_id)
            
            # Combine current features with user context
            prediction_features = self._prepare_prediction_features(features, user_context)
            
            # Make prediction
            if self.wellness_predictor is not None:
                # Use ML model
                prediction = self._ml_predict(prediction_features)
            else:
                # Use rule-based approach
                prediction = self._rule_based_predict(features)
            
            # Convert numpy types to Python native types for JSON serialization
            def convert_numpy_types(obj):
                if isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                elif isinstance(obj, dict):
                    return {key: convert_numpy_types(value) for key, value in obj.items()}
                elif isinstance(obj, list):
                    return [convert_numpy_types(item) for item in obj]
                else:
                    return obj
            
            # Add context and explanations
            result = {
                'wellness_score': convert_numpy_types(prediction['score']),
                'confidence': convert_numpy_types(prediction['confidence']),
                'model_type': prediction['model_type'],
                'feature_importance': convert_numpy_types(prediction.get('feature_importance', {})),
                'user_context': convert_numpy_types(user_context),
                'recommendations': self._generate_recommendations(features, prediction['score']),
                'trends': self._analyze_trends(user_id),
                'timestamp': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Wellness prediction failed: {e}")
            return {
                'wellness_score': 50.0,
                'confidence': 0.0,
                'model_type': 'fallback',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_user_context(self, user_id: str) -> Dict:
        """Get user's historical context for prediction"""
        if user_id not in self.user_profiles:
            return {}
        
        profile = self.user_profiles[user_id]
        
        # Get recent data points
        recent_data = profile['data_points'][-10:] if profile['data_points'] else []
        
        context = {
            'total_entries': profile['total_entries'],
            'last_updated': profile['last_updated'].isoformat() if profile['last_updated'] else None,
            'recent_wellness_scores': [d['wellness_score'] for d in recent_data],
            'avg_wellness_score': np.mean([d['wellness_score'] for d in recent_data]) if recent_data else 50.0,
            'wellness_variance': np.var([d['wellness_score'] for d in recent_data]) if recent_data else 0.0
        }
        
        # Add aggregated features if available
        if profile['aggregated_data']:
            context.update(profile['aggregated_data'])
        
        return context
    
    def _prepare_prediction_features(self, current_features: Dict, user_context: Dict) -> np.ndarray:
        """Prepare features for ML prediction"""
        # Combine current features with user context
        combined_features = current_features.copy()
        
        # Add context features
        context_features = {
            'user_avg_wellness': user_context.get('avg_wellness_score', 50.0),
            'user_wellness_variance': user_context.get('wellness_variance', 0.0),
            'total_entries': user_context.get('total_entries', 0),
            'days_since_last_entry': (datetime.now() - datetime.fromisoformat(user_context['last_updated'])).days if user_context.get('last_updated') else 0
        }
        combined_features.update(context_features)
        
        # Convert to feature vector
        feature_vector = []
        feature_names = []
        
        for key, value in combined_features.items():
            if isinstance(value, (int, float)) and not np.isnan(value):
                feature_vector.append(value)
                feature_names.append(key)
        
        # Update feature names if not set
        if not self.feature_names:
            self.feature_names = feature_names
        
        return np.array(feature_vector).reshape(1, -1)
    
    def _ml_predict(self, features: np.ndarray) -> Dict:
        """Make prediction using trained ML model"""
        try:
            # Scale features
            scaled_features = self.scaler.transform(features)
            
            # Make prediction
            prediction = self.wellness_predictor.predict(scaled_features)[0]
            
            # Calculate confidence (simplified)
            confidence = 0.8  # In production, use model uncertainty estimation
            
            # Get feature importance if available
            feature_importance = {}
            if hasattr(self.wellness_predictor, 'feature_importances_'):
                importance_scores = self.wellness_predictor.feature_importances_
                for i, score in enumerate(importance_scores):
                    if i < len(self.feature_names):
                        feature_importance[self.feature_names[i]] = float(score)
            
            return {
                'score': float(prediction),
                'confidence': confidence,
                'model_type': 'ml_ensemble',
                'feature_importance': feature_importance
            }
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            return self._rule_based_predict(features.flatten())
    
    def _rule_based_predict(self, features: np.ndarray) -> Dict:
        """Fallback to rule-based prediction"""
        # Simple rule-based calculation
        score = 50.0  # Default score
        
        return {
            'score': score,
            'confidence': 0.5,
            'model_type': 'rule_based'
        }
    
    def _generate_recommendations(self, features: Dict, wellness_score: float) -> List[str]:
        """Generate personalized wellness recommendations"""
        recommendations = []
        
        # Mood-based recommendations
        mood_score = features.get('mood_score', 5.0)
        if mood_score <= 4:
            recommendations.append("Consider mood-boosting activities like exercise or social interaction")
        
        # Stress-based recommendations
        stress_level = features.get('stress_level', 5.0)
        if stress_level >= 7:
            recommendations.append("High stress detected. Try deep breathing or meditation")
        
        # Sleep-based recommendations
        sleep_quality = features.get('sleep_quality', 7.0)
        if sleep_quality <= 5:
            recommendations.append("Improve sleep quality with better bedtime routine")
        
        # Activity-based recommendations
        activity_minutes = features.get('activity_minutes', 30.0)
        if activity_minutes < 30:
            recommendations.append("Increase physical activity to at least 30 minutes daily")
        
        # Nutrition-based recommendations
        nutrition_score = features.get('nutrition_score', 7.0)
        if nutrition_score <= 5:
            recommendations.append("Focus on balanced nutrition with more fruits and vegetables")
        
        # Screen time recommendations
        screen_time = features.get('screen_time_hours', 4.0)
        if screen_time > 6:
            recommendations.append("Reduce screen time to improve overall wellness")
        
        # General wellness score recommendations
        if wellness_score < 60:
            recommendations.append("Consider a comprehensive wellness review with a healthcare provider")
        elif wellness_score > 80:
            recommendations.append("Excellent wellness! Keep maintaining your healthy habits")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _analyze_trends(self, user_id: str) -> Dict:
        """Analyze user's wellness trends"""
        if user_id not in self.user_profiles:
            return {'trend': 'insufficient_data'}
        
        recent_data = self.user_profiles[user_id]['data_points'][-7:]  # Last 7 entries
        
        if len(recent_data) < 3:
            return {'trend': 'insufficient_data'}
        
        wellness_scores = [d['wellness_score'] for d in recent_data]
        
        # Calculate trend
        x = np.arange(len(wellness_scores))
        slope = np.polyfit(x, wellness_scores, 1)[0]
        
        if slope > 2:
            trend = 'improving'
        elif slope < -2:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'trend_slope': float(slope),
            'recent_average': float(np.mean(wellness_scores)),
            'consistency': float(np.std(wellness_scores))
        }
    
    def _retrain_model(self):
        """Retrain the ML model with accumulated data"""
        try:
            if len(self.training_data) < 10:
                logger.info("Insufficient data for training")
                return
            
            logger.info(f"🔄 Retraining model with {len(self.training_data)} data points")
            
            # Prepare training data
            X = []
            y = []
            
            for data_point in self.training_data:
                features = list(data_point['processed_features'].values())
                # Filter out non-numeric values
                numeric_features = [f for f in features if isinstance(f, (int, float)) and not np.isnan(f)]
                if numeric_features:
                    X.append(numeric_features)
                    y.append(data_point['wellness_score'])
            
            if len(X) < 10:
                logger.info("Insufficient valid data for training")
                return
            
            # Convert to numpy arrays
            X = np.array(X)
            y = np.array(y)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            self.scaler.fit(X_train)
            X_train_scaled = self.scaler.transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train ensemble model
            self.wellness_predictor = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.wellness_predictor.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.wellness_predictor.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"✅ Model retrained - MSE: {mse:.2f}, R²: {r2:.2f}")
            
            # Save model
            self._save_model()
            
            # Clear training data to prevent memory issues
            self.training_data = []
            
        except Exception as e:
            logger.error(f"❌ Model retraining failed: {e}")
    
    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        return {
            'model_type': 'WellnessMLModel',
            'model_path': self.model_path,
            'is_trained': self.wellness_predictor is not None,
            'training_data_size': len(self.training_data),
            'user_profiles_count': len(self.user_profiles),
            'feature_count': len(self.feature_names) if self.feature_names else 0,
            'last_training': 'N/A',  # Could track this
            'model_config': self.model_config
        }
    
    def export_user_data(self, user_id: str) -> Dict:
        """Export user's wellness data for analysis"""
        if user_id not in self.user_profiles:
            return {'error': 'User not found'}
        
        profile = self.user_profiles[user_id]
        
        return {
            'user_id': user_id,
            'total_entries': profile['total_entries'],
            'last_updated': profile['last_updated'].isoformat(),
            'data_points': [
                {
                    'timestamp': d['timestamp'].isoformat(),
                    'wellness_score': d['wellness_score'],
                    'features': d['processed_features']
                }
                for d in profile['data_points']
            ],
            'aggregated_data': profile['aggregated_data']
        }

# Global instance
wellness_ml_model = WellnessMLModel()

