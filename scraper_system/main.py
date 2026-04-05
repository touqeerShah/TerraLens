from __future__ import annotations

import asyncio
import json

from core.browser_session import BrowserSession
from core.coordinator import ScrapeCoordinator
from core.state_store import StateStore
from models.requests import ScrapeRequest
from settings import settings


async def main() -> None:

    user_goal = (
                    "Remove blockers, ignore login, list available filters, "
                    "then get the page ready for scraping marketplace property rental results."
                )

    request = ScrapeRequest(
        url="https://www.facebook.com/marketplace/category/propertyrentals",
        user_goal=user_goal,
        keyword="2 bedroom apartment",
        max_items=settings.default_max_items,
        max_steps=settings.default_max_steps,
        headless=settings.headless,
        slow_mo_ms=settings.slow_mo_ms,
        timeout_ms=settings.timeout_ms,
    )

    browser = BrowserSession(request)
    state = StateStore()

    coordinator = ScrapeCoordinator(
        request=request,
        browser_session=browser,
        state_store=state,
        ollama_base_url=settings.ollama_base_url,
        ollama_chat_model=settings.ollama_chat_model,
        ollama_embedding_model=settings.ollama_embedding_model,
        endpoint_threshold=settings.endpoint_threshold,
    )

    result = await coordinator.run()

    print("=== RESULT ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    print("\n=== DEBUG SNAPSHOT ===")
    snapshot = await state.snapshot()
    print(json.dumps(snapshot, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())