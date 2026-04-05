from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class ActionTarget:
    role: Optional[str] = None
    text: Optional[str] = None
    label: Optional[str] = None
    placeholder: Optional[str] = None
    css: Optional[str] = None
    approximate_position: Optional[dict[str, float]] = None


@dataclass
class ActionPlan:
    page_state: str
    goal_status: str
    reason: str
    action_type: str
    target: Optional[ActionTarget] = None
    value: Optional[str] = None
    wait_ms: Optional[int] = None
    can_scrape_now: bool = False
    can_continue: bool = True