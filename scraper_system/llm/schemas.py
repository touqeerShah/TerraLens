from __future__ import annotations

ACTION_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "page_state": {"type": "string"},
        "goal_status": {"type": "string"},
        "reason": {"type": "string"},
        "action_type": {"type": "string"},
        "target": {
            "type": ["object", "null"],
            "properties": {
                "role": {"type": ["string", "null"]},
                "text": {"type": ["string", "null"]},
                "label": {"type": ["string", "null"]},
                "placeholder": {"type": ["string", "null"]},
                "css": {"type": ["string", "null"]},
            },
            "required": ["role", "text", "label", "placeholder", "css"],
            "additionalProperties": False,
        },
        "value": {"type": ["string", "null"]},
        "wait_ms": {"type": ["integer", "null"]},
        "can_scrape_now": {"type": "boolean"},
        "can_continue": {"type": "boolean"},
    },
    "required": [
        "page_state",
        "goal_status",
        "reason",
        "action_type",
        "target",
        "value",
        "wait_ms",
        "can_scrape_now",
        "can_continue",
    ],
    "additionalProperties": False,
}
