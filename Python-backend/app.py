from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager

# Load environment variables early so MINIMAL_BOOT reflects .env
load_dotenv()

# Minimal boot flag (now respects .env)
MINIMAL_BOOT = os.getenv("MINIMAL_BOOT", "false").lower() == "true"

# Conditional imports to avoid heavy deps in minimal mode
if not MINIMAL_BOOT:
    from database.connection import init_db, get_db, close_db
    from services.emotion_service import EmotionAnalysisService
    from services.attention_service import AttentionTrackingService
    from services.fatigue_service import FatigueDetectionService
    from services.adaptive_learning_service import AdaptiveLearningService
    from services.wellness_service import WellnessService
else:
    # Define lightweight stub services
    class EmotionAnalysisService:
        async def analyze_frame(self, frame: str):
            return {"emotion": "neutral", "confidence": 0.9}

    class AttentionTrackingService:
        async def track_attention(self, frame: str):
            return {"attention": 0.8, "confidence": 0.88}

    class FatigueDetectionService:
        async def detect_fatigue(self, frame: str):
            return {"fatigue": 0.2, "confidence": 0.9}

    class AdaptiveLearningService:
        pass

    class WellnessService:
        pass

from api.routes import emotion_router, attention_router, learning_router, wellness_router, analytics_router
from core.websocket_manager import WebSocketManager
from core.auth import verify_token
from database.logger import log_emotion, log_attention, log_fatigue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global services
emotion_service = None
attention_service = None
fatigue_service = None
adaptive_learning_service = None
wellness_service = None
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    global emotion_service, attention_service, fatigue_service, adaptive_learning_service, wellness_service
    
    try:
        # Initialize database (skip in minimal boot)
        if not MINIMAL_BOOT:
            await init_db()
            logger.info("✅ Database initialized")
        else:
            logger.info("⚙️ MINIMAL_BOOT enabled: skipping DB init")

        # Initialize services
        emotion_service = EmotionAnalysisService()
        attention_service = AttentionTrackingService()
        fatigue_service = FatigueDetectionService()
        adaptive_learning_service = AdaptiveLearningService()
        wellness_service = WellnessService()
        
        logger.info("✅ ML services initialized")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize application: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🔄 Shutting down application...")
        if not MINIMAL_BOOT:
            # Close MongoDB connection
            await close_db()

# Create FastAPI app
app = FastAPI(
    title="ACAWS Python Backend",
    description="AI/ML backend for Adaptive Cognitive Access & Wellness System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (allow configure via env, default to common dev ports)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:5173")
cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ACAWS Python Backend",
        "version": "1.0.0",
        "timestamp": "2024-01-01T00:00:00Z"
    }

# WebSocket endpoint for real-time processing
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time emotion and attention tracking"""
    await websocket_manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "frame_data":
                # Process frame data
                frame_data = data.get("frame")
                if frame_data:
                    # Analyze emotions
                    emotion_result = await emotion_service.analyze_frame(frame_data)
                    
                    # Track attention
                    attention_result = await attention_service.track_attention(frame_data)
                    
                    # Detect fatigue
                    fatigue_result = await fatigue_service.detect_fatigue(frame_data)
                    
                    # Persist all results (no auth context on WS; use session_id=client_id)
                    try:
                        await log_emotion(user_id=None, payload=emotion_result, session_id=client_id, source="websocket")
                    except Exception as e:
                        logger.error(f"WS log_emotion failed: {e}")
                    try:
                        await log_attention(user_id=None, payload=attention_result, session_id=client_id, source="websocket")
                    except Exception as e:
                        logger.error(f"WS log_attention failed: {e}")
                    try:
                        await log_fatigue(user_id=None, payload=fatigue_result, session_id=client_id, source="websocket")
                    except Exception as e:
                        logger.error(f"WS log_fatigue failed: {e}")

                    # Send results back
                    await websocket_manager.send_personal_message({
                        "type": "analysis_result",
                        "emotion": emotion_result,
                        "attention": attention_result,
                        "fatigue": fatigue_result
                    }, client_id)
                    
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)

# Include API routes
app.include_router(emotion_router, prefix="/api/emotion", tags=["Emotion Analysis"])
app.include_router(attention_router, prefix="/api/attention", tags=["Attention Tracking"])
app.include_router(learning_router, prefix="/api/learning", tags=["Adaptive Learning"])
app.include_router(wellness_router, prefix="/api/wellness", tags=["Wellness"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])

# Protected route example
@app.get("/api/protected")
async def protected_route(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Example protected route"""
    user = await verify_token(credentials.credentials)
    return {"message": f"Hello {user['name']}, this is a protected route!"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ACAWS Python Backend API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"🚀 Starting ACAWS Python Backend on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )