from __future__ import annotations

from core.state_store import StateStore
from network.collector import NetworkCollector
from core.browser_session import BrowserSession

class NetworkCollectorAgent:
    def __init__(self, state: StateStore, max_candidates: int = 100) -> None:
        self.state = state
        self.collector = NetworkCollector(
            state=state,
            max_candidates=max_candidates,
        )

    async def start(self, browser: BrowserSession) -> None:
        if not browser.context:
            raise RuntimeError("Browser context is not initialized.")
        await self.collector.attach(browser.context)

    async def get_top_candidates(self, limit: int = 10):
        return await self.state.get_top_network_candidates(limit=limit)