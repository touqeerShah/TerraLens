from __future__ import annotations

import json
from typing import Any

from models.network import NetworkCandidate
from models.requests import ScrapeRequest
ACTION_PLANNER_SYSTEM = """
You are the browser action planner for a scraping agent.

Use the live page packet as the only source of truth.
Decide the minimum safe next actions needed to move toward the user goal.
Return JSON only.
Do not extract data.
Do not explain reasoning.

Rules:
- Plan at most 3 actions.
- Prefer 0 or 1 action when sufficient.
- Use only visible controls grounded in the page packet.
- If results are clearly visible and usable, return no actions and set `results_ready=true`.
- If `page.active_dialog` exists, resolve that dialog first.
- When `page.active_dialog` exists, it is the only dialog you should consider; ignore the rest of the page until it is cleared.
- For cookie/consent dialogs, accept only if needed to unblock the page.
- For login/signup/newsletter/subscription dialogs, dismiss/close/cancel/not-now.
- Never propose login, signup, payment, checkout, or subscription actions.
- After dialogs are cleared:
  1. use keyword search if relevant and visible
  2. apply location first when a location goal or visible location control exists
  3. apply the most relevant remaining visible filters
  4. use pagination/load-more/scroll if more results are needed
- If search needs submission, either click the visible search/apply button or use `press_enter`.
- Do not stop at keyword search when visible filters can better match the goal.
- Treat location as a first-class filter when the goal mentions a place name or region and location-like controls are visible.
- Location controls may appear as buttons, comboboxes, text inputs, chips, or labels such as "Enter your town/city to show local results".
- If `page.location_controls` is not empty, inspect those controls before assuming location is already correct.
- If `page.filter_controls` is not empty, use them to refine bedrooms, bathrooms, type, price, sort, and listing constraints.
- Use visible radio and checkbox filter choices such as bedrooms, bathrooms, property type, sort, and listing type when they clearly match the goal.
- Avoid speculative multi-step plans when the first action is likely to change the page.
- Avoid duplicate or unnecessary actions.

Allowed action types:
wait, click, fill_input, press_enter, click_pagination, scroll, open_filter, select_option, toggle_checkbox, click_chip, apply_filter, close_dialog, set_min_price, set_max_price

Stop condition:
Set `results_ready=true` only if:
- target results are visibly present
- no blocking dialog remains
- extraction can begin without more interaction

Also include `data_load_plan` with mode:
- `none`
- `pagination`
- `load_more`
- `infinite_scroll`

Each action must include:
- `type`
- `label`
- `reason`
- `target_hint`

Return exactly one JSON object matching:
{
  "action_type": "click",
  "target": {
    "role": "button",
    "text": "Search",
    "label": "Search",
    "placeholder": null,
    "css": null,
    "field_hint": null,
    "button_hint": "main search submit button",
    "nearby_text": "Find properties"
  },
  "value": null,
  "wait_ms": null
}
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
    page_packet: dict[str, Any],
    last_actions: list[dict[str, Any]],
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
        "goal_filter_priority": [
            "keyword_search",
            "location",
            "price",
            "bedrooms",
            "bathrooms",
            "property_type",
            "sort",
            "listing_constraints",
        ],
        "available_action_types": [
            "wait",
            "click",
            "fill_input",
            "press_enter",
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
        "data_load_plan_modes": [
            "pagination_next",
            "load_more",
            "infinite_scroll",
            "none",
            "unknown",
        ],
        "planner_checklist": [
            "Identify the visible page state.",
            "If a dialog or modal is present, resolve only the current active dialog first.",
            "Accept cookie dialogs, but ignore login or subscription dialogs by closing them.",
            "If a keyword exists, apply it after dialogs are cleared.",
            "If search needs submission, use a search/apply button click or press_enter.",
            "Then inspect visible location controls before other filters when a place is relevant.",
            "Then use relevant filters and sort controls, especially bedrooms, bathrooms, price, type, and sort.",
            "Treat visible radio or checkbox options as valid filter choices.",
            "Identify pagination, load more, or infinite scroll when visible.",
            "Choose the next action that best advances the user goal.",
            "Stop interaction when target results are visibly ready.",
        ],
        "page": page_packet,
        "last_actions": last_actions[-3:],
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
