from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, ClassVar

from llm.embedding_client import EmbeddingClient


class HuggingFaceEmbeddingClient(EmbeddingClient):
    _model_cache: ClassVar[dict[tuple[str, str | None, str], Any]] = {}
    _model_locks: ClassVar[dict[tuple[str, str | None, str], asyncio.Lock]] = {}

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        cache_dir: str | None = None,
        device: str = "cpu",
        batch_size: int = 16,
        normalize_embeddings: bool = True,
    ) -> None:
        self.model_name = model_name
        self.cache_dir = cache_dir
        self.device = device
        self.batch_size = batch_size
        self.normalize_embeddings = normalize_embeddings

    async def embed_text(self, text: str) -> list[float]:
        embeddings = await self.embed_texts([text])
        return embeddings[0] if embeddings else []

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        model = await self._get_model()
        return await asyncio.to_thread(self._encode_texts, model, texts)

    async def _get_model(self):
        key = (self.model_name, self.cache_dir, self.device)
        if key in self._model_cache:
            return self._model_cache[key]

        lock = self._model_locks.setdefault(key, asyncio.Lock())
        async with lock:
            if key not in self._model_cache:
                self._model_cache[key] = await asyncio.to_thread(self._load_model)
        return self._model_cache[key]

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise RuntimeError(
                "The 'sentence-transformers' package is required for Hugging Face embeddings. "
                "Install project dependencies with `uv sync` in /Users/touqeershah/Documents/TerraLens/scraper_system."
            ) from exc

        if self.cache_dir:
            Path(self.cache_dir).mkdir(parents=True, exist_ok=True)

        return SentenceTransformer(
            self.model_name,
            cache_folder=self.cache_dir,
            device=self.device,
        )

    def _encode_texts(self, model, texts: list[str]) -> list[list[float]]:
        vectors = model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=self.normalize_embeddings,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [vector.tolist() for vector in vectors]
