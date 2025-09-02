# Enhanced Cognitive Analysis System

## Overview

The Enhanced Cognitive Analysis System is a state-of-the-art machine learning-powered platform for real-time cognitive state monitoring and analysis. It combines multiple advanced AI services to provide comprehensive insights into user attention, emotion, engagement, and cognitive performance.

## 🚀 Features

### Core Capabilities
- **Real-time Facial Analysis**: MediaPipe-powered face mesh detection with 468+ landmarks
- **Advanced Gaze Tracking**: Pupil detection, eye movement analysis, and attention mapping
- **Multi-dimensional Emotion Recognition**: Rule-based and ML-powered emotion classification
- **Temporal Pattern Analysis**: Trend detection, cognitive state transitions, and performance prediction
- **Performance Metrics**: Real-time efficiency tracking and cognitive load assessment
- **Drowsiness Detection**: PERCLOS methodology with micro-expression analysis
- **Adaptive Learning**: Self-calibrating baselines and personalized thresholds

### Advanced ML Features
- **Ensemble Feature Extraction**: Multi-modal signal processing
- **Temporal Analysis**: Time-series analysis with pattern recognition
- **Predictive Modeling**: Performance forecasting and fatigue prediction
- **Confidence Scoring**: Uncertainty estimation and quality assessment
- **Cultural Adaptation**: Multi-cultural emotion recognition support

## 🏗️ Architecture

### Service Components

1. **Enhanced Cognitive Analyzer** (`enhanced_cognitive.py`)
   - Main orchestration service
   - Integrates all analysis components
   - Provides unified API interface

2. **Gaze Tracking Service** (`gaze_tracking_service.py`)
   - Pupil center detection
   - Eye movement analysis
   - Saccade and fixation detection

3. **Advanced Emotion Service** (`advanced_emotion_service.py`)
   - Facial expression analysis
   - Action Unit (AU) detection
   - Temporal emotion smoothing

4. **Temporal Analysis Service** (`temporal_analysis_service.py`)
   - Time-series pattern recognition
   - Cognitive state transitions
   - Performance trend analysis

5. **Performance Metrics Service** (`performance_metrics_service.py`)
   - Real-time performance tracking
   - Efficiency calculations
   - Benchmarking and recommendations

## 📋 Requirements

### Dependencies
```bash
pip install mediapipe opencv-python numpy scikit-learn scipy
```

### System Requirements
- Python 3.8+
- Webcam/camera access (for real-time analysis)
- 4GB+ RAM recommended
- GPU acceleration optional (for MediaPipe)

## 🔧 Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /path/to/your/Python-backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation**
   ```bash
   python test_enhanced_cognitive.py
   ```

## 📖 Usage

### Basic Usage

```python
from services.enhanced_cognitive import enhanced_cognitive
import asyncio

async def analyze_frame():
    # Your camera frame as base64 string
    frame_data = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."

    result = await enhanced_cognitive.analyze_realtime({
        'frame': frame_data
    })

    print(f"Attention: {result['metrics']['attention']['current']}")
    print(f"Emotion: {result['metrics']['emotional_state']['current']}")
```

### Advanced Usage with All Services

```python
from services.enhanced_cognitive import enhanced_cognitive
from services.gaze_tracking_service import gaze_tracker
from services.advanced_emotion_service import emotion_recognizer
from services.temporal_analysis_service import temporal_analyzer
from services.performance_metrics_service import performance_service

async def comprehensive_analysis(frame_data):
    # Main cognitive analysis
    cognitive_result = await enhanced_cognitive.analyze_realtime({
        'frame': frame_data
    })

    # Individual service analysis
    gaze_result = await gaze_tracker.analyze_gaze(frame_data)
    emotion_result = await emotion_recognizer.analyze_emotion(frame_data)

    # Get temporal patterns
    temporal_result = temporal_analyzer.analyze_temporal_patterns()

    # Performance insights
    performance_result = performance_service.calculate_realtime_metrics()
    insights = performance_service.get_performance_insights()

    return {
        'cognitive': cognitive_result,
        'gaze': gaze_result,
        'emotion': emotion_result,
        'temporal': temporal_result,
        'performance': performance_result,
        'insights': insights
    }
```

## 🔍 API Reference

### Enhanced Cognitive Analyzer

#### `analyze_realtime(payload: Dict[str, Any]) -> Dict[str, Any]`

Main analysis function that processes camera frames and returns comprehensive cognitive metrics.

**Parameters:**
- `payload`: Dictionary containing:
  - `frame`: Base64-encoded image data (required)
  - `timestamp`: Optional timestamp

