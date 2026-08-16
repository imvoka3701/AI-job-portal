"""Deepseek API client for LLM-powered AI features."""

import httpx
from app.config import settings


class DeepseekClient:
    def __init__(self) -> None:
        self.base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(30.0, connect=10.0),
        )

    async def create_chat_completion(
        self,
        messages: list[dict[str, str]],
        model: str,
        response_format: dict | None = {"type": "json_object"},
    ) -> dict:
        payload = {
            "model": model,
            "messages": messages,
        }
        if response_format is not None:
            payload["response_format"] = response_format
        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        return response.json()


deepseek_client = DeepseekClient()
