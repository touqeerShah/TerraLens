from __future__ import annotations

from core.browser_session import BrowserSession
from extractors.registry import ExtractorRegistry


class DOMExtractorAgent:
    def __init__(self, registry: ExtractorRegistry | None = None) -> None:
        self.registry = registry or ExtractorRegistry()

    async def extract(
        self,
        browser: BrowserSession,
        max_items: int = 50,
        container_hint: str | None = None,
        field_hints: dict[str, str] | None = None,
    ) -> list[dict]:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        url = browser.page.url
        extractor = self.registry.get_dom_extractor_for_url(url)

        if hasattr(extractor, "extract"):
            try:
                return await extractor.extract(
                    browser.page,
                    max_items=max_items,
                    container_hint=container_hint,
                    field_hints=field_hints or {},
                )
            except TypeError:
                return await extractor.extract(
                    browser.page,
                    max_items=max_items,
                )

        return []