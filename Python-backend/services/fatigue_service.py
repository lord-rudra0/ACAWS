import cv2
import numpy as np
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class FatigueDetectionService:
    """Service for detecting cognitive fatigue through multiple indicators"""
    
    def __init__(self):
        self.fatigue_indicators = []
        self.baseline_metrics = {}
        self.fatigue_threshold = 0.6
        
        # Fatigue detection parameters
        self.eye_closure_threshold = 0.3
        self.yawn_detection_enabled = True
        self.micro_sleep_threshold = 2.0  # seconds
        
    async def detect_fatigue(self, frame_data: str) -> Dict:
        """Detect fatigue from camera frame"""
        try:
            frame = self._decode_frame(frame_data)
            if frame is None:
                return {"error": "Failed to decode frame"}
            
            # Analyze multiple fatigue indicators
            eye_closure = self._analyze_eye_closure(frame)
            yawn_detection = self._detect_yawn(frame)
            micro_movements = self._analyze_micro_movements(frame)
            blink_patterns = self._analyze_blink_patterns(frame)
            
            # Calculate overall fatigue score
            fatigue_score = self._calculate_fatigue_score(
                eye_closure, yawn_detection, micro_movements, blink_patterns
            )
            
            # Determine fatigue level
            fatigue_level = self._determine_fatigue_level(fatigue_score)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(fatigue_level, fatigue_score)
            
            # Store fatigue data
            fatigue_record = {
                "fatigue_score": fatigue_score,
                "fatigue_level": fatigue_level,
                "indicators": {
                    "eye_closure": eye_closure,
                    "yawn_detected": yawn_detection["detected"],
                    "micro_movements": micro_movements,
                    "blink_rate": blink_patterns["rate"]
                },
                "recommendations": recommendations,
                "timestamp": datetime.now()
            }
            
            self.fatigue_indicators.append(fatigue_record)
            
            # Keep only recent data
            if len(self.fatigue_indicators) > 50:
                self.fatigue_indicators.pop(0)
            
            return {
                "fatigue_score": fatigue_score,
                "fatigue_level": fatigue_level,
                "indicators": fatigue_record["indicators"],
                "recommendations": recommendations,
                "break_suggested": fatigue_score > 70,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Fatigue detection failed: {e}")
            return {"error": str(e)}
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """Decode base64 frame data"""
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
    
    def _analyze_eye_closure(self, frame: np.ndarray) -> float:
        """Analyze eye closure duration and frequency"""
        try:
            # Simplified eye closure detection
            # Real implementation would use facial landmarks
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Mock eye closure analysis
            closure_score = np.random.uniform(0, 1)
            
            return closure_score
            
        except Exception as e:
            logger.error(f"Eye closure analysis failed: {e}")
            return 0.2
    
    def _detect_yawn(self, frame: np.ndarray) -> Dict:
        """Detect yawning as fatigue indicator"""
        try:
            # Simplified yawn detection
            # Real implementation would analyze mouth landmarks
            
            yawn_detected = np.random.random() < 0.05  # 5% chance
            mouth_openness = np.random.uniform(0.1, 0.9)
            
            return {
                "detected": yawn_detected,
                "mouth_openness": mouth_openness,
                "confidence": 0.8 if yawn_detected else 0.2
            }
            
        except Exception as e:
            logger.error(f"Yawn detection failed: {e}")
            return {"detected": False, "mouth_openness": 0.3, "confidence": 0.5}
    
    def _analyze_micro_movements(self, frame: np.ndarray) -> float:
        """Analyze micro-movements that indicate fatigue"""
        try:
            # Simplified micro-movement analysis
            # Real implementation would track subtle head movements
            
            movement_score = np.random.uniform(0, 1)
            return movement_score
            
        except Exception as e:
            logger.error(f"Micro-movement analysis failed: {e}")
            return 0.3
    
    def _analyze_blink_patterns(self, frame: np.ndarray) -> Dict:
        """Analyze blink patterns for fatigue indicators"""
        try:
            # Mock blink pattern analysis
            blink_rate = np.random.randint(10, 25)  # blinks per minute
            blink_duration = np.random.uniform(0.1, 0.4)  # seconds
            
            return {
                "rate": blink_rate,
                "duration": blink_duration,
                "irregular": blink_rate > 22 or blink_duration > 0.35
            }
            
        except Exception as e:
            logger.error(f"Blink pattern analysis failed: {e}")
            return {"rate": 15, "duration": 0.2, "irregular": False}
    
    def _calculate_fatigue_score(self, eye_closure: float, yawn_data: Dict, 
                                micro_movements: float, blink_patterns: Dict) -> float:
        """Calculate overall fatigue score from all indicators"""
        try:
            score = 0.0
            
            # Eye closure contribution (30%)
            score += eye_closure * 30
            
            # Yawn detection contribution (25%)
            if yawn_data["detected"]:
                score += 25
            
            # Micro-movements contribution (20%)
            score += micro_movements * 20
            
            # Blink patterns contribution (25%)
            if blink_patterns["irregular"]:
                score += 15
            if blink_patterns["rate"] > 20:
                score += 10
            
            return min(100, max(0, score))
            
        except Exception as e:
            logger.error(f"Fatigue score calculation failed: {e}")
            return 30.0
    
    def _determine_fatigue_level(self, fatigue_score: float) -> str:
        """Determine fatigue level category"""
        if fatigue_score >= 80:
            return "severe"
        elif fatigue_score >= 60:
            return "high"
        elif fatigue_score >= 40:
            return "moderate"
        elif fatigue_score >= 20:
            return "low"
        else:
            return "minimal"
    
    def _generate_recommendations(self, fatigue_level: str, fatigue_score: float) -> List[str]:
        """Generate personalized recommendations based on fatigue level"""
        recommendations = []
        
        if fatigue_level == "severe":
            recommendations.extend([
                "Take an immediate 15-20 minute break",
                "Consider ending the study session",
                "Get some fresh air or light exercise",
                "Ensure adequate sleep tonight"
            ])
        elif fatigue_level == "high":
            recommendations.extend([
                "Take a 10-15 minute break",
                "Do some light stretching",
                "Hydrate with water",
                "Consider switching to easier material"
            ])
        elif fatigue_level == "moderate":
            recommendations.extend([
                "Take a 5-10 minute break",
                "Practice deep breathing",
                "Adjust your posture",
                "Reduce screen brightness"
            ])
        elif fatigue_level == "low":
            recommendations.extend([
                "Stay hydrated",
                "Maintain good posture",
                "Take regular micro-breaks"
            ])
        
        return recommendations
    
    def get_fatigue_trends(self, time_window_hours: int = 2) -> Dict:
        """Get fatigue trends over specified time window"""
        try:
            if not self.fatigue_indicators:
                return {"error": "No fatigue data available"}
            
            current_time = datetime.now()
            recent_data = []
            
            for record in self.fatigue_indicators:
                time_diff = (current_time - record["timestamp"]).total_seconds() / 3600
                if time_diff <= time_window_hours:
                    recent_data.append(record)
            
            if not recent_data:
                return {"error": "No recent fatigue data"}
            
            # Calculate trends
            avg_fatigue = sum(r["fatigue_score"] for r in recent_data) / len(recent_data)
            
            level_distribution = {}
            for record in recent_data:
                level = record["fatigue_level"]
                level_distribution[level] = level_distribution.get(level, 0) + 1
            
            # Convert to percentages
            total_records = len(recent_data)
            for level in level_distribution:
                level_distribution[level] = (level_distribution[level] / total_records) * 100
            
            return {
                "time_window_hours": time_window_hours,
                "total_measurements": len(recent_data),
                "average_fatigue": round(avg_fatigue, 2),
                "level_distribution": level_distribution,
                "break_recommendations": sum(1 for r in recent_data if r["fatigue_score"] > 70),
                "timestamp": current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Fatigue trends calculation failed: {e}")
            return {"error": str(e)}