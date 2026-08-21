"""Deepseek API client for LLM-powered AI features."""

import asyncio

import httpx
from app.config import settings


class DeepseekClient:
    def __init__(self) -> None:
        self.base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        # The httpx.AsyncClient binds to the event loop that is running when it
        # is created. Creating it once at import time (module singleton) means
        # it stays bound to whatever loop existed then; when a different loop
        # runs later (e.g. Starlette TestClient spins up a fresh loop per
        # request), the old client's connection pool raises
        # "RuntimeError: Event loop is closed". So we create the client lazily
        # and rebind it whenever the running loop changes or the client closed.
        self._client: httpx.AsyncClient | None = None
        self._client_loop: asyncio.AbstractEventLoop | None = None

    def _get_client(self) -> httpx.AsyncClient:
        loop = asyncio.get_running_loop()
        if self._client is None or self._client.is_closed or self._client_loop is not loop:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(30.0, connect=10.0),
            )
            self._client_loop = loop
        return self._client

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
        client = self._get_client()
        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        return response.json()


deepseek_client = DeepseekClient()
