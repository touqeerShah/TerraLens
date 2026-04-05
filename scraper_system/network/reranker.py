from __future__ import annotations

from models.network import NetworkCandidate
from network.scorer import (
    combine_candidate_scores,
    score_candidate_endpoint_heuristic,
    score_candidate_extractability,
)
from network.semantic import SemanticScorer


class CandidateReranker:
    def __init__(self, semantic_scorer: SemanticScorer) -> None:
        self.semantic_scorer = semantic_scorer

    async def rerank(
        self,
        user_goal: str,
        candidates: list[NetworkCandidate],
        prefilter_limit: int = 12,
        final_top_n: int = 5,
    ) -> list[NetworkCandidate]:
        if not candidates:
            return []

        for candidate in candidates:
            score_candidate_endpoint_heuristic(candidate)
            score_candidate_extractability(candidate)
            combine_candidate_scores(
                candidate,
                heuristic_weight=0.65,
                semantic_weight=0.0,
                extractability_weight=0.35,
            )

        prefiltered = sorted(
            candidates,
            key=lambda c: c.final_score,
            reverse=True,
        )[:prefilter_limit]

        await self.semantic_scorer.score_candidates(user_goal, prefiltered)

        for candidate in prefiltered:
            combine_candidate_scores(
                candidate,
                heuristic_weight=0.35,
                semantic_weight=0.35,
                extractability_weight=0.30,
            )

        return sorted(
            prefiltered,
            key=lambda c: c.final_score,
            reverse=True,
        )[:final_top_n]
