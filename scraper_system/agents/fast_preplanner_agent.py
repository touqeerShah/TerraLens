from __future__ import annotations

from typing import Optional

from models.plans import (
    ActionTarget,
    DataLoadPlan,
    ExtractionPlan,
    PlannedAction,
    PlannerDecision,
)
from models.requests import ScrapeRequest


COOKIE_TEXTS = [
    "accept all",
    "accept cookies",
    "allow all",
    "allow cookies",
    "consent",
    "agree",
    "ok",
    "got it",
]

CLOSE_TEXTS = [
    "close",
    "dismiss",
    "not now",
    "maybe later",
    "skip",
    "cancel",
    "no thanks",
    "x",
]

MORE_DATA_TEXTS = [
    "next",
    "next page",
    "show more",
    "load more",
    "see more",
]


class FastPrePlannerAgent:
    def plan(
        self,
        request: ScrapeRequest,
        observation_packet: dict,
        blockers: list[dict],
        last_actions: list[dict],
    ) -> Optional[PlannerDecision]:
        buttons = observation_packet.get("buttons", []) or []
        links = observation_packet.get("links", []) or []
        dialogs = observation_packet.get("dialogs", []) or []
        body_preview = (observation_packet.get("body_preview") or "").lower()
        results_visible = bool(observation_packet.get("results_visible"))

        # 1. Cookie fallback only
        for blocker in blockers:
            if blocker.get("type") in {"cookie_consent", "cookie_dialog"}:
                btn = self._find_button(buttons, COOKIE_TEXTS)
                if btn and not self._recent_click_target(last_actions, btn):
                    return PlannerDecision(
                        reason="Fallback rule: cookie dialog detected.",
                        actions=[
                            PlannedAction(
                                action_type="close_dialog",
                                target=ActionTarget(
                                    text=btn.get("text"),
                                    label=btn.get("label"),
                                    button_hint="cookie accept button",
                                ),
                                wait_ms=1200,
                            )
                        ],
                        results_ready=False,
                        should_continue=True,
                        data_load_plan=None,
                        extraction_plan=None,
                        api_shortlist_ids=[],
                    )

        # 2. Generic modal/login close fallback
        if dialogs:
            close_btn = self._find_button(buttons, CLOSE_TEXTS)
            if close_btn and not self._recent_click_target(last_actions, close_btn):
                return PlannerDecision(
                    reason="Fallback rule: dialog visible and close-like button found.",
                    actions=[
                        PlannedAction(
                            action_type="close_dialog",
                            target=ActionTarget(
                                text=close_btn.get("text"),
                                label=close_btn.get("label"),
                                button_hint="close dialog button",
                            ),
                            wait_ms=1200,
                        )
                    ],
                    results_ready=False,
                    should_continue=True,
                    data_load_plan=None,
                    extraction_plan=None,
                    api_shortlist_ids=[],
                )

        # 3. If results already look visible, let extraction judges decide next.
        if results_visible:
            return PlannerDecision(
                reason="Fallback rule: visible results detected, so interaction can stop and extraction can start.",
                actions=[],
                results_ready=True,
                should_continue=True,
                data_load_plan=self._detect_more_data(buttons, links, body_preview),
                extraction_plan=ExtractionPlan(
                    mode=None,
                    reason="Need extraction judges to choose API, DOM, or HTML.",
                ),
                api_shortlist_ids=[],
            )

        return None

    def _find_button(self, buttons: list[dict], texts: list[str]) -> Optional[dict]:
        for btn in buttons:
            hay = " ".join(filter(None, [btn.get("text"), btn.get("label")])).lower()
            if any(t in hay for t in texts):
                return btn
        return None

    def _find_link(self, links: list[dict], texts: list[str]) -> Optional[dict]:
        for link in links:
            hay = " ".join(filter(None, [link.get("text"), link.get("href")])).lower()
            if any(t in hay for t in texts):
                return link
        return None

    def _detect_more_data(
        self,
        buttons: list[dict],
        links: list[dict],
        body_preview: str,
    ) -> DataLoadPlan:
        btn = self._find_button(buttons, MORE_DATA_TEXTS)
        if btn:
            return DataLoadPlan(
                mode="pagination_next",
                trigger_target=ActionTarget(
                    text=btn.get("text"),
                    label=btn.get("label"),
                    button_hint="next or load more button",
                ),
                reason="Visible next/load-more control detected.",
            )

        link = self._find_link(links, MORE_DATA_TEXTS)
        if link:
            return DataLoadPlan(
                mode="pagination_next",
                trigger_target=ActionTarget(
                    text=link.get("text"),
                ),
                reason="Visible pagination-like link detected.",
            )

        if any(x in body_preview for x in ["scroll", "more results", "more listings"]):
            return DataLoadPlan(
                mode="infinite_scroll",
                trigger_target=None,
                reason="Page text suggests more data may appear on scroll.",
            )

        return DataLoadPlan(
            mode="unknown",
            trigger_target=None,
            reason="No clear pagination mechanism identified yet.",
        )

    def _recent_click_target(self, last_actions: list[dict], btn: dict) -> bool:
        target_text = (btn.get("text") or "").strip().lower()
        target_label = (btn.get("label") or "").strip().lower()

        for action in last_actions[-3:]:
            if action.get("action_type") not in {"click", "click_pagination", "close_dialog"}:
                continue

            a_text = str(action.get("target_text") or "").strip().lower()
            a_label = str(action.get("target_label") or "").strip().lower()

            if target_text and target_text == a_text:
                return True
            if target_label and target_label == a_label:
                return True

        return False
