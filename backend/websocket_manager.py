import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Any):
        """
        Broadcasts structured real-time events to all connected clients:
        - RESOURCE_UPDATED
        - EMERGENCY_CREATED
        - EMERGENCY_ACCEPTED
        - EMERGENCY_REJECTED
        - RESOURCE_RESERVED
        - EMERGENCY_CANCELLED
        """
        payload = json.dumps({
            "event": event_type,
            "data": data
        }, default=str)

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.append(connection)

        for dead_conn in disconnected:
            self.disconnect(dead_conn)


ws_manager = ConnectionManager()
