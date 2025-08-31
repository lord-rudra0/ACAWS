from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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

from core.auth import verify_token

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Initialize routers
emotion_router = APIRouter()
attention_router = APIRouter()
learning_router = APIRouter()
wellness_router = APIRouter()
analytics_router = APIRouter()

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
    frame_data: FrameData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze emotion from camera frame"""
    try:
        user = await verify_token(credentials.credentials)
        
        # Get emotion service instance
        emotion_service = EmotionAnalysisService()
        
        # Analyze frame
        result = await emotion_service.analyze_frame(frame_data.frame)
        
        return {
            "success": True,
            "data": result,
            "user_id": user["id"]
        }
        
    except Exception as e:
        logger.error(f"Emotion analysis endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@emotion_router.get("/trends/{user_id}")
async def get_emotion_trends(
    user_id: str,
    time_window: int = 5,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get emotion trends for user"""
    try:
        user = await verify_token(credentials.credentials)
        
        emotion_service = EmotionAnalysisService()
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
    frame_data: FrameData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Track attention from camera frame"""
    try:
        user = await verify_token(credentials.credentials)
        
        attention_service = AttentionTrackingService()
        result = await attention_service.track_attention(frame_data.frame)
        
        return {
            "success": True,
            "data": result,
            "user_id": user["id"]
        }
        
    except Exception as e:
        logger.error(f"Attention tracking endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@attention_router.get("/trends/{user_id}")
async def get_attention_trends(
    user_id: str,
    time_window: int = 10,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get attention trends for user"""
    try:
        user = await verify_token(credentials.credentials)
        
        attention_service = AttentionTrackingService()
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
    current_content: LearningContent,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Adapt learning content based on cognitive state"""
    try:
        user = await verify_token(credentials.credentials)
        
        adaptive_service = AdaptiveLearningService()
        
        result = await adaptive_service.adapt_content(
            user_id,
            cognitive_state.dict(),
            current_content.dict()
        )
        
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
    target_competency: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate personalized learning path"""
    try:
        user = await verify_token(credentials.credentials)
        
        adaptive_service = AdaptiveLearningService()
        
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
    performance_data: Dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Recommend next content based on performance"""
    try:
        user = await verify_token(credentials.credentials)
        
        adaptive_service = AdaptiveLearningService()
        
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
    metrics: WellnessMetrics,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Track comprehensive wellness metrics"""
    try:
        user = await verify_token(credentials.credentials)
        
        wellness_service = WellnessService()
        
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
    current_state: Dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Suggest break activities based on current state"""
    try:
        user = await verify_token(credentials.credentials)
        
        wellness_service = WellnessService()
        
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
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get comprehensive wellness insights"""
    try:
        user = await verify_token(credentials.credentials)
        
        wellness_service = WellnessService()
        
        result = await wellness_service.generate_wellness_insights(user_id)
        
        return {
            "success": True,
            "data": result,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Wellness insights endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Routes
@analytics_router.get("/dashboard/{user_id}")
async def get_analytics_dashboard(
    user_id: str,
    time_range: str = "week",
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get comprehensive analytics dashboard data"""
    try:
        user = await verify_token(credentials.credentials)
        
        # Aggregate data from all services
        emotion_service = EmotionAnalysisService()
        attention_service = AttentionTrackingService()
        wellness_service = WellnessService()
        adaptive_service = AdaptiveLearningService()
        
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
    time_range: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate comprehensive analytics report"""
    try:
        user = await verify_token(credentials.credentials)
        
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
        
        return {
            "success": True,
            "data": report_data
        }
        
    except Exception as e:
        logger.error(f"Report generation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))