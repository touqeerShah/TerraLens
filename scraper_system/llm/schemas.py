from __future__ import annotations

PLANNER_DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "reason": {"type": "string"},
        "actions": {
            "type": "array",
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "action_type": {"type": "string"},
                    "target": {
                        "type": ["object", "null"],
                        "properties": {
                            "role": {"type": ["string", "null"]},
                            "text": {"type": ["string", "null"]},
                            "label": {"type": ["string", "null"]},
                            "placeholder": {"type": ["string", "null"]},
                            "css": {"type": ["string", "null"]},
                            "field_hint": {"type": ["string", "null"]},
                            "button_hint": {"type": ["string", "null"]},
                            "nearby_text": {"type": ["string", "null"]},
                        },
                        "required": [
                            "role",
                            "text",
                            "label",
                            "placeholder",
                            "css",
                            "field_hint",
                            "button_hint",
                            "nearby_text",
                        ],
                        "additionalProperties": False,
                    },
                    "value": {"type": ["string", "null"]},
                    "wait_ms": {"type": ["integer", "null"]},
                },
                "required": ["action_type", "target", "value", "wait_ms"],
                "additionalProperties": False,
            },
        },
        "results_ready": {"type": "boolean"},
        "should_continue": {"type": "boolean"},
        "data_load_plan": {
            "type": ["object", "null"],
            "properties": {
                "mode": {"type": ["string", "null"]},
                "trigger_target": {"type": ["object", "null"]},
                "reason": {"type": ["string", "null"]},
            },
            "required": ["mode", "trigger_target", "reason"],
            "additionalProperties": True,
        },
        "extraction_plan": {
            "type": ["object", "null"],
            "properties": {
                "mode": {"type": ["string", "null"]},
                "container_hint": {"type": ["string", "null"]},
                "field_hints": {"type": "object"},
                "html_section_hint": {"type": ["string", "null"]},
                "reason": {"type": ["string", "null"]},
            },
            "required": [
                "mode",
                "container_hint",
                "field_hints",
                "html_section_hint",
                "reason",
            ],
            "additionalProperties": False,
        },
        "api_shortlist_ids": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": [
        "reason",
        "actions",
        "results_ready",
        "should_continue",
        "data_load_plan",
        "extraction_plan",
        "api_shortlist_ids",
    ],
    "additionalProperties": False,
}

NETWORK_JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "reason": {"type": "string"},
        "best_ids": {
            "type": "array",
            "items": {"type": "string"},
        },
        "prefer_api": {"type": "boolean"},
        "expected_mode": {"type": ["string", "null"]},
    },
    "required": ["reason", "best_ids", "prefer_api", "expected_mode"],
    "additionalProperties": False,
}

DOM_HTML_JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "reason": {"type": "string"},
        "prefer_mode": {"type": "string"},  # dom | html | none
        "container_hint": {"type": ["string", "null"]},
        "html_section_hint": {"type": ["string", "null"]},
        "field_hints": {"type": "object"},
    },
    "required": [
        "reason",
        "prefer_mode",
        "container_hint",
        "html_section_hint",
        "field_hints",
    ],
    "additionalProperties": False,
}
