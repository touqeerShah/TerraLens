from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ProxyConfig:
    server: str
    username: Optional[str] = None
    password: Optional[str] = None


@dataclass
class ScrapeRequest:
    url: str
    user_goal: str
    keyword: Optional[str] = None
    location: Optional[str] = None
    filters: dict[str, Any] = field(default_factory=dict)
    max_items: int = 50
    max_pages: int = 3
    max_steps: int = 12
    headless: bool = True
    slow_mo_ms: int = 0
    timeout_ms: int = 30000
    retry: int = 2
    proxy: Optional[ProxyConfig] = None
    capture_screenshots: bool = False