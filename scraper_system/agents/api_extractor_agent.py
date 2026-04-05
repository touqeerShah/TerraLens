from __future__ import annotations

from core.browser_session import BrowserSession
from extractors.registry import ExtractorRegistry
from models.network import NetworkCandidate
from network.replayer import NetworkReplayer


class APIExtractorAgent:
    def __init__(
        self,
        replayer: NetworkReplayer,
        registry: ExtractorRegistry | None = None,
    ) -> None:
        self.replayer = replayer
        self.registry = registry or ExtractorRegistry()

    async def extract(
        self,
        browser: BrowserSession,
        candidate: NetworkCandidate,
        max_items: int = 50,
    ) -> list[dict]:
        if not browser.context:
            raise RuntimeError("Browser context is not initialized.")

        replay = await self.replayer.replay_candidate(browser.context, candidate)
        if not replay.ok or replay.data is None:
            return []

        extractor = self.registry.get_api_extractor_for_url(candidate.url)

        return extractor.extract_records(
            replay.data,
            max_items=max_items,
        )