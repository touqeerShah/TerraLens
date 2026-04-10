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

AUTH_CLOSE_HINTS = {"close", "not now", "no thanks", "dismiss", "cancel", "skip"}


class ActionExecutionError(Exception):
    pass


class ActionExecutor:
    HANDLERS = {
        "click": "_click",
        "fill": "_fill",
        "press_enter": "_press_enter",
        "select": "_select",
        "scroll": "_scroll",
        "wait": "_wait",
    }

    async def execute_many(
        self,
        browser: BrowserSession,
        actions: list[PlannedAction],
    ) -> list[dict]:
        results: list[dict] = []

        for action in actions[:3]:
            try:
                await self.execute(browser, action)
                result = {
                    "action_type": action.action_type,
                    "ok": True,
                    "value": action.value,
                    "target_text": action.target.text if action.target else None,
                    "target_label": action.target.label if action.target else None,
                    "target_placeholder": action.target.placeholder if action.target else None,
                }
                results.append(result)
                print(f"[ACTION SUCCESS] {result}")
            except Exception as exc:
                result = {
                    "action_type": action.action_type,
                    "ok": False,
                    "value": action.value,
                    "target_text": action.target.text if action.target else None,
                    "target_label": action.target.label if action.target else None,
                    "target_placeholder": action.target.placeholder if action.target else None,
                    "error": str(exc),
                }
                print(f"[ACTION FAIL] {result}")
                raise

        return results

    async def execute(
        self,
        browser: BrowserSession,
        action: PlannedAction,
    ) -> None:
        if not browser.page:
            raise ActionExecutionError("Browser page is not initialized.")

        self._ensure_safe(action)
        handler_name = self.HANDLERS.get(action.action_type)
        if not handler_name:
            raise ActionExecutionError(
                f"Unknown action_type '{action.action_type}'. Allowed: {list(self.HANDLERS)}"
            )

        await getattr(self, handler_name)(browser.page, action)

        if self._should_reinforce_auth_suppression(action):
            await browser.suppress_auth_dialogs()

    def _ensure_safe(self, action: PlannedAction) -> None:
        if not action.target:
            return

        target_text = " ".join(
            filter(
                None,
                [
                    action.target.text,
                    action.target.label,
                    action.target.nearby_text,
                ],
            )
        ).lower()

        if any(hint in target_text for hint in AUTH_CLOSE_HINTS):
            return

        text = " ".join(
            filter(
                None,
                [
                    target_text,
                    action.target.button_hint,
                    action.target.field_hint,
                ],
            )
        ).lower()

        if any(hint in text for hint in DANGEROUS_TEXT_HINTS):
            raise ActionExecutionError("Unsafe action blocked.")

    async def _click(self, page, action: PlannedAction) -> None:
        target = action.target
        if not target:
            raise ActionExecutionError("Click action missing target.")

        roots = await self._candidate_click_roots(page)
        for root in roots:
            for locator in self._candidate_locators(root, target):
                try:
                    await locator.click(timeout=2500)
                    await page.wait_for_timeout(250)
                    return
                except Exception:
                    pass

        raise ActionExecutionError("Could not execute click action.")

    async def _press_enter(self, page, action: PlannedAction) -> None:
        target = action.target

        if target:
            for locator in self._candidate_input_locators(page, target):
                try:
                    await locator.click(timeout=1000)
                    await locator.press("Enter", timeout=1000)
                    return
                except Exception:
                    pass

        try:
            await page.keyboard.press("Enter")
            return
        except Exception as exc:
            raise ActionExecutionError("Could not press Enter.") from exc

    async def _fill(self, page, action: PlannedAction) -> None:
        value = action.value or ""
        target = action.target

        if not target:
            raise ActionExecutionError("Fill action missing target.")

        for locator in self._candidate_input_locators(page, target):
            try:
                await locator.click(timeout=1000)
                await locator.fill(value, timeout=1000)
                return
            except Exception:
                pass

        raise ActionExecutionError("Could not fill input.")

    async def _select(self, page, action: PlannedAction) -> None:
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

    async def _scroll(self, page, action: PlannedAction) -> None:
        await page.mouse.wheel(0, 2000)

    async def _wait(self, page, action: PlannedAction) -> None:
        return

    def _should_reinforce_auth_suppression(self, action: PlannedAction) -> bool:
        if action.action_type != "click" or not action.target:
            return False

        combined = " ".join(
            filter(
                None,
                [
                    action.target.text,
                    action.target.label,
                    action.target.button_hint,
                ],
            )
        ).lower()
        return any(hint in combined for hint in AUTH_CLOSE_HINTS)

    async def _candidate_click_roots(self, page) -> list:
        roots = []
        for selector in ['[role="dialog"]', 'dialog', '[aria-modal="true"]']:
            scope = page.locator(selector)
            try:
                count = await scope.count()
            except Exception:
                continue

            for index in range(min(count, 3)):
                roots.append(scope.nth(index))

        roots.append(page)
        return roots

    def _candidate_locators(self, root, target) -> list:
        locators = []

        if target.css:
            locators.append(root.locator(target.css).first)

        if target.label:
            locators.append(root.get_by_label(target.label, exact=True).first)
            locators.append(root.get_by_label(target.label, exact=False).first)

        if target.role:
            role_name = target.label or target.text
            try:
                if role_name:
                    locators.append(
                        root.get_by_role(target.role, name=role_name, exact=True).first
                    )
                    locators.append(
                        root.get_by_role(target.role, name=role_name, exact=False).first
                    )
                else:
                    locators.append(root.get_by_role(target.role).first)
            except Exception:
                pass

        if target.placeholder:
            locators.append(root.get_by_placeholder(target.placeholder, exact=False).first)

        if target.text:
            locators.append(root.get_by_text(target.text, exact=True).first)
            locators.append(root.get_by_text(target.text, exact=False).first)

        return locators

    def _candidate_input_locators(self, page, target) -> list:
        locators = self._candidate_locators(page, target)
        locators.extend(
            [
                page.locator('input[type="search"]').first,
                page.locator('input[placeholder*="search" i]').first,
                page.locator('input[aria-label*="search" i]').first,
                page.locator('input[name*="search" i]').first,
                page.locator('input[type="text"]').first,
                page.locator("textarea").first,
            ]
        )
        return locators
