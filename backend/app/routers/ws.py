"""WebSocket router — real-time duplex connections for notifications and live updates."""

import json
import logging

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.user import crud_user
from app.database import get_db
from app.models.user import User
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])


def authenticate_websocket_token(token: str | None, db: Session) -> User | None:
    """Validate JWT token passed in WebSocket query parameters."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
        user = crud_user.get_by_id(db, user_id=user_id)
        if user and user.is_active:
            return user
    except (JWTError, KeyError, ValueError, Exception) as exc:
        logger.debug("WebSocket auth failed: %s", exc)
        return None
    return None


@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str | None = Query(None),
    db: Session = Depends(get_db),
) -> None:
    """WebSocket endpoint for receiving real-time in-app notifications.

    Requires a valid JWT passed via `?token=<access_token>`.
    """
    user = authenticate_websocket_token(token, db)
    if not user:
        # 1008: Policy Violation (RFC 6455)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(websocket, user.id)
    try:
        # Send greeting acknowledging established connection
        await websocket.send_json(
            {
                "type": "connection_established",
                "user_id": user.id,
                "message": "Connected to real-time notification stream.",
            }
        )
        while True:
            raw_text = await websocket.receive_text()
            # Handle client-side heartbeat ping
            if raw_text == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    data = json.loads(raw_text)
                    if data.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except json.JSONDecodeError:
                    pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user.id)
    except Exception as exc:
        logger.debug("WebSocket error for user %s: %s", user.id, exc)
        ws_manager.disconnect(websocket, user.id)
