import jwt
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "change_this_to_a_strong_random_secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE = os.getenv("JWT_EXPIRE", "7d")

async def verify_token(token: str) -> Dict:
    """Verify JWT token and return user data"""
    try:
        # Decode JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Handle both userId (from Express) and user_id (Python convention)
        user_id = payload.get("userId") or payload.get("user_id")
        if not user_id:
            raise Exception("Invalid token payload: Missing user ID")
        
        # Get user info from token or use defaults
        return {
            "id": user_id,
            "email": payload.get("email", ""),
            "name": payload.get("name", "User"),
            "role": payload.get("role", "student")
        }
        
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        raise Exception("Invalid token")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise Exception("Authentication failed")

def create_token(user_data: Dict) -> str:
    """Create JWT token for user"""
    try:
        payload = {
            "userId": user_data["id"],
            "email": user_data["email"],
            "name": user_data.get("name", "User"),
            "role": user_data.get("role", "student"),
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
        
    except Exception as e:
        logger.error(f"Token creation failed: {e}")
        raise Exception("Token creation failed")

def require_role(required_roles: List[str]):
    """Decorator to require specific user roles"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract credentials from kwargs
            credentials = kwargs.get("credentials")
            if not credentials:
                raise Exception("Authentication required")
            
            user = await verify_token(credentials.credentials)
            
            if user["role"] not in required_roles:
                raise Exception("Insufficient permissions")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator