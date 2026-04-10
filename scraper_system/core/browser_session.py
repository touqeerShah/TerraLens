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
        await self.suppress_auth_dialogs()

    async def suppress_auth_dialogs(self) -> None:
        if not self.page:
            raise RuntimeError("Page is not initialized.")

        try:
            await self.page.evaluate(
                """
                () => {
                  const AUTH_SIGNALS = [
                    'log in', 'login', 'sign in', 'signin',
                    'sign up', 'signup', 'create account',
                    'register', 'subscribe', 'newsletter',
                    'join now', 'start trial', 'get started',
                    'continue with google', 'continue with facebook',
                  ];

                  const isAuthDialog = (el) => {
                    const text = (el.innerText || '').toLowerCase();
                    const matchCount = AUTH_SIGNALS.filter((signal) => text.includes(signal)).length;
                    return matchCount >= 2;
                  };

                  const killAuthDialogs = () => {
                    const selectors = [
                      '[role="dialog"]',
                      '[aria-modal="true"]',
                      'dialog',
                      '[class*="modal" i]',
                      '[class*="overlay" i]',
                      '[class*="popup" i]',
                      '[class*="drawer" i]',
                      '[id*="modal" i]',
                      '[id*="login" i]',
                      '[id*="signin" i]',
                    ];

                    selectors.forEach((selector) => {
                      document.querySelectorAll(selector).forEach((el) => {
                        if (isAuthDialog(el)) {
                          el.remove();
                        }
                      });
                    });
                  };

                  killAuthDialogs();

                  if (window.__authDialogObserver) {
                    window.__authDialogObserver.disconnect();
                  }

                  const observer = new MutationObserver(() => {
                    killAuthDialogs();
                  });

                  if (document.body) {
                    observer.observe(document.body, {
                      childList: true,
                      subtree: true,
                    });
                  }

                  window.__authDialogObserver = observer;
                }
                """
            )
        except Exception:
            # suppressor is best-effort and should never break the run
            pass

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
