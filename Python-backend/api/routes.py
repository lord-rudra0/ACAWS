from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging
from datetime import datetime
import os

# Import services or use lightweight stubs in minimal boot
MINIMAL_BOOT = os.getenv("MINIMAL_BOOT", "false").lower() == "true"

if not MINIMAL_BOOT:
    # Real services (may require heavy ML deps)
    from services.emotion_service import EmotionAnalysisService
    from services.attention_service import AttentionTrackingService
    from services.fatigue_service import FatigueDetectionService
    from services.adaptive_learning_service import AdaptiveLearningService
    from services.wellness_service import WellnessService
    from services.wellness_ml_model import wellness_ml_model
else:
    # Lightweight stubs to avoid heavy deps in minimal boot
    class EmotionAnalysisService:
        async def analyze_frame(self, frame: str):
            return {"emotion": "neutral", "confidence": 0.9}

        def get_emotion_trends(self, time_window: int = 5):
            return {"trend": "stable", "time_window": time_window}

    class AttentionTrackingService:
        async def track_attention(self, frame: str):
            return {"attention": 0.8, "confidence": 0.88}

        def get_attention_trends(self, time_window: int = 10):
            return {"trend": "improving", "time_window": time_window}

    class FatigueDetectionService:
        async def detect_fatigue(self, frame: str):
            return {"fatigue": 0.2, "confidence": 0.9}

    class AdaptiveLearningService:
        async def adapt_content(self, user_id: str, cognitive_state: Dict, current_content: Dict):
            return {"action": "adjust_difficulty", "new_level": cognitive_state.get("attention", 0.7)}

        async def generate_learning_path(self, user_id: str, subject: str, target_competency: str):
            return {"user_id": user_id, "subject": subject, "path": ["intro", "practice", "quiz"]}

        async def recommend_next_content(self, user_id: str, performance_data: Dict):
            return {"recommended": {"content_id": "demo-1", "type": "quiz"}}

    class WellnessService:
        async def track_wellness_metrics(self, user_id: str, metrics: Dict):
            return {"status": "tracked", "metrics": metrics}

        async def suggest_break_activities(self, user_id: str, current_state: Dict):
            return {"suggestions": ["stretch", "hydrate", "deep_breathing"]}

        async def generate_wellness_insights(self, user_id: str):
            return {"summary": {"mood": 7.0, "stress": 3.5, "energy": 7.5}}

# Authentication removed for development: verify_token intentionally not used
from database.connection import get_db
from database.logger import log_emotion, log_attention, log_generic

logger = logging.getLogger(__name__)

# Initialize routers
emotion_router = APIRouter()
attention_router = APIRouter()
learning_router = APIRouter()
wellness_router = APIRouter()
analytics_router = APIRouter()

# Service singletons (persist across requests)
try:
    emotion_service = EmotionAnalysisService()
    attention_service = AttentionTrackingService()
    adaptive_service = AdaptiveLearningService()
    wellness_service = WellnessService()
except Exception as e:
    logger.error(f"Service initialization failed: {e}")

# Pydantic models
class FrameData(BaseModel):
    frame: str
    timestamp: Optional[str] = None

class WellnessMetrics(BaseModel):
    mood: Optional[Dict] = {}
    stress: Optional[Dict] = {}
    energy: Optional[Dict] = {}
    sleep: Optional[Dict] = {}
    activity: Optional[Dict] = {}

class LearningContent(BaseModel):
    content_id: str
    difficulty_level: int
    content_type: str
    duration: int

class CognitiveState(BaseModel):
    attention: float
    confusion: float
    engagement: float
    fatigue: float

