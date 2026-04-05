from __future__ import annotations

from typing import Optional

from llm.ollama_client import OllamaClient
from llm.prompts import PLANNER_SYSTEM_PROMPT, build_planner_prompt
from models.observations import PageObservation
from models.plans import ActionPlan, ActionTarget
from models.requests import ScrapeRequest


class ActionPlannerAgent:
    def __init__(
        self,
        ollama: Optional[OllamaClient] = None,
        use_llm: bool = True,
    ) -> None:
        self.ollama = ollama
        self.use_llm = use_llm and ollama is not None

    async def plan(
        self,
        request: ScrapeRequest,
        observation: PageObservation,
        step: int,
    ) -> ActionPlan:
        rule_plan = self._plan_with_rules(request, observation, step)
        if rule_plan:
            return rule_plan

        if self.use_llm:
            try:
                prompt = build_planner_prompt(
                    request=request,
                    observation=observation,
                    step=step,
                )
                data = await self.ollama.chat_json(
                    prompt=prompt,
                    system=PLANNER_SYSTEM_PROMPT,
                    temperature=0.0,
                )
                return self._parse_plan(data)
            except Exception:
                pass

        return ActionPlan(
            page_state="fallback",
            goal_status="waiting",
            reason="No safe or confident action selected.",
            action_type="wait",
            target=None,
            value=None,
            wait_ms=1200,
            can_scrape_now=False,
            can_continue=step < (request.max_steps - 1),
        )

    def _plan_with_rules(
        self,
        request: ScrapeRequest,
        observation: PageObservation,
        step: int,
    ) -> Optional[ActionPlan]:
        body_lower = observation.body_text.lower()

        if observation.can_scrape_now:
            return ActionPlan(
                page_state="results_visible",
                goal_status="ready",
                reason="Visible results appear extractable.",
                action_type="wait",
                target=None,
                value=None,
                wait_ms=300,
                can_scrape_now=True,
                can_continue=False,
            )

        cookie_keywords = [
            "accept cookies",
            "accept all",
            "cookie policy",
            "allow cookies",
            "consent",
        ]
        if any(k in body_lower for k in cookie_keywords):
            return ActionPlan(
                page_state="dialog_blocking",
                goal_status="not_ready",
                reason="Cookie or consent dialog may block interaction.",
                action_type="click",
                target=ActionTarget(text="Accept"),
                value=None,
                wait_ms=1000,
                can_scrape_now=False,
                can_continue=True,
            )

        if request.keyword and step == 0:
            has_search_like_input = any(
                (c.placeholder and "search" in c.placeholder.lower())
                or (c.label and "search" in c.label.lower())
                or (c.role and c.role.lower() == "search")
                for c in observation.controls
            )
            if has_search_like_input or any(
                "search" in (c.placeholder or "").lower() for c in observation.controls
            ):
                return ActionPlan(
                    page_state="search_available",
                    goal_status="searching",
                    reason="Keyword exists and search input appears available.",
                    action_type="fill_search",
                    target=ActionTarget(role="textbox", placeholder="Search"),
                    value=request.keyword,
                    wait_ms=1500,
                    can_scrape_now=False,
                    can_continue=True,
                )

        return None

    def _parse_plan(self, data: dict) -> ActionPlan:
        target_data = data.get("target")
        target = None

        if isinstance(target_data, dict):
            target = ActionTarget(
                role=target_data.get("role"),
                text=target_data.get("text"),
                label=target_data.get("label"),
                placeholder=target_data.get("placeholder"),
                css=target_data.get("css"),
            )

        return ActionPlan(
            page_state=data.get("page_state", "unknown"),
            goal_status=data.get("goal_status", "unknown"),
            reason=data.get("reason", "No reason provided."),
            action_type=data.get("action_type", "wait"),
            target=target,
            value=data.get("value"),
            wait_ms=data.get("wait_ms"),
            can_scrape_now=bool(data.get("can_scrape_now", False)),
            can_continue=bool(data.get("can_continue", True)),
        )
