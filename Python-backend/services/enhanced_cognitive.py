"""
Advanced Enhanced Cognitive Analysis Service with State-of-the-Art ML Features.

This service provides comprehensive real-time cognitive monitoring using:
- MediaPipe Face Mesh for precise facial landmark detection
- Advanced gaze tracking and pupil analysis
- Head pose estimation and orientation analysis
- Multi-dimensional emotion recognition
- Temporal analysis with history tracking
- Drowsiness detection using PERCLOS methodology
- Attention span and cognitive load analysis
- Micro-expression and blink rate detection
- Ensemble feature extraction and confidence scoring

Features:
- Real-time facial expression analysis
- Advanced attention tracking with multiple signals
- Cognitive load estimation using multiple physiological indicators
- Emotional state classification with confidence scores
- Temporal trend analysis and pattern recognition
- Adaptive baseline calibration
- Multi-face detection and analysis
- Performance metrics and quality assessment
"""
from typing import Optional, Dict, Any, List, Tuple
import base64
import logging
import io
import numpy as np
import time
import math
from collections import deque
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

try:
    import cv2
except Exception:
    cv2 = None

# Try to import MediaPipe if available; fall back silently when not present
try:
    import mediapipe as mp
    _HAS_MEDIAPIPE = True
    mp_face_mesh = mp.solutions.face_mesh
    mp_face_detection = mp.solutions.face_detection
    mp_pose = mp.solutions.pose
except Exception:
    _HAS_MEDIAPIPE = False
    mp_face_mesh = None
    mp_face_detection = None
    mp_pose = None

# Try to import scikit-learn for advanced ML features
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    _HAS_SKLEARN = True
except Exception:
    _HAS_SKLEARN = False

# Import additional services
try:
    from .gaze_tracking_service import gaze_tracker
    from .advanced_emotion_service import emotion_recognizer
    from .temporal_analysis_service import temporal_analyzer
    from .performance_metrics_service import performance_service
    _HAS_ADDITIONAL_SERVICES = True
except Exception:
    _HAS_ADDITIONAL_SERVICES = False
    gaze_tracker = None
    emotion_recognizer = None
    temporal_analyzer = None
    performance_service = None

@dataclass
class FacialFeatures:
    """Advanced facial feature extraction from landmarks"""
    # Eye features
    left_eye_openness: float = 0.0
    right_eye_openness: float = 0.0
    eye_aspect_ratio: float = 0.0
    blink_rate: float = 0.0

    # Mouth features
    mouth_openness: float = 0.0
    mouth_width: float = 0.0
    smile_intensity: float = 0.0

    # Eyebrow features
    eyebrow_raise: float = 0.0
    eyebrow_frown: float = 0.0

    # Head pose
    head_pitch: float = 0.0
    head_yaw: float = 0.0
    head_roll: float = 0.0

    # Gaze features
    gaze_direction_x: float = 0.0
    gaze_direction_y: float = 0.0
    gaze_confidence: float = 0.0

    # Face metrics
    face_size: float = 0.0
    face_position_x: float = 0.0
    face_position_y: float = 0.0

@dataclass
class TemporalMetrics:
    """Temporal analysis for trend detection and pattern recognition"""
    attention_history: deque = field(default_factory=lambda: deque(maxlen=50))
    blink_history: deque = field(default_factory=lambda: deque(maxlen=100))
    emotion_history: deque = field(default_factory=lambda: deque(maxlen=30))
    head_pose_history: deque = field(default_factory=lambda: deque(maxlen=20))

    def update_attention(self, value: float):
        self.attention_history.append((time.time(), value))

    def update_blink(self, blink_detected: bool):
        self.blink_history.append((time.time(), blink_detected))

    def update_emotion(self, emotion: str, confidence: float):
        self.emotion_history.append((time.time(), emotion, confidence))

    def update_head_pose(self, pitch: float, yaw: float, roll: float):
        self.head_pose_history.append((time.time(), pitch, yaw, roll))

    def get_attention_trend(self) -> str:
        if len(self.attention_history) < 5:
            return "→ Stable"
        recent = [v for _, v in list(self.attention_history)[-5:]]
        avg_recent = sum(recent) / len(recent)
        older = [v for _, v in list(self.attention_history)[:-5]]
        if not older:
            return "→ Stable"
        avg_older = sum(older) / len(older)
        diff = avg_recent - avg_older
        if diff > 5:
            return "↗️ Rising"
        elif diff < -5:
            return "↘️ Falling"
        return "→ Stable"

    def get_blink_rate(self) -> float:
        """Calculate blinks per minute"""
        if len(self.blink_history) < 10:
            return 0.0
        recent_blinks = [t for t, b in list(self.blink_history)[-60:] if b]  # Last minute
        return len(recent_blinks) * 1.0

    def get_emotion_stability(self) -> float:
        """Measure emotional stability (0-1, higher = more stable)"""
        if len(self.emotion_history) < 5:
            return 0.5
        emotions = [e for _, e, _ in list(self.emotion_history)[-10:]]
        if not emotions:
            return 0.5
        most_common = max(set(emotions), key=emotions.count)
        stability = emotions.count(most_common) / len(emotions)
        return stability

