import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, Conv2D, MaxPooling2D, Flatten, Dropout, LSTM, Input, Attention
from tensorflow.keras.optimizers import Adam
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from typing import Dict, List, Tuple, Optional
import os

logger = logging.getLogger(__name__)

class EmotionDetectionModel:
    """Advanced emotion detection using CNN with attention mechanism"""
    
    def __init__(self):
        self.model = None
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.input_shape = (48, 48, 1)
        self.confidence_threshold = 0.7
        
    def build_model(self):
        """Build advanced CNN model with attention mechanism"""
        try:
            # Input layer
            inputs = Input(shape=self.input_shape)
            
            # Convolutional layers with batch normalization
            x = Conv2D(64, (3, 3), activation='relu', padding='same')(inputs)
            x = tf.keras.layers.BatchNormalization()(x)
            x = MaxPooling2D(2, 2)(x)
            x = Dropout(0.25)(x)
            
            x = Conv2D(128, (3, 3), activation='relu', padding='same')(x)
            x = tf.keras.layers.BatchNormalization()(x)
            x = MaxPooling2D(2, 2)(x)
            x = Dropout(0.25)(x)
            
            x = Conv2D(256, (3, 3), activation='relu', padding='same')(x)
            x = tf.keras.layers.BatchNormalization()(x)
            x = MaxPooling2D(2, 2)(x)
            x = Dropout(0.25)(x)
            
            # Attention mechanism
            x = tf.keras.layers.Reshape((-1, 256))(x)
            attention_weights = Dense(256, activation='tanh')(x)
            attention_weights = Dense(1, activation='softmax')(attention_weights)
            x = tf.keras.layers.Multiply()([x, attention_weights])
            x = tf.keras.layers.GlobalAveragePooling1D()(x)
            
            # Dense layers
            x = Dense(512, activation='relu')(x)
            x = Dropout(0.5)(x)
            x = Dense(256, activation='relu')(x)
            x = Dropout(0.3)(x)
            
            # Output layer
            outputs = Dense(len(self.emotion_labels), activation='softmax')(x)
            
            self.model = Model(inputs=inputs, outputs=outputs)
            
            # Compile with advanced optimizer
            self.model.compile(
                optimizer=Adam(learning_rate=0.001, beta_1=0.9, beta_2=0.999),
                loss='categorical_crossentropy',
                metrics=['accuracy', 'top_k_categorical_accuracy']
            )
            
            logger.info("✅ Advanced emotion detection model built")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to build emotion model: {e}")
            return False
    
    def predict_emotion(self, face_image: np.ndarray) -> Dict:
        """Predict emotion with confidence scores"""
        try:
            if self.model is None:
                self.build_model()
            
            # Preprocess image
            processed_image = self._preprocess_image(face_image)
            
            # Get prediction
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Convert to emotion probabilities
            emotion_probs = {}
            for i, emotion in enumerate(self.emotion_labels):
                emotion_probs[emotion] = float(predictions[0][i])
            
            # Get primary emotion and confidence
            primary_emotion = max(emotion_probs, key=emotion_probs.get)
            confidence = emotion_probs[primary_emotion]
            
            # Calculate emotion intensity
            intensity = self._calculate_emotion_intensity(emotion_probs)
            
            return {
                "primary_emotion": primary_emotion,
                "confidence": confidence,
                "emotion_probabilities": emotion_probs,
                "intensity": intensity,
                "is_confident": confidence > self.confidence_threshold,
                "secondary_emotions": self._get_secondary_emotions(emotion_probs)
            }
            
        except Exception as e:
            logger.error(f"Emotion prediction failed: {e}")
            return {
                "primary_emotion": "neutral",
                "confidence": 0.0,
                "emotion_probabilities": {emotion: 0.0 for emotion in self.emotion_labels},
                "intensity": 0.5,
                "is_confident": False,
                "error": str(e)
            }
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for model input"""
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            image = tf.image.rgb_to_grayscale(image)
        
        # Resize to model input size
        image = tf.image.resize(image, [48, 48])
        
        # Normalize
        image = tf.cast(image, tf.float32) / 255.0
        
        # Add batch dimension
        image = tf.expand_dims(image, 0)
        
        return image
    
    def _calculate_emotion_intensity(self, emotion_probs: Dict) -> float:
        """Calculate overall emotional intensity"""
        # Exclude neutral emotion for intensity calculation
        non_neutral_probs = {k: v for k, v in emotion_probs.items() if k != 'neutral'}
        
        if not non_neutral_probs:
            return 0.0
        
        # Calculate intensity as sum of non-neutral emotions
        intensity = sum(non_neutral_probs.values())
        return min(1.0, intensity)
    
    def _get_secondary_emotions(self, emotion_probs: Dict) -> List[Dict]:
        """Get secondary emotions above threshold"""
        sorted_emotions = sorted(emotion_probs.items(), key=lambda x: x[1], reverse=True)
        
        secondary = []
        for emotion, prob in sorted_emotions[1:]:  # Skip primary emotion
            if prob > 0.2:  # Secondary emotion threshold
                secondary.append({
                    "emotion": emotion,
                    "probability": prob
                })
        
        return secondary[:2]  # Return top 2 secondary emotions


class AttentionTrackingModel:
    """Advanced attention tracking using multiple indicators"""
    
    def __init__(self):
        self.gaze_model = None
        self.blink_model = None
        self.head_pose_model = None
        self.attention_fusion_model = None
        
    def build_models(self):
        """Build all attention tracking models"""
        try:
            # Gaze estimation model
            self.gaze_model = self._build_gaze_model()
            
            # Blink detection model
            self.blink_model = self._build_blink_model()
            
            # Head pose estimation model
            self.head_pose_model = self._build_head_pose_model()
            
            # Attention fusion model
            self.attention_fusion_model = self._build_attention_fusion_model()
            
            logger.info("✅ All attention tracking models built")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to build attention models: {e}")
            return False
    
    def _build_gaze_model(self):
        """Build gaze estimation CNN"""
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(64, 64, 1)),
            MaxPooling2D(2, 2),
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Conv2D(128, (3, 3), activation='relu'),
            Flatten(),
            Dense(256, activation='relu'),
            Dropout(0.5),
            Dense(2, activation='linear')  # x, y gaze coordinates
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def _build_blink_model(self):
        """Build blink detection model"""
        model = Sequential([
            Dense(64, activation='relu', input_shape=(20,)),  # Eye landmark features
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dropout(0.3),
            Dense(1, activation='sigmoid')  # Blink probability
        ])
        
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model
    
    def _build_head_pose_model(self):
        """Build head pose estimation model"""
        model = Sequential([
            Dense(128, activation='relu', input_shape=(68*2,)),  # Facial landmarks
            Dropout(0.4),
            Dense(64, activation='relu'),
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dense(3, activation='linear')  # pitch, yaw, roll
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def _build_attention_fusion_model(self):
        """Build model to fuse all attention indicators"""
        model = Sequential([
            Dense(64, activation='relu', input_shape=(10,)),  # Combined features
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')  # Attention score
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def predict_attention(self, face_features: Dict) -> Dict:
        """Predict attention level from multiple indicators"""
        try:
            if not all([self.gaze_model, self.blink_model, self.head_pose_model, self.attention_fusion_model]):
                self.build_models()
            
            # Extract features
            gaze_coords = self._predict_gaze(face_features.get('eye_region'))
            blink_prob = self._predict_blink(face_features.get('eye_landmarks'))
            head_pose = self._predict_head_pose(face_features.get('face_landmarks'))
            
            # Combine features for attention prediction
            combined_features = np.array([[
                gaze_coords[0], gaze_coords[1],  # Gaze x, y
                blink_prob,  # Blink probability
                head_pose[0], head_pose[1], head_pose[2],  # Pitch, yaw, roll
                face_features.get('face_size', 0.5),  # Face size (distance indicator)
                face_features.get('lighting_quality', 0.8),  # Lighting quality
                face_features.get('image_quality', 0.9),  # Image quality
                face_features.get('movement_stability', 0.7)  # Movement stability
            ]])
            
            # Predict attention score
            attention_score = float(self.attention_fusion_model.predict(combined_features, verbose=0)[0][0]) * 100
            
            return {
                "attention_score": attention_score,
                "gaze_coordinates": {"x": gaze_coords[0], "y": gaze_coords[1]},
                "blink_probability": blink_prob,
                "head_pose": {"pitch": head_pose[0], "yaw": head_pose[1], "roll": head_pose[2]},
                "focus_level": self._categorize_attention(attention_score),
                "confidence": self._calculate_attention_confidence(combined_features[0])
            }
            
        except Exception as e:
            logger.error(f"Attention prediction failed: {e}")
            return {
                "attention_score": 50.0,
                "gaze_coordinates": {"x": 0, "y": 0},
                "blink_probability": 0.2,
                "head_pose": {"pitch": 0, "yaw": 0, "roll": 0},
                "focus_level": "medium",
                "confidence": 0.5,
                "error": str(e)
            }
    
    def _predict_gaze(self, eye_region):
        """Predict gaze coordinates"""
        if eye_region is None or self.gaze_model is None:
            return [0.0, 0.0]
        
        try:
            # Preprocess eye region
            processed = tf.image.resize(eye_region, [64, 64])
            processed = tf.expand_dims(processed, 0)
            
            gaze_coords = self.gaze_model.predict(processed, verbose=0)[0]
            return gaze_coords.tolist()
        except:
            return [0.0, 0.0]
    
    def _predict_blink(self, eye_landmarks):
        """Predict blink probability"""
        if eye_landmarks is None or self.blink_model is None:
            return 0.2
        
        try:
            # Extract eye aspect ratio and other features
            features = np.array([eye_landmarks]).reshape(1, -1)
            blink_prob = self.blink_model.predict(features, verbose=0)[0][0]
            return float(blink_prob)
        except:
            return 0.2
    
    def _predict_head_pose(self, face_landmarks):
        """Predict head pose angles"""
        if face_landmarks is None or self.head_pose_model is None:
            return [0.0, 0.0, 0.0]
        
        try:
            features = np.array([face_landmarks]).reshape(1, -1)
            pose_angles = self.head_pose_model.predict(features, verbose=0)[0]
            return pose_angles.tolist()
        except:
            return [0.0, 0.0, 0.0]
    
    def _categorize_attention(self, score: float) -> str:
        """Categorize attention level"""
        if score >= 80:
            return "high"
        elif score >= 60:
            return "medium"
        elif score >= 40:
            return "low"
        else:
            return "very_low"
    
    def _calculate_attention_confidence(self, features: np.ndarray) -> float:
        """Calculate confidence in attention prediction"""
        # Simple confidence based on feature quality
        quality_indicators = features[-4:]  # Last 4 features are quality indicators
        return float(np.mean(quality_indicators))


class AdaptiveLearningModel:
    """Machine learning model for adaptive learning recommendations"""
    
    def __init__(self):
        self.difficulty_model = None
        self.content_model = None
        self.performance_predictor = None
        self.scaler = StandardScaler()
        
    def build_models(self):
        """Build adaptive learning models"""
        try:
            # Difficulty adaptation model
            self.difficulty_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            
            # Content recommendation model
            self.content_model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            # Performance prediction model
            self.performance_predictor = self._build_performance_predictor()
            
            logger.info("✅ Adaptive learning models built")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to build adaptive learning models: {e}")
            return False
    
    def _build_performance_predictor(self):
        """Build LSTM model for performance prediction"""
        model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(10, 8)),  # 10 time steps, 8 features
            Dropout(0.3),
            LSTM(32, return_sequences=False),
            Dropout(0.3),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')  # Performance score 0-1
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def recommend_difficulty(self, user_features: Dict, cognitive_state: Dict) -> Dict:
        """Recommend optimal difficulty level"""
        try:
            # Prepare features
            features = self._prepare_difficulty_features(user_features, cognitive_state)
            
            if self.difficulty_model is None:
                self.build_models()
                # For demo, use rule-based approach
                return self._rule_based_difficulty(cognitive_state)
            
            # Predict difficulty (0: easy, 1: medium, 2: hard)
            difficulty_pred = self.difficulty_model.predict_proba([features])[0]
            
            difficulty_labels = ['easy', 'medium', 'hard']
            recommended_difficulty = difficulty_labels[np.argmax(difficulty_pred)]
            confidence = float(np.max(difficulty_pred))
            
            return {
                "recommended_difficulty": recommended_difficulty,
                "confidence": confidence,
                "difficulty_probabilities": {
                    label: float(prob) for label, prob in zip(difficulty_labels, difficulty_pred)
                },
                "reasoning": self._generate_difficulty_reasoning(cognitive_state, recommended_difficulty)
            }
            
        except Exception as e:
            logger.error(f"Difficulty recommendation failed: {e}")
            return self._rule_based_difficulty(cognitive_state)
    
    def _rule_based_difficulty(self, cognitive_state: Dict) -> Dict:
        """Rule-based difficulty recommendation as fallback"""
        attention = cognitive_state.get('attention', 50)
        confusion = cognitive_state.get('confusion', 0)
        fatigue = cognitive_state.get('fatigue', 0)
        
        if confusion > 60 or fatigue > 70:
            difficulty = 'easy'
            confidence = 0.8
        elif attention > 80 and confusion < 20:
            difficulty = 'hard'
            confidence = 0.9
        else:
            difficulty = 'medium'
            confidence = 0.7
        
        return {
            "recommended_difficulty": difficulty,
            "confidence": confidence,
            "difficulty_probabilities": {
                'easy': 0.8 if difficulty == 'easy' else 0.1,
                'medium': 0.8 if difficulty == 'medium' else 0.1,
                'hard': 0.8 if difficulty == 'hard' else 0.1
            },
            "reasoning": f"Based on attention ({attention}%), confusion ({confusion}%), and fatigue ({fatigue}%)"
        }
    
    def predict_performance(self, user_history: List[Dict], current_state: Dict) -> Dict:
        """Predict learning performance"""
        try:
            if len(user_history) < 5:
                return {"error": "Insufficient history for prediction"}
            
            # Prepare sequence data
            sequence_data = self._prepare_sequence_data(user_history, current_state)
            
            if self.performance_predictor is None:
                self.build_models()
                # Use simple prediction
                return self._simple_performance_prediction(current_state)
            
            # Predict performance
            performance_pred = self.performance_predictor.predict(sequence_data, verbose=0)[0][0]
            
            return {
                "predicted_performance": float(performance_pred) * 100,
                "confidence": 0.8,
                "factors": self._analyze_performance_factors(current_state),
                "recommendations": self._generate_performance_recommendations(performance_pred, current_state)
            }
            
        except Exception as e:
            logger.error(f"Performance prediction failed: {e}")
            return self._simple_performance_prediction(current_state)
    
    def _simple_performance_prediction(self, current_state: Dict) -> Dict:
        """Simple rule-based performance prediction"""
        attention = current_state.get('attention', 50)
        confusion = current_state.get('confusion', 0)
        fatigue = current_state.get('fatigue', 0)
        engagement = current_state.get('engagement', 50)
        
        # Calculate predicted performance
        performance = (attention * 0.3 + engagement * 0.3 + (100 - confusion) * 0.2 + (100 - fatigue) * 0.2)
        
        return {
            "predicted_performance": performance,
            "confidence": 0.7,
            "factors": {
                "attention_impact": attention * 0.3,
                "engagement_impact": engagement * 0.3,
                "confusion_impact": -(confusion * 0.2),
                "fatigue_impact": -(fatigue * 0.2)
            },
            "recommendations": self._generate_performance_recommendations(performance / 100, current_state)
        }
    
    def _prepare_difficulty_features(self, user_features: Dict, cognitive_state: Dict) -> List[float]:
        """Prepare features for difficulty recommendation"""
        return [
            cognitive_state.get('attention', 50) / 100,
            cognitive_state.get('confusion', 0) / 100,
            cognitive_state.get('engagement', 50) / 100,
            cognitive_state.get('fatigue', 0) / 100,
            user_features.get('experience_level', 0.5),
            user_features.get('recent_performance', 0.7),
            user_features.get('learning_speed', 0.6),
            user_features.get('preference_difficulty', 0.5)
        ]
    
    def _prepare_sequence_data(self, history: List[Dict], current_state: Dict) -> np.ndarray:
        """Prepare sequence data for LSTM"""
        # Take last 10 sessions
        recent_history = history[-10:]
        
        sequence = []
        for session in recent_history:
            features = [
                session.get('attention', 50) / 100,
                session.get('confusion', 0) / 100,
                session.get('engagement', 50) / 100,
                session.get('fatigue', 0) / 100,
                session.get('performance', 70) / 100,
                session.get('time_spent', 30) / 60,  # Normalize to hours
                session.get('difficulty', 1) / 3,  # Normalize difficulty
                session.get('completion', 80) / 100
            ]
            sequence.append(features)
        
        # Pad sequence if needed
        while len(sequence) < 10:
            sequence.insert(0, [0.5] * 8)  # Neutral values
        
        return np.array([sequence])
    
    def _generate_difficulty_reasoning(self, cognitive_state: Dict, difficulty: str) -> str:
        """Generate human-readable reasoning for difficulty recommendation"""
        attention = cognitive_state.get('attention', 50)
        confusion = cognitive_state.get('confusion', 0)
        fatigue = cognitive_state.get('fatigue', 0)
        
        if difficulty == 'easy':
            if confusion > 60:
                return "High confusion detected - simplifying content to build understanding"
            elif fatigue > 70:
                return "High fatigue detected - reducing cognitive load"
            else:
                return "Optimizing for better comprehension"
        elif difficulty == 'hard':
            if attention > 80:
                return "High attention and low confusion - ready for challenging content"
            else:
                return "Good performance indicators - increasing challenge level"
        else:
            return "Maintaining balanced difficulty based on current cognitive state"
    
    def _analyze_performance_factors(self, current_state: Dict) -> Dict:
        """Analyze factors affecting performance"""
        return {
            "attention_factor": current_state.get('attention', 50) / 100,
            "cognitive_load": current_state.get('confusion', 0) / 100,
            "engagement_level": current_state.get('engagement', 50) / 100,
            "fatigue_impact": current_state.get('fatigue', 0) / 100,
            "optimal_conditions": all([
                current_state.get('attention', 0) > 70,
                current_state.get('confusion', 100) < 30,
                current_state.get('fatigue', 100) < 40
            ])
        }
    
    def _generate_performance_recommendations(self, predicted_performance: float, current_state: Dict) -> List[str]:
        """Generate recommendations based on predicted performance"""
        recommendations = []
        
        if predicted_performance < 0.6:
            recommendations.append("Consider taking a break to improve focus")
            recommendations.append("Switch to easier content temporarily")
            
        if current_state.get('confusion', 0) > 50:
            recommendations.append("Request simplified explanations")
            recommendations.append("Review prerequisite concepts")
            
        if current_state.get('fatigue', 0) > 60:
            recommendations.append("Take a 10-15 minute break")
            recommendations.append("Try energizing activities")
            
        if current_state.get('attention', 0) < 50:
            recommendations.append("Increase interactivity")
            recommendations.append("Change study environment")
        
        return recommendations


class WellnessAnalyticsModel:
    """Advanced wellness analytics and prediction model"""
    
    def __init__(self):
        self.mood_predictor = None
        self.stress_analyzer = None
        self.wellness_optimizer = None
        
    def build_models(self):
        """Build wellness analytics models"""
        try:
            # Mood prediction model
            self.mood_predictor = self._build_mood_predictor()
            
            # Stress analysis model
            self.stress_analyzer = self._build_stress_analyzer()
            
            # Wellness optimization model
            self.wellness_optimizer = self._build_wellness_optimizer()
            
            logger.info("✅ Wellness analytics models built")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to build wellness models: {e}")
            return False
    
    def _build_mood_predictor(self):
        """Build mood prediction LSTM model"""
        model = Sequential([
            LSTM(32, return_sequences=True, input_shape=(7, 5)),  # 7 days, 5 features
            Dropout(0.3),
            LSTM(16, return_sequences=False),
            Dropout(0.2),
            Dense(8, activation='relu'),
            Dense(1, activation='sigmoid')  # Mood score 0-1
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def _build_stress_analyzer(self):
        """Build stress level analyzer"""
        model = Sequential([
            Dense(64, activation='relu', input_shape=(15,)),  # Multiple stress indicators
            Dropout(0.4),
            Dense(32, activation='relu'),
            Dropout(0.3),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')  # Stress level 0-1
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def _build_wellness_optimizer(self):
        """Build wellness optimization recommendation model"""
        model = Sequential([
            Dense(128, activation='relu', input_shape=(20,)),  # Comprehensive wellness features
            Dropout(0.4),
            Dense(64, activation='relu'),
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dense(10, activation='softmax')  # 10 wellness activity types
        ])
        
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        return model
    
    def predict_mood_trend(self, mood_history: List[Dict]) -> Dict:
        """Predict mood trends"""
        try:
            if len(mood_history) < 7:
                return {"error": "Insufficient mood history"}
            
            # Prepare sequence data
            sequence_data = self._prepare_mood_sequence(mood_history)
            
            if self.mood_predictor is None:
                self.build_models()
                return self._simple_mood_prediction(mood_history)
            
            # Predict next mood
            predicted_mood = self.mood_predictor.predict(sequence_data, verbose=0)[0][0]
            
            return {
                "predicted_mood": float(predicted_mood) * 10,  # Scale to 1-10
                "trend": self._analyze_mood_trend(mood_history),
                "confidence": 0.75,
                "recommendations": self._generate_mood_recommendations(predicted_mood, mood_history)
            }
            
        except Exception as e:
            logger.error(f"Mood prediction failed: {e}")
            return self._simple_mood_prediction(mood_history)
    
    def _simple_mood_prediction(self, mood_history: List[Dict]) -> Dict:
        """Simple rule-based mood prediction"""
        recent_moods = [m.get('score', 5) for m in mood_history[-7:]]
        avg_mood = np.mean(recent_moods)
        trend_slope = np.polyfit(range(len(recent_moods)), recent_moods, 1)[0]
        
        predicted_mood = avg_mood + trend_slope
        predicted_mood = max(1, min(10, predicted_mood))
        
        return {
            "predicted_mood": predicted_mood,
            "trend": "improving" if trend_slope > 0.1 else "declining" if trend_slope < -0.1 else "stable",
            "confidence": 0.6,
            "recommendations": self._generate_mood_recommendations(predicted_mood / 10, mood_history)
        }
    
    def _prepare_mood_sequence(self, mood_history: List[Dict]) -> np.ndarray:
        """Prepare mood sequence for LSTM"""
        sequence = []
        
        for mood_entry in mood_history[-7:]:  # Last 7 days
            features = [
                mood_entry.get('score', 5) / 10,
                mood_entry.get('stress', 5) / 10,
                mood_entry.get('energy', 5) / 10,
                mood_entry.get('sleep_quality', 7) / 10,
                mood_entry.get('activity_level', 5) / 10
            ]
            sequence.append(features)
        
        # Pad if needed
        while len(sequence) < 7:
            sequence.insert(0, [0.5] * 5)
        
        return np.array([sequence])
    
    def _analyze_mood_trend(self, mood_history: List[Dict]) -> str:
        """Analyze mood trend direction"""
        if len(mood_history) < 3:
            return "insufficient_data"
        
        recent_scores = [m.get('score', 5) for m in mood_history[-7:]]
        
        # Calculate trend using linear regression
        x = np.arange(len(recent_scores))
        slope = np.polyfit(x, recent_scores, 1)[0]
        
        if slope > 0.2:
            return "improving"
        elif slope < -0.2:
            return "declining"
        else:
            return "stable"
    
    def _generate_mood_recommendations(self, predicted_mood: float, history: List[Dict]) -> List[str]:
        """Generate mood improvement recommendations"""
        recommendations = []
        
        if predicted_mood < 0.4:
            recommendations.extend([
                "Consider scheduling pleasant activities",
                "Practice gratitude exercises",
                "Connect with supportive friends or family",
                "Engage in physical exercise"
            ])
        elif predicted_mood < 0.6:
            recommendations.extend([
                "Maintain current wellness practices",
                "Add one new positive activity to your routine",
                "Monitor stress levels closely"
            ])
        else:
            recommendations.extend([
                "Great mood trend! Keep up current practices",
                "Consider helping others to maintain positive feelings",
                "Document what's working well for future reference"
            ])
        
        return recommendations


# Model factory for creating and managing all ML models
class MLModelFactory:
    """Factory for creating and managing all ML models"""
    
    def __init__(self):
        self.models = {}
        self.model_status = {}
        
    def get_model(self, model_type: str):
        """Get or create model instance"""
        if model_type not in self.models:
            self.models[model_type] = self._create_model(model_type)
            
        return self.models[model_type]
    
    def _create_model(self, model_type: str):
        """Create specific model instance"""
        model_classes = {
            'emotion': EmotionDetectionModel,
            'attention': AttentionTrackingModel,
            'adaptive_learning': AdaptiveLearningModel,
            'wellness': WellnessAnalyticsModel
        }
        
        if model_type in model_classes:
            model = model_classes[model_type]()
            self.model_status[model_type] = {
                'created_at': np.datetime64('now'),
                'status': 'initialized',
                'version': '1.0.0'
            }
            return model
        
        raise ValueError(f"Unknown model type: {model_type}")
    
    def get_model_status(self) -> Dict:
        """Get status of all models"""
        return {
            'models': self.model_status,
            'total_models': len(self.models),
            'memory_usage': self._estimate_memory_usage()
        }
    
    def _estimate_memory_usage(self) -> str:
        """Estimate total memory usage of models"""
        # Simple estimation - in production would use actual memory profiling
        base_memory = len(self.models) * 50  # MB per model
        return f"{base_memory}MB (estimated)"

# Global model factory instance
ml_factory = MLModelFactory()