# Emotion Analysis Routes
@emotion_router.post("/analyze")
async def analyze_emotion(
    frame_data: FrameData
):
    """Analyze emotion from camera frame"""
    try:
        # Use shared singleton service instance
        result = await emotion_service.analyze_frame(frame_data.frame)

        # Persist full payload to MongoDB
        try:
            await log_emotion(user_id=None, payload=result, session_id=None, source="api")
        except Exception as e:
            logger.error(f"Emotion result persistence failed: {e}")
        
        return {
            "success": True,
            "data": result,
            "user_id": None
        }
        
    except Exception as e:
        logger.error(f"Emotion analysis endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@emotion_router.get("/trends/{user_id}")
async def get_emotion_trends(
    user_id: str,
    time_window: int = 5
):
    """Get emotion trends for user"""
    try:
        # Use shared singleton service instance
        trends = emotion_service.get_emotion_trends(time_window)
        
        return {
            "success": True,
            "data": trends,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Emotion trends endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Attention Tracking Routes
@attention_router.post("/track")
async def track_attention(
    frame_data: FrameData
):
    """Track attention from camera frame"""
    try:
        result = await attention_service.track_attention(frame_data.frame)

        # Persist full payload to MongoDB
        try:
            await log_attention(user_id=None, payload=result, session_id=None, source="api")
        except Exception as e:
            logger.error(f"Attention result persistence failed: {e}")
        
        return {
            "success": True,
            "data": result,
            "user_id": None
        }
        
    except Exception as e:
        logger.error(f"Attention tracking endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@attention_router.get("/trends/{user_id}")
async def get_attention_trends(
    user_id: str,
    time_window: int = 10
):
    """Get attention trends for user"""
    try:
        # Use shared singleton service instance
        trends = attention_service.get_attention_trends(time_window)
        
        return {
            "success": True,
            "data": trends,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Attention trends endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Adaptive Learning Routes
@learning_router.post("/adapt-content")
async def adapt_content(
    user_id: str,
    cognitive_state: CognitiveState,
    current_content: LearningContent
):
    """Adapt learning content based on cognitive state"""
    try:
        # Use shared singleton service instance
        result = await adaptive_service.adapt_content(
            user_id,
            cognitive_state.dict(),
            current_content.dict()
        )
        
        # Persist full payload
        try:
            await log_generic("learning_events", user_id=user_id, payload={
                "event": "adapt_content",
                "input": {
                    "cognitive_state": cognitive_state.dict(),
                    "current_content": current_content.dict()
                },
                "result": result
            })
        except Exception as e:
            logger.error(f"Adapt content persistence failed: {e}")

        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Content adaptation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@learning_router.post("/generate-path")
async def generate_learning_path(
    user_id: str,
    subject: str,
    target_competency: str
):
    """Generate personalized learning path"""
    try:
        # Use shared singleton service instance
        result = await adaptive_service.generate_learning_path(
            user_id, subject, target_competency
        )
        
        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Learning path generation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@learning_router.post("/recommend-content")
async def recommend_next_content(
    user_id: str,
    performance_data: Dict
):
    """Recommend next content based on performance"""
    try:
        # Use shared singleton service instance
        result = await adaptive_service.recommend_next_content(user_id, performance_data)
        
        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Content recommendation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Wellness Routes
@wellness_router.post("/track-metrics")
async def track_wellness_metrics(
    user_id: str,
    metrics: WellnessMetrics
):
    """Track comprehensive wellness metrics"""
    try:
        # Use shared singleton service instance
        result = await wellness_service.track_wellness_metrics(
            user_id, metrics.dict()
        )
        
        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Wellness tracking endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@wellness_router.post("/suggest-break")
async def suggest_break_activities(
    user_id: str,
    current_state: Dict
):
    """Suggest break activities based on current state"""
    try:
        # Use shared singleton service instance
        result = await wellness_service.suggest_break_activities(user_id, current_state)
        
        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Break suggestion endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@wellness_router.get("/insights/{user_id}")
async def get_wellness_insights(
    user_id: str
):
    """Get comprehensive wellness insights"""
    try:
        # Use shared singleton service instance
        result = await wellness_service.generate_wellness_insights(user_id)
        
        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Wellness insights endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get ML model information
@wellness_router.get("/ml-model-info")
async def get_ml_model_info():
    """Get information about the wellness ML model"""
    try:
        model_info = wellness_ml_model.get_model_info()

        return {
            "success": True,
            "model_info": model_info,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"ML model info endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint for ML model info (no auth required)
@wellness_router.get("/test-ml-model-info")
async def test_ml_model_info():
    """Test endpoint for ML model info (no authentication required)"""
    try:
        model_info = wellness_ml_model.get_model_info()
        
        return {
            "success": True,
            "model_info": model_info,
            "timestamp": datetime.now().isoformat(),
            "note": "This is a test endpoint - no authentication required"
        }
        
    except Exception as e:
        logger.error(f"Test ML model info endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint for tracking metrics (no auth required)
@wellness_router.post("/test-track-metrics")
async def test_track_wellness_metrics(metrics: dict):
    """Test endpoint for tracking wellness metrics (no authentication required)"""
    try:
        # Use a test user ID
        test_user_id = "test_user_123"
        
        # Track metrics and get ML prediction
        result = await wellness_service.track_wellness_metrics(test_user_id, metrics)
        
        return {
            "success": True,
            "user_id": test_user_id,
            "result": result,
            "timestamp": datetime.now().isoformat(),
            "note": "This is a test endpoint - no authentication required"
        }
        
    except Exception as e:
        logger.error(f"Test wellness metrics tracking failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Wellness prediction endpoint (no auth required for development)
@wellness_router.post("/predict")
async def predict_wellness(
    request_data: Dict
):
    """Predict wellness score using ML model"""
    try:
        user_id = request_data.get("user_id", "default_user")
        data = request_data.get("data", {})
        
        logger.info(f"🔮 Wellness prediction request for user {user_id}")
        logger.info(f"📊 Input data: {data}")
        
        # Use the wellness ML model directly for prediction
        prediction_result = wellness_ml_model.predict_wellness(user_id, data)
        
        logger.info(f"✅ Prediction result: {prediction_result}")
        
        return {
            "success": True,
            "wellness_score": prediction_result.get("wellness_score", 50),
            "confidence": prediction_result.get("confidence", 0.8),
            "model_type": prediction_result.get("model_type", "gradient_boosting"),
            "feature_importance": prediction_result.get("feature_importance", {}),
            "user_context": prediction_result.get("user_context", {}),
            "recommendations": prediction_result.get("recommendations", []),
            "trends": prediction_result.get("trends", {}),
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "input_features": list(data.keys())
        }
        
    except Exception as e:
        logger.error(f"❌ Wellness prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Export user wellness data
@wellness_router.get("/export-data/{user_id}")
async def export_user_wellness_data(
    user_id: str
):
    """Export user's wellness data for analysis"""
    try:
        # In dev mode, allow export without auth; production should re-enable checks
        user_data = wellness_ml_model.export_user_data(user_id)

        return {
            "success": True,
            "user_data": user_data,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Data export endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Retrain ML model (admin only)
@wellness_router.post("/retrain-model")
async def retrain_ml_model():
    """Retrain the wellness ML model (admin only)"""
    try:
        # In dev mode retraining is allowed without auth; production should require admin
        wellness_ml_model._retrain_model()

        return {
            "success": True,
            "message": "Model retraining initiated",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Model retraining endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Routes
@analytics_router.get("/dashboard/{user_id}")
async def get_analytics_dashboard(
    user_id: str,
    time_range: str = "week"
):
    """Get comprehensive analytics dashboard data"""
    try:
        # Aggregate data from shared singleton services

        # Get trends from each service
        emotion_trends = emotion_service.get_emotion_trends()
        attention_trends = attention_service.get_attention_trends()
        
        # Mock comprehensive analytics data
        dashboard_data = {
            "overview": {
                "total_study_time": 2847,  # minutes
                "average_attention": 87,
                "wellness_score": 85,
                "learning_progress": 92,
                "modules_completed": 12
            },
            "emotion_analytics": emotion_trends,
            "attention_analytics": attention_trends,
            "performance_metrics": {
                "quiz_scores": [85, 92, 78, 95, 88],
                "completion_rates": [100, 95, 100, 90, 100],
                "time_efficiency": [90, 85, 95, 88, 92]
            },
            "wellness_summary": {
                "mood_average": 7.2,
                "stress_average": 4.1,
                "energy_average": 7.8,
                "break_compliance": 85
            }
        }
        
        # Persist dashboard generation
        try:
            await log_generic("analytics_events", user_id=user_id, payload={
                "event": "dashboard",
                "time_range": time_range,
                "result": dashboard_data
            })
        except Exception as e:
            logger.error(f"Analytics dashboard persistence failed: {e}")

        return {
            "success": True,
            "data": dashboard_data,
            "time_range": time_range,
            "user_id": user_id,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Analytics dashboard endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@analytics_router.post("/generate-report")
async def generate_analytics_report(
    user_id: str,
    report_type: str,
    time_range: str
):
    """Generate comprehensive analytics report"""
    try:
        # Mock report generation
        report_data = {
            "report_id": f"report_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "user_id": user_id,
            "report_type": report_type,
            "time_range": time_range,
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_sessions": 45,
                "average_session_duration": 42,
                "overall_progress": 87,
                "wellness_trend": "improving"
            },
            "download_url": f"/api/reports/download/{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{report_type}"
        }
        
        # Persist report generation
        try:
            await log_generic("analytics_events", user_id=user_id, payload={
                "event": "generate_report",
                "report_type": report_type,
                "time_range": time_range,
                "result": report_data
            })
        except Exception as e:
            logger.error(f"Analytics report persistence failed: {e}")

        return {
            "success": True,
            "data": report_data
        }
        
    except Exception as e:
        logger.error(f"Report generation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))