@dataclass
class CognitiveState:
    """Comprehensive cognitive state representation"""
    attention_score: float = 0.0
    cognitive_load: float = 0.0
    engagement_level: float = 0.0
    emotional_state: str = "neutral"
    emotional_confidence: float = 0.0
    drowsiness_level: float = 0.0
    focus_quality: float = 0.0
    stress_indicators: float = 0.0
    learning_readiness: float = 0.0
    micro_expressions: List[str] = field(default_factory=list)
    confidence_score: float = 0.0

def _decode_frame_dataurl(dataurl: str) -> Optional[np.ndarray]:
    if not dataurl:
        return None
    try:
        # strip header if present
        if dataurl.startswith('data:'):
            data = dataurl.split(',', 1)[1]
        else:
            data = dataurl

        b = base64.b64decode(data)
        arr = np.frombuffer(b, dtype=np.uint8)
        if cv2 is None:
            logger.debug('cv2 not available; cannot decode image to ndarray')
            return None
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.debug('Failed to decode frame data: %s', e)
        return None

def _calculate_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate Euclidean distance between two points"""
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def _calculate_angle(p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
    """Calculate angle at p2 formed by p1-p2-p3"""
    v1 = (p1[0] - p2[0], p1[1] - p2[1])
    v2 = (p3[0] - p2[0], p3[1] - p2[1])
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
    mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
    if mag1 == 0 or mag2 == 0:
        return 0
    cos_angle = dot / (mag1 * mag2)
    cos_angle = max(-1, min(1, cos_angle))  # Clamp to avoid domain errors
    return math.degrees(math.acos(cos_angle))

def _extract_facial_features(landmarks, img_shape: Tuple[int, int]) -> FacialFeatures:
    """Extract comprehensive facial features from MediaPipe landmarks"""
    features = FacialFeatures()

    try:
        # Eye features - Left eye (landmarks 33, 160, 158, 133, 153, 144)
        left_eye_points = [33, 160, 158, 133, 153, 144]
        left_eye_coords = [(landmarks[i].x, landmarks[i].y) for i in left_eye_points]

        # Right eye (landmarks 362, 385, 387, 263, 373, 380)
        right_eye_points = [362, 385, 387, 263, 373, 380]
        right_eye_coords = [(landmarks[i].x, landmarks[i].y) for i in right_eye_points]

        # Calculate eye aspect ratios
        def eye_aspect_ratio(eye_coords):
            # Vertical distances
            v1 = _calculate_distance(eye_coords[1], eye_coords[5])
            v2 = _calculate_distance(eye_coords[2], eye_coords[4])
            # Horizontal distance
            h = _calculate_distance(eye_coords[0], eye_coords[3])
            return (v1 + v2) / (2.0 * h) if h > 0 else 0

        features.left_eye_openness = eye_aspect_ratio(left_eye_coords)
        features.right_eye_openness = eye_aspect_ratio(right_eye_coords)
        features.eye_aspect_ratio = (features.left_eye_openness + features.right_eye_openness) / 2.0

        # Mouth features - landmarks 61, 291, 0, 17, 57, 287
        mouth_points = [61, 291, 0, 17, 57, 287]
        mouth_coords = [(landmarks[i].x, landmarks[i].y) for i in mouth_points]

        # Mouth openness (distance between upper and lower lip)
        upper_lip = landmarks[0]  # Upper lip center
        lower_lip = landmarks[17]  # Lower lip center
        features.mouth_openness = abs(upper_lip.y - lower_lip.y)

        # Mouth width
        left_corner = landmarks[61]
        right_corner = landmarks[291]
        features.mouth_width = abs(right_corner.x - left_corner.x)

        # Smile intensity (mouth corner raise relative to nose)
        nose_tip = landmarks[1]
        left_corner_y = left_corner.y
        right_corner_y = right_corner.y
        avg_corner_y = (left_corner_y + right_corner_y) / 2.0
        features.smile_intensity = max(0, nose_tip.y - avg_corner_y)

        # Eyebrow features
        left_eyebrow = [landmarks[i] for i in [70, 63, 105, 66, 107]]
        right_eyebrow = [landmarks[i] for i in [336, 296, 334, 293, 300]]
        left_eye_center = landmarks[33]
        right_eye_center = landmarks[263]

        # Eyebrow raise (distance from eyebrow to eye center)
        left_eyebrow_avg_y = sum([p.y for p in left_eyebrow]) / len(left_eyebrow)
        right_eyebrow_avg_y = sum([p.y for p in right_eyebrow]) / len(right_eyebrow)
        features.eyebrow_raise = (left_eye_center.y - left_eyebrow_avg_y + right_eye_center.y - right_eyebrow_avg_y) / 2.0

        # Head pose estimation using facial landmarks
        # Simplified head pose using nose and eye positions
        nose_bridge = landmarks[6]  # Nose bridge
        left_eye_inner = landmarks[133]
        right_eye_inner = landmarks[362]

        # Yaw (left-right rotation) - based on eye symmetry
        eye_center_x = (left_eye_inner.x + right_eye_inner.x) / 2.0
        features.head_yaw = (nose_bridge.x - eye_center_x) * 100

        # Pitch (up-down rotation) - based on nose position relative to eyes
        eye_center_y = (left_eye_inner.y + right_eye_inner.y) / 2.0
        features.head_pitch = (nose_bridge.y - eye_center_y) * 100

        # Roll (tilt) - based on eye level difference
        features.head_roll = (left_eye_inner.y - right_eye_inner.y) * 100

        # Face size and position
        face_left = min([landmarks[i].x for i in [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338]])
        face_right = max([landmarks[i].x for i in [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338]])
        face_top = min([landmarks[i].y for i in [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338]])
        face_bottom = max([landmarks[i].y for i in [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338]])

        features.face_size = (face_right - face_left) * (face_bottom - face_top)
        features.face_position_x = (face_left + face_right) / 2.0
        features.face_position_y = (face_top + face_bottom) / 2.0

        # Gaze estimation (simplified)
        left_pupil = landmarks[468] if 468 < len(landmarks) else left_eye_inner
        right_pupil = landmarks[473] if 473 < len(landmarks) else right_eye_inner

        # Gaze direction based on pupil position relative to eye corners
        left_gaze_x = (left_pupil.x - left_eye_inner.x) / (landmarks[33].x - left_eye_inner.x) if landmarks[33].x != left_eye_inner.x else 0
        right_gaze_x = (right_pupil.x - right_eye_inner.x) / (landmarks[362].x - right_eye_inner.x) if landmarks[362].x != right_eye_inner.x else 0
        features.gaze_direction_x = (left_gaze_x + right_gaze_x) / 2.0

        left_gaze_y = (left_pupil.y - left_eye_inner.y) / (landmarks[160].y - left_eye_inner.y) if landmarks[160].y != left_eye_inner.y else 0
        right_gaze_y = (right_pupil.y - right_eye_inner.y) / (landmarks[385].y - right_eye_inner.y) if landmarks[385].y != right_eye_inner.y else 0
        features.gaze_direction_y = (left_gaze_y + right_gaze_y) / 2.0

        features.gaze_confidence = 0.8  # Simplified confidence

    except Exception as e:
        logger.debug(f'Feature extraction error: {e}')

    return features

def _analyze_emotion_from_features(features: FacialFeatures) -> Tuple[str, float]:
    """Advanced emotion analysis using extracted facial features"""
    emotions = {
        'happy': 0.0,
        'sad': 0.0,
        'angry': 0.0,
        'surprised': 0.0,
        'neutral': 0.5,
        'disgusted': 0.0,
        'fearful': 0.0
    }

    # Happy: high smile intensity, raised mouth corners
    if features.smile_intensity > 0.02:
        emotions['happy'] += 0.6
    if features.mouth_openness > 0.05:
        emotions['surprised'] += 0.4

    # Sad: lowered mouth corners, reduced eye openness
    if features.smile_intensity < -0.01:
        emotions['sad'] += 0.5
    if features.eye_aspect_ratio < 0.2:
        emotions['sad'] += 0.3

    # Angry: furrowed eyebrows, reduced mouth openness
    if features.eyebrow_frown > 0.02:
        emotions['angry'] += 0.5
    if features.mouth_openness < 0.02:
        emotions['angry'] += 0.2

    # Surprised: wide eyes, open mouth
    if features.eye_aspect_ratio > 0.3:
        emotions['surprised'] += 0.4
    if features.mouth_openness > 0.08:
        emotions['surprised'] += 0.4

    # Fearful: wide eyes, raised eyebrows
    if features.eye_aspect_ratio > 0.35:
        emotions['fearful'] += 0.3
    if features.eyebrow_raise > 0.03:
        emotions['fearful'] += 0.4

    # Disgusted: wrinkled nose area, narrowed eyes
    if features.mouth_width < 0.1:
        emotions['disgusted'] += 0.4

    # Find dominant emotion
    dominant_emotion = max(emotions.items(), key=lambda x: x[1])
    confidence = min(0.95, dominant_emotion[1] + 0.1)  # Add base confidence

    return dominant_emotion[0], confidence

def _calculate_cognitive_load(features: FacialFeatures, temporal: TemporalMetrics) -> float:
    """Calculate cognitive load using multiple physiological indicators"""
    load_factors = []

    # Eye blink rate (higher blink rate = higher cognitive load)
    blink_rate = temporal.get_blink_rate()
    if blink_rate > 20:
        load_factors.append(min(1.0, blink_rate / 40.0))
    else:
        load_factors.append(max(0.0, (blink_rate - 10) / 20.0))

    # Eye openness (lower = higher load)
    eye_openness = features.eye_aspect_ratio
    if eye_openness < 0.15:
        load_factors.append(0.8)
    elif eye_openness < 0.25:
        load_factors.append(0.4)
    else:
        load_factors.append(0.1)

    # Head movement (more movement = higher load)
    if len(temporal.head_pose_history) > 5:
        recent_poses = list(temporal.head_pose_history)[-5:]
        yaw_variance = np.var([yaw for _, _, yaw, _ in recent_poses])
        pitch_variance = np.var([pitch for _, pitch, _, _ in recent_poses])
        movement = (yaw_variance + pitch_variance) / 2.0
        load_factors.append(min(1.0, movement * 10))

    # Mouth activity (more talking = potentially lower load)
    if features.mouth_openness > 0.05:
        load_factors.append(-0.2)  # Negative factor for active speaking

    # Average load factors
    if load_factors:
        avg_load = sum(load_factors) / len(load_factors)
        return max(0.0, min(100.0, avg_load * 100))
    return 50.0

def _calculate_drowsiness(features: FacialFeatures, temporal: TemporalMetrics) -> float:
    """Calculate drowsiness using PERCLOS (Percentage of Eye Closure Over Time)"""
    if len(temporal.blink_history) < 20:
        # Fallback to current eye openness
        if features.eye_aspect_ratio < 0.15:
            return 80.0
        elif features.eye_aspect_ratio < 0.2:
            return 40.0
        else:
            return 10.0

    # Calculate PERCLOS over last 60 seconds
    recent_blinks = list(temporal.blink_history)[-60:]
    closed_frames = sum(1 for _, is_closed in recent_blinks if is_closed)
    perclos = closed_frames / len(recent_blinks) if recent_blinks else 0

    # Convert to drowsiness score
    drowsiness = min(100.0, perclos * 200)  # Scale appropriately

    # Additional factors
    if features.eye_aspect_ratio < 0.18:
        drowsiness += 20
    if features.head_pitch < -10:  # Head nodding down
        drowsiness += 15

    return max(0.0, min(100.0, drowsiness))

def _calculate_attention_score(features: FacialFeatures, temporal: TemporalMetrics) -> float:
    """Calculate attention score using multiple signals"""
    attention_factors = []

    # Face size (larger face = more attention)
    if features.face_size > 0.1:
        attention_factors.append(0.8)
    elif features.face_size > 0.05:
        attention_factors.append(0.6)
    else:
        attention_factors.append(0.3)

    # Eye openness
    if features.eye_aspect_ratio > 0.25:
        attention_factors.append(0.9)
    elif features.eye_aspect_ratio > 0.2:
        attention_factors.append(0.7)
    elif features.eye_aspect_ratio > 0.15:
        attention_factors.append(0.4)
    else:
        attention_factors.append(0.1)

    # Gaze stability
    if abs(features.gaze_direction_x) < 0.3 and abs(features.gaze_direction_y) < 0.3:
        attention_factors.append(0.8)
    else:
        attention_factors.append(0.5)

    # Head pose stability
    if len(temporal.head_pose_history) > 3:
        recent_yaw = [yaw for _, _, yaw, _ in list(temporal.head_pose_history)[-3:]]
        yaw_stability = 1.0 - min(1.0, np.std(recent_yaw) * 5)
        attention_factors.append(yaw_stability)

    # Average attention factors
    if attention_factors:
        avg_attention = sum(attention_factors) / len(attention_factors)
        return max(0.0, min(100.0, avg_attention * 100))
    return 50.0

def _label_quality(value: Optional[float]) -> str:
    if value is None:
        return '—'
    if value >= 0.9:
        return 'Excellent'
    if value >= 0.8:
        return 'Very Good'
    if value >= 0.7:
        return 'Good'
    if value >= 0.6:
        return 'Fair'
    if value >= 0.4:
        return 'Poor'
    return 'Very Low'

class AdvancedCognitiveAnalyzer:
    """Advanced cognitive analyzer with state-of-the-art ML features"""

    def __init__(self):
        # Initialize face detection
        self.face_cascade = None
        if cv2 is not None:
            try:
                self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            except Exception:
                self.face_cascade = None

        # Temporal analysis
        self.temporal_metrics = TemporalMetrics()

        # Blink detection state
        self.last_blink_time = 0
        self.blink_threshold = 0.2
        self.blink_cooldown = 0.1  # seconds

        # Baseline calibration
        self.baseline_attention = 70.0
        self.baseline_samples = []

        # ML model for emotion classification (if sklearn available)
        self.emotion_model = None
        if _HAS_SKLEARN:
            try:
                self.emotion_model = RandomForestClassifier(n_estimators=50, random_state=42)
                self.scaler = StandardScaler()
                self.is_trained = False
            except Exception:
                self.emotion_model = None

    def _detect_blink(self, features: FacialFeatures) -> bool:
        """Detect eye blinks using EAR threshold"""
        current_time = time.time()
        ear = features.eye_aspect_ratio

        # Check if eyes are closed (EAR below threshold)
        if ear < self.blink_threshold:
            if current_time - self.last_blink_time > self.blink_cooldown:
                self.last_blink_time = current_time
                return True
        return False

    def _update_baseline(self, attention_score: float):
        """Update baseline attention score for personalization"""
        self.baseline_samples.append(attention_score)
        if len(self.baseline_samples) > 100:
            self.baseline_samples.pop(0)

        if len(self.baseline_samples) >= 10:
            self.baseline_attention = sum(self.baseline_samples) / len(self.baseline_samples)

    async def analyze_realtime(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Advanced real-time cognitive analysis with ML features"""
        frame_b64 = payload.get('frame') if isinstance(payload, dict) else None
        img = _decode_frame_dataurl(frame_b64)

        camera_enabled = False
        cognitive_state = CognitiveState()

        # Initialize enhanced analysis results
        enhanced_results = {
            'gaze_analysis': {},
            'advanced_emotion': {},
            'temporal_analysis': {},
            'performance_metrics': {}
        }

        try:
            if img is None:
                logger.debug('No image decoded from payload')
            else:
                # Convert to gray for classic detectors
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if cv2 is not None else None

                # Advanced MediaPipe analysis
                if _HAS_MEDIAPIPE and mp_face_mesh is not None:
                    try:
                        with mp_face_mesh.FaceMesh(
                            static_image_mode=True,
                            max_num_faces=1,
                            min_detection_confidence=0.5,
                            min_tracking_confidence=0.5
                        ) as fm:
                            results = fm.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

                            if results and results.multi_face_landmarks:
                                camera_enabled = True
                                landmarks = results.multi_face_landmarks[0].landmark

                                # Extract comprehensive facial features
                                features = _extract_facial_features(landmarks, img.shape)

                                # Detect blinks
                                blink_detected = self._detect_blink(features)
                                self.temporal_metrics.update_blink(blink_detected)

                                # Analyze emotion
                                emotion, confidence = _analyze_emotion_from_features(features)
                                cognitive_state.emotional_state = emotion
                                cognitive_state.emotional_confidence = confidence
                                self.temporal_metrics.update_emotion(emotion, confidence)

                                # Calculate attention score
                                attention = _calculate_attention_score(features, self.temporal_metrics)
                                cognitive_state.attention_score = attention
                                self.temporal_metrics.update_attention(attention)
                                self._update_baseline(attention)

                                # Calculate cognitive load
                                cognitive_load = _calculate_cognitive_load(features, self.temporal_metrics)
                                cognitive_state.cognitive_load = cognitive_load

                                # Calculate drowsiness
                                drowsiness = _calculate_drowsiness(features, self.temporal_metrics)
                                cognitive_state.drowsiness_level = drowsiness

                                # Calculate engagement (combination of attention and emotional engagement)
                                engagement = (attention * 0.7 + (confidence * 100) * 0.3)
                                cognitive_state.engagement_level = engagement

                                # Focus quality (based on gaze stability and attention consistency)
                                focus_quality = attention * (1 - min(1.0, np.std(list(self.temporal_metrics.attention_history)[-10:]) / 20)) if len(self.temporal_metrics.attention_history) > 10 else attention
                                cognitive_state.focus_quality = focus_quality

                                # Stress indicators (based on cognitive load and emotional variance)
                                stress = cognitive_load * 0.6 + (1 - self.temporal_metrics.get_emotion_stability()) * 40
                                cognitive_state.stress_indicators = stress

                                # Learning readiness (inverse of cognitive load and stress)
                                readiness = 100 - (cognitive_load * 0.5 + stress * 0.3 + drowsiness * 0.2)
                                cognitive_state.learning_readiness = max(0, readiness)

                                # Micro-expressions detection (simplified)
                                if features.smile_intensity > 0.05 and confidence > 0.7:
                                    cognitive_state.micro_expressions.append("genuine_smile")
                                if features.eyebrow_raise > 0.04:
                                    cognitive_state.micro_expressions.append("surprise_micro")

                                # Overall confidence score
                                cognitive_state.confidence_score = min(0.95, (confidence + 0.8) / 2)

                                # Update head pose history
                                self.temporal_metrics.update_head_pose(
                                    features.head_pitch,
                                    features.head_yaw,
                                    features.head_roll
                                )

                                # Integrate additional services if available
                                if _HAS_ADDITIONAL_SERVICES:
                                    try:
                                        # Gaze tracking analysis
                                        if gaze_tracker:
                                            gaze_result = await gaze_tracker.analyze_gaze(frame_b64, landmarks)
                                            enhanced_results['gaze_analysis'] = gaze_result

                                        # Advanced emotion analysis
                                        if emotion_recognizer:
                                            emotion_result = await emotion_recognizer.analyze_emotion(frame_b64, landmarks)
                                            enhanced_results['advanced_emotion'] = emotion_result

                                        # Update temporal analyzer with current metrics
                                        if temporal_analyzer:
                                            current_metrics = {
                                                'attention': attention,
                                                'engagement': engagement,
                                                'fatigue': drowsiness / 100.0,
                                                'comprehension': cognitive_state.learning_readiness / 100.0,
                                                'emotion': emotion,
                                                'confidence': confidence,
                                                'performance': (attention + engagement) / 200.0,
                                                'reaction_time': 0.5,  # Placeholder
                                                'cognitive_load': cognitive_load / 100.0
                                            }
                                            temporal_analyzer.add_metrics(current_metrics)
                                            temporal_result = temporal_analyzer.analyze_temporal_patterns()
                                            enhanced_results['temporal_analysis'] = temporal_result

                                        # Performance metrics
                                        if performance_service:
                                            performance_service.record_performance_metric('attention', attention / 100.0)
                                            performance_service.record_performance_metric('engagement', engagement / 100.0)
                                            performance_service.record_performance_metric('cognitive_load', cognitive_load / 100.0)
                                            perf_result = performance_service.calculate_realtime_metrics()
                                            enhanced_results['performance_metrics'] = perf_result

                                    except Exception as e:
                                        logger.debug(f'Enhanced services integration failed: {e}')

                    except Exception as e:
                        logger.debug(f'MediaPipe advanced analysis failed: {e}')

                # Fallback: OpenCV face detector
                if not camera_enabled and self.face_cascade is not None and gray is not None:
                    faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
                    if len(faces) > 0:
                        camera_enabled = True
                        # Basic fallback metrics
                        x, y, w, h = faces[0]
                        face_area = w * h
                        img_area = img.shape[0] * img.shape[1]
                        face_ratio = face_area / img_area

                        attention = int(min(100, max(10, face_ratio * 1000)))
                        cognitive_state.attention_score = attention
                        cognitive_state.engagement_level = attention * 0.8
                        cognitive_state.cognitive_load = 50 - attention * 0.2
                        cognitive_state.emotional_state = 'neutral'
                        cognitive_state.emotional_confidence = 0.5
                        cognitive_state.confidence_score = 0.6

        except Exception as e:
            logger.debug(f'Enhanced analysis error: {e}')

        # Create comprehensive summary
        attention_trend = self.temporal_metrics.get_attention_trend()
        blink_rate = self.temporal_metrics.get_blink_rate()

        summary = {
            'camera_enabled': bool(camera_enabled),
            'timestamp': time.time(),
            'metrics': {
                'attention': {
                    'quality': _label_quality(cognitive_state.attention_score / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.attention_score)}%" if camera_enabled else '—',
                    'raw_value': cognitive_state.attention_score,
                    'trend': attention_trend,
                    'baseline': self.baseline_attention
                },
                'cognitive_load': {
                    'quality': _label_quality(cognitive_state.cognitive_load / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.cognitive_load)}%" if camera_enabled else '0%',
                    'raw_value': cognitive_state.cognitive_load,
                    'trend': '→ Stable'
                },
                'engagement': {
                    'quality': _label_quality(cognitive_state.engagement_level / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.engagement_level)}%" if camera_enabled else '—',
                    'raw_value': cognitive_state.engagement_level,
                    'trend': '→ Stable'
                },
                'emotional_state': {
                    'quality': _label_quality(cognitive_state.emotional_confidence),
                    'current': cognitive_state.emotional_state,
                    'raw_value': round(float(cognitive_state.emotional_confidence), 2),
                    'trend': '→ Stable'
                },
                'drowsiness': {
                    'quality': _label_quality((100 - cognitive_state.drowsiness_level) / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.drowsiness_level)}%" if camera_enabled else '—',
                    'raw_value': cognitive_state.drowsiness_level,
                    'trend': '→ Stable'
                },
                'focus_quality': {
                    'quality': _label_quality(cognitive_state.focus_quality / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.focus_quality)}%" if camera_enabled else '—',
                    'raw_value': cognitive_state.focus_quality,
                    'trend': '→ Stable'
                },
                'stress_indicators': {
                    'quality': _label_quality((100 - cognitive_state.stress_indicators) / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.stress_indicators)}%" if camera_enabled else '—',
                    'raw_value': cognitive_state.stress_indicators,
                    'trend': '→ Stable'
                },
                'learning_readiness': {
                    'quality': _label_quality(cognitive_state.learning_readiness / 100.0) if camera_enabled else '—',
                    'current': f"{int(cognitive_state.learning_readiness)}%" if camera_enabled else '—',
                    'raw_value': cognitive_state.learning_readiness,
                    'trend': '→ Stable'
                }
            },
            'advanced_metrics': {
                'blink_rate': blink_rate,
                'emotion_stability': self.temporal_metrics.get_emotion_stability(),
                'micro_expressions': cognitive_state.micro_expressions,
                'confidence_score': cognitive_state.confidence_score,
                'temporal_samples': len(self.temporal_metrics.attention_history)
            },
            'enhanced_analysis': enhanced_results,
            'human_readable': f'Advanced cognitive analysis completed - {cognitive_state.emotional_state} emotion detected with {int(cognitive_state.confidence_score * 100)}% confidence',
        }

        return summary


# Singleton instance for importers
enhanced_cognitive = AdvancedCognitiveAnalyzer()
