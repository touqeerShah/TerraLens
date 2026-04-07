from __future__ import annotations

import asyncio
from dataclasses import asdict
from urllib.parse import urlparse

from agents.action_planner_agent import ActionPlannerAgent
from agents.api_extractor_agent import APIExtractorAgent
from agents.dom_extractor_agent import DOMExtractorAgent
from agents.dom_html_judge_agent import DOMHTMLJudgeAgent
from agents.fast_preplanner_agent import FastPrePlannerAgent
from agents.html_extractor_agent import HTMLExtractorAgent
from agents.network_collector_agent import NetworkCollectorAgent
from agents.network_judge_agent import NetworkJudgeAgent
from agents.page_observer_agent import PageObserverAgent
from agents.recipe_cache_agent import RecipeCacheAgent
from core.browser_session import BrowserSession
from core.state_store import StateStore
from debug.debug_trace import StepTrace
from llm.huggingface_embedding_client import HuggingFaceEmbeddingClient
from llm.ollama_client import OllamaClient, OllamaEmbeddingClient
from models.requests import ScrapeRequest
from network.replayer import NetworkReplayer
from network.reranker import CandidateReranker
from network.semantic import EmbeddingSemanticScorer
from rules.actions import ActionExecutionError, ActionExecutor
from rules.blockers import detect_blockers
from settings import settings


