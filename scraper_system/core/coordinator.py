from __future__ import annotations

import asyncio
from typing import Any, Optional

from scraper_system.agents.action_planner_agent import ActionPlannerAgent
from scraper_system.agents.api_extractor_agent import APIExtractorAgent
from scraper_system.agents.dom_extractor_agent import DOMExtractorAgent
from scraper_system.agents.endpoint_ranker_agent import EndpointRankerAgent
from scraper_system.agents.network_collector_agent import NetworkCollectorAgent
from scraper_system.agents.page_observer_agent import PageObserverAgent
from scraper_system.core.browser_session import BrowserSession
from scraper_system.core.state_store import StateStore
from scraper_system.llm.ollama_client import OllamaClient, OllamaEmbeddingClient
from scraper_system.models.network import NetworkCandidate
from scraper_system.models.requests import ScrapeRequest
from scraper_system.network.replayer import NetworkReplayer
from scraper_system.network.reranker import CandidateReranker
from scraper_system.network.semantic import EmbeddingSemanticScorer
from scraper_system.rules.actions import ActionExecutionError, ActionExecutor
from scraper_system.rules.blockers import detect_blockers
from scraper_system.sites.profiles import resolve_site_profile
from scraper_system.sites.strategy import SiteStrategy


class ScrapeCoordinator:
    def __init__(
        self,
        request: ScrapeRequest,
        browser_session: BrowserSession,
        state_store: StateStore,
        ollama_base_url: str = "http://localhost:11434",
        ollama_chat_model: str = "qwen2.5:7b",
        ollama_embedding_model: str = "nomic-embed-text",
        endpoint_threshold: float = 6.5,
    ) -> None:
        self.request = request
        self.browser = browser_session
        self.state = state_store
        self.default_endpoint_threshold = endpoint_threshold

        self.site_profile = resolve_site_profile(request.url)
        self.site_strategy = SiteStrategy(self.site_profile)

        self.ollama = OllamaClient(
            base_url=ollama_base_url,
            chat_model=ollama_chat_model,
            embedding_model=ollama_embedding_model,
        )
        self.embedding_client = OllamaEmbeddingClient(self.ollama)
        self.semantic_scorer = EmbeddingSemanticScorer(self.embedding_client)
        self.reranker = CandidateReranker(self.semantic_scorer)

        self.network_agent = NetworkCollectorAgent(
            state=state_store,
            max_candidates=100,
        )
        self.endpoint_ranker_agent = EndpointRankerAgent(
            state=state_store,
            reranker=self.reranker,
        )
        self.replayer = NetworkReplayer()

        self.page_observer_agent = PageObserverAgent()
        self.action_planner_agent = ActionPlannerAgent(
            ollama=self.ollama,
            use_llm=True,
        )
        self.action_executor = ActionExecutor()
        self.dom_extractor_agent = DOMExtractorAgent()
        self.api_extractor_agent = APIExtractorAgent(self.replayer)

    async def run(self) -> dict[str, Any]:
        try:
            await self.browser.start()
            await self.network_agent.start(self.browser)

            await self.browser.goto(self.request.url)
            await self.browser.wait_for_network_idle()
            await asyncio.sleep(self.site_strategy.initial_wait_seconds())

            await self.state.add_debug_event(
                "site_profile_resolved",
                {
                    "profile": self.site_profile.name,
                    "family": self.site_profile.family,
                    "prefer_api_first": self.site_profile.prefer_api_first,
                    "prefer_dom_first": self.site_profile.prefer_dom_first,
                    "dom_fragile": self.site_profile.dom_fragile,
                    "api_likely_available": self.site_profile.api_likely_available,
                    "notes": self.site_profile.notes,
                },
            )

            for step in range(self.request.max_steps):
                observation = await self.page_observer_agent.observe(self.browser, step=step)
                await self.state.add_observation(observation)

                blockers = detect_blockers(observation)
                await self.state.add_debug_event(
                    "blockers_detected",
                    {"step": step, "blockers": blockers},
                )

                candidates = await self.state.get_network_candidates()
                decision = self.site_strategy.decide(
                    observation=observation,
                    step=step,
                    has_keyword=bool(self.request.keyword),
                    has_network_candidates=bool(candidates),
                )

                await self.state.add_debug_event(
                    "strategy_decision",
                    {
                        "step": step,
                        "try_dom_now": decision.try_dom_now,
                        "try_api_now": decision.try_api_now,
                        "endpoint_threshold": decision.endpoint_threshold,
                        "action_wait_seconds": decision.action_wait_seconds,
                        "reason": decision.reason,
                    },
                )

                if decision.try_dom_now:
                    dom_items = await self.dom_extractor_agent.extract(
                        self.browser,
                        max_items=self.request.max_items,
                    )
                    if dom_items:
                        await self.state.set_final_items(dom_items)
                        return {
                            "mode": "dom",
                            "status": "completed",
                            "step": step,
                            "site_profile": self.site_profile.name,
                            "items": dom_items,
                            "best_endpoint": None,
                        }

                if decision.try_api_now:
                    best_endpoint = await self.try_select_best_endpoint(
                        step=step,
                        threshold=decision.endpoint_threshold,
                    )
                    if best_endpoint:
                        api_items = await self.api_extractor_agent.extract(
                            self.browser,
                            best_endpoint,
                            max_items=self.request.max_items,
                        )
                        if api_items:
                            await self.state.set_final_items(api_items)
                            return {
                                "mode": "api",
                                "status": "completed",
                                "step": step,
                                "site_profile": self.site_profile.name,
                                "items": api_items,
                                "best_endpoint": best_endpoint.short_dict(),
                            }

                plan = await self.action_planner_agent.plan(
                    request=self.request,
                    observation=observation,
                    step=step,
                )
                await self.state.add_action(plan)

                await self.state.add_debug_event(
                    "action_plan",
                    {
                        "step": step,
                        "action_type": plan.action_type,
                        "reason": plan.reason,
                        "can_scrape_now": plan.can_scrape_now,
                        "can_continue": plan.can_continue,
                    },
                )

                if plan.can_scrape_now:
                    dom_items = await self.dom_extractor_agent.extract(
                        self.browser,
                        max_items=self.request.max_items,
                    )
                    if dom_items:
                        await self.state.set_final_items(dom_items)
                        return {
                            "mode": "dom",
                            "status": "completed",
                            "step": step,
                            "site_profile": self.site_profile.name,
                            "items": dom_items,
                            "best_endpoint": None,
                        }

                if not plan.can_continue:
                    break

                try:
                    await self.action_executor.execute(self.browser, plan)
                except ActionExecutionError as exc:
                    await self.state.add_debug_event(
                        "action_execution_error",
                        {
                            "step": step,
                            "action_type": plan.action_type,
                            "reason": str(exc),
                        },
                    )

                await asyncio.sleep((plan.wait_ms or 1200) / 1000)
                await asyncio.sleep(self.site_strategy.post_action_wait_seconds())

            best_endpoint = await self.try_select_best_endpoint(
                step=self.request.max_steps,
                threshold=self.site_strategy.endpoint_threshold(),
            )
            if best_endpoint:
                api_items = await self.api_extractor_agent.extract(
                    self.browser,
                    best_endpoint,
                    max_items=self.request.max_items,
                )
                if api_items:
                    await self.state.set_final_items(api_items)
                    return {
                        "mode": "api_late",
                        "status": "completed",
                        "step": self.request.max_steps,
                        "site_profile": self.site_profile.name,
                        "items": api_items,
                        "best_endpoint": best_endpoint.short_dict(),
                    }

            dom_items = await self.dom_extractor_agent.extract(
                self.browser,
                max_items=self.request.max_items,
            )
            await self.state.set_final_items(dom_items)

            return {
                "mode": "dom_fallback",
                "status": "completed",
                "step": self.request.max_steps,
                "site_profile": self.site_profile.name,
                "items": dom_items,
                "best_endpoint": (
                    self.state.best_endpoint.short_dict()
                    if self.state.best_endpoint
                    else None
                ),
            }

        finally:
            await self.browser.close()

    async def try_select_best_endpoint(
        self,
        step: int,
        threshold: float,
    ) -> Optional[NetworkCandidate]:
        try:
            best = await self.endpoint_ranker_agent.promote_best_if_strong(
                user_goal=self.request.user_goal,
                threshold=threshold,
            )

            if best:
                await self.state.add_debug_event(
                    "best_endpoint_selected",
                    {
                        "step": step,
                        "url": best.url,
                        "heuristic_score": best.heuristic_score,
                        "semantic_score": best.semantic_score,
                        "extractability_score": best.extractability_score,
                        "final_score": best.final_score,
                        "threshold_used": threshold,
                        "tags": best.tags,
                        "notes": best.notes[:20],
                    },
                )
            else:
                top = await self.endpoint_ranker_agent.rank_for_goal(
                    user_goal=self.request.user_goal,
                    prefilter_limit=12,
                    final_top_n=3,
                )
                await self.state.add_debug_event(
                    "endpoint_rank_summary",
                    {
                        "step": step,
                        "threshold_used": threshold,
                        "top_candidates": [c.short_dict() for c in top],
                    },
                )

            return best

        except Exception as exc:
            await self.state.add_debug_event(
                "endpoint_ranker_error",
                {
                    "step": step,
                    "error": str(exc),
                },
            )
            return None