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
- If there is no active dialog or modal, ignore standalone login/signup/auth controls on the page. They are not blockers.
- Never propose login, signup, payment, checkout, or subscription actions.
- After dialogs are cleared:
  1. if a location is provided or clearly mentioned in the goal, apply location first
  2. then use keyword search if relevant and visible
  3. apply the most relevant remaining visible filters
  4. use pagination/load-more/scroll if more results are needed
- If search needs submission, either click the visible search/apply button or use `press_enter`.
- If the page has separate controls for location and keyword search, use them separately.
- If a single search field is handling both keyword and place, combine them into one fill value such as "2 bedroom apartment Malta".
- If a field usually applies on Enter, either return a separate `press_enter` action after `fill` or set `submit_after_fill=true` on the `fill` action.
- If `location` is present in the request, do not skip it. The page is not ready until the location intent has been applied.
- If `location_pending=true`, the next action must target `page.location_controls` before other search or filter actions.
- Do not stop at keyword search when visible filters can better match the goal.
- Treat location as a first-class filter when the goal mentions a place name or region and location-like controls are visible.
- Location controls may appear as buttons, comboboxes, text inputs, chips, or labels such as "Enter your town/city to show local results".
- If `page.location_controls` is not empty, inspect those controls before assuming location is already correct.
- Use visible radio and checkbox filter choices such as bedrooms, bathrooms, property type, sort, and listing type when they clearly match the goal.
- Avoid speculative multi-step plans when the first action is likely to change the page.
- Avoid duplicate or unnecessary actions.
- Use primitives only. Never invent semantic action types.

Allowed action_types (primitives only):
- `click` → any clickable element
- `fill` → type into an input or textarea
- `press_enter` → submit or confirm the focused element
- `select` → native `<select>` dropdown
- `scroll` → scroll the page down
- `wait` → pause only

Map every real interaction to these primitives:
- location picker → `fill`, then `click` a suggestion if visible, otherwise `press_enter`
- checkbox filter → `click`
- chip/tag filter → `click`
- open filter panel → `click`
- apply filter → `click`
- pagination/load more → `click`
- close dialog/cookie dismiss → `click`

Never return action_type values outside:
`click`, `fill`, `press_enter`, `select`, `scroll`, `wait`

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

Return exactly one JSON object matching:
{
  "action_type": "fill",
  "reason": "fill the main search field with keyword and location",
  "target": {
    "role": "combobox",
    "text": "Search Marketplace",
    "label": "Search Marketplace",
    "placeholder": "Search Marketplace",
    "css": null,
    "field_hint": null,
    "button_hint": null,
    "nearby_text": "property search"
  },
  "value": "2 bedroom apartment Malta",
  "submit_after_fill": true,
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
        "location_pending": bool(
            (request.location or "").strip() and page_packet.get("location_controls")
        ),
        "location_strategy": _build_location_strategy(request, page_packet),
        "search_value_hint": _build_search_value_hint(request, page_packet),
        "goal_filter_priority": [
            "location",
            "keyword_search",
            "price",
            "bedrooms",
            "bathrooms",
            "property_type",
            "sort",
            "listing_constraints",
        ],
        "available_action_types": [
            "click",
            "fill",
            "press_enter",
            "select",
            "scroll",
            "wait",
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
            "Accept cookie dialogs, but ignore login or subscription dialogs by clicking dismiss or close controls.",
            "If no active dialog exists, ignore standalone auth controls such as Log in, Sign up, Email or phone, and Password.",
            "If a location exists in the request or goal, apply it immediately after dialogs are cleared.",
            "If location_pending=true, the next action must use a location control from page.location_controls.",
            "If the page shows separate location and keyword controls, fill them separately.",
            "If a keyword exists, apply it after location unless one shared search field should contain both values.",
            "If search needs submission, use a search/apply button click, press_enter, or submit_after_fill=true on the fill action.",
            "If one search field can take both keyword and place, combine them in the fill value.",
            "Then use relevant filters and sort controls, especially bedrooms, bathrooms, price, type, and sort.",
            "Treat visible radio or checkbox options as valid filter choices.",
            "Identify only verified pagination, load more, or infinite scroll when visible.",
            "Return only primitive actions: click, fill, press_enter, select, scroll, wait.",
            "Choose the next action that best advances the user goal.",
            "Stop interaction when target results are visibly ready.",
        ],
        "page": page_packet,
        "last_actions": last_actions[-3:],
        "cached_recipe": cached_recipe,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _build_search_value_hint(
    request: ScrapeRequest, page_packet: dict[str, Any]
) -> str | None:
    keyword = (request.keyword or "").strip()
    location = (request.location or "").strip()
    separate_location_controls = bool(page_packet.get("location_controls"))

    if keyword and location and not separate_location_controls:
        return f"{keyword} {location}".strip()
    if keyword:
        return keyword
    if location:
        return location
    return None


def _build_location_strategy(
    request: ScrapeRequest, page_packet: dict[str, Any]
) -> str:
    location = (request.location or "").strip()
    if not location:
        return "not_required"
    if page_packet.get("location_controls"):
        return "separate_location_control"
    return "shared_search_or_not_visible"


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
