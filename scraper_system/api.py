from __future__ import annotations

from fastapi import FastAPI, HTTPException

from core.browser_session import BrowserSession
from core.coordinator import ScrapeCoordinator
from core.state_store import StateStore
from models.requests import ProxyConfig, ScrapeRequest

app = FastAPI(title="Multi-Agent Scraper System", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/scrape")
async def scrape(request: ScrapeRequest) -> dict:
    try:
        browser = BrowserSession(request)
        state = StateStore()

        coordinator = ScrapeCoordinator(
            request=request,
            browser_session=browser,
            state_store=state,
        )

        result = await coordinator.run()
        snapshot = await state.snapshot()

        return {
            "result": result,
            "state": snapshot,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc