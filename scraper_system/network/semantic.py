from __future__ import annotations

from abc import ABC, abstractmethod
from math import sqrt
from typing import Sequence

from models.network import NetworkCandidate
from network.candidate_text import build_candidate_text


class SemanticScorer(ABC):
    @abstractmethod
    async def score_candidates(
        self,
        user_goal: str,
        candidates: list[NetworkCandidate],
    ) -> list[NetworkCandidate]:
        raise NotImplementedError


class NoOpSemanticScorer(SemanticScorer):
    async def score_candidates(
        self,
        user_goal: str,
        candidates: list[NetworkCandidate],
    ) -> list[NetworkCandidate]:
        for candidate in candidates:
            candidate.semantic_score = 0.0
        return candidates


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    dot = sum(x * y for x, y in zip(a, b))
    na = sqrt(sum(x * x for x in a))
    nb = sqrt(sum(y * y for y in b))

    if na == 0 or nb == 0:
        return 0.0

    return dot / (na * nb)


class EmbeddingSemanticScorer(SemanticScorer):
    def __init__(self, embedding_client) -> None:
        self.embedding_client = embedding_client

    async def score_candidates(
        self,
        user_goal: str,
        candidates: list[NetworkCandidate],
    ) -> list[NetworkCandidate]:
        if not candidates:
            return candidates

        goal_embedding = await self.embedding_client.embed_text(user_goal)
        candidate_texts = [build_candidate_text(c) for c in candidates]
        candidate_embeddings = await self.embedding_client.embed_texts(candidate_texts)

        for candidate, emb in zip(candidates, candidate_embeddings):
            sim = cosine_similarity(goal_embedding, emb)
            candidate.semantic_score = round(float(sim) * 10.0, 4)

        return candidates