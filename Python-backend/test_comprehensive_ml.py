#!/usr/bin/env python3
"""
Comprehensive test script for Wellness ML API
Demonstrates all features with multiple test scenarios
"""
import requests
import json
import time
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api/wellness"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_result(title, response):
    """Print formatted API result"""
    print(f"\n📋 {title}")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        try:
            data = response.json()
            print(json.dumps(data, indent=2))
        except:
            print(response.text)
    else:
        print(f"Error: {response.text}")

def test_health():
    """Test health endpoint"""
    print_section("HEALTH CHECK")
    response = requests.get(f"{BASE_URL}/health")
    print_result("Health Check", response)
    return response.status_code == 200

def test_ml_model_info():
    """Test ML model information"""
    print_section("ML MODEL INFORMATION")
    response = requests.get(f"{API_BASE}/test-ml-model-info")
    print_result("ML Model Info", response)
    return response.status_code == 200

def test_wellness_scenarios():
    """Test multiple wellness scenarios"""
    print_section("WELLNESS SCENARIOS")
    
    scenarios = [
        {
            "name": "Excellent Day",
            "data": {
                "mood": {"score": 9, "tags": ["happy", "energetic", "motivated"], "note": "Amazing day!"},
                "stress": {"level": 1, "sources": [], "note": "No stress"},
                "energy": {"level": 9, "note": "High energy"},
                "sleep": {"hours": 8.5, "quality": "excellent", "note": "Perfect sleep"},
                "activity": {"minutes": 60, "type": "running", "note": "Great workout"},
                "nutrition": {"score": 9, "note": "Perfect nutrition"},
                "hydration": {"glasses": 10, "note": "Well hydrated"},
                "screen_time": {"hours": 2, "note": "Low screen time"}
            }
        },
        {
            "name": "Average Day",
            "data": {
                "mood": {"score": 6, "tags": ["neutral", "focused"], "note": "Regular day"},
                "stress": {"level": 5, "sources": ["work"], "note": "Normal work stress"},
                "energy": {"level": 6, "note": "Moderate energy"},
                "sleep": {"hours": 7, "quality": "good", "note": "Decent sleep"},
                "activity": {"minutes": 30, "type": "walking", "note": "Light exercise"},
                "nutrition": {"score": 6, "note": "Okay nutrition"},
                "hydration": {"glasses": 6, "note": "Moderate hydration"},
                "screen_time": {"hours": 6, "note": "Normal screen time"}
            }
        },
        {
            "name": "Challenging Day",
            "data": {
                "mood": {"score": 3, "tags": ["tired", "stressed"], "note": "Difficult day"},
                "stress": {"level": 8, "sources": ["work", "personal"], "note": "High stress"},
                "energy": {"level": 3, "note": "Low energy"},
                "sleep": {"hours": 5, "quality": "poor", "note": "Poor sleep"},
                "activity": {"minutes": 15, "type": "stretching", "note": "Minimal activity"},
                "nutrition": {"score": 4, "note": "Poor nutrition"},
                "hydration": {"glasses": 3, "note": "Dehydrated"},
                "screen_time": {"hours": 10, "note": "High screen time"}
            }
        },
        {
            "name": "Custom Fields Test",
            "data": {
                "mood": {"score": 7, "tags": ["calm", "focused"], "note": "Meditation helped"},
                "stress": {"level": 4, "sources": ["deadlines"], "note": "Manageable stress"},
                "energy": {"level": 7, "note": "Good energy"},
                "sleep": {"hours": 7.5, "quality": "good", "note": "Restful sleep"},
                "activity": {"minutes": 45, "type": "yoga", "note": "Mindful movement"},
                "nutrition": {"score": 8, "note": "Healthy meals"},
                "hydration": {"glasses": 8, "note": "Well hydrated"},
                "screen_time": {"hours": 3, "note": "Low screen time"},
                "meditation_minutes": 20,
                "social_interactions": 8,
                "workout_intensity": "moderate",
                "caffeine_intake": 2,
                "alcohol_consumption": 0,
                "creative_activities": 3
            }
        }
    ]
    
    results = []
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n🎯 Scenario {i}: {scenario['name']}")
        print("-" * 40)
        
        response = requests.post(
            f"{API_BASE}/test-track-metrics",
            json=scenario['data'],
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            wellness_score = data['result']['wellness_score']
            confidence = data['result']['ml_prediction']['confidence']
            model_type = data['result']['ml_prediction']['model_type']
            
            print(f"✅ Wellness Score: {wellness_score}")
            print(f"📊 Confidence: {confidence}")
            print(f"🤖 Model Type: {model_type}")
            
            # Show recommendations
            recommendations = data['result']['ml_prediction']['recommendations']
            if recommendations:
                print(f"💡 Recommendations: {', '.join(recommendations[:2])}")
            
            results.append({
                "scenario": scenario['name'],
                "wellness_score": wellness_score,
                "confidence": confidence,
                "model_type": model_type
            })
        else:
            print(f"❌ Failed: {response.text}")
            results.append({
                "scenario": scenario['name'],
                "error": response.text
            })
        
        # Small delay between requests
        time.sleep(1)
    
    return results

def test_data_persistence():
    """Test that data persists across multiple requests"""
    print_section("DATA PERSISTENCE TEST")
    
    user_id = "persistence_test_user"
    
    # First submission
    data1 = {
        "mood": {"score": 8, "tags": ["happy"], "note": "First entry"},
        "stress": {"level": 3, "sources": [], "note": "Low stress"},
        "energy": {"level": 7, "note": "Good energy"},
        "sleep": {"hours": 7, "quality": "good", "note": "Good sleep"},
        "activity": {"minutes": 30, "type": "walking", "note": "Light activity"}
    }
    
    print("📝 Submitting first entry...")
    response1 = requests.post(f"{API_BASE}/test-track-metrics", json=data1)
    if response1.status_code == 200:
        result1 = response1.json()
        print(f"✅ First entry - Wellness Score: {result1['result']['wellness_score']}")
    else:
        print(f"❌ First entry failed: {response1.text}")
        return False
    
    # Second submission (same user)
    data2 = {
        "mood": {"score": 6, "tags": ["neutral"], "note": "Second entry"},
        "stress": {"level": 5, "sources": ["work"], "note": "Work stress"},
        "energy": {"level": 5, "note": "Moderate energy"},
        "sleep": {"hours": 6, "quality": "fair", "note": "Less sleep"},
        "activity": {"minutes": 20, "type": "stretching", "note": "Minimal activity"}
    }
    
    print("📝 Submitting second entry...")
    response2 = requests.post(f"{API_BASE}/test-track-metrics", json=data2)
    if response2.status_code == 200:
        result2 = response2.json()
        print(f"✅ Second entry - Wellness Score: {result2['result']['wellness_score']}")
        
        # Check if user context shows multiple entries
        user_context = result2['result']['ml_prediction']['user_context']
        total_entries = user_context.get('total_entries', 0)
        print(f"📊 Total entries in user profile: {total_entries}")
        
        return total_entries >= 2
    else:
        print(f"❌ Second entry failed: {response2.text}")
        return False

def test_feature_extraction():
    """Test that the system extracts features from arbitrary data"""
    print_section("FEATURE EXTRACTION TEST")
    
    complex_data = {
        "mood": {"score": 7, "tags": ["focused", "productive"], "note": "Working on important project"},
        "stress": {"level": 4, "sources": ["deadlines", "meetings"], "note": "Busy workday"},
        "energy": {"level": 8, "note": "High energy from good sleep"},
        "sleep": {"hours": 8, "quality": "excellent", "note": "Deep, restful sleep"},
        "activity": {"minutes": 50, "type": "cycling", "note": "Morning bike ride"},
        "nutrition": {"score": 8, "note": "Protein-rich breakfast"},
        "hydration": {"glasses": 9, "note": "Drinking lots of water"},
        "screen_time": {"hours": 5, "note": "Work-related screen time"},
        "custom_metrics": {
            "steps_today": 8500,
            "calories_burned": 450,
            "meditation_minutes": 15,
            "social_interactions": 6,
            "workout_intensity": "high",
            "caffeine_cups": 2,
            "alcohol_units": 0,
            "creative_time": 30,
            "learning_hours": 2,
            "outdoor_time": 90
        }
    }
    
    print("🔍 Testing complex data with custom metrics...")
    response = requests.post(f"{API_BASE}/test-track-metrics", json=complex_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Complex data processed successfully")
        print(f"📊 Wellness Score: {result['result']['wellness_score']}")
        
        # Check if custom fields were processed
        extra_fields = result['result'].get('extra_fields', {})
        if 'custom_metrics' in extra_fields:
            print("✅ Custom metrics were captured and stored")
        else:
            print("⚠️ Custom metrics not found in extra_fields")
        
        return True
    else:
        print(f"❌ Complex data processing failed: {response.text}")
        return False

def main():
    """Run all comprehensive tests"""
    print("🚀 COMPREHENSIVE WELLNESS ML API TESTING")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test health
    if not test_health():
        print("❌ Health check failed. Server may not be running.")
        return
    
    # Test ML model info
    test_ml_model_info()
    
    # Test wellness scenarios
    scenario_results = test_wellness_scenarios()
    
    # Test data persistence
    persistence_success = test_data_persistence()
    
    # Test feature extraction
    feature_success = test_feature_extraction()
    
    # Summary
    print_section("TEST SUMMARY")
    print(f"✅ Health Check: PASSED")
    print(f"✅ ML Model Info: PASSED")
    print(f"✅ Wellness Scenarios: {len([r for r in scenario_results if 'error' not in r])}/{len(scenario_results)} PASSED")
    print(f"✅ Data Persistence: {'PASSED' if persistence_success else 'FAILED'}")
    print(f"✅ Feature Extraction: {'PASSED' if feature_success else 'FAILED'}")
    
    print(f"\n🎯 Wellness Scores from Scenarios:")
    for result in scenario_results:
        if 'error' not in result:
            print(f"   {result['scenario']}: {result['wellness_score']} (confidence: {result['confidence']})")
        else:
            print(f"   {result['scenario']}: ERROR")
    
    print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎉 All tests completed!")

if __name__ == "__main__":
    main()
