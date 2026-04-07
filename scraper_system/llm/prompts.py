from __future__ import annotations

import json
from typing import Any

from models.observations import PageObservation
from models.requests import ScrapeRequest
from models.network import NetworkCandidate


ACTION_PLANNER_SYSTEM = """
You are the primary browser interaction planner for a scraping agent.
The observation packet is your eyes. Use it to understand what is visible, what blocks progress, and what single next step best moves toward the user goal.
Keep looping toward the target results. When the target results are visibly ready, stop interaction so extraction can start.

Return only JSON.
Plan at most 3 actions.
Prefer minimal safe actions.
Prefer goal-driven UI actions over generic actions.
Think in this order:
1. What does the user want?
2. What is visible now?
3. What is blocking progress?
4. What is the next best action?
5. Are the target results already visible?
6. Is filtering or pagination still needed?
7. Should interaction stop and extraction begin?
Allowed action types: wait, click, fill_input, click_pagination, scroll, open_filter, select_option, toggle_checkbox, click_chip, apply_filter, close_dialog, set_min_price, set_max_price.
If a richer action type is the best fit, use it.
Do not propose login, signup, payment, checkout, or email subscription actions.
If results are clearly ready, return zero actions and set results_ready=true.
Use target hints that help Playwright identify the intended control.
""".strip()

NETWORK_JUDGE_SYSTEM = """
You are the network API judge for a scraping agent.

Return only JSON.
You receive a user goal, required fields, and top ranked network candidates.
Choose the best request ids for likely structured data extraction.
Prefer endpoints with extractable records and pagination signals.
""".strip()

DOM_HTML_JUDGE_SYSTEM = """
You are the DOM/HTML extraction judge for a scraping agent.

Return only JSON.
Choose whether DOM or HTML is the better extraction source.
Use repeated visible structure and required fields.
Prefer DOM when repeated rendered items are clearly visible.
Prefer HTML when useful structure exists in markup and DOM targeting is weak.
""".strip()


def build_action_planner_prompt(
    request: ScrapeRequest,
    observation_packet: dict[str, Any],
    last_actions: list[dict[str, Any]],
    blockers: list[dict[str, Any]],
    network_summary: list[dict[str, Any]],
    cached_recipe: dict[str, Any] | None = None,
) -> str:
    payload = {
        "goal": request.user_goal,
        "required_fields": request.filters.get("__required_fields__", []),
        "keyword": request.keyword,
        "location": request.location,
        "filters": {
            k: v for k, v in request.filters.items() if k != "__required_fields__"
        },
        "available_action_types": [
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
        ],
        "planner_checklist": [
            "Identify the visible page state and blockers.",
            "Choose the next action that best advances the user goal.",
            "Prefer filters, selects, tabs, chips, and sort controls when visible.",
            "Stop interaction when target results are visibly ready.",
        ],
        "page": observation_packet,
        "last_actions": last_actions[-3:],
        "blockers": blockers[:5],
        "network_summary": network_summary[:5],
        "cached_recipe": cached_recipe,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def build_network_judge_prompt(
    request: ScrapeRequest,
    candidates: list[NetworkCandidate],
) -> str:
    payload = {
        "goal": request.user_goal,
        "required_fields": request.filters.get("__required_fields__", []),
        "candidates": [c.short_dict() for c in candidates[:5]],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def build_dom_html_judge_prompt(
    request: ScrapeRequest,
    dom_packet: dict[str, Any],
) -> str:
    payload = {
        "goal": request.user_goal,
        "required_fields": request.filters.get("__required_fields__", []),
        "dom_packet": dom_packet,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)
