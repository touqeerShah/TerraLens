from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ActionTarget:
    role: Optional[str] = None
    text: Optional[str] = None
    label: Optional[str] = None
    placeholder: Optional[str] = None
    css: Optional[str] = None

    field_hint: Optional[str] = None
    button_hint: Optional[str] = None
    nearby_text: Optional[str] = None


@dataclass
class PlannedAction:
    action_type: str   # wait | click | fill_input | click_pagination | scroll | open_filter | select_option | toggle_checkbox | click_chip | apply_filter | close_dialog | set_min_price | set_max_price
    target: Optional[ActionTarget] = None
    value: Optional[str] = None
    wait_ms: Optional[int] = None


@dataclass
class APICandidateDecision:
    request_id: str
    confidence: float
    reason: str
    expected_data_shape: Optional[str] = None
    pagination_hint: Optional[str] = None


@dataclass
class DataLoadPlan:
    mode: Optional[str] = None   # pagination_next | load_more | infinite_scroll | none | unknown
    trigger_target: Optional[ActionTarget] = None
    reason: Optional[str] = None


@dataclass
class ExtractionPlan:
    mode: Optional[str] = None   # api | dom | html | null
    container_hint: Optional[str] = None
    field_hints: dict[str, str] = field(default_factory=dict)
    html_section_hint: Optional[str] = None
    reason: Optional[str] = None


@dataclass
class PlannerDecision:
    reason: str
    actions: list[PlannedAction] = field(default_factory=list)

    results_ready: bool = False
    should_continue: bool = True

    data_load_plan: Optional[DataLoadPlan] = None
    extraction_plan: Optional[ExtractionPlan] = None
    api_shortlist_ids: list[str] = field(default_factory=list)
