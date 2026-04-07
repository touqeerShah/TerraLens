from __future__ import annotations

from models.plans import PlannedAction
from core.browser_session import BrowserSession


DANGEROUS_TEXT_HINTS = [
    "log in",
    "login",
    "sign in",
    "signin",
    "sign up",
    "signup",
    "register",
    "create account",
    "checkout",
    "buy now",
    "purchase",
    "pay now",
    "subscribe",
    "start trial",
    "join now",
    "continue with google",
    "continue with facebook",
]


class ActionExecutionError(Exception):
    pass


class ActionExecutor:
    async def execute_many(
        self,
        browser: BrowserSession,
        actions: list[PlannedAction],
    ) -> list[dict]:
        results: list[dict] = []

        for action in actions[:3]:
            await self.execute(browser, action)
            results.append(
                {
                    "action_type": action.action_type,
                    "ok": True,
                    "value": action.value,
                    "target_text": action.target.text if action.target else None,
                    "target_label": action.target.label if action.target else None,
                    "target_placeholder": action.target.placeholder if action.target else None,
                }
            )

        return results

    async def execute(
        self,
        browser: BrowserSession,
        action: PlannedAction,
    ) -> None:
        if not browser.page:
            raise ActionExecutionError("Browser page is not initialized.")

        self._ensure_safe(action)
        page = browser.page

        if action.action_type == "wait":
            return

        if action.action_type == "click":
            await self._click(page, action)
            return

        if action.action_type in {
            "open_filter",
            "toggle_checkbox",
            "click_chip",
            "apply_filter",
            "close_dialog",
        }:
            await self._click(page, action)
            return

        if action.action_type == "fill_input":
            await self._fill_input(page, action)
            return

        if action.action_type in {"set_min_price", "set_max_price"}:
            await self._fill_input(page, action)
            return

        if action.action_type == "select_option":
            await self._select_option(page, action)
            return

        if action.action_type == "click_pagination":
            await self._click_pagination(page, action)
            return

        if action.action_type == "scroll":
            await page.mouse.wheel(0, 2000)
            return

        raise ActionExecutionError(f"Unhandled action type: {action.action_type}")

    def _ensure_safe(self, action: PlannedAction) -> None:
        if not action.target:
            return

        text = " ".join(
            filter(
                None,
                [
                    action.target.text,
                    action.target.label,
                    action.target.button_hint,
                    action.target.field_hint,
                    action.target.nearby_text,
                ],
            )
        ).lower()

        if any(hint in text for hint in DANGEROUS_TEXT_HINTS):
            raise ActionExecutionError("Unsafe action blocked.")

    async def _click(self, page, action: PlannedAction) -> None:
        target = action.target
        if not target:
            raise ActionExecutionError("Click action missing target.")

        attempts = [
            ("text", target.text),
            ("label", target.label),
            ("css", target.css),
        ]

        for mode, value in attempts:
            if not value:
                continue
            try:
                if mode == "text":
                    await page.get_by_text(value, exact=False).first.click(timeout=2500)
                    return
                if mode == "label":
                    await page.get_by_label(value, exact=False).first.click(timeout=2500)
                    return
                if mode == "css":
                    await page.locator(value).first.click(timeout=2500)
                    return
            except Exception:
                pass

        raise ActionExecutionError("Could not execute click action.")

    async def _fill_input(self, page, action: PlannedAction) -> None:
        value = action.value or ""
        target = action.target

        if not target:
            raise ActionExecutionError("Fill action missing target.")

        if target.label:
            try:
                locator = page.get_by_label(target.label, exact=False).first
                await locator.click(timeout=1000)
                await locator.fill(value, timeout=1000)
                return
            except Exception:
                pass

        selectors = []
        if target.placeholder:
            selectors.append(f'input[placeholder*="{target.placeholder}" i]')
        if target.css:
            selectors.append(target.css)

        selectors.extend(
            [
                'input[type="search"]',
                'input[placeholder*="search" i]',
                'input[aria-label*="search" i]',
                'input[name*="search" i]',
                'input[type="text"]',
            ]
        )

        for selector in selectors:
            try:
                locator = page.locator(selector).first
                await locator.click(timeout=1000)
                await locator.fill(value, timeout=1000)
                return
            except Exception:
                pass

        raise ActionExecutionError("Could not fill input.")

    async def _select_option(self, page, action: PlannedAction) -> None:
        value = action.value or ""
        target = action.target

        if not value:
            raise ActionExecutionError("Select action missing option value.")

        locators = []
        if target:
            if target.label:
                locators.append(page.get_by_label(target.label, exact=False).first)
            if target.css:
                locators.append(page.locator(target.css).first)
            if target.text:
                locators.append(page.get_by_text(target.text, exact=False).first)
            if target.placeholder:
                locators.append(page.get_by_placeholder(target.placeholder, exact=False).first)

        locators.append(page.locator("select").first)

        for locator in locators:
            try:
                await locator.select_option(label=value, timeout=1500)
                return
            except Exception:
                pass

            try:
                await locator.select_option(value=value, timeout=1500)
                return
            except Exception:
                pass

            try:
                await locator.click(timeout=1000)
            except Exception:
                continue

            try:
                await page.get_by_role("option", name=value, exact=False).first.click(
                    timeout=1500
                )
                return
            except Exception:
                pass

            try:
                await page.get_by_text(value, exact=False).first.click(timeout=1500)
                return
            except Exception:
                pass

        raise ActionExecutionError("Could not select option.")

    async def _click_pagination(self, page, action: PlannedAction) -> None:
        target = action.target

        selectors = []
        if target and target.text:
            selectors.append(f"text={target.text}")
        if target and target.label:
            try:
                await page.get_by_label(target.label, exact=False).first.click(timeout=2000)
                return
            except Exception:
                pass

        selectors.extend(
            [
                'a[rel="next"]',
                'button[aria-label*="next" i]',
                'a[aria-label*="next" i]',
                'text=Next',
                'text=Show more',
                'text=Load more',
                'text=See more',
            ]
        )

        for selector in selectors:
            try:
                await page.locator(selector).first.click(timeout=2500)
                return
            except Exception:
                pass

        raise ActionExecutionError("Could not find a pagination control.")
