from __future__ import annotations

from core.state_store import StateStore
from llm.ollama_client import OllamaClient
from llm.prompts import NETWORK_JUDGE_SYSTEM, build_network_judge_prompt
from models.network import NetworkCandidate
from models.requests import ScrapeRequest
from network.reranker import CandidateReranker


class NetworkJudgeAgent:
    def __init__(
        self,
        state: StateStore,
        reranker: CandidateReranker,
        ollama: OllamaClient,
    ) -> None:
        self.state = state
        self.reranker = reranker
        self.ollama = ollama

    async def judge(self, request: ScrapeRequest) -> dict:
        candidates = await self.state.get_network_candidates()
        ranked = await self.reranker.rerank(
            user_goal=request.user_goal,
            candidates=candidates,
            prefilter_limit=12,
            final_top_n=5,
        )
        if not ranked:
            return {"reason": "No candidates.", "best_ids": [], "prefer_api": False, "expected_mode": None}

        prompt = build_network_judge_prompt(request, ranked)
        data = await self.ollama.chat_json(prompt=prompt, system=NETWORK_JUDGE_SYSTEM, temperature=0.0)
        data["_ranked"] = ranked
        return data