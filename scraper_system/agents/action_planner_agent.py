from __future__ import annotations

from llm.ollama_client import OllamaClient
from llm.prompts import ACTION_PLANNER_SYSTEM, build_action_planner_prompt
from models.plans import (
    ActionTarget,
    DataLoadPlan,
    ExtractionPlan,
    PlannedAction,
    PlannerDecision,
)
from models.requests import ScrapeRequest


class ActionPlannerAgent:
    def __init__(self, ollama: OllamaClient) -> None:
        self.ollama = ollama
        self.last_prompt: dict | None = None
        self.last_raw_response: dict | None = None
        self.last_decision: PlannerDecision | None = None

    async def plan(
        self,
        request: ScrapeRequest,
        observation_packet: dict,
        last_actions: list[dict],
        blockers: list[dict],
        network_summary: list[dict],
        cached_recipe: dict | None = None,
    ) -> PlannerDecision:
        prompt = build_action_planner_prompt(
            request=request,
            observation_packet=observation_packet,
            last_actions=last_actions,
            blockers=blockers,
            network_summary=network_summary,
            cached_recipe=cached_recipe,
        )
        self.last_prompt = {
            "goal": request.user_goal,
            "keyword": request.keyword,
            "location": request.location,
            "required_fields": request.filters.get("__required_fields__", []),
            "filters": {
                k: v for k, v in request.filters.items() if k != "__required_fields__"
            },
            "page": observation_packet,
            "last_actions": last_actions[-3:],
            "blockers": blockers[:5],
            "network_summary": network_summary[:5],
            "cached_recipe": cached_recipe,
        }
        data = await self.ollama.chat_json(prompt=prompt, system=ACTION_PLANNER_SYSTEM, temperature=0.0)
        self.last_raw_response = data
        decision = self._parse(data)
        self.last_decision = decision
        return decision

    def _parse(self, data: dict) -> PlannerDecision:
        actions = []
        for item in data.get("actions", [])[:3]:
            tgt = item.get("target")
            target = None
            if isinstance(tgt, dict):
                target = ActionTarget(
                    role=tgt.get("role"),
                    text=tgt.get("text"),
                    label=tgt.get("label"),
                    placeholder=tgt.get("placeholder"),
                    css=tgt.get("css"),
                    field_hint=tgt.get("field_hint"),
                    button_hint=tgt.get("button_hint"),
                    nearby_text=tgt.get("nearby_text"),
                )
            actions.append(
                PlannedAction(
                    action_type=str(item.get("action_type", "wait") or "wait"),
                    target=target,
                    value=item.get("value"),
                    wait_ms=item.get("wait_ms"),
                )
            )

        dlp = data.get("data_load_plan")
        data_load_plan = None
        if isinstance(dlp, dict):
            tt = dlp.get("trigger_target")
            trigger_target = None
            if isinstance(tt, dict):
                trigger_target = ActionTarget(
                    role=tt.get("role"),
                    text=tt.get("text"),
                    label=tt.get("label"),
                    placeholder=tt.get("placeholder"),
                    css=tt.get("css"),
                    field_hint=tt.get("field_hint"),
                    button_hint=tt.get("button_hint"),
                    nearby_text=tt.get("nearby_text"),
                )
            data_load_plan = DataLoadPlan(
                mode=dlp.get("mode"),
                trigger_target=trigger_target,
                reason=dlp.get("reason"),
            )

        ep = data.get("extraction_plan")
        extraction_plan = None
        if isinstance(ep, dict):
            extraction_plan = ExtractionPlan(
                mode=ep.get("mode"),
                container_hint=ep.get("container_hint"),
                field_hints=ep.get("field_hints", {}),
                html_section_hint=ep.get("html_section_hint"),
                reason=ep.get("reason"),
            )

        return PlannerDecision(
            reason=data.get("reason", ""),
            actions=actions,
            results_ready=bool(data.get("results_ready", False)),
            should_continue=bool(data.get("should_continue", True)),
            data_load_plan=data_load_plan,
            extraction_plan=extraction_plan,
            api_shortlist_ids=data.get("api_shortlist_ids", []),
        )
