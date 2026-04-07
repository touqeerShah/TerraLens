from __future__ import annotations

import re

from core.browser_session import BrowserSession
from models.observations import PageControl, PageObservation


class PageObserverAgent:
    def __init__(self, max_body_chars: int = 8000) -> None:
        self.max_body_chars = max_body_chars

    async def observe(self, browser: BrowserSession, step: int) -> PageObservation:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page
        body_text = await page.locator("body").inner_text()
        body_text = body_text[: self.max_body_chars]

        dialogs = await self._collect_dialogs(browser)
        semantic_snapshot = await self._collect_semantic_snapshot(browser, body_text)
        controls = self._build_controls_from_snapshot(semantic_snapshot)
        filters = self._build_filters_from_snapshot(semantic_snapshot)

        result_signals = {
            "has_cards": await page.locator('[role="article"], article, li, .item, .card').count() > 0,
            "has_table_rows": await page.locator("table tr").count() > 1,
            "has_many_links": await page.locator("a").count() > 10,
            "has_result_count_text": bool(semantic_snapshot.get("result_counts")),
            "has_filter_controls": bool(
                semantic_snapshot.get("selects")
                or semantic_snapshot.get("checkboxes")
                or semantic_snapshot.get("radios")
                or semantic_snapshot.get("chips")
                or semantic_snapshot.get("sort_controls")
            ),
        }

        return PageObservation(
            url=page.url,
            title=await page.title(),
            body_text=body_text,
            screenshot_path=None,
            controls=controls,
            filters=filters,
            dialogs=dialogs,
            result_signals=result_signals,
            signals={
                "step": step,
                "page_semantics": {
                    **semantic_snapshot,
                    "dialogs": dialogs[:5],
                },
            },
            can_scrape_now=bool(result_signals["has_cards"] or result_signals["has_table_rows"]),
        )

    def build_compact_packet(self, observation: PageObservation) -> dict:
        semantics = observation.signals.get("page_semantics", {}) or {}
        buttons = []
        inputs = []
        for c in observation.controls[:24]:
            if c.role == "button":
                buttons.append(
                    {
                        "text": c.text,
                        "label": c.label,
                        "selector": c.selector,
                    }
                )
            else:
                inputs.append(
                    {
                        "role": c.role,
                        "text": c.text,
                        "label": c.label,
                        "placeholder": c.placeholder,
                        "selector": c.selector,
                    }
                )

        return {
            "results_visible": observation.can_scrape_now,
            "body_preview": observation.body_text[:2500],
            "title": observation.title,
            "url": observation.url,
            "headings": semantics.get("headings", [])[:8],
            "buttons": buttons[:10],
            "inputs": inputs[:10],
            "links": semantics.get("links", [])[:12],
            "selects": semantics.get("selects", [])[:8],
            "checkboxes": semantics.get("checkboxes", [])[:10],
            "radios": semantics.get("radios", [])[:8],
            "tabs": semantics.get("tabs", [])[:10],
            "chips": semantics.get("chips", [])[:10],
            "sort_controls": semantics.get("sort_controls", [])[:8],
            "active_filters": semantics.get("active_filters", [])[:10],
            "result_counts": semantics.get("result_counts", [])[:6],
            "filters": observation.filters[:12],
            "dialogs": observation.dialogs[:5],
            "result_signals": observation.result_signals,
            "visible_summary": {
                "buttons_count": len(semantics.get("buttons", [])),
                "inputs_count": len(semantics.get("inputs", [])),
                "links_count": len(semantics.get("links", [])),
                "selects_count": len(semantics.get("selects", [])),
                "checkboxes_count": len(semantics.get("checkboxes", [])),
                "tabs_count": len(semantics.get("tabs", [])),
                "filters_count": len(observation.filters),
                "dialogs_count": len(observation.dialogs),
            },
        }

    async def build_dom_html_packet(self, browser: BrowserSession) -> dict:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")
        page = browser.page

        html = await page.content()
        html_preview = html[:12000]

        container_samples = await page.evaluate(
            """
            () => {
              const selectors = ['article', '[role="article"]', 'li', '.item', '.card', 'table', 'tbody tr'];
              const out = [];
              for (const selector of selectors) {
                const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 5);
                for (const node of nodes) {
                  const text = (node.innerText || '').trim().replace(/\\s+/g, ' ');
                  if (!text) continue;
                  out.push({
                    selector,
                    text: text.slice(0, 500)
                  });
                }
              }
              return out.slice(0, 12);
            }
            """
        )

        return {
            "html_preview": html_preview,
            "container_samples": container_samples,
        }

    def _build_controls_from_snapshot(self, snapshot: dict) -> list[PageControl]:
        controls: list[PageControl] = []

        for button in snapshot.get("buttons", [])[:12]:
            controls.append(
                PageControl(
                    role="button",
                    text=button.get("text"),
                    label=button.get("label"),
                    selector=button.get("selector"),
                )
            )

        for item in snapshot.get("inputs", [])[:12]:
            controls.append(
                PageControl(
                    role=item.get("role"),
                    text=item.get("text"),
                    label=item.get("label"),
                    placeholder=item.get("placeholder"),
                    selector=item.get("selector"),
                )
            )

        for item in snapshot.get("selects", [])[:6]:
            controls.append(
                PageControl(
                    role="select",
                    text=item.get("selected"),
                    label=item.get("label"),
                    selector=item.get("selector"),
                )
            )

        for item in snapshot.get("checkboxes", [])[:6]:
            controls.append(
                PageControl(
                    role="checkbox",
                    text=item.get("text"),
                    label=item.get("label"),
                    selector=item.get("selector"),
                )
            )

        for item in snapshot.get("radios", [])[:6]:
            controls.append(
                PageControl(
                    role="radio",
                    text=item.get("text"),
                    label=item.get("label"),
                    selector=item.get("selector"),
                )
            )

        for item in snapshot.get("tabs", [])[:6]:
            controls.append(
                PageControl(
                    role="tab",
                    text=item.get("text"),
                    label=item.get("label"),
                    selector=item.get("selector"),
                )
            )

        return controls

    def _build_filters_from_snapshot(self, snapshot: dict) -> list[dict]:
        filters: list[dict] = []

        for item in snapshot.get("selects", [])[:6]:
            filters.append(
                {
                    "type": "select",
                    "text": item.get("label") or item.get("selected"),
                    "selected": item.get("selected"),
                    "options": item.get("options", [])[:8],
                }
            )

        for item in snapshot.get("checkboxes", [])[:8]:
            filters.append(
                {
                    "type": "checkbox",
                    "text": item.get("label") or item.get("text"),
                    "checked": item.get("checked", False),
                }
            )

        for item in snapshot.get("radios", [])[:8]:
            filters.append(
                {
                    "type": "radio",
                    "text": item.get("label") or item.get("text"),
                    "checked": item.get("checked", False),
                }
            )

        for item in snapshot.get("chips", [])[:8]:
            filters.append(
                {
                    "type": "chip",
                    "text": item.get("text"),
                    "active": item.get("active", False),
                }
            )

        for item in snapshot.get("sort_controls", [])[:6]:
            filters.append(
                {
                    "type": "sort",
                    "text": item.get("text") or item.get("label"),
                    "active": item.get("active", False),
                }
            )

        for item in snapshot.get("active_filters", [])[:8]:
            filters.append(
                {
                    "type": "active_filter",
                    "text": item.get("text"),
                    "label": item.get("label"),
                }
            )

        return filters

    async def _collect_dialogs(self, browser: BrowserSession) -> list[dict]:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")
        page = browser.page
        dialogs: list[dict] = []
        for selector in ['[role="dialog"]', '[aria-modal="true"]', '.modal', '.dialog']:
            try:
                loc = page.locator(selector)
                for i in range(min(await loc.count(), 3)):
                    text = (await loc.nth(i).inner_text()).strip()
                    if text:
                        dialogs.append({"selector": selector, "text": text[:300]})
            except Exception:
                pass
        return dialogs

    async def _collect_semantic_snapshot(
        self,
        browser: BrowserSession,
        body_text: str,
    ) -> dict:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")
        page = browser.page

        snapshot: dict = {
            "headings": [],
            "buttons": [],
            "inputs": [],
            "links": [],
            "selects": [],
            "checkboxes": [],
            "radios": [],
            "tabs": [],
            "chips": [],
            "sort_controls": [],
            "active_filters": [],
            "result_counts": self._extract_result_counts(body_text),
        }

        try:
            headings = page.locator("h1, h2, h3")
            for i in range(min(await headings.count(), 8)):
                text = (await headings.nth(i).inner_text()).strip()
                if text:
                    snapshot["headings"].append(text[:180])
        except Exception:
            pass

        try:
            buttons = page.locator('button, [role="button"], input[type="button"], input[type="submit"]')
            for i in range(min(await buttons.count(), 16)):
                btn = buttons.nth(i)
                text = ((await btn.inner_text()).strip() or await btn.get_attribute("value") or None)
                label = await btn.get_attribute("aria-label")
                selector = await btn.get_attribute("id")
                if text or label:
                    snapshot["buttons"].append(
                        {
                            "text": text[:140] if text else None,
                            "label": label[:140] if label else None,
                            "selector": f'#{selector}' if selector else None,
                        }
                    )
        except Exception:
            pass

        try:
            fields = page.locator("input, textarea")
            for i in range(min(await fields.count(), 14)):
                field = fields.nth(i)
                role = (await field.get_attribute("type")) or "input"
                label = await field.get_attribute("aria-label")
                placeholder = await field.get_attribute("placeholder")
                selector = await field.get_attribute("id")
                value = None
                try:
                    value = await field.input_value()
                except Exception:
                    value = None

                snapshot["inputs"].append(
                    {
                        "role": role,
                        "label": label[:140] if label else None,
                        "placeholder": placeholder[:140] if placeholder else None,
                        "text": value[:140] if value else None,
                        "selector": f'#{selector}' if selector else None,
                    }
                )
        except Exception:
            pass

        try:
            links = page.locator("a[href]")
            for i in range(min(await links.count(), 14)):
                link = links.nth(i)
                text = (await link.inner_text()).strip()
                href = await link.get_attribute("href")
                if text or href:
                    snapshot["links"].append(
                        {
                            "text": text[:140] if text else None,
                            "href": href[:240] if href else None,
                        }
                    )
        except Exception:
            pass

        try:
            selects = page.locator("select")
            for i in range(min(await selects.count(), 8)):
                sel = selects.nth(i)
                label = await sel.get_attribute("aria-label")
                selector = await sel.get_attribute("id")
                options = await sel.evaluate(
                    """element => Array.from(element.options || [])
                    .map(option => (option.textContent || '').trim())
                    .filter(Boolean)
                    .slice(0, 8)
                    """
                )
                selected = await sel.evaluate(
                    """element => {
                        const option = Array.from(element.selectedOptions || [])[0];
                        return option ? (option.textContent || '').trim() : '';
                    }"""
                )
                snapshot["selects"].append(
                    {
                        "label": label[:140] if label else None,
                        "selected": selected[:140] if selected else None,
                        "options": options,
                        "selector": f'#{selector}' if selector else None,
                    }
                )
        except Exception:
            pass

        try:
            checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]')
            for i in range(min(await checkboxes.count(), 10)):
                item = checkboxes.nth(i)
                label = await item.get_attribute("aria-label")
                selector = await item.get_attribute("id")
                text = (await item.evaluate(
                    """el => {
                        const parent = el.closest('label');
                        return parent ? (parent.innerText || '').trim() : '';
                    }"""
                )) or None
                checked = False
                try:
                    checked = await item.is_checked()
                except Exception:
                    checked = (await item.get_attribute("aria-checked")) == "true"
                snapshot["checkboxes"].append(
                    {
                        "text": text[:140] if text else None,
                        "label": label[:140] if label else None,
                        "checked": checked,
                        "selector": f'#{selector}' if selector else None,
                    }
                )
        except Exception:
            pass

        try:
            radios = page.locator('input[type="radio"], [role="radio"]')
            for i in range(min(await radios.count(), 10)):
                item = radios.nth(i)
                label = await item.get_attribute("aria-label")
                selector = await item.get_attribute("id")
                text = (await item.evaluate(
                    """el => {
                        const parent = el.closest('label');
                        return parent ? (parent.innerText || '').trim() : '';
                    }"""
                )) or None
                checked = False
                try:
                    checked = await item.is_checked()
                except Exception:
                    checked = (await item.get_attribute("aria-checked")) == "true"
                snapshot["radios"].append(
                    {
                        "text": text[:140] if text else None,
                        "label": label[:140] if label else None,
                        "checked": checked,
                        "selector": f'#{selector}' if selector else None,
                    }
                )
        except Exception:
            pass

        snapshot["tabs"] = await self._collect_text_controls(
            page,
            selectors='[role="tab"], button[aria-selected], a[aria-selected]',
            limit=10,
        )
        snapshot["chips"] = await self._collect_text_controls(
            page,
            selectors='button[class*="chip"], button[class*="pill"], [data-chip], [data-filter-chip]',
            limit=10,
            include_active=True,
        )
        snapshot["sort_controls"] = await self._collect_keyword_controls(
            page,
            selectors='button, [role="button"], select, a, label',
            keywords=["sort", "newest", "price", "relevance", "recent"],
            limit=8,
        )
        snapshot["active_filters"] = await self._collect_text_controls(
            page,
            selectors='[aria-pressed="true"], [aria-selected="true"], [data-active="true"]',
            limit=10,
            include_active=True,
        )

        return snapshot

    async def _collect_text_controls(
        self,
        page,
        selectors: str,
        limit: int,
        include_active: bool = False,
    ) -> list[dict]:
        out: list[dict] = []
        try:
            locator = page.locator(selectors)
            for i in range(min(await locator.count(), limit)):
                item = locator.nth(i)
                text = (await item.inner_text()).strip()
                label = await item.get_attribute("aria-label")
                selector = await item.get_attribute("id")
                if not text and not label:
                    continue
                payload = {
                    "text": text[:140] if text else None,
                    "label": label[:140] if label else None,
                    "selector": f'#{selector}' if selector else None,
                }
                if include_active:
                    payload["active"] = (
                        (await item.get_attribute("aria-selected")) == "true"
                        or (await item.get_attribute("aria-pressed")) == "true"
                        or (await item.get_attribute("data-active")) == "true"
                    )
                out.append(payload)
        except Exception:
            pass
        return out

    async def _collect_keyword_controls(
        self,
        page,
        selectors: str,
        keywords: list[str],
        limit: int,
    ) -> list[dict]:
        out: list[dict] = []
        try:
            locator = page.locator(selectors)
            for i in range(min(await locator.count(), 24)):
                item = locator.nth(i)
                text = (await item.inner_text()).strip()
                label = await item.get_attribute("aria-label")
                hay = " ".join(filter(None, [text, label])).lower()
                if not hay or not any(keyword in hay for keyword in keywords):
                    continue
                selector = await item.get_attribute("id")
                out.append(
                    {
                        "text": text[:140] if text else None,
                        "label": label[:140] if label else None,
                        "selector": f'#{selector}' if selector else None,
                        "active": (
                            (await item.get_attribute("aria-selected")) == "true"
                            or (await item.get_attribute("data-active")) == "true"
                        ),
                    }
                )
                if len(out) >= limit:
                    break
        except Exception:
            pass
        return out

    def _extract_result_counts(self, body_text: str) -> list[str]:
        matches = re.findall(
            r"\b\d[\d,\.]*\s+(?:results?|listings?|properties?|homes?|items?|records?)\b",
            body_text,
            flags=re.IGNORECASE,
        )
        deduped: list[str] = []
        seen: set[str] = set()
        for match in matches:
            normalized = match.strip()
            lowered = normalized.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(normalized)
            if len(deduped) >= 6:
                break
        return deduped
