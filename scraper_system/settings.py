from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Settings:
    # Browser
    headless: bool = False
    slow_mo_ms: int = 0
    timeout_ms: int = 30000

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "qwen2.5-coder:7b"
    ollama_embedding_model: str = "nomic-embed-text"

    # Embeddings
    embedding_provider: str = "huggingface"
    huggingface_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    huggingface_cache_dir: str | None = None
    huggingface_device: str = "cpu"
    huggingface_batch_size: int = 16

    # Network ranking
    endpoint_threshold: float = 6.5
    max_network_candidates: int = 100
    rerank_prefilter_limit: int = 12
    rerank_final_top_n: int = 5

    # Extraction
    default_max_items: int = 50
    default_max_steps: int = 10

    # Timing
    initial_settle_seconds: float = 1.0
    post_action_settle_seconds: float = 0.8


settings = Settings()
