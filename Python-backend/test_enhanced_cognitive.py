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
    from enhanced_cognitive import enhanced_cognitive
    from gaze_tracking_service import gaze_tracker
    from advanced_emotion_service import emotion_recognizer
    from temporal_analysis_service import temporal_analyzer
    from performance_metrics_service import performance_service
    print("✅ All services imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please ensure all service files are in the same directory")
    exit(1)

def create_test_frame() -> str:
    """Create a simple test frame (placeholder for actual camera frame)"""
    # This is a placeholder - in real usage, you'd capture from camera
    # For testing, we'll use a minimal valid base64 string
    test_data = b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    return base64.b64encode(test_data).decode('utf-8')

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

async def generate_demo_report():
    """Generate a comprehensive demo report"""
    print("\n📊 Generating Demo Report...")

    # Run a final comprehensive analysis
    test_payload = {
        'frame': create_test_frame(),
        'timestamp': time.time()
    }

    try:
        result = await enhanced_cognitive.analyze_realtime(test_payload)

        if result:
            print("\n" + "="*60)
            print("🎯 ENHANCED COGNITIVE ANALYSIS DEMO REPORT")
            print("="*60)

            print(f"\n📅 Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(result['timestamp']))}")
            print(f"📹 Camera Status: {'✅ Enabled' if result['camera_enabled'] else '❌ Disabled'}")

            print(f"\n🧠 COGNITIVE METRICS:")
            metrics = result['metrics']
            for key, value in metrics.items():
                if key != 'emotional_state':
                    print(f"   {key.replace('_', ' ').title()}: {value['current']} ({value['quality']})")

            print(f"\n😊 EMOTIONAL ANALYSIS:")
            emotion = metrics['emotional_state']
            print(f"   Current Emotion: {emotion['current']}")
            print(f"   Confidence: {emotion['raw_value']}")
            print(f"   Quality: {emotion['quality']}")

            print(f"\n⚡ ADVANCED METRICS:")
            advanced = result['advanced_metrics']
            print(f"   Blink Rate: {advanced['blink_rate']:.1f} blinks/min")
            print(f"   Emotion Stability: {advanced['emotion_stability']:.2f}")
            print(f"   Confidence Score: {advanced['confidence_score']:.2f}")
            print(f"   Temporal Samples: {advanced['temporal_samples']}")

            enhanced = result.get('enhanced_analysis', {})
            if enhanced:
                print(f"\n🔬 ENHANCED ANALYSIS RESULTS:")

                if enhanced.get('gaze_analysis'):
                    gaze = enhanced['gaze_analysis']
                    print(f"   👁️  Gaze Tracking: {'✅ Pupil detected' if gaze.get('pupil_detected') else '❌ No pupil'}")
                    if gaze.get('pupil_detected'):
                        direction = gaze.get('gaze_direction', [0, 0])
                        print(f"      Gaze Direction: ({direction[0]:.2f}, {direction[1]:.2f})")

                if enhanced.get('advanced_emotion'):
                    adv_emotion = enhanced['advanced_emotion']
                    print(f"   🧠 Advanced Emotion: {adv_emotion.get('emotion', 'N/A')} ({adv_emotion.get('confidence', 0):.2f})")

                if enhanced.get('temporal_analysis'):
                    temporal = enhanced['temporal_analysis']
                    state = temporal.get('cognitive_state', {})
                    print(f"   ⏱️  Cognitive State: {state.get('state', 'N/A')} ({state.get('confidence', 0):.2f})")

                if enhanced.get('performance_metrics'):
                    perf = enhanced['performance_metrics']
                    overall = perf.get('overall_performance', {})
                    print(f"   📈 Performance Rating: {overall.get('rating', 'N/A')}")

            print(f"\n💬 Summary: {result['human_readable']}")
            print("\n" + "="*60)

    except Exception as e:
        print(f"❌ Demo report generation failed: {e}")

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

    # Generate demo report
    await generate_demo_report()

    print("\n✅ Test suite completed!")
    print("\n💡 Note: This test uses placeholder data. For real analysis,")
    print("   integrate with actual camera frames and ensure dependencies are installed:")
    print("   pip install mediapipe opencv-python numpy scikit-learn scipy")

if __name__ == "__main__":
    asyncio.run(main())
