from __future__ import annotations

import json
from typing import Any

from models.observations import PageObservation
from models.requests import ScrapeRequest


PLANNER_SYSTEM_PROMPT = """
You are a web scrape planning assistant.

You must return only JSON.
Choose the next safest useful browser action.

Rules:
- Prefer safe actions: wait, click cookie consent, fill visible search box, click pagination
- Avoid login, sign up, checkout, payment, email subscription, auth submit
- If data is already visible and extractable, set can_scrape_now=true
- If no useful action is available, use action_type="wait"
- Keep the target minimal and realistic
- Never invent hidden elements
""".strip()


def build_planner_prompt(
    request: ScrapeRequest,
    observation: PageObservation,
    step: int,
) -> str:
    controls = [
        {
            "role": c.role,
            "text": c.text,
            "label": c.label,
            "placeholder": c.placeholder,
            "selector": c.selector,
            "visible": c.visible,
            "enabled": c.enabled,
        }
        for c in observation.controls[:20]
    ]

    payload: dict[str, Any] = {
        "step": step,
        "user_goal": request.user_goal,
        "keyword": request.keyword,
        "location": request.location,
        "filters": request.filters,
        "page": {
            "url": observation.url,
            "title": observation.title,
            "body_text_preview": observation.body_text[:4000],
            "controls": controls,
            "filters": observation.filters[:20],
            "dialogs": observation.dialogs[:10],
            "result_signals": observation.result_signals,
            "signals": observation.signals,
            "can_scrape_now": observation.can_scrape_now,
        },
    }

    return (
        "Return a single JSON object for the next action.\n\n"
        + json.dumps(payload, ensure_ascii=False, indent=2)
    )