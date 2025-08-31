import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .connection import get_db

logger = logging.getLogger(__name__)


async def log_emotion(user_id: Optional[str], payload: Dict[str, Any], session_id: Optional[str] = None, source: str = "api"):
    db = get_db()
    if not db:
        return
    try:
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "source": source,  # api or websocket
            # include everything returned by the service
            **payload,
        }
        if "timestamp" not in doc:
            doc["timestamp"] = datetime.now().isoformat()
        await db["emotion_analyses"].insert_one(doc)
    except Exception as e:
        logger.error(f"log_emotion failed: {e}")


async def log_attention(user_id: Optional[str], payload: Dict[str, Any], session_id: Optional[str] = None, source: str = "api"):
    db = get_db()
    if not db:
        return
    try:
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "source": source,
            **payload,
        }
        if "timestamp" not in doc:
            doc["timestamp"] = datetime.now().isoformat()
        await db["attention_tracking"].insert_one(doc)
    except Exception as e:
        logger.error(f"log_attention failed: {e}")


async def log_fatigue(user_id: Optional[str], payload: Dict[str, Any], session_id: Optional[str] = None, source: str = "api"):
    db = get_db()
    if not db:
        return
    try:
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "source": source,
            **payload,
        }
        if "timestamp" not in doc:
            doc["timestamp"] = datetime.now().isoformat()
        await db["fatigue_detections"].insert_one(doc)
    except Exception as e:
        logger.error(f"log_fatigue failed: {e}")


async def log_generic(collection: str, user_id: Optional[str], payload: Dict[str, Any], session_id: Optional[str] = None, source: str = "api"):
    db = get_db()
    if not db:
        return
    try:
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "source": source,
            **payload,
        }
        if "timestamp" not in doc:
            doc["timestamp"] = datetime.now().isoformat()
        await db[collection].insert_one(doc)
    except Exception as e:
        logger.error(f"log_generic failed: {e}")
