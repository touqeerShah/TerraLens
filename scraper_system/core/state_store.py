from __future__ import annotations

import asyncio
from dataclasses import asdict, is_dataclass
from typing import Any, Optional

from models.network import NetworkCandidate
from models.observations import PageObservation
from models.plans import ActionPlan


class StateStore:
    def __init__(self) -> None:
        self.page_observations: list[PageObservation] = []
        self.action_history: list[ActionPlan] = []
        self.network_candidates: list[NetworkCandidate] = []
        self.best_endpoint: Optional[NetworkCandidate] = None
        self.final_items: list[dict[str, Any]] = []
        self.debug_events: list[dict[str, Any]] = []
        self._lock = asyncio.Lock()

    async def add_observation(self, obs: PageObservation) -> None:
        async with self._lock:
            self.page_observations.append(obs)

    async def add_action(self, action: ActionPlan) -> None:
        async with self._lock:
            self.action_history.append(action)

    async def add_network_candidate(self, candidate: NetworkCandidate) -> None:
        async with self._lock:
            self.network_candidates.append(candidate)

    async def update_network_candidate(
        self,
        request_id: str,
        **updates: Any,
    ) -> Optional[NetworkCandidate]:
        async with self._lock:
            for candidate in self.network_candidates:
                if candidate.request_id == request_id:
                    for key, value in updates.items():
                        if hasattr(candidate, key):
                            setattr(candidate, key, value)
                    return candidate
        return None

    async def set_best_endpoint(self, endpoint: Optional[NetworkCandidate]) -> None:
        async with self._lock:
            self.best_endpoint = endpoint

    async def set_final_items(self, items: list[dict[str, Any]]) -> None:
        async with self._lock:
            self.final_items = items

    async def add_debug_event(self, event_type: str, payload: dict[str, Any]) -> None:
        async with self._lock:
            self.debug_events.append(
                {
                    "type": event_type,
                    "payload": payload,
                }
            )

    async def latest_observation(self) -> Optional[PageObservation]:
        async with self._lock:
            return self.page_observations[-1] if self.page_observations else None

    async def get_network_candidates(self) -> list[NetworkCandidate]:
        async with self._lock:
            return list(self.network_candidates)

    async def get_top_network_candidates(self, limit: int = 10) -> list[NetworkCandidate]:
        async with self._lock:
            return sorted(
                self.network_candidates,
                key=lambda c: c.score,
                reverse=True,
            )[:limit]

    async def snapshot(self) -> dict[str, Any]:
        async with self._lock:
            return {
                "page_observations": [self._serialize(x) for x in self.page_observations],
                "action_history": [self._serialize(x) for x in self.action_history],
                "network_candidates": [self._serialize(x) for x in self.network_candidates],
                "best_endpoint": self._serialize(self.best_endpoint),
                "final_items": self.final_items,
                "debug_events": self.debug_events,
            }

    def _serialize(self, value: Any) -> Any:
        if value is None:
            return None
        if is_dataclass(value):
            return asdict(value)
        if isinstance(value, list):
            return [self._serialize(v) for v in value]
        if isinstance(value, dict):
            return {k: self._serialize(v) for k, v in value.items()}
        return value