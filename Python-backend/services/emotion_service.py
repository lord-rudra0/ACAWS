import cv2
import numpy as np
import base64
import logging
from typing import Dict, List, Optional
import asyncio
from datetime import datetime
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

logger = logging.getLogger(__name__)

class EmotionAnalysisService:
    """Service for real-time emotion detection from camera feed"""
    
    def __init__(self):
        self.model = None
        self.face_cascade = None
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.frame_buffer = []
        self.buffer_size = 10
        self.confidence_threshold = float(os.getenv('MODEL_CONFIDENCE_THRESHOLD', 0.7))
        
        # Initialize models
        self._load_models()
    
    def _load_models(self):
        """Load emotion detection and face detection models"""
        try:
            # Load face cascade for face detection
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # Check if custom emotion model exists, otherwise use a simple model
            model_path = os.getenv('EMOTION_MODEL_PATH', 'models/emotion_detection_model.h5')
            if os.path.exists(model_path):
                self.model = load_model(model_path)
                logger.info("✅ Custom emotion detection model loaded")
            else:
                # Create a simple CNN model for demonstration
                self.model = self._create_simple_emotion_model()
                logger.info("✅ Simple emotion detection model created")
                
        except Exception as e:
            logger.error(f"❌ Failed to load emotion models: {e}")
            # Create fallback model
            self.model = self._create_simple_emotion_model()
    
    def _create_simple_emotion_model(self):
        """Create a simple CNN model for emotion detection"""
        model = tf.keras.Sequential([
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(7, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """Decode base64 frame data to OpenCV image"""
        try:
            # Remove data URL prefix if present
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            
            # Decode base64
            frame_bytes = base64.b64decode(frame_data)
            
            # Convert to numpy array
            nparr = np.frombuffer(frame_bytes, np.uint8)
            
            # Decode image
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return frame
            
        except Exception as e:
            logger.error(f"Failed to decode frame: {e}")
            return None
    
    def _detect_faces(self, frame: np.ndarray) -> List[tuple]:
        """Detect faces in the frame"""
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces
            
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return []
    
    def _preprocess_face(self, face_roi: np.ndarray) -> np.ndarray:
        """Preprocess face ROI for emotion detection"""
        try:
            # Convert to grayscale
            gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            
            # Contrast Limited Adaptive Histogram Equalization (CLAHE)
            try:
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                gray_face = clahe.apply(gray_face)
            except Exception:
                pass
            
            # Gamma correction for illumination normalization
            try:
                gamma = float(os.getenv('EMOTION_PREPROC_GAMMA', '1.0'))
                if gamma and abs(gamma - 1.0) > 1e-3:
                    inv_gamma = 1.0 / max(0.1, gamma)
                    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype('uint8')
                    gray_face = cv2.LUT(gray_face, table)
            except Exception:
                pass
            
            # Resize to model input size
            resized_face = cv2.resize(gray_face, (48, 48))
            
            # Normalize pixel values
            normalized_face = resized_face / 255.0
            
            # Reshape for model input
            processed_face = normalized_face.reshape(1, 48, 48, 1)
            
            return processed_face
            
        except Exception as e:
            logger.error(f"Face preprocessing failed: {e}")
            return None
    
    def _predict_emotion(self, processed_face: np.ndarray) -> Dict[str, float]:
        """Predict emotion from processed face"""
        try:
            # Get prediction
            predictions = self.model.predict(processed_face, verbose=0)
            
            # Convert to emotion probabilities
            emotion_probs = {}
            for i, emotion in enumerate(self.emotion_labels):
                emotion_probs[emotion] = float(predictions[0][i])
            
            return emotion_probs
            
        except Exception as e:
            logger.error(f"Emotion prediction failed: {e}")
            return {emotion: 0.0 for emotion in self.emotion_labels}
    
    async def analyze_frame(self, frame_data: str) -> Dict:
        """Analyze a single frame for emotions"""
        try:
            # Decode frame
            frame = self._decode_frame(frame_data)
            if frame is None:
                return {"error": "Failed to decode frame"}
            
            # Detect faces
            faces = self._detect_faces(frame)
            
            if len(faces) == 0:
                return {
                    "faces_detected": 0,
                    "primary_emotion": "neutral",
                    "emotion_confidence": 0.0,
                    "emotion_probabilities": {emotion: 0.0 for emotion in self.emotion_labels},
                    "timestamp": datetime.now().isoformat()
                }
            
            # Process largest face
            (x, y, w, h) = max(faces, key=lambda face: face[2] * face[3])
            face_roi = frame[y:y+h, x:x+w]
            
            # Preprocess face
            processed_face = self._preprocess_face(face_roi)
            if processed_face is None:
                return {"error": "Failed to preprocess face"}
            
            # Predict emotion
            emotion_probs = self._predict_emotion(processed_face)
            
            # Temporal smoothing of probabilities (simple moving average over recent frames)
            try:
                smoothing_window = int(os.getenv('EMOTION_SMOOTHING_WINDOW', '5'))
                # Store the raw probs in frame buffer
                self.frame_buffer.append({
                    "probs": emotion_probs,
                    "timestamp": datetime.now()
                })
                if len(self.frame_buffer) > max(self.buffer_size, smoothing_window):
                    self.frame_buffer.pop(0)
                # Compute smoothed probs over last N entries
                recent = [f["probs"] for f in self.frame_buffer[-smoothing_window:]] if smoothing_window > 1 else [emotion_probs]
                smoothed = {k: float(np.mean([r.get(k, 0.0) for r in recent])) for k in self.emotion_labels}
            except Exception:
                smoothed = emotion_probs
            
            # Get primary emotions
            primary_emotion = max(emotion_probs, key=emotion_probs.get)
            confidence = float(emotion_probs[primary_emotion])
            smoothed_primary = max(smoothed, key=smoothed.get)
            smoothed_confidence = float(smoothed[smoothed_primary])
            
            # Confidence gating (fallback to neutral if below threshold)
            try:
                conf_thr = float(os.getenv('MODEL_CONFIDENCE_THRESHOLD', '0.7'))
            except Exception:
                conf_thr = 0.7
            gated_primary = primary_emotion if confidence >= conf_thr else 'neutral'
            gated_smoothed_primary = smoothed_primary if smoothed_confidence >= conf_thr else 'neutral'
            
            # Keep buffer size limited
            if len(self.frame_buffer) > self.buffer_size:
                self.frame_buffer.pop(0)
            
            return {
                "faces_detected": len(faces),
                "primary_emotion": gated_primary,
                "emotion_confidence": confidence,
                "emotion_probabilities": emotion_probs,
                "smoothed_primary_emotion": gated_smoothed_primary,
                "smoothed_emotion_confidence": smoothed_confidence,
                "smoothed_emotion_probabilities": smoothed,
                "face_coordinates": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Frame analysis failed: {e}")
            return {"error": str(e)}
    
    def get_emotion_trends(self, time_window_minutes: int = 5) -> Dict:
        """Get emotion trends over time window"""
        try:
            if not self.frame_buffer:
                return {"error": "No emotion data available"}
            
            current_time = datetime.now()
            recent_emotions = []
            
            for frame_data in self.frame_buffer:
                time_diff = (current_time - frame_data["timestamp"]).total_seconds() / 60
                if time_diff <= time_window_minutes:
                    recent_emotions.append(frame_data)
            
            if not recent_emotions:
                return {"error": "No recent emotion data"}
            
            # Calculate trends
            emotion_counts = {}
            total_confidence = 0
            
            for emotion_data in recent_emotions:
                emotion = emotion_data["emotion"]
                confidence = emotion_data["confidence"]
                
                if emotion not in emotion_counts:
                    emotion_counts[emotion] = {"count": 0, "total_confidence": 0}
                
                emotion_counts[emotion]["count"] += 1
                emotion_counts[emotion]["total_confidence"] += confidence
                total_confidence += confidence
            
            # Calculate percentages and average confidence
            emotion_trends = {}
            for emotion, data in emotion_counts.items():
                emotion_trends[emotion] = {
                    "percentage": (data["count"] / len(recent_emotions)) * 100,
                    "average_confidence": data["total_confidence"] / data["count"]
                }
            
            dominant_emotion = max(emotion_counts, key=lambda e: emotion_counts[e]["count"])
            
            return {
                "time_window_minutes": time_window_minutes,
                "total_frames": len(recent_emotions),
                "dominant_emotion": dominant_emotion,
                "emotion_trends": emotion_trends,
                "overall_confidence": total_confidence / len(recent_emotions) if recent_emotions else 0,
                "timestamp": current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Emotion trends calculation failed: {e}")
            return {"error": str(e)}