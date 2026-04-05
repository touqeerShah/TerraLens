from __future__ import annotations

from core.state_store import StateStore
from models.network import NetworkCandidate
from network.reranker import CandidateReranker


class EndpointRankerAgent:
    def __init__(
        self,
        state: StateStore,
        reranker: CandidateReranker,
    ) -> None:
        self.state = state
        self.reranker = reranker

    async def rank_for_goal(
        self,
        user_goal: str,
        prefilter_limit: int = 12,
        final_top_n: int = 5,
    ) -> list[NetworkCandidate]:
        candidates = await self.state.get_network_candidates()
        ranked = await self.reranker.rerank(
            user_goal=user_goal,
            candidates=candidates,
            prefilter_limit=prefilter_limit,
            final_top_n=final_top_n,
        )
        return ranked

    async def promote_best_if_strong(
        self,
        user_goal: str,
        threshold: float = 6.5,
    ) -> NetworkCandidate | None:
        ranked = await self.rank_for_goal(user_goal=user_goal, prefilter_limit=12, final_top_n=3)
        if not ranked:
            return None

        best = ranked[0]
        if best.final_score >= threshold:
            await self.state.set_best_endpoint(best)
            return best

        return None