import cv2
import numpy as np
import logging
from typing import Dict, List, Optional, Tuple
import asyncio
from datetime import datetime, timedelta
import os
import math

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
        self.mpf = None  # MediaPipe disabled; using OpenCV-only path
        
        # Thresholds
        # Read from environment when available for easy calibration
        # ATTENTION_SCORE_THRESHOLD expects 0-1 range; others are degrees or counts
        self.attention_threshold = float(os.getenv('ATTENTION_SCORE_THRESHOLD', '0.7'))
        self.blink_rate_threshold = int(os.getenv('ATTENTION_BLINK_RATE_THRESHOLD', '20'))  # blinks per minute
        self.gaze_deviation_threshold = float(os.getenv('ATTENTION_GAZE_DEVIATION_THRESHOLD', '30'))  # degrees
        self.head_deviation_threshold = float(os.getenv('ATTENTION_HEAD_DEVIATION_THRESHOLD', '20'))  # |yaw|+|pitch|

        # Penalty weights (configurable)
        self.blink_penalty_weight = float(os.getenv('ATTENTION_PENALTY_BLINK_WEIGHT', '2.0'))
        self.gaze_penalty_weight = float(os.getenv('ATTENTION_PENALTY_GAZE_WEIGHT', '1.5'))
        self.head_penalty_weight = float(os.getenv('ATTENTION_PENALTY_HEAD_WEIGHT', '1.2'))

        # Smoothing params (EWMA)
        self.smoothing_alpha = float(os.getenv('ATTENTION_SMOOTHING_ALPHA', '0.4'))  # 0..1
        self._smoothed_attention = None
        
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
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 5)
            
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
            face_roi_color = frame[y:y+h, x:x+w]
            face_roi_gray = gray[y:y+h, x:x+w]

            # Detect eyes in face ROI
            eyes = self._detect_eyes(face_roi_gray)

            # Track eyes and blinks
            blink_data = self.blink_detector.analyze_blinks(face_roi_color, face_roi_gray, eyes)

            # Track gaze direction
            gaze_data = self.gaze_tracker.estimate_gaze(face_roi_color, face_roi_gray, eyes)

            # Estimate head pose
            head_pose = self.head_pose_estimator.estimate_pose(face_roi_color, face_roi_gray, eyes)
            
            # Calculate attention score
            attention_score = self._calculate_attention_score(blink_data, gaze_data, head_pose)

            # EWMA smoothing
            if self._smoothed_attention is None:
                self._smoothed_attention = attention_score
            else:
                a = min(1.0, max(0.0, self.smoothing_alpha))
                self._smoothed_attention = a * attention_score + (1 - a) * self._smoothed_attention
            
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
                "smoothed_attention_score": float(self._smoothed_attention),
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

    def _detect_eyes(self, face_roi_gray: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect eyes within the face ROI using Haar cascade and return up to two eyes sorted by x."""
        try:
            eyes = self.eye_cascade.detectMultiScale(face_roi_gray, 1.1, 10)
            # Keep top two eyes with largest width and sort left->right
            eyes = sorted(eyes, key=lambda e: -e[2])[:2]
            eyes = sorted(eyes, key=lambda e: e[0])
            return eyes
        except Exception as e:
            logger.error(f"Eye detection failed: {e}")
            return []
    
    def _calculate_attention_score(self, blink_data: Dict, gaze_data: Dict, head_pose: Dict) -> float:
        """Calculate overall attention score from multiple indicators"""
        try:
            score = 100.0
            
            # Penalize for excessive blinking (fatigue indicator)
            if blink_data["rate"] > self.blink_rate_threshold:
                blink_over = (blink_data["rate"] - self.blink_rate_threshold)
                score -= min(30, blink_over * self.blink_penalty_weight)
            
            # Penalize for gaze deviation
            gaze_deviation = abs(gaze_data.get("horizontal_angle", 0))
            gaze_conf = float(gaze_data.get("confidence", 0.7))
            if gaze_deviation > self.gaze_deviation_threshold:
                penalty = (gaze_deviation - self.gaze_deviation_threshold) * self.gaze_penalty_weight * max(0.3, min(1.0, gaze_conf))
                score -= min(40, penalty)
            
            # Penalize for head pose deviation
            head_yaw = abs(head_pose.get("yaw", 0))
            head_pitch = abs(head_pose.get("pitch", 0))
            head_deviation = head_yaw + head_pitch
            # derive a soft confidence based on deviation (smaller deviation -> higher confidence)
            head_conf = max(0.3, 1.0 - min(1.0, head_deviation / 60.0))
            if head_deviation > self.head_deviation_threshold:
                penalty = (head_deviation - self.head_deviation_threshold) * self.head_penalty_weight * head_conf
                score -= min(30, penalty)
            
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
    
    def analyze_blinks(self, face_roi_color: np.ndarray, face_roi_gray: np.ndarray, eyes: List[Tuple[int,int,int,int]]) -> Dict:
        """Analyze blink patterns using eye openness ratio from eye ROIs."""
        try:
            current_time = datetime.now()
            # Compute openness per detected eye as height/width of bright region after thresholding
            openness_vals = []
            for (ex, ey, ew, eh) in eyes:
                eye_roi = face_roi_gray[ey:ey+eh, ex:ex+ew]
                if eye_roi.size == 0:
                    continue
                eye_blur = cv2.GaussianBlur(eye_roi, (5,5), 0)
                # adaptive threshold to segment sclera/eyelid vs dark pupil/iris
                thr = cv2.adaptiveThreshold(eye_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 15, 5)
                # proportion of white pixels vertically -> openness estimate
                white_ratio = float(np.mean(thr == 255))
                # approximate openness using white ratio scaled
                openness = max(0.0, min(1.0, white_ratio * 1.5))
                # fallback to height/width if threshold unstable
                if np.isnan(openness) or openness == 0:
                    openness = min(1.0, eh / (ew + 1e-6))
                openness_vals.append(openness)

            avg_open = float(np.mean(openness_vals)) if openness_vals else 0.0
            blink_detected = avg_open < 0.25
            if blink_detected:
                self.blink_history.append(current_time)

            one_minute_ago = current_time - timedelta(minutes=1)
            recent_blinks = [b for b in self.blink_history if b > one_minute_ago]
            blink_rate = len(recent_blinks)
            self.blink_history = recent_blinks

            return {
                "rate": blink_rate,
                "detected": blink_detected,
                "eye_openness": avg_open,
                "fatigue_indicator": blink_rate > 20,
            }
        
        except Exception as e:
            logger.error(f"Blink analysis failed: {e}")
            return {"rate": 15, "detected": False, "eye_openness": 0.8, "fatigue_indicator": False}


class GazeTracker:
    """Track eye gaze direction for attention assessment"""
    
    def __init__(self):
        self.gaze_history = []
    
    def estimate_gaze(self, face_roi_color: np.ndarray, face_roi_gray: np.ndarray, eyes: List[Tuple[int,int,int,int]]) -> Dict:
        """Estimate gaze direction using pupil center offset within eye region."""
        try:
            centers = []
            boxes = []
            for (ex, ey, ew, eh) in eyes:
                eye_roi = face_roi_gray[ey:ey+eh, ex:ex+ew]
                if eye_roi.size == 0:
                    continue
                eye_blur = cv2.GaussianBlur(eye_roi, (7,7), 0)
                # Invert for pupil as bright blob after threshold
                _, thr = cv2.threshold(eye_blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
                thr = cv2.morphologyEx(thr, cv2.MORPH_OPEN, np.ones((3,3), np.uint8), iterations=1)
                contours, _ = cv2.findContours(thr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if not contours:
                    continue
                cnt = max(contours, key=cv2.contourArea)
                (cx, cy), r = cv2.minEnclosingCircle(cnt)
                centers.append((cx, cy))
                boxes.append((ex, ey, ew, eh))

            if len(centers) >= 1 and len(boxes) >= 1:
                # Use average normalized offsets from eye centers
                x_offs = []
                y_offs = []
                for (cx, cy), (ex, ey, ew, eh) in zip(centers, boxes):
                    x_offs.append((cx / (ew + 1e-6)) - 0.5)
                    y_offs.append((cy / (eh + 1e-6)) - 0.5)
                x_off = float(np.mean(x_offs)) if x_offs else 0.0
                y_off = float(np.mean(y_offs)) if y_offs else 0.0
                horizontal_angle = x_off * 60.0
                vertical_angle = y_off * 40.0
            else:
                horizontal_angle = 0.0
                vertical_angle = 0.0

            if abs(horizontal_angle) < 5 and abs(vertical_angle) < 5:
                direction = "center"
            elif horizontal_angle > 5:
                direction = "right"
            elif horizontal_angle < -5:
                direction = "left"
            elif vertical_angle > 5:
                direction = "down"  # positive y means down in image coordinates
            else:
                direction = "up"

            confidence = float(max(0, 1.0 - (abs(horizontal_angle)/60 + abs(vertical_angle)/40)))
            return {
                "direction": direction,
                "horizontal_angle": float(horizontal_angle),
                "vertical_angle": float(vertical_angle),
                "confidence": confidence,
                "on_screen": abs(horizontal_angle) < 30 and abs(vertical_angle) < 20,
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
    
    def estimate_pose(self, face_roi_color: np.ndarray, face_roi_gray: np.ndarray, eyes: List[Tuple[int,int,int,int]]) -> Dict:
        """Estimate head pose heuristically using eye geometry: roll from eye-line angle, yaw from eye width asymmetry, pitch from eye vertical placement."""
        try:
            h, w = face_roi_gray.shape[:2]
            pitch = 0.0
            yaw = 0.0
            roll = 0.0

            if len(eyes) >= 2:
                (x1, y1, w1, h1), (x2, y2, w2, h2) = eyes[:2]
                # Eye centers
                c1 = (x1 + w1/2.0, y1 + h1/2.0)
                c2 = (x2 + w2/2.0, y2 + h2/2.0)
                # Roll from eye-line angle
                roll = math.degrees(math.atan2(c2[1]-c1[1], c2[0]-c1[0]))
                # Yaw from eye width asymmetry (larger apparent width ~ closer eye)
                yaw = float((w2 - w1) / (max(w1, w2) + 1e-6)) * 25.0
                # Pitch from vertical placement of eyes within face box
                eye_avg_y = (c1[1] + c2[1]) / 2.0
                norm_y = (eye_avg_y / (h + 1e-6)) - 0.5
                pitch = float(-norm_y * 40.0)
            else:
                # With one or zero eyes, fall back to zero angles
                pitch = 0.0
                yaw = 0.0
                roll = 0.0

            pose_deviation = abs(pitch) + abs(yaw) + abs(roll)
            engagement_score = max(0, 100 - pose_deviation * 2)
            return {
                "pitch": float(pitch),
                "yaw": float(yaw),
                "roll": float(roll),
                "engagement_score": float(engagement_score),
                "facing_camera": abs(yaw) < 20 and abs(pitch) < 15,
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


# MediaPipe integration removed for this build (protobuf conflicts). OpenCV-only approach implemented above.