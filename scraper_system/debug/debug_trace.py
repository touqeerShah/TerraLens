from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class StepTrace:
    step: int
    page_signature: str
    page_url: Optional[str] = None
    page_title: Optional[str] = None

    observation_summary: dict[str, Any] = field(default_factory=dict)
    observation_packet: dict[str, Any] = field(default_factory=dict)
    blockers: list[dict[str, Any]] = field(default_factory=list)

    cache_checked: bool = False
    cache_hit: bool = False
    cache_recipe_used: Optional[dict[str, Any]] = None

    preplanner_used: bool = False
    planner_used: bool = False
    planner_source: Optional[str] = None
    planner_reason: Optional[str] = None
    planner_request: Optional[dict[str, Any]] = None
    planner_raw_response: Optional[dict[str, Any]] = None

    actions_planned: list[dict[str, Any]] = field(default_factory=list)
    actions_executed: list[dict[str, Any]] = field(default_factory=list)

    results_ready: bool = False

    network_summary: list[dict[str, Any]] = field(default_factory=list)
    network_judge_result: Optional[dict[str, Any]] = None
    dom_html_judge_result: Optional[dict[str, Any]] = None

    chosen_mode: Optional[str] = None
    extraction_result_count: Optional[int] = None
    extraction_success: bool = False

    debug_notes: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
