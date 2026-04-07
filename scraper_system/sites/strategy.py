from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from models.observations import PageObservation
from sites.profiles import SiteProfile


@dataclass
class StrategyDecision:
    try_dom_now: bool
    try_api_now: bool
    endpoint_threshold: float
    action_wait_seconds: float
    reason: str


class SiteStrategy:
    def __init__(self, profile: SiteProfile) -> None:
        self.profile = profile

    def initial_wait_seconds(self) -> float:
        return self.profile.initial_wait_seconds

    def post_action_wait_seconds(self) -> float:
        return self.profile.post_action_wait_seconds

    def endpoint_threshold(self) -> float:
        return self.profile.network_rank_threshold

    def decide(
        self,
        observation: PageObservation,
        step: int,
        has_keyword: bool = False,
        has_network_candidates: bool = False,
    ) -> StrategyDecision:
        if self.profile.prefer_api_first:
            if has_network_candidates:
                return StrategyDecision(
                    try_dom_now=observation.can_scrape_now and not self.profile.dom_fragile,
                    try_api_now=True,
                    endpoint_threshold=self.profile.network_rank_threshold,
                    action_wait_seconds=self.profile.post_action_wait_seconds,
                    reason="Site profile prefers API-first strategy.",
                )

            return StrategyDecision(
                try_dom_now=observation.can_scrape_now and not self.profile.dom_fragile,
                try_api_now=False,
                endpoint_threshold=self.profile.network_rank_threshold,
                action_wait_seconds=self.profile.post_action_wait_seconds,
                reason="API-first site, but no network candidates yet.",
            )

        if observation.can_scrape_now and self.profile.prefer_dom_first:
            return StrategyDecision(
                try_dom_now=True,
                try_api_now=self.profile.api_likely_available and has_network_candidates,
                endpoint_threshold=self.profile.network_rank_threshold,
                action_wait_seconds=self.profile.post_action_wait_seconds,
                reason="Page appears scrapeable and site profile prefers DOM-first.",
            )

        if has_keyword and self.profile.supports_search and step == 0:
            return StrategyDecision(
                try_dom_now=False,
                try_api_now=has_network_candidates and self.profile.api_likely_available,
                endpoint_threshold=self.profile.network_rank_threshold,
                action_wait_seconds=self.profile.post_action_wait_seconds,
                reason="Prefer allowing search interaction before extraction.",
            )

        return StrategyDecision(
            try_dom_now=observation.can_scrape_now,
            try_api_now=has_network_candidates and self.profile.api_likely_available,
            endpoint_threshold=self.profile.network_rank_threshold,
            action_wait_seconds=self.profile.post_action_wait_seconds,
            reason="Balanced default strategy.",
        )