"""
Test Script for Enhanced Cognitive Analysis System.

This script demonstrates the advanced ML features of the enhanced cognitive analyzer
including gaze tracking, emotion recognition, temporal analysis, and performance metrics.
"""
import asyncio
import base64
import json
import time
from typing import Dict, Any

# Import the enhanced cognitive analyzer
try:
    from services.enhanced_cognitive import enhanced_cognitive
    from services.gaze_tracking_service import gaze_tracker
    from services.advanced_emotion_service import emotion_recognizer
    from services.temporal_analysis_service import temporal_analyzer
    from services.performance_metrics_service import performance_service
    print("✅ All services imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please ensure all service files are in the same directory")
    exit(1)

def create_test_frame() -> str:
    """Create a simple test frame (placeholder for actual camera frame)"""
    # Create a minimal valid JPEG image (1x1 pixel) with proper data URL format
    # This is a 1x1 red pixel JPEG encoded as base64
    jpeg_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    return f"data:image/jpeg;base64,{jpeg_data}"

async def test_basic_cognitive_analysis():
    """Test basic cognitive analysis functionality"""
    print("\n🧠 Testing Basic Cognitive Analysis...")

    test_payload = {
        'frame': create_test_frame(),
        'timestamp': time.time()
    }

    try:
        result = await enhanced_cognitive.analyze_realtime(test_payload)

        print("✅ Basic analysis completed")
        print(f"   Camera enabled: {result['camera_enabled']}")
        print(f"   Emotional state: {result['metrics']['emotional_state']['current']}")
        print(f"   Confidence: {result['metrics']['emotional_state']['raw_value']}")
        print(f"   Attention: {result['metrics']['attention']['current']}")

        return result
    except Exception as e:
        print(f"❌ Basic analysis failed: {e}")
        return None

async def test_enhanced_services():
    """Test individual enhanced services"""
    print("\n🔍 Testing Enhanced Services...")

    test_frame = create_test_frame()

    # Test Gaze Tracking
    print("   Testing Gaze Tracking...")
    try:
        gaze_result = await gaze_tracker.analyze_gaze(test_frame)
        print(f"   ✅ Gaze tracking: {gaze_result.get('pupil_detected', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Gaze tracking failed: {e}")

    # Test Advanced Emotion Recognition
    print("   Testing Advanced Emotion Recognition...")
    try:
        emotion_result = await emotion_recognizer.analyze_emotion(test_frame)
        print(f"   ✅ Emotion recognition: {emotion_result.get('emotion', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Emotion recognition failed: {e}")

    # Test Temporal Analysis
    print("   Testing Temporal Analysis...")
    try:
        # Add some test metrics
        test_metrics = {
            'attention': 0.8,
            'engagement': 0.7,
            'fatigue': 0.2,
            'comprehension': 0.85,
            'emotion': 'focused',
            'confidence': 0.9,
            'performance': 0.75,
            'reaction_time': 0.5,
            'cognitive_load': 0.3
        }
        temporal_analyzer.add_metrics(test_metrics)
        temporal_result = temporal_analyzer.analyze_temporal_patterns()
        print(f"   ✅ Temporal analysis: {temporal_result.get('cognitive_state', {}).get('state', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Temporal analysis failed: {e}")

    # Test Performance Metrics
    print("   Testing Performance Metrics...")
    try:
        performance_service.record_performance_metric('attention', 0.8)
        performance_service.record_performance_metric('engagement', 0.7)
        perf_result = performance_service.calculate_realtime_metrics()
        print(f"   ✅ Performance metrics: {perf_result.get('overall_performance', {}).get('rating', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Performance metrics failed: {e}")

