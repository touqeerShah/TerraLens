from __future__ import annotations

from core.browser_session import BrowserSession
from models.observations import PageControl, PageObservation


class PageObserverAgent:
    def __init__(self, max_body_chars: int = 12000) -> None:
        self.max_body_chars = max_body_chars

    async def observe(self, browser: BrowserSession, step: int) -> PageObservation:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page

        title = await page.title()
        url = page.url

        body_text = await page.locator("body").inner_text()
        body_text = body_text[: self.max_body_chars]

        controls = await self._collect_controls(browser)
        dialogs = await self._collect_dialogs(browser)
        filters = await self._collect_filters(browser)

        result_signals = {
            "has_cards": await page.locator('[role="article"], article, li, .item, .card').count() > 0,
            "has_table_rows": await page.locator("table tr").count() > 1,
            "has_many_links": await page.locator("a").count() > 10,
            "has_product_like_text": any(
                token in body_text.lower()
                for token in ["price", "results", "items", "product", "listing"]
            ),
        }

        can_scrape_now = bool(
            result_signals["has_cards"]
            or result_signals["has_table_rows"]
        )

        return PageObservation(
            url=url,
            title=title,
            body_text=body_text,
            screenshot_path=None,
            controls=controls,
            filters=filters,
            dialogs=dialogs,
            result_signals=result_signals,
            signals={"step": step},
            can_scrape_now=can_scrape_now,
        )

    async def _collect_controls(self, browser: BrowserSession) -> list[PageControl]:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page
        controls: list[PageControl] = []

        try:
            buttons = page.locator("button")
            count = min(await buttons.count(), 15)
            for i in range(count):
                btn = buttons.nth(i)
                text = (await btn.inner_text()).strip()
                aria = await btn.get_attribute("aria-label")
                controls.append(
                    PageControl(
                        role="button",
                        text=text[:120] if text else None,
                        label=aria,
                        visible=True,
                        enabled=True,
                    )
                )
        except Exception:
            pass

        try:
            inputs = page.locator("input")
            count = min(await inputs.count(), 12)
            for i in range(count):
                inp = inputs.nth(i)
                placeholder = await inp.get_attribute("placeholder")
                aria = await inp.get_attribute("aria-label")
                input_type = await inp.get_attribute("type")
                controls.append(
                    PageControl(
                        role=input_type or "input",
                        label=aria,
                        placeholder=placeholder,
                        visible=True,
                        enabled=True,
                    )
                )
        except Exception:
            pass

        try:
            selects = page.locator("select")
            count = min(await selects.count(), 8)
            for i in range(count):
                sel = selects.nth(i)
                aria = await sel.get_attribute("aria-label")
                controls.append(
                    PageControl(
                        role="select",
                        label=aria,
                        visible=True,
                        enabled=True,
                    )
                )
        except Exception:
            pass

        return controls

    async def _collect_dialogs(self, browser: BrowserSession) -> list[dict]:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page
        dialogs: list[dict] = []

        common_dialog_selectors = [
            '[role="dialog"]',
            '[aria-modal="true"]',
            '.modal',
            '.dialog',
            '#cookie',
            '[id*="cookie" i]',
            '[class*="cookie" i]',
        ]

        for selector in common_dialog_selectors:
            try:
                loc = page.locator(selector)
                count = min(await loc.count(), 5)
                for i in range(count):
                    el = loc.nth(i)
                    text = (await el.inner_text()).strip()
                    if text:
                        dialogs.append(
                            {
                                "selector": selector,
                                "text": text[:500],
                            }
                        )
            except Exception:
                continue

        return dialogs[:10]

    async def _collect_filters(self, browser: BrowserSession) -> list[dict]:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page
        filters: list[dict] = []

        try:
            labels = page.locator("label")
            count = min(await labels.count(), 20)
            for i in range(count):
                label = labels.nth(i)
                text = (await label.inner_text()).strip()
                if text and len(text) <= 120:
                    filters.append(
                        {
                            "type": "label",
                            "text": text,
                        }
                    )
        except Exception:
            pass

        try:
            selects = page.locator("select")
            count = min(await selects.count(), 8)
            for i in range(count):
                sel = selects.nth(i)
                aria = await sel.get_attribute("aria-label")
                name = await sel.get_attribute("name")
                filters.append(
                    {
                        "type": "select",
                        "aria_label": aria,
                        "name": name,
                    }
                )
        except Exception:
            pass

        return filters[:20]