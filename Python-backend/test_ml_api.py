#!/usr/bin/env python3
"""
Test script for Wellness ML API endpoints
"""
import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api/wellness"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_ml_model_info():
    """Test ML model info endpoint"""
    try:
        response = requests.get(f"{API_BASE}/ml-model-info")
        print(f"\n✅ ML Model Info: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"❌ ML Model Info failed: {e}")
        return False

def test_track_metrics():
    """Test wellness metrics tracking with ML prediction"""
    test_data = {
        "mood": {
            "score": 8,
            "tags": ["happy", "focused", "motivated"],
            "note": "Feeling great about today's progress!"
        },
        "stress": {
            "level": 2,
            "sources": ["work", "deadlines"],
            "note": "Manageable stress levels"
        },
        "energy": {
            "level": 7,
            "note": "Good energy throughout the day"
        },
        "sleep": {
            "hours": 7.5,
            "quality": "good",
            "note": "Restful sleep"
        },
        "activity": {
            "minutes": 45,
            "type": "walking",
            "note": "Morning walk in the park"
        },
        "nutrition": {
            "score": 8,
            "meals": ["breakfast", "lunch", "dinner"],
            "note": "Balanced meals today"
        },
        "hydration": {
            "glasses": 8,
            "note": "Well hydrated"
        },
        "screen_time": {
            "hours": 4,
            "note": "Moderate screen usage"
        },
        "custom_field": {
            "meditation_minutes": 15,
            "social_interactions": 5
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/track-metrics", json=test_data)
        print(f"\n✅ Track Metrics: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"❌ Track Metrics failed: {e}")
        return False

def test_user_data_export():
    """Test user data export"""
    try:
        response = requests.get(f"{API_BASE}/export-user-data")
        print(f"\n✅ User Data Export: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"❌ User Data Export failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Wellness ML API...")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("❌ Server not running. Please start the server first.")
        return
    
    # Wait a moment for server to be ready
    time.sleep(1)
    
    # Test ML model info
    test_ml_model_info()
    
    # Test tracking metrics
    test_track_metrics()
    
    # Test user data export
    test_user_data_export()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    main()
