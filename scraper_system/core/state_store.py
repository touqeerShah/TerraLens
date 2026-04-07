from __future__ import annotations

import asyncio
from dataclasses import asdict, is_dataclass
from typing import Any, Optional

from models.network import NetworkCandidate
from models.observations import PageObservation


class StateStore:
    def __init__(self) -> None:
        self.page_observations: list[PageObservation] = []
        self.action_history: list[dict[str, Any]] = []
        self.network_candidates: list[NetworkCandidate] = []
        self.best_endpoint: Optional[NetworkCandidate] = None
        self.final_items: list[dict[str, Any]] = []
        self.debug_events: list[dict[str, Any]] = []
        self._lock = asyncio.Lock()

        self.page_recipe_cache: dict[str, dict] = {}
        self.cache_stats: dict[str, int] = {
            "hits": 0,
            "misses": 0,
        }
        self.step_traces: list[dict] = []

    async def increment_cache_stat(self, key: str) -> None:
        async with self._lock:
            self.cache_stats[key] = int(self.cache_stats.get(key, 0)) + 1

    async def add_step_trace(self, trace: dict) -> None:
        async with self._lock:
            self.step_traces.append(trace)

    async def get_step_traces(self) -> list[dict]:
        async with self._lock:
            return list(self.step_traces)

    async def get_cache_stats(self) -> dict[str, int]:
        async with self._lock:
            return dict(self.cache_stats)

    async def get_cached_recipe(self, page_signature: str):
        async with self._lock:
            return self.page_recipe_cache.get(page_signature)

    async def set_cached_recipe(self, page_signature: str, recipe: dict):
        async with self._lock:
            self.page_recipe_cache[page_signature] = recipe

    async def add_observation(self, obs: PageObservation) -> None:
        async with self._lock:
            self.page_observations.append(obs)

    async def add_action(self, action: dict[str, Any]) -> None:
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

    async def get_top_network_candidates(
        self, limit: int = 10
    ) -> list[NetworkCandidate]:
        async with self._lock:
            return sorted(
                self.network_candidates,
                key=lambda c: getattr(c, "final_score", getattr(c, "score", 0)),
                reverse=True,
            )[:limit]

    async def snapshot(self) -> dict[str, Any]:
        async with self._lock:
            return {
                "page_observations": [
                    self._serialize(x) for x in self.page_observations
                ],
                "action_history": [self._serialize(x) for x in self.action_history],
                "network_candidates": [
                    self._serialize(x) for x in self.network_candidates
                ],
                "best_endpoint": self._serialize(self.best_endpoint),
                "final_items": self._serialize(self.final_items),
                "debug_events": self._serialize(self.debug_events),
                "page_recipe_cache": self._serialize(self.page_recipe_cache),
                "cache_stats": self._serialize(self.cache_stats),
                "step_traces": self._serialize(self.step_traces),
            }

    def _serialize(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, (str, int, float, bool)):
            return value
        if is_dataclass(value):
            return asdict(value)
        if isinstance(value, list):
            return [self._serialize(v) for v in value]
        if isinstance(value, dict):
            return {k: self._serialize(v) for k, v in value.items()}
        if hasattr(value, "short_dict") and callable(value.short_dict):
            return self._serialize(value.short_dict())
        if hasattr(value, "__dict__"):
            return self._serialize(vars(value))
        return value