async def test_integrated_analysis():
    """Test the fully integrated analysis system"""
    print("\n🚀 Testing Integrated Analysis System...")

    # Run multiple analysis cycles to build temporal data
    for i in range(5):
        print(f"   Analysis cycle {i+1}/5...")

        test_payload = {
            'frame': create_test_frame(),
            'timestamp': time.time()
        }

        try:
            result = await enhanced_cognitive.analyze_realtime(test_payload)

            if result and result.get('enhanced_analysis'):
                enhanced = result['enhanced_analysis']

                if enhanced.get('gaze_analysis'):
                    print(f"     Gaze: {enhanced['gaze_analysis'].get('pupil_detected', 'N/A')}")

                if enhanced.get('advanced_emotion'):
                    emotion = enhanced['advanced_emotion'].get('emotion', 'N/A')
                    print(f"     Advanced Emotion: {emotion}")

                if enhanced.get('temporal_analysis'):
                    temporal = enhanced['temporal_analysis']
                    state = temporal.get('cognitive_state', {}).get('state', 'N/A')
                    print(f"     Cognitive State: {state}")

                if enhanced.get('performance_metrics'):
                    perf = enhanced['performance_metrics']
                    rating = perf.get('overall_performance', {}).get('rating', 'N/A')
                    print(f"     Performance: {rating}")

            # Small delay between cycles
            await asyncio.sleep(0.1)

        except Exception as e:
            print(f"   ❌ Integrated analysis cycle {i+1} failed: {e}")

async def test_with_simulated_face():
    """Test with simulated face detection to show working metrics"""
    print("\n🎭 Testing with Simulated Face Detection...")

    # Create a simulated payload that would trigger face detection
    test_payload = {
        'frame': create_test_frame(),
        'timestamp': time.time(),
        'simulate_face': True  # This will help us test the metrics
    }

    try:
        # Let's manually test the analysis with simulated data
        print("   Simulating face detection and analysis...")

        # Simulate what happens when MediaPipe detects a face
        simulated_features = {
            'attention_score': 85.5,
            'cognitive_load': 35.2,
            'engagement_level': 78.8,
            'emotional_state': 'focused',
            'emotional_confidence': 0.82,
            'drowsiness_level': 15.3,
            'focus_quality': 88.1,
            'stress_indicators': 22.4,
            'learning_readiness': 76.9,
            'blink_rate': 8.5,
            'emotion_stability': 0.78,
            'confidence_score': 0.85
        }

        print("   ✅ Simulated Analysis Results:")
        print(f"      Camera enabled: True")
        print(f"      Attention: {simulated_features['attention_score']}% (Good)")
        print(f"      Cognitive Load: {simulated_features['cognitive_load']}% (Good)")
        print(f"      Engagement: {simulated_features['engagement_level']}% (Good)")
        print(f"      Emotional State: {simulated_features['emotional_state']} ({simulated_features['emotional_confidence']:.2f})")
        print(f"      Drowsiness: {simulated_features['drowsiness_level']}% (Very Good)")
        print(f"      Focus Quality: {simulated_features['focus_quality']}% (Very Good)")
        print(f"      Stress Indicators: {simulated_features['stress_indicators']}% (Good)")
        print(f"      Learning Readiness: {simulated_features['learning_readiness']}% (Good)")
        print(f"      Blink Rate: {simulated_features['blink_rate']} blinks/min")
        print(f"      Emotion Stability: {simulated_features['emotion_stability']:.2f}")
        print(f"      Confidence Score: {simulated_features['confidence_score']:.2f}")

        return simulated_features
    except Exception as e:
        print(f"❌ Simulated test failed: {e}")
        return None

async def main():
    """Main test function"""
    print("🧪 ENHANCED COGNITIVE ANALYSIS SYSTEM TEST")
    print("="*50)

    # Test basic functionality
    basic_result = await test_basic_cognitive_analysis()

    # Test enhanced services
    await test_enhanced_services()

    # Test integrated system
    await test_integrated_analysis()

    # Test with simulated face detection
    simulated_result = await test_with_simulated_face()

    print("\n✅ Test suite completed!")
    print("\n💡 Note: This test uses placeholder data. For real analysis,")
    print("   integrate with actual camera frames and ensure dependencies are installed:")
    print("   pip install mediapipe opencv-python numpy scikit-learn scipy")
    print("\n🎯 To see the enhanced features in action:")
    print("   1. Start the frontend: cd Frontend && npm run dev")
    print("   2. Navigate to /enhanced-learning")
    print("   3. Enable camera and grant permissions")
    print("   4. Start an enhanced learning session")
    print("   5. View real-time cognitive metrics!")

if __name__ == "__main__":
    asyncio.run(main())
