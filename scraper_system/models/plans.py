from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ActionTarget(BaseModel):
    role: Optional[str] = None
    text: Optional[str] = None
    label: Optional[str] = None
    placeholder: Optional[str] = None
    css: Optional[str] = None

    field_hint: Optional[str] = None
    button_hint: Optional[str] = None
    nearby_text: Optional[str] = None


class PlannedAction(BaseModel):
    action_type: str = Field(
        ...,
        description="wait | click | fill_input | click_pagination | scroll | open_filter | "
        "select_option | toggle_checkbox | click_chip | apply_filter | close_dialog | "
        "set_min_price | set_max_price",
    )
    target: Optional[ActionTarget] = None
    value: Optional[str] = None
    wait_ms: Optional[int] = None


class APICandidateDecision(BaseModel):
    request_id: str
    confidence: float
    reason: str
    expected_data_shape: Optional[str] = None
    pagination_hint: Optional[str] = None


class DataLoadPlan(BaseModel):
    mode: Optional[str] = Field(
        None,
        description="pagination_next | load_more | infinite_scroll | none | unknown",
    )
    trigger_target: Optional[ActionTarget] = None
    reason: Optional[str] = None


class ExtractionPlan(BaseModel):
    mode: Optional[str] = Field(
        None,
        description="api | dom | html | null",
    )
    container_hint: Optional[str] = None
    field_hints: dict[str, str] = Field(default_factory=dict)
    html_section_hint: Optional[str] = None
    reason: Optional[str] = None


class PlannerDecision(BaseModel):
    reason: str
    actions: list[PlannedAction] = Field(default_factory=list)

    results_ready: bool = False
    should_continue: bool = True

    data_load_plan: Optional[DataLoadPlan] = None
    extraction_plan: Optional[ExtractionPlan] = None
    api_shortlist_ids: list[str] = Field(default_factory=list)