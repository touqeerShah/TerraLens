from __future__ import annotations

from typing import Optional

from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    async_playwright,
)

from models.requests import ScrapeRequest


class BrowserSession:
    def __init__(self, request: ScrapeRequest) -> None:
        self.request = request
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

    async def start(self) -> None:
        self.playwright = await async_playwright().start()

        launch_args = {
            "headless": self.request.headless,
            "slow_mo": self.request.slow_mo_ms,
        }

        proxy = self.request.proxy
        if proxy:
            launch_args["proxy"] = {
                "server": proxy.server,
                "username": proxy.username,
                "password": proxy.password,
            }

        self.browser = await self.playwright.chromium.launch(**launch_args)

        self.context = await self.browser.new_context(
            ignore_https_errors=True,
            viewport={"width": 1440, "height": 1100},
        )

        self.page = await self.context.new_page()
        self.page.set_default_timeout(self.request.timeout_ms)
        self.page.set_default_navigation_timeout(self.request.timeout_ms)

    async def goto(self, url: str) -> None:
        if not self.page:
            raise RuntimeError("BrowserSession not started. Call start() first.")
        await self.page.goto(url, wait_until="domcontentloaded")

    async def wait_for_network_idle(self, timeout_ms: int = 3000) -> None:
        if not self.page:
            raise RuntimeError("Page is not initialized.")
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout_ms)
        except Exception:
            # some sites never truly go idle; this should not kill the run
            pass

    async def screenshot(self, path: str, full_page: bool = True) -> str:
        if not self.page:
            raise RuntimeError("Page is not initialized.")
        await self.page.screenshot(path=path, full_page=full_page)
        return path

    async def content(self) -> str:
        if not self.page:
            raise RuntimeError("Page is not initialized.")
        return await self.page.content()

    async def title(self) -> str:
        if not self.page:
            raise RuntimeError("Page is not initialized.")
        return await self.page.title()

    async def current_url(self) -> str:
        if not self.page:
            raise RuntimeError("Page is not initialized.")
        return self.page.url

    async def close(self) -> None:
        if self.context:
            await self.context.close()
            self.context = None

        if self.browser:
            await self.browser.close()
            self.browser = None

        if self.playwright:
            await self.playwright.stop()
            self.playwright = None