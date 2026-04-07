from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class CachedRecipe:
    page_signature: str
    successful_actions: list[dict[str, Any]] = field(default_factory=list)
    preferred_extraction_mode: Optional[str] = None
    known_container_hint: Optional[str] = None
    known_field_hints: dict[str, str] = field(default_factory=dict)
    known_good_endpoint_patterns: list[str] = field(default_factory=list)

    success_count: int = 0
    cache_hit_count: int = 0
    cache_use_success_count: int = 0
    cache_use_fail_count: int = 0


class RecipeCacheAgent:
    def __init__(self, state_store) -> None:
        self.state = state_store

    async def get_recipe(self, page_signature: str) -> CachedRecipe | None:
        recipe = await self.state.get_cached_recipe(page_signature)
        if recipe:
            recipe["cache_hit_count"] = int(recipe.get("cache_hit_count", 0)) + 1
            await self.state.set_cached_recipe(page_signature, recipe)
            await self.state.increment_cache_stat("hits")
            return self._from_dict(recipe)

        await self.state.increment_cache_stat("misses")
        return None

    async def save_success_recipe(
        self,
        page_signature: str,
        actions: list[dict[str, Any]],
        preferred_extraction_mode: str | None = None,
        known_container_hint: str | None = None,
        known_field_hints: dict[str, str] | None = None,
        known_good_endpoint_patterns: list[str] | None = None,
    ) -> None:
        existing = await self.state.get_cached_recipe(page_signature)

        if existing:
            existing["successful_actions"] = actions
            existing["preferred_extraction_mode"] = preferred_extraction_mode
            existing["known_container_hint"] = known_container_hint
            existing["known_field_hints"] = known_field_hints or {}
            existing["known_good_endpoint_patterns"] = (
                known_good_endpoint_patterns or []
            )
            existing["success_count"] = int(existing.get("success_count", 0)) + 1
            await self.state.set_cached_recipe(page_signature, existing)
            return

        recipe = CachedRecipe(
            page_signature=page_signature,
            successful_actions=actions,
            preferred_extraction_mode=preferred_extraction_mode,
            known_container_hint=known_container_hint,
            known_field_hints=known_field_hints or {},
            known_good_endpoint_patterns=known_good_endpoint_patterns or [],
            success_count=1,
        )
        await self.state.set_cached_recipe(page_signature, self._to_dict(recipe))

    async def mark_recipe_use_success(self, page_signature: str) -> None:
        recipe = await self.state.get_cached_recipe(page_signature)
        if not recipe:
            return
        recipe["cache_use_success_count"] = (
            int(recipe.get("cache_use_success_count", 0)) + 1
        )
        await self.state.set_cached_recipe(page_signature, recipe)

    async def mark_recipe_use_failure(self, page_signature: str) -> None:
        recipe = await self.state.get_cached_recipe(page_signature)
        if not recipe:
            return
        recipe["cache_use_fail_count"] = int(recipe.get("cache_use_fail_count", 0)) + 1
        await self.state.set_cached_recipe(page_signature, recipe)

    def build_cached_recipe_prompt_payload(
        self, recipe: CachedRecipe | None
    ) -> dict[str, Any] | None:
        if not recipe:
            return None
        return {
            "successful_actions": recipe.successful_actions[:3],
            "preferred_extraction_mode": recipe.preferred_extraction_mode,
            "known_container_hint": recipe.known_container_hint,
            "known_field_hints": recipe.known_field_hints,
            "known_good_endpoint_patterns": recipe.known_good_endpoint_patterns[:3],
            "success_count": recipe.success_count,
            "cache_hit_count": recipe.cache_hit_count,
            "cache_use_success_count": recipe.cache_use_success_count,
            "cache_use_fail_count": recipe.cache_use_fail_count,
        }

    def _from_dict(self, data: dict[str, Any]) -> CachedRecipe:
        return CachedRecipe(
            page_signature=data["page_signature"],
            successful_actions=data.get("successful_actions", []),
            preferred_extraction_mode=data.get("preferred_extraction_mode"),
            known_container_hint=data.get("known_container_hint"),
            known_field_hints=data.get("known_field_hints", {}),
            known_good_endpoint_patterns=data.get("known_good_endpoint_patterns", []),
            success_count=int(data.get("success_count", 0)),
            cache_hit_count=int(data.get("cache_hit_count", 0)),
            cache_use_success_count=int(data.get("cache_use_success_count", 0)),
            cache_use_fail_count=int(data.get("cache_use_fail_count", 0)),
        )

    def _to_dict(self, recipe: CachedRecipe) -> dict[str, Any]:
        return {
            "page_signature": recipe.page_signature,
            "successful_actions": recipe.successful_actions,
            "preferred_extraction_mode": recipe.preferred_extraction_mode,
            "known_container_hint": recipe.known_container_hint,
            "known_field_hints": recipe.known_field_hints,
            "known_good_endpoint_patterns": recipe.known_good_endpoint_patterns,
            "success_count": recipe.success_count,
            "cache_hit_count": recipe.cache_hit_count,
            "cache_use_success_count": recipe.cache_use_success_count,
            "cache_use_fail_count": recipe.cache_use_fail_count,
        }
