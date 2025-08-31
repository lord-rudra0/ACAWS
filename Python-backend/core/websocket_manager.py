import json
import logging
from typing import Dict, List
from fastapi import WebSocket
import asyncio

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manage WebSocket connections for real-time communication"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept new WebSocket connection"""
        try:
            await websocket.accept()
            self.active_connections[client_id] = websocket
            self.user_sessions[client_id] = {
                "connected_at": asyncio.get_event_loop().time(),
                "last_activity": asyncio.get_event_loop().time(),
                "message_count": 0
            }
            
            logger.info(f"✅ WebSocket connected: {client_id}")
            
            # Send welcome message
            await self.send_personal_message({
                "type": "connection_established",
                "message": "Connected to ACAWS real-time analysis",
                "client_id": client_id
            }, client_id)
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
    
    def disconnect(self, client_id: str):
        """Remove WebSocket connection"""
        try:
            if client_id in self.active_connections:
                del self.active_connections[client_id]
            
            if client_id in self.user_sessions:
                session_duration = asyncio.get_event_loop().time() - self.user_sessions[client_id]["connected_at"]
                logger.info(f"📊 WebSocket disconnected: {client_id}, Duration: {session_duration:.2f}s")
                del self.user_sessions[client_id]
                
        except Exception as e:
            logger.error(f"WebSocket disconnection error: {e}")
    
    async def send_personal_message(self, message: Dict, client_id: str):
        """Send message to specific client"""
        try:
            if client_id in self.active_connections:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
                
                # Update session activity
                if client_id in self.user_sessions:
                    self.user_sessions[client_id]["last_activity"] = asyncio.get_event_loop().time()
                    self.user_sessions[client_id]["message_count"] += 1
                
        except Exception as e:
            logger.error(f"Failed to send message to {client_id}: {e}")
            # Remove broken connection
            self.disconnect(client_id)
    
    async def broadcast_message(self, message: Dict):
        """Broadcast message to all connected clients"""
        try:
            disconnected_clients = []
            
            for client_id, websocket in self.active_connections.items():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send broadcast to {client_id}: {e}")
                    disconnected_clients.append(client_id)
            
            # Clean up disconnected clients
            for client_id in disconnected_clients:
                self.disconnect(client_id)
                
        except Exception as e:
            logger.error(f"Broadcast failed: {e}")
    
    async def send_to_room(self, message: Dict, room_id: str):
        """Send message to all clients in a specific room"""
        try:
            # In a full implementation, you'd track room memberships
            # For now, we'll broadcast to all connections
            await self.broadcast_message({
                **message,
                "room_id": room_id
            })
            
        except Exception as e:
            logger.error(f"Room message failed: {e}")
    
    def get_connection_stats(self) -> Dict:
        """Get WebSocket connection statistics"""
        try:
            current_time = asyncio.get_event_loop().time()
            
            stats = {
                "total_connections": len(self.active_connections),
                "active_sessions": len(self.user_sessions),
                "session_details": []
            }
            
            for client_id, session in self.user_sessions.items():
                session_duration = current_time - session["connected_at"]
                time_since_activity = current_time - session["last_activity"]
                
                stats["session_details"].append({
                    "client_id": client_id,
                    "duration": round(session_duration, 2),
                    "time_since_activity": round(time_since_activity, 2),
                    "message_count": session["message_count"],
                    "status": "active" if time_since_activity < 60 else "idle"
                })
            
            return stats
            
        except Exception as e:
            logger.error(f"Connection stats failed: {e}")
            return {"error": str(e)}
    
    async def cleanup_inactive_connections(self):
        """Clean up inactive WebSocket connections"""
        try:
            current_time = asyncio.get_event_loop().time()
            inactive_clients = []
            
            for client_id, session in self.user_sessions.items():
                time_since_activity = current_time - session["last_activity"]
                
                # Mark as inactive if no activity for 5 minutes
                if time_since_activity > 300:
                    inactive_clients.append(client_id)
            
            for client_id in inactive_clients:
                logger.info(f"🧹 Cleaning up inactive connection: {client_id}")
                self.disconnect(client_id)
                
        except Exception as e:
            logger.error(f"Connection cleanup failed: {e}")