**Returns:**
```json
{
  "camera_enabled": true,
  "timestamp": 1640995200.0,
  "metrics": {
    "attention": {
      "quality": "Good",
      "current": "78%",
      "raw_value": 78.5,
      "trend": "↗️ Rising",
      "baseline": 70.0
    },
    "emotional_state": {
      "quality": "Very Good",
      "current": "focused",
      "raw_value": 0.85
    }
  },
  "advanced_metrics": {
    "blink_rate": 12.5,
    "emotion_stability": 0.82,
    "confidence_score": 0.91
  },
  "enhanced_analysis": {
    "gaze_analysis": {...},
    "advanced_emotion": {...},
    "temporal_analysis": {...},
    "performance_metrics": {...}
  }
}
```

### Individual Services

#### Gaze Tracking Service
```python
gaze_result = await gaze_tracker.analyze_gaze(frame_data, landmarks)
```

#### Advanced Emotion Service
```python
emotion_result = await emotion_recognizer.analyze_emotion(frame_data, landmarks, culture='western')
```

#### Temporal Analysis Service
```python
temporal_analyzer.add_metrics(metrics_dict)
result = temporal_analyzer.analyze_temporal_patterns()
```

#### Performance Metrics Service
```python
performance_service.record_performance_metric('attention', 0.8)
result = performance_service.calculate_realtime_metrics()
insights = performance_service.get_performance_insights()
```

## 🎯 Metrics Explained

### Core Metrics
- **Attention Score**: 0-100, measures focus level
- **Cognitive Load**: 0-100, indicates mental workload
- **Engagement Level**: 0-100, combines attention and emotional engagement
- **Emotional State**: Current detected emotion with confidence
- **Drowsiness Level**: 0-100, based on PERCLOS methodology
- **Focus Quality**: 0-100, attention consistency over time
- **Stress Indicators**: 0-100, based on physiological signals
- **Learning Readiness**: 0-100, optimal learning conditions

### Advanced Metrics
- **Blink Rate**: Blinks per minute
- **Emotion Stability**: 0-1, consistency of emotional state
- **Micro-expressions**: Detected subtle facial expressions
- **Confidence Score**: Overall analysis reliability
- **Temporal Samples**: Number of historical data points

## 🔬 Testing

### Run Test Suite
```bash
python test_enhanced_cognitive.py
```

### Integration Testing
```bash
# Test with actual camera frames
python -c "
import cv2
import base64
from services.enhanced_cognitive import enhanced_cognitive
import asyncio

async def test_camera():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    if ret:
        _, buffer = cv2.imencode('.jpg', frame)
        frame_b64 = base64.b64encode(buffer).decode()
        result = await enhanced_cognitive.analyze_realtime({'frame': frame_b64})
        print('Analysis result:', result['human_readable'])
    cap.release()

asyncio.run(test_camera())
"
```

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure all service files are in the services directory
   ls services/
   # Should show: enhanced_cognitive.py, gaze_tracking_service.py, etc.
   ```

2. **MediaPipe Not Found**
   ```bash
   pip install mediapipe
   # Or for CPU-only version:
   pip install mediapipe --no-deps
   ```

3. **OpenCV Errors**
   ```bash
   pip install opencv-python
   # For headless systems:
   pip install opencv-python-headless
   ```

4. **Camera Access Issues**
   - Ensure camera permissions are granted
   - Check camera is not used by other applications
   - Try different camera index: `cv2.VideoCapture(1)`

5. **Performance Issues**
   - Reduce image resolution for faster processing
   - Use GPU acceleration if available
   - Implement frame rate limiting

### Debug Mode
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Optimization

### Tips for Production Use
1. **Frame Rate Optimization**
   ```python
   # Process every 3rd frame for better performance
   frame_count = 0
   if frame_count % 3 == 0:
       result = await enhanced_cognitive.analyze_realtime(payload)
   frame_count += 1
   ```

2. **Resolution Scaling**
   ```python
   # Reduce resolution for faster processing
   small_frame = cv2.resize(frame, (320, 240))
   ```

3. **Async Processing**
   ```python
   # Use asyncio for concurrent processing
   import asyncio

   async def process_frames():
       tasks = [analyze_frame(frame) for frame in frame_batch]
       results = await asyncio.gather(*tasks)
   ```

## 🤝 Contributing

### Adding New Features
1. Create new service in `services/` directory
2. Follow existing naming conventions
3. Add proper error handling and fallbacks
4. Update main analyzer to integrate new service
5. Add tests and documentation

### Code Style
- Use type hints for all function parameters
- Include comprehensive docstrings
- Handle exceptions gracefully with fallbacks
- Follow PEP 8 style guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MediaPipe for advanced face analysis
- OpenCV for computer vision capabilities
- scikit-learn for machine learning algorithms
- NumPy and SciPy for numerical computing

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the test suite for examples

---

**Note**: This system is designed for research and educational purposes. Ensure compliance with privacy regulations when processing facial data.
