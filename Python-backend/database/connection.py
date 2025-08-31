import os
import logging
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logger = logging.getLogger(__name__)

# MongoDB configuration (aligns with Express backend)
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "acaws")

# Global client/db handles
_mongo_client: AsyncIOMotorClient | None = None
_mongo_db = None

async def init_db():
    """Initialize MongoDB connection and verify connectivity."""
    global _mongo_client, _mongo_db
    try:
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI is not set in environment")

        _mongo_client = AsyncIOMotorClient(MONGODB_URI)
        # Ping to verify connection
        await _mongo_client.admin.command("ping")
        _mongo_db = _mongo_client[MONGODB_DB_NAME]
        logger.info(f"✅ Connected to MongoDB database: {MONGODB_DB_NAME}")
    except Exception as e:
        logger.error(f"❌ MongoDB initialization failed: {e}")
        raise

def get_db():
    """Get the MongoDB database handle."""
    return _mongo_db

async def close_db():
    """Close MongoDB connection."""
    global _mongo_client
    try:
        if _mongo_client:
            _mongo_client.close()
            _mongo_client = None
            logger.info("🔌 MongoDB connection closed")
    except Exception as e:
        logger.error(f"MongoDB close error: {e}")