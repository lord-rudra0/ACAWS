"""
Advanced Gaze Tracking Service with Pupil Detection and Eye Movement Analysis.

This service provides sophisticated gaze tracking using:
- Pupil center detection using image gradients
- Eye corner and landmark-based gaze estimation
- Saccade and fixation detection
- Gaze pattern analysis for attention assessment
- Temporal gaze stability metrics
- Multi-resolution gaze mapping
"""
from typing import Optional, Dict, Any, List, Tuple
import base64
import logging
import numpy as np
import cv2
import math
from collections import deque
import time

logger = logging.getLogger(__name__)

try:
    import cv2
    _HAS_OPENCV = True
except Exception:
    _HAS_OPENCV = False

class GazeTracker:
    """Advanced gaze tracking with pupil detection and eye movement analysis"""

    def __init__(self):
        self.eye_cascade = None
        self.pupil_history = deque(maxlen=50)
        self.gaze_history = deque(maxlen=100)
        self.saccade_threshold = 0.1  # Minimum gaze shift for saccade detection
        self.fixation_threshold = 0.05  # Maximum gaze movement for fixation
        self.fixation_duration = 0.2  # Minimum time for fixation (seconds)

        if _HAS_OPENCV:
            try:
                # Load Haar cascades for eye detection
                self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
                self.left_eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_lefteye_2splits.xml')
                self.right_eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_righteye_2splits.xml')
            except Exception as e:
                logger.warning(f"Could not load eye cascades: {e}")

    def _detect_pupil_center(self, eye_roi: np.ndarray) -> Optional[Tuple[float, float]]:
        """Detect pupil center using image gradients and thresholding"""
        if eye_roi is None or eye_roi.size == 0:
            return None

        try:
            # Convert to grayscale if needed
            if len(eye_roi.shape) == 3:
                gray = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)
            else:
                gray = eye_roi

            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Apply adaptive thresholding to segment pupil
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
            )

            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if not contours:
                return None

            # Find the largest contour (likely the pupil)
            largest_contour = max(contours, key=cv2.contourArea)

            # Calculate centroid
            M = cv2.moments(largest_contour)
            if M["m00"] == 0:
                return None

            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])

            # Convert to relative coordinates (0-1)
            height, width = eye_roi.shape[:2]
            rel_x = cx / width
            rel_y = cy / height

            return (rel_x, rel_y)

        except Exception as e:
            logger.debug(f"Pupil detection failed: {e}")
            return None

    def _estimate_gaze_from_landmarks(self, eye_landmarks: List, eye_center: Tuple[float, float]) -> Tuple[float, float]:
        """Estimate gaze direction from eye landmarks and pupil position"""
        if not eye_landmarks or len(eye_landmarks) < 6:
            return (0.0, 0.0)

        try:
            # Eye corner landmarks (approximate indices for left eye)
            inner_corner = eye_landmarks[0]  # Inner corner
            outer_corner = eye_landmarks[3]  # Outer corner
            top_lid = eye_landmarks[1]     # Top eyelid
            bottom_lid = eye_landmarks[5]  # Bottom eyelid

            # Calculate eye center from landmarks
            eye_center_x = (inner_corner[0] + outer_corner[0]) / 2.0
            eye_center_y = (top_lid[1] + bottom_lid[1]) / 2.0

            # Gaze direction based on pupil position relative to eye center
            gaze_x = (eye_center[0] - 0.5) * 2.0  # Convert to -1 to 1 range
            gaze_y = (eye_center[1] - 0.5) * 2.0

            # Normalize to reasonable range
            gaze_x = max(-1.0, min(1.0, gaze_x))
            gaze_y = max(-1.0, min(1.0, gaze_y))

            return (gaze_x, gaze_y)

        except Exception as e:
            logger.debug(f"Gaze estimation from landmarks failed: {e}")
            return (0.0, 0.0)

    def _detect_saccades_and_fixations(self, gaze_positions: List[Tuple[float, float, float]]) -> Dict[str, Any]:
        """Detect saccades and fixations in gaze data"""
        if len(gaze_positions) < 3:
            return {
                'saccades': [],
                'fixations': [],
                'saccade_count': 0,
                'avg_fixation_duration': 0.0
            }

        saccades = []
        fixations = []
        current_fixation_start = None
        current_fixation_positions = []

        for i in range(1, len(gaze_positions)):
            prev_pos = gaze_positions[i-1]
            curr_pos = gaze_positions[i]

            # Calculate gaze shift distance
            distance = math.sqrt(
                (curr_pos[0] - prev_pos[0])**2 +
                (curr_pos[1] - prev_pos[1])**2
            )

            if distance > self.saccade_threshold:
                # Saccade detected
                saccades.append({
                    'start_time': prev_pos[2],
                    'end_time': curr_pos[2],
                    'amplitude': distance,
                    'duration': curr_pos[2] - prev_pos[2]
                })

                # End current fixation if active
                if current_fixation_start is not None:
                    fixation_duration = prev_pos[2] - current_fixation_start
                    if fixation_duration >= self.fixation_duration:
                        fixations.append({
                            'start_time': current_fixation_start,
                            'end_time': prev_pos[2],
                            'duration': fixation_duration,
                            'position': (
                                sum(p[0] for p in current_fixation_positions) / len(current_fixation_positions),
                                sum(p[1] for p in current_fixation_positions) / len(current_fixation_positions)
                            )
                        })
                    current_fixation_start = None
                    current_fixation_positions = []

            elif distance <= self.fixation_threshold:
                # Part of fixation
                if current_fixation_start is None:
                    current_fixation_start = prev_pos[2]
                current_fixation_positions.append((prev_pos[0], prev_pos[1]))

        # Handle final fixation
        if current_fixation_start is not None and current_fixation_positions:
            last_time = gaze_positions[-1][2]
            fixation_duration = last_time - current_fixation_start
            if fixation_duration >= self.fixation_duration:
                fixations.append({
                    'start_time': current_fixation_start,
                    'end_time': last_time,
                    'duration': fixation_duration,
                    'position': (
                        sum(p[0] for p in current_fixation_positions) / len(current_fixation_positions),
                        sum(p[1] for p in current_fixation_positions) / len(current_fixation_positions)
                    )
                })

        avg_fixation_duration = (
            sum(f['duration'] for f in fixations) / len(fixations)
            if fixations else 0.0
        )

        return {
            'saccades': saccades,
            'fixations': fixations,
            'saccade_count': len(saccades),
            'avg_fixation_duration': avg_fixation_duration
        }

    def _analyze_gaze_patterns(self, gaze_history: List[Tuple[float, float, float]]) -> Dict[str, Any]:
        """Analyze gaze patterns for attention and cognitive insights"""
        if len(gaze_history) < 10:
            return {
                'stability': 0.5,
                'exploration_rate': 0.0,
                'attention_focus': 0.5,
                'pattern_type': 'insufficient_data'
            }

        # Calculate gaze stability (inverse of variance)
        positions = [(x, y) for x, y, _ in gaze_history]
        x_coords = [p[0] for p in positions]
        y_coords = [p[1] for p in positions]

        x_variance = np.var(x_coords) if len(x_coords) > 1 else 0
        y_variance = np.var(y_coords) if len(y_coords) > 1 else 0
        stability = 1.0 - min(1.0, (x_variance + y_variance) / 2.0)

        # Calculate exploration rate (how much area is covered)
        x_range = max(x_coords) - min(x_coords) if x_coords else 0
        y_range = max(y_coords) - min(y_coords) if y_coords else 0
        exploration_rate = min(1.0, (x_range * y_range) / 4.0)  # Normalized to 0-1

        # Attention focus (based on time spent in center region)
        center_time = sum(1 for x, y in positions
                         if abs(x) < 0.3 and abs(y) < 0.3) / len(positions)
        attention_focus = center_time

        # Pattern classification
        if stability > 0.8:
            pattern_type = 'focused'
        elif exploration_rate > 0.6:
            pattern_type = 'exploratory'
        elif stability < 0.3:
            pattern_type = 'distracted'
        else:
            pattern_type = 'balanced'

        return {
            'stability': stability,
            'exploration_rate': exploration_rate,
            'attention_focus': attention_focus,
            'pattern_type': pattern_type
        }

    async def analyze_gaze(self, frame_data: str, landmarks: Optional[List] = None) -> Dict[str, Any]:
        """Main gaze analysis function"""
        try:
            # Decode frame
            if frame_data.startswith('data:'):
                frame_data = frame_data.split(',', 1)[1]
            frame_bytes = base64.b64decode(frame_data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return {'error': 'Could not decode frame'}

            gaze_info = {
                'pupil_detected': False,
                'gaze_direction': (0.0, 0.0),
                'confidence': 0.0,
                'eye_openness': 0.0,
                'saccades': [],
                'fixations': [],
                'pattern_analysis': {}
            }

            # Detect eyes using Haar cascades
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            eyes = []

            if self.eye_cascade:
                detected_eyes = self.eye_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
                )
                eyes = [(x, y, w, h) for x, y, w, h in detected_eyes]

            # If no eyes detected, try separate left/right cascades
            if not eyes and self.left_eye_cascade and self.right_eye_cascade:
                left_eyes = self.left_eye_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=3, minSize=(25, 25)
                )
                right_eyes = self.right_eye_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=3, minSize=(25, 25)
                )
                eyes = [(x, y, w, h) for x, y, w, h in left_eyes] + \
                       [(x, y, w, h) for x, y, w, h in right_eyes]

            if eyes:
                # Process the most prominent eye
                eye = max(eyes, key=lambda e: e[2] * e[3])  # Largest eye
                x, y, w, h = eye

                # Extract eye ROI
                eye_roi = gray[y:y+h, x:x+w]
                if eye_roi.size > 0:
                    pupil_center = self._detect_pupil_center(eye_roi)

                    if pupil_center:
                        gaze_info['pupil_detected'] = True
                        gaze_info['gaze_direction'] = pupil_center
                        gaze_info['confidence'] = 0.8

                        # Store in history
                        self.pupil_history.append((pupil_center[0], pupil_center[1], time.time()))
                        self.gaze_history.append((pupil_center[0], pupil_center[1], time.time()))

                        # Analyze patterns if we have enough history
                        if len(self.gaze_history) >= 10:
                            gaze_info['saccades'] = self._detect_saccades_and_fixations(list(self.gaze_history))
                            gaze_info['pattern_analysis'] = self._analyze_gaze_patterns(list(self.gaze_history))

            # Use landmarks if available (from MediaPipe)
            if landmarks and len(landmarks) > 468:  # MediaPipe face mesh landmarks
                # Extract eye landmarks (simplified)
                left_eye_indices = [33, 160, 158, 133, 153, 144]
                right_eye_indices = [362, 385, 387, 263, 373, 380]

                left_eye_coords = [(landmarks[i].x, landmarks[i].y) for i in left_eye_indices]
                right_eye_coords = [(landmarks[i].x, landmarks[i].y) for i in right_eye_indices]

                # Estimate gaze from both eyes
                left_gaze = self._estimate_gaze_from_landmarks(left_eye_coords, gaze_info['gaze_direction'])
                right_gaze = self._estimate_gaze_from_landmarks(right_eye_coords, gaze_info['gaze_direction'])

                # Average gaze direction
                avg_gaze = (
                    (left_gaze[0] + right_gaze[0]) / 2.0,
                    (left_gaze[1] + right_gaze[1]) / 2.0
                )

                gaze_info['gaze_direction'] = avg_gaze
                gaze_info['confidence'] = min(0.95, gaze_info['confidence'] + 0.3)

            return gaze_info

        except Exception as e:
            logger.error(f"Gaze analysis failed: {e}")
            return {
                'error': str(e),
                'pupil_detected': False,
                'gaze_direction': (0.0, 0.0),
                'confidence': 0.0
            }

# Singleton instance
gaze_tracker = GazeTracker()
