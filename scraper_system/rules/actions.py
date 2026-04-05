from __future__ import annotations

from core.browser_session import BrowserSession
from models.plans import ActionPlan
from rules.safety import is_safe_action


class ActionExecutionError(Exception):
    pass


class ActionExecutor:
    async def execute(self, browser: BrowserSession, plan: ActionPlan) -> None:
        if not browser.page:
            raise ActionExecutionError("Browser page is not initialized.")

        is_safe, reason = is_safe_action(plan)
        if not is_safe:
            raise ActionExecutionError(reason or "Unsafe action blocked.")

        page = browser.page

        if plan.action_type == "wait":
            return

        if plan.action_type == "click":
            await self._execute_click(page, plan)
            return

        if plan.action_type == "fill_search":
            await self._execute_fill_search(page, plan)
            return

        if plan.action_type == "click_pagination":
            await self._execute_pagination_click(page, plan)
            return

        if plan.action_type == "select_filter":
            await self._execute_select_filter(page, plan)
            return

        raise ActionExecutionError(f"Unhandled action type: {plan.action_type}")

    async def _execute_click(self, page, plan: ActionPlan) -> None:
        if not plan.target:
            raise ActionExecutionError("Click action missing target.")

        if plan.target.text:
            try:
                await page.get_by_text(plan.target.text, exact=False).first.click(timeout=2500)
                return
            except Exception:
                pass

        if plan.target.label:
            try:
                await page.get_by_label(plan.target.label, exact=False).first.click(timeout=2500)
                return
            except Exception:
                pass

        if plan.target.css:
            try:
                await page.locator(plan.target.css).first.click(timeout=2500)
                return
            except Exception:
                pass

        raise ActionExecutionError("Could not execute click action.")

    async def _execute_fill_search(self, page, plan: ActionPlan) -> None:
        value = plan.value or ""
        search_selectors = [
            'input[type="search"]',
            'input[placeholder*="Search" i]',
            'input[aria-label*="Search" i]',
            'input[name*="search" i]',
            'input[type="text"]',
        ]

        for selector in search_selectors:
            try:
                locator = page.locator(selector).first
                await locator.click(timeout=1000)
                await locator.fill(value, timeout=1000)
                await locator.press("Enter")
                return
            except Exception:
                continue

        raise ActionExecutionError("Could not find a usable search input.")

    async def _execute_pagination_click(self, page, plan: ActionPlan) -> None:
        pagination_selectors = [
            'a[rel="next"]',
            'button[aria-label*="next" i]',
            'a[aria-label*="next" i]',
            'text=Next',
            'text=Show more',
            'text=Load more',
        ]

        if plan.target and plan.target.text:
            try:
                await page.get_by_text(plan.target.text, exact=False).first.click(timeout=2500)
                return
            except Exception:
                pass

        for selector in pagination_selectors:
            try:
                await page.locator(selector).first.click(timeout=2500)
                return
            except Exception:
                continue

        raise ActionExecutionError("Could not find a pagination control.")

    async def _execute_select_filter(self, page, plan: ActionPlan) -> None:
        if not plan.target or not plan.value:
            raise ActionExecutionError("Filter selection requires target and value.")

        if plan.target.label:
            try:
                await page.get_by_label(plan.target.label, exact=False).select_option(label=plan.value)
                return
            except Exception:
                pass

        if plan.target.css:
            try:
                await page.locator(plan.target.css).select_option(label=plan.value)
                return
            except Exception:
                pass

        raise ActionExecutionError("Could not apply filter selection.")