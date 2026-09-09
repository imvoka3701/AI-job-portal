"""WebSocket Manager for real-time in-app notifications and event broadcasting."""

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class NotificationWebSocketManager:
    """Manages active WebSocket connections by user_id and broadcasts real-time events."""

    def __init__(self) -> None:
        # Maps user_id -> set of active WebSocket instances (supports multi-tab)
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        """Accept connection and register under user_id."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(
            "User %s connected via WebSocket (active sessions: %s)",
            user_id,
            len(self.active_connections[user_id]),
        )

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        """Remove disconnected socket."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info("User %s disconnected from WebSocket", user_id)

    async def send_personal_notification(
        self, user_id: int, payload: dict[str, Any]
    ) -> None:
        """Send JSON notification to all active sockets for a specific user."""
        if user_id not in self.active_connections:
            return
        dead_connections = []
        for connection in list(self.active_connections[user_id]):
            try:
                await connection.send_json(payload)
            except Exception as exc:
                logger.warning(
                    "Failed to send WebSocket message to user %s: %s", user_id, exc
                )
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead, user_id)

    async def broadcast_to_users(
        self, user_ids: list[int], payload: dict[str, Any]
    ) -> None:
        """Send JSON notification to multiple users."""
        for uid in user_ids:
            await self.send_personal_notification(uid, payload)

    def notify_user_sync(self, user_id: int, payload: dict[str, Any]) -> None:
        """Synchronous wrapper to safely schedule sending notifications from sync endpoints or threads."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.send_personal_notification(user_id, payload))
        except RuntimeError:
            try:
                asyncio.run(self.send_personal_notification(user_id, payload))
            except Exception as exc:
                logger.warning(
                    "Could not dispatch async WebSocket notification: %s", exc
                )


ws_manager = NotificationWebSocketManager()
