from __future__ import annotations

import json
from typing import Any, Optional

import httpx

from llm.embedding_client import EmbeddingClient


class OllamaClient:
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        chat_model: str = "qwen2.5-coder:7b",
        embedding_model: str = "nomic-embed-text",
        timeout_seconds: int = 60,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.chat_model = chat_model
        self.embedding_model = embedding_model
        self.timeout_seconds = timeout_seconds

    async def chat_json(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        payload = {
            "model": self.chat_model,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": temperature,
            },
            "messages": [],
        }

        if system:
            payload["messages"].append({"role": "system", "content": system})
        payload["messages"].append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "{}")
        try:
            return json.loads(content)
        except Exception as exc:
            raise ValueError(f"Failed to parse Ollama JSON response: {exc}\nRaw: {content}") from exc

    async def embed(self, text: str) -> list[float]:
        payload = {
            "model": self.embedding_model,
            "prompt": text,
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/api/embeddings", json=payload)
            response.raise_for_status()
            data = response.json()

        embedding = data.get("embedding")
        if not isinstance(embedding, list):
            raise ValueError("Ollama embeddings response missing 'embedding' list.")
        return [float(x) for x in embedding]

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        embeddings: list[list[float]] = []
        for text in texts:
            embeddings.append(await self.embed(text))
        return embeddings


class OllamaEmbeddingClient(EmbeddingClient):
    def __init__(self, ollama: OllamaClient) -> None:
        self.ollama = ollama

    async def embed_text(self, text: str) -> list[float]:
        return await self.ollama.embed(text)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return await self.ollama.embed_many(texts)