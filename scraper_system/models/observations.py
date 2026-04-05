from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class PageControl:
    role: Optional[str] = None
    text: Optional[str] = None
    label: Optional[str] = None
    placeholder: Optional[str] = None
    selector: Optional[str] = None
    visible: bool = True
    enabled: bool = True


@dataclass
class PageObservation:
    url: str
    title: str
    body_text: str
    screenshot_path: Optional[str] = None
    controls: list[PageControl] = field(default_factory=list)
    filters: list[dict[str, Any]] = field(default_factory=list)
    dialogs: list[dict[str, Any]] = field(default_factory=list)
    result_signals: dict[str, Any] = field(default_factory=dict)
    signals: dict[str, Any] = field(default_factory=dict)
    can_scrape_now: bool = False