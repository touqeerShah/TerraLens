from __future__ import annotations

from core.browser_session import BrowserSession
from extractors.generic_html import GenericHTMLExtractor


class HTMLExtractorAgent:
    def __init__(self, extractor: GenericHTMLExtractor | None = None) -> None:
        self.extractor = extractor or GenericHTMLExtractor()

    async def extract(
        self,
        browser: BrowserSession,
        max_items: int = 50,
        section_hint: str | None = None,
        field_hints: dict[str, str] | None = None,
    ) -> list[dict]:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        html = await browser.page.content()
        return self.extractor.extract(
            html=html,
            max_items=max_items,
            section_hint=section_hint,
            field_hints=field_hints or {},
        )