class ScrapeCoordinator:
    def __init__(
        self,
        request: ScrapeRequest,
        browser_session: BrowserSession,
        state_store: StateStore,
    ) -> None:
        self.request = request
        self.browser = browser_session
        self.state = state_store

        self.ollama = OllamaClient(
            base_url=settings.ollama_base_url,
            chat_model=settings.ollama_chat_model,
            embedding_model=settings.ollama_embedding_model,
        )
        self.embedding_provider = settings.embedding_provider.strip().lower()
        self.embedding_client = self._build_embedding_client()
        self.semantic_scorer = EmbeddingSemanticScorer(self.embedding_client)
        self.reranker = CandidateReranker(self.semantic_scorer)

        self.observer = PageObserverAgent()
        self.network_collector = NetworkCollectorAgent(state_store, max_candidates=100)
        self.network_judge = NetworkJudgeAgent(state_store, self.reranker, self.ollama)
        self.dom_html_judge = DOMHTMLJudgeAgent(self.observer, self.ollama)
        self.action_planner = ActionPlannerAgent(self.ollama)
        self.fast_preplanner = FastPrePlannerAgent()
        self.action_executor = ActionExecutor()
        self.replayer = NetworkReplayer()
        self.api_extractor = APIExtractorAgent(self.replayer)
        self.dom_extractor = DOMExtractorAgent()
        self.html_extractor = HTMLExtractorAgent()
        self.recipe_cache = RecipeCacheAgent(self.state)

    async def run(self) -> dict:
        page_signature = self._page_signature(self.request.url)

        try:
            await self.browser.start()
            await self.network_collector.start(self.browser)
            await self.browser.goto(self.request.url)
            await self.browser.wait_for_network_idle()
            await asyncio.sleep(1.0)

            await self.state.add_debug_event(
                "embedding_backend",
                {
                    "provider": self.embedding_provider,
                    "model": self._embedding_model_name(),
                },
            )

            cached_recipe_obj = await self.recipe_cache.get_recipe(page_signature)
            cached_recipe_payload = self.recipe_cache.build_cached_recipe_prompt_payload(
                cached_recipe_obj
            )

            for step in range(self.request.max_steps):
                trace = StepTrace(
                    step=step,
                    page_signature=page_signature,
                )

                observation = await self.observer.observe(self.browser, step)
                await self.state.add_observation(observation)

                blockers = detect_blockers(observation)
                compact_packet = self.observer.build_compact_packet(observation)
                top_candidates = await self.state.get_top_network_candidates(limit=5)
                network_summary = [c.short_dict() for c in top_candidates]

                trace.blockers = blockers[:5]
                trace.page_url = observation.url
                trace.page_title = observation.title
                trace.cache_checked = True
                trace.cache_hit = cached_recipe_obj is not None
                trace.cache_recipe_used = cached_recipe_payload
                trace.network_summary = network_summary[:5]
                trace.observation_packet = {
                    "headings": compact_packet.get("headings", [])[:5],
                    "buttons": compact_packet.get("buttons", [])[:5],
                    "inputs": compact_packet.get("inputs", [])[:5],
                    "selects": compact_packet.get("selects", [])[:5],
                    "tabs": compact_packet.get("tabs", [])[:5],
                    "chips": compact_packet.get("chips", [])[:5],
                    "active_filters": compact_packet.get("active_filters", [])[:5],
                    "result_counts": compact_packet.get("result_counts", [])[:5],
                    "dialogs": compact_packet.get("dialogs", [])[:3],
                }
                trace.observation_summary = {
                    "results_visible": compact_packet.get("results_visible"),
                    "buttons_count": len(compact_packet.get("buttons", [])),
                    "inputs_count": len(compact_packet.get("inputs", [])),
                    "links_count": len(compact_packet.get("links", [])),
                    "selects_count": len(compact_packet.get("selects", [])),
                    "tabs_count": len(compact_packet.get("tabs", [])),
                    "filters_count": len(compact_packet.get("filters", [])),
                    "dialogs_count": len(compact_packet.get("dialogs", [])),
                }
                trace.debug_notes.append(
                    f"Observed page '{observation.title}' with results_visible={compact_packet.get('results_visible')}."
                )

                await self.state.add_debug_event(
                    "step_observation",
                    {
                        "step": step,
                        "url": observation.url,
                        "title": observation.title,
                        "observation_summary": trace.observation_summary,
                        "observation_packet": trace.observation_packet,
                    },
                )

                if blockers:
                    await self.state.add_debug_event(
                        "blockers_detected",
                        {
                            "step": step,
                            "blockers": blockers[:5],
                        },
                    )

                last_actions = [
                    {
                        "action_type": self._history_value(a, "action_type"),
                        "reason": self._history_value(a, "reason"),
                        "value": self._history_value(a, "value"),
                        "target_text": self._history_value(a, "target_text"),
                        "target_label": self._history_value(a, "target_label"),
                    }
                    for a in self.state.action_history[-3:]
                ]

                decision = await self.action_planner.plan(
                    request=self.request,
                    observation_packet=compact_packet,
                    last_actions=last_actions,
                    blockers=blockers,
                    network_summary=network_summary,
                    cached_recipe=cached_recipe_payload,
                )
                trace.planner_source = "llm_planner"
                trace.planner_request = self.action_planner.last_prompt
                trace.planner_raw_response = self.action_planner.last_raw_response
                trace.debug_notes.append("LLM planner evaluated the current page state.")

                await self.state.add_debug_event(
                    "llm_planner_io",
                    {
                        "step": step,
                        "prompt_payload": self.action_planner.last_prompt,
                        "raw_response": self.action_planner.last_raw_response,
                    },
                )

                if self._decision_is_weak(decision):
                    fallback = self.fast_preplanner.plan(
                        request=self.request,
                        observation_packet=compact_packet,
                        blockers=blockers,
                        last_actions=last_actions,
                    )
                    if fallback is not None:
                        decision = fallback
                        trace.planner_source = "fast_preplanner_fallback"
                        trace.debug_notes.append(
                            "Fallback preplanner replaced weak or empty LLM decision."
                        )
                        await self.state.add_debug_event(
                            "planner_fallback_used",
                            {
                                "step": step,
                                "reason": fallback.reason,
                                "results_ready": fallback.results_ready,
                                "actions": [
                                    {
                                        "action_type": a.action_type,
                                        "target_text": a.target.text if a.target else None,
                                        "target_label": a.target.label if a.target else None,
                                        "value": a.value,
                                        "wait_ms": a.wait_ms,
                                    }
                                    for a in fallback.actions
                                ],
                            },
                        )

                trace.planner_reason = decision.reason
                trace.results_ready = decision.results_ready
                trace.actions_planned = [
                    {
                        "action_type": a.action_type,
                        "target_text": a.target.text if a.target else None,
                        "target_label": a.target.label if a.target else None,
                        "target_placeholder": a.target.placeholder if a.target else None,
                        "value": a.value,
                        "wait_ms": a.wait_ms,
                    }
                    for a in decision.actions
                ]
                trace.debug_notes.append(
                    f"Planner chose source={trace.planner_source} with {len(decision.actions)} action(s); results_ready={decision.results_ready}."
                )

                await self.state.add_debug_event(
                    "planner_decision",
                    {
                        "step": step,
                        "planner_source": trace.planner_source,
                        "reason": decision.reason,
                        "results_ready": decision.results_ready,
                        "should_continue": decision.should_continue,
                        "api_shortlist_ids": decision.api_shortlist_ids,
                        "extraction_mode": (
                            decision.extraction_plan.mode
                            if decision.extraction_plan
                            else None
                        ),
                    },
                )

                if decision.actions:
                    try:
                        executed = await self.action_executor.execute_many(
                            self.browser, decision.actions
                        )
                        trace.actions_executed = executed
                        trace.debug_notes.append(
                            f"Executed {len(executed)} action(s) for step {step}."
                        )
                        for action in decision.actions[:3]:
                            await self.state.add_action(
                                {
                                    "action_type": action.action_type,
                                    "reason": decision.reason,
                                    "value": action.value,
                                    "target_text": action.target.text if action.target else None,
                                    "target_label": action.target.label if action.target else None,
                                    "target_placeholder": (
                                        action.target.placeholder if action.target else None
                                    ),
                                }
                            )
                        await self.state.add_debug_event(
                            "actions_executed",
                            {
                                "step": step,
                                "executed": executed,
                            },
                        )
                    except ActionExecutionError as exc:
                        trace.errors.append(str(exc))
                        trace.debug_notes.append(
                            f"Action execution error: {str(exc)}"
                        )
                        await self.state.add_debug_event(
                            "action_execution_error",
                            {"step": step, "error": str(exc)},
                        )

                    await self.state.add_step_trace(asdict(trace))
                    await asyncio.sleep(1.2)
                    continue

                if decision.results_ready:
                    network_task = asyncio.create_task(
                        self.network_judge.judge(self.request)
                    )
                    dom_html_task = asyncio.create_task(
                        self.dom_html_judge.judge(self.browser, self.request)
                    )
                    network_result, dom_html_result = await asyncio.gather(
                        network_task, dom_html_task
                    )

                    await self.state.add_debug_event(
                        "network_judge_result",
                        {"step": step, **network_result},
                    )
                    await self.state.add_debug_event(
                        "dom_html_judge_result",
                        {"step": step, **dom_html_result},
                    )

                    trace.network_judge_result = network_result
                    trace.dom_html_judge_result = dom_html_result
                    trace.debug_notes.append(
                        "Extraction judges evaluated API and DOM/HTML options."
                    )

                    chosen_mode = self._choose_mode(
                        decision, network_result, dom_html_result
                    )
                    trace.chosen_mode = chosen_mode
                    trace.debug_notes.append(
                        f"Chosen extraction mode: {chosen_mode}."
                    )

                    if chosen_mode == "api":
                        best_id = next(iter(network_result.get("best_ids", [])), None)
                        candidate = None
                        if best_id:
                            candidates = await self.state.get_network_candidates()
                            candidate = next(
                                (c for c in candidates if c.request_id == best_id), None
                            )

                        if candidate:
                            items = await self.api_extractor.extract(
                                self.browser,
                                candidate,
                                max_items=self.request.max_items,
                            )
                            if items:
                                trace.extraction_success = True
                                trace.extraction_result_count = len(items)
                                trace.debug_notes.append(
                                    f"API extraction succeeded with {len(items)} item(s)."
                                )

                                await self.recipe_cache.save_success_recipe(
                                    page_signature=page_signature,
                                    actions=trace.actions_planned,
                                    preferred_extraction_mode="api",
                                    known_good_endpoint_patterns=[candidate.url],
                                )
                                if trace.cache_hit:
                                    await self.recipe_cache.mark_recipe_use_success(
                                        page_signature
                                    )

                                await self.state.set_final_items(items)
                                await self.state.add_step_trace(asdict(trace))
                                return {"mode": "api", "items": items, "step": step}

                    if chosen_mode == "html":
                        section_hint = None
                        field_hints = {}

                        if decision.extraction_plan:
                            section_hint = decision.extraction_plan.html_section_hint
                            field_hints = decision.extraction_plan.field_hints or {}

                        if not section_hint:
                            section_hint = dom_html_result.get("html_section_hint")
                        if not field_hints:
                            field_hints = dom_html_result.get("field_hints", {}) or {}

                        items = await self.html_extractor.extract(
                            self.browser,
                            max_items=self.request.max_items,
                            section_hint=section_hint,
                            field_hints=field_hints,
                        )
                        if items:
                            trace.extraction_success = True
                            trace.extraction_result_count = len(items)
                            trace.debug_notes.append(
                                f"HTML extraction succeeded with {len(items)} item(s)."
                            )

                            await self.recipe_cache.save_success_recipe(
                                page_signature=page_signature,
                                actions=trace.actions_planned,
                                preferred_extraction_mode="html",
                                known_good_endpoint_patterns=[],
                            )
                            if trace.cache_hit:
                                await self.recipe_cache.mark_recipe_use_success(
                                    page_signature
                                )

                            await self.state.set_final_items(items)
                            await self.state.add_step_trace(asdict(trace))
                            return {"mode": "html", "items": items, "step": step}

                    container_hint = None
                    field_hints = {}

                    if decision.extraction_plan:
                        container_hint = decision.extraction_plan.container_hint
                        field_hints = decision.extraction_plan.field_hints or {}

                    if not container_hint:
                        container_hint = dom_html_result.get("container_hint")
                    if not field_hints:
                        field_hints = dom_html_result.get("field_hints", {}) or {}

                    items = await self.dom_extractor.extract(
                        self.browser,
                        max_items=self.request.max_items,
                        container_hint=container_hint,
                        field_hints=field_hints,
                    )
                    if items:
                        trace.extraction_success = True
                        trace.extraction_result_count = len(items)
                        trace.debug_notes.append(
                            f"DOM extraction succeeded with {len(items)} item(s)."
                        )

                        await self.recipe_cache.save_success_recipe(
                            page_signature=page_signature,
                            actions=trace.actions_planned,
                            preferred_extraction_mode="dom",
                            known_good_endpoint_patterns=[],
                        )
                        if trace.cache_hit:
                            await self.recipe_cache.mark_recipe_use_success(
                                page_signature
                            )

                        await self.state.set_final_items(items)
                        await self.state.add_step_trace(asdict(trace))
                        return {"mode": "dom", "items": items, "step": step}

                    trace.errors.append(
                        f"Extraction failed after judges chose mode '{chosen_mode}'."
                    )
                    trace.debug_notes.append(
                        f"Extraction failed after judges chose mode '{chosen_mode}'."
                    )
                    if trace.cache_hit:
                        await self.recipe_cache.mark_recipe_use_failure(page_signature)
                    await self.state.add_step_trace(asdict(trace))

                if not decision.should_continue:
                    trace.debug_notes.append(
                        "Planner indicated the interaction loop should stop."
                    )
                    await self.state.add_step_trace(asdict(trace))
                    break

            latest_observation = await self.state.latest_observation()
            if latest_observation and latest_observation.can_scrape_now:
                items = await self.dom_extractor.extract(
                    self.browser,
                    max_items=self.request.max_items,
                )
                await self.state.set_final_items(items)
                await self.state.add_debug_event(
                    "fallback_extraction",
                    {
                        "step": self.request.max_steps,
                        "mode": "dom_fallback",
                        "items_count": len(items),
                    },
                )
                return {
                    "mode": "fallback",
                    "items": items,
                    "step": self.request.max_steps,
                }

            await self.state.add_debug_event(
                "goal_completion_incomplete",
                {
                    "step": self.request.max_steps,
                    "reason": "Interaction loop ended before a results-ready state was observed.",
                },
            )
            await self.state.set_final_items([])
            return {
                "mode": "incomplete",
                "items": [],
                "step": self.request.max_steps,
            }

        finally:
            await self.browser.close()

    def _choose_mode(
        self,
        planner_decision,
        network_result: dict,
        dom_html_result: dict,
    ) -> str:
        if (
            planner_decision.extraction_plan
            and planner_decision.extraction_plan.mode in {"api", "dom", "html"}
        ):
            return planner_decision.extraction_plan.mode

        if network_result.get("prefer_api") and network_result.get("best_ids"):
            return "api"

        prefer_mode = dom_html_result.get("prefer_mode")
        if prefer_mode in {"dom", "html"}:
            return prefer_mode

        return "dom"

    def _page_signature(self, url: str) -> str:
        parsed = urlparse(url)
        return f"{parsed.netloc}|{parsed.path}"

    def _history_value(self, action: dict, key: str):
        if isinstance(action, dict):
            return action.get(key)
        return getattr(action, key, None)

    def _decision_is_weak(self, decision) -> bool:
        if decision is None:
            return True

        if not decision.actions and not decision.results_ready:
            return True

        supported_action_types = {
            "wait",
            "click",
            "fill_input",
            "click_pagination",
            "scroll",
            "open_filter",
            "select_option",
            "toggle_checkbox",
            "click_chip",
            "apply_filter",
            "close_dialog",
            "set_min_price",
            "set_max_price",
        }

        targeted_action_types = supported_action_types - {"wait", "scroll"}

        for action in decision.actions:
            if action.action_type not in supported_action_types:
                return True
            if action.action_type in targeted_action_types and not action.target:
                return True

        return False

    def _build_embedding_client(self):
        if self.embedding_provider in {"huggingface", "hf"}:
            return HuggingFaceEmbeddingClient(
                model_name=settings.huggingface_embedding_model,
                cache_dir=settings.huggingface_cache_dir,
                device=settings.huggingface_device,
                batch_size=settings.huggingface_batch_size,
            )

        if self.embedding_provider == "ollama":
            return OllamaEmbeddingClient(self.ollama)

        raise ValueError(
            f"Unsupported embedding_provider='{settings.embedding_provider}'. "
            "Use 'huggingface' or 'ollama'."
        )

    def _embedding_model_name(self) -> str:
        if self.embedding_provider in {"huggingface", "hf"}:
            return settings.huggingface_embedding_model
        return settings.ollama_embedding_model
