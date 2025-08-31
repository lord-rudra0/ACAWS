import cv2
import numpy as np
import logging
from typing import Dict, List, Optional
import asyncio
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class AttentionTrackingService:
    """Service for real-time attention tracking using eye gaze and head pose"""
    
    def __init__(self):
        self.eye_cascade = None
        self.face_cascade = None
        self.attention_history = []
        self.blink_detector = BlinkDetector()
        self.gaze_tracker = GazeTracker()
        self.head_pose_estimator = HeadPoseEstimator()
        
        # Thresholds
        self.attention_threshold = 0.7
        self.blink_rate_threshold = 20  # blinks per minute
        self.gaze_deviation_threshold = 30  # degrees
        
        self._load_models()
    
    def _load_models(self):
        """Load attention tracking models"""
        try:
            # Load OpenCV cascades
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
            
            self.face_cascade = cv2.CascadeClassifier(face_cascade_path)
            self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
            
            logger.info("✅ Attention tracking models loaded")
            
        except Exception as e:
            logger.error(f"❌ Failed to load attention models: {e}")
    
    async def track_attention(self, frame_data: str) -> Dict:
        """Track attention level from camera frame"""
        try:
            # Decode frame (reuse from emotion service)
            frame = self._decode_frame(frame_data)
            if frame is None:
                return {"error": "Failed to decode frame"}
            
            # Detect face and eyes
            faces = self.face_cascade.detectMultiScale(frame, 1.1, 5)
            
            if len(faces) == 0:
                return {
                    "attention_score": 0,
                    "gaze_direction": "unknown",
                    "blink_rate": 0,
                    "head_pose": {"pitch": 0, "yaw": 0, "roll": 0},
                    "focus_level": "low",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Process largest face
            (x, y, w, h) = max(faces, key=lambda face: face[2] * face[3])
            face_roi = frame[y:y+h, x:x+w]
            
            # Track eyes and blinks
            blink_data = self.blink_detector.analyze_blinks(face_roi)
            
            # Track gaze direction
            gaze_data = self.gaze_tracker.estimate_gaze(face_roi)
            
            # Estimate head pose
            head_pose = self.head_pose_estimator.estimate_pose(face_roi)
            
            # Calculate attention score
            attention_score = self._calculate_attention_score(blink_data, gaze_data, head_pose)
            
            # Determine focus level
            focus_level = self._determine_focus_level(attention_score, gaze_data, blink_data)
            
            # Store in history
            attention_record = {
                "attention_score": attention_score,
                "gaze_direction": gaze_data["direction"],
                "blink_rate": blink_data["rate"],
                "head_pose": head_pose,
                "focus_level": focus_level,
                "timestamp": datetime.now()
            }
            
            self.attention_history.append(attention_record)
            
            # Keep only last 100 records
            if len(self.attention_history) > 100:
                self.attention_history.pop(0)
            
            return {
                "attention_score": attention_score,
                "gaze_direction": gaze_data["direction"],
                "blink_rate": blink_data["rate"],
                "head_pose": head_pose,
                "focus_level": focus_level,
                "face_detected": True,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Attention tracking failed: {e}")
            return {"error": str(e)}
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """Decode base64 frame data (shared with emotion service)"""
        try:
            import base64
            
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            
            frame_bytes = base64.b64decode(frame_data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return frame
            
        except Exception as e:
            logger.error(f"Failed to decode frame: {e}")
            return None
    
    def _calculate_attention_score(self, blink_data: Dict, gaze_data: Dict, head_pose: Dict) -> float:
        """Calculate overall attention score from multiple indicators"""
        try:
            score = 100.0
            
            # Penalize for excessive blinking (fatigue indicator)
            if blink_data["rate"] > self.blink_rate_threshold:
                score -= min(30, (blink_data["rate"] - self.blink_rate_threshold) * 2)
            
            # Penalize for gaze deviation
            gaze_deviation = abs(gaze_data.get("horizontal_angle", 0))
            if gaze_deviation > self.gaze_deviation_threshold:
                score -= min(40, (gaze_deviation - self.gaze_deviation_threshold) * 1.5)
            
            # Penalize for head pose deviation
            head_deviation = abs(head_pose.get("yaw", 0)) + abs(head_pose.get("pitch", 0))
            if head_deviation > 20:
                score -= min(30, (head_deviation - 20) * 1.2)
            
            return max(0, min(100, score))
            
        except Exception as e:
            logger.error(f"Attention score calculation failed: {e}")
            return 50.0  # Default moderate score
    
    def _determine_focus_level(self, attention_score: float, gaze_data: Dict, blink_data: Dict) -> str:
        """Determine focus level category"""
        if attention_score >= 80:
            return "high"
        elif attention_score >= 60:
            return "medium"
        elif attention_score >= 40:
            return "low"
        else:
            return "very_low"
    
    def get_attention_trends(self, time_window_minutes: int = 10) -> Dict:
        """Get attention trends over specified time window"""
        try:
            if not self.attention_history:
                return {"error": "No attention data available"}
            
            current_time = datetime.now()
            recent_data = []
            
            for record in self.attention_history:
                time_diff = (current_time - record["timestamp"]).total_seconds() / 60
                if time_diff <= time_window_minutes:
                    recent_data.append(record)
            
            if not recent_data:
                return {"error": "No recent attention data"}
            
            # Calculate trends
            avg_attention = sum(r["attention_score"] for r in recent_data) / len(recent_data)
            avg_blink_rate = sum(r["blink_rate"] for r in recent_data) / len(recent_data)
            
            focus_distribution = {}
            for record in recent_data:
                level = record["focus_level"]
                focus_distribution[level] = focus_distribution.get(level, 0) + 1
            
            # Convert to percentages
            total_records = len(recent_data)
            for level in focus_distribution:
                focus_distribution[level] = (focus_distribution[level] / total_records) * 100
            
            return {
                "time_window_minutes": time_window_minutes,
                "total_measurements": len(recent_data),
                "average_attention": round(avg_attention, 2),
                "average_blink_rate": round(avg_blink_rate, 2),
                "focus_distribution": focus_distribution,
                "trend": self._calculate_trend(recent_data),
                "timestamp": current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Attention trends calculation failed: {e}")
            return {"error": str(e)}
    
    def _calculate_trend(self, data: List[Dict]) -> str:
        """Calculate if attention is improving, declining, or stable"""
        if len(data) < 5:
            return "insufficient_data"
        
        # Compare first half with second half
        mid_point = len(data) // 2
        first_half_avg = sum(r["attention_score"] for r in data[:mid_point]) / mid_point
        second_half_avg = sum(r["attention_score"] for r in data[mid_point:]) / (len(data) - mid_point)
        
        difference = second_half_avg - first_half_avg
        
        if difference > 5:
            return "improving"
        elif difference < -5:
            return "declining"
        else:
            return "stable"


class BlinkDetector:
    """Detect and analyze eye blinks for fatigue assessment"""
    
    def __init__(self):
        self.blink_history = []
        self.eye_aspect_ratio_threshold = 0.25
    
    def analyze_blinks(self, face_roi: np.ndarray) -> Dict:
        """Analyze blink patterns in face region"""
        try:
            # Simplified blink detection - in real implementation would use dlib landmarks
            gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            
            # Mock blink detection for demonstration
            current_time = datetime.now()
            
            # Simulate blink detection
            blink_detected = np.random.random() < 0.1  # 10% chance of blink per frame
            
            if blink_detected:
                self.blink_history.append(current_time)
            
            # Calculate blink rate (blinks per minute)
            one_minute_ago = current_time - timedelta(minutes=1)
            recent_blinks = [b for b in self.blink_history if b > one_minute_ago]
            blink_rate = len(recent_blinks)
            
            # Clean old blinks
            self.blink_history = recent_blinks
            
            return {
                "rate": blink_rate,
                "detected": blink_detected,
                "eye_openness": np.random.uniform(0.7, 1.0),  # Mock eye openness
                "fatigue_indicator": blink_rate > 20
            }
            
        except Exception as e:
            logger.error(f"Blink analysis failed: {e}")
            return {"rate": 15, "detected": False, "eye_openness": 0.8, "fatigue_indicator": False}


class GazeTracker:
    """Track eye gaze direction for attention assessment"""
    
    def __init__(self):
        self.gaze_history = []
    
    def estimate_gaze(self, face_roi: np.ndarray) -> Dict:
        """Estimate gaze direction from face region"""
        try:
            # Simplified gaze estimation - real implementation would use eye landmarks
            
            # Mock gaze estimation
            horizontal_angle = np.random.uniform(-15, 15)  # degrees
            vertical_angle = np.random.uniform(-10, 10)    # degrees
            
            # Determine gaze direction
            if abs(horizontal_angle) < 5 and abs(vertical_angle) < 5:
                direction = "center"
            elif horizontal_angle > 5:
                direction = "right"
            elif horizontal_angle < -5:
                direction = "left"
            elif vertical_angle > 5:
                direction = "up"
            else:
                direction = "down"
            
            confidence = 1.0 - (abs(horizontal_angle) + abs(vertical_angle)) / 50
            
            return {
                "direction": direction,
                "horizontal_angle": horizontal_angle,
                "vertical_angle": vertical_angle,
                "confidence": max(0, min(1, confidence)),
                "on_screen": abs(horizontal_angle) < 30 and abs(vertical_angle) < 20
            }
            
        except Exception as e:
            logger.error(f"Gaze estimation failed: {e}")
            return {
                "direction": "center",
                "horizontal_angle": 0,
                "vertical_angle": 0,
                "confidence": 0.5,
                "on_screen": True
            }


class HeadPoseEstimator:
    """Estimate head pose for attention and engagement assessment"""
    
    def __init__(self):
        self.pose_history = []
    
    def estimate_pose(self, face_roi: np.ndarray) -> Dict:
        """Estimate head pose angles"""
        try:
            # Simplified head pose estimation
            # Real implementation would use facial landmarks and PnP algorithm
            
            # Mock head pose estimation
            pitch = np.random.uniform(-10, 10)  # Up/down rotation
            yaw = np.random.uniform(-15, 15)    # Left/right rotation  
            roll = np.random.uniform(-5, 5)     # Tilt rotation
            
            # Calculate engagement based on pose
            pose_deviation = abs(pitch) + abs(yaw) + abs(roll)
            engagement_score = max(0, 100 - pose_deviation * 2)
            
            return {
                "pitch": pitch,
                "yaw": yaw,
                "roll": roll,
                "engagement_score": engagement_score,
                "facing_camera": abs(yaw) < 20 and abs(pitch) < 15
            }
            
        except Exception as e:
            logger.error(f"Head pose estimation failed: {e}")
            return {
                "pitch": 0,
                "yaw": 0,
                "roll": 0,
                "engagement_score": 75,
                "facing_camera": True
            }