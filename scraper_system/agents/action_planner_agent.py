from __future__ import annotations

from core.browser_session import BrowserSession
from llm.ollama_client import OllamaClient
from llm.prompts import ACTION_PLANNER_SYSTEM, build_action_planner_prompt
from models.plans import (
    ActionTarget,
    DataLoadPlan,
    ExtractionPlan,
    PlannedAction,
    PlannerDecision,
)
from models.requests import ScrapeRequest


class ActionPlannerAgent:
    def __init__(self, ollama: OllamaClient) -> None:
        self.ollama = ollama
        self.last_prompt: dict | None = None
        self.last_raw_response: dict | None = None
        self.last_decision: PlannerDecision | None = None

    async def capture_page_packet(self, browser: BrowserSession) -> dict:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page
        title = await page.title()

        packet = await page.evaluate(
            """
            () => {
              const isVisible = (element) => {
                if (!element) return false;
                const style = window.getComputedStyle(element);
                if (!style || style.visibility === 'hidden' || style.display === 'none') return false;
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              };

              const textValue = (element) => {
                const text = (
                  element.innerText ||
                  element.textContent ||
                  element.getAttribute('aria-label') ||
                  element.getAttribute('value') ||
                  ''
                ).replace(/\\s+/g, ' ').trim();
                return text.slice(0, 180);
              };

              const nthOfType = (element) => {
                let index = 1;
                let sibling = element;
                while ((sibling = sibling.previousElementSibling)) {
                  if (sibling.tagName === element.tagName) index += 1;
                }
                return index;
              };

              const selectorValue = (element) => {
                if (element.id) return `#${element.id}`;
                const name = element.getAttribute('name');
                if (name) return `${element.tagName.toLowerCase()}[name="${name}"]`;
                const parts = [];
                let node = element;
                let depth = 0;

                while (node && node.nodeType === 1 && depth < 4 && node.tagName.toLowerCase() !== 'body') {
                  let part = node.tagName.toLowerCase();
                  const role = node.getAttribute('role');
                  if (role) part += `[role="${role}"]`;
                  const ariaLabel = node.getAttribute('aria-label');
                  if (!role && ariaLabel && ariaLabel.length < 40) {
                    const escaped = ariaLabel.replace(/"/g, '\\"');
                    part += `[aria-label="${escaped}"]`;
                  }
                  part += `:nth-of-type(${nthOfType(node)})`;
                  parts.unshift(part);
                  node = node.parentElement;
                  depth += 1;
                }

                return parts.join(' > ') || element.tagName.toLowerCase();
              };

              const collect = (selector, mapFn, limit = 12) => {
                const nodes = Array.from(document.querySelectorAll(selector)).filter(isVisible).slice(0, limit);
                return nodes.map(mapFn);
              };

              const controlSnapshot = (element) => ({
                role: element.getAttribute('role') || element.tagName.toLowerCase(),
                text: textValue(element),
                label: element.getAttribute('aria-label'),
                placeholder: element.getAttribute('placeholder'),
                selector: selectorValue(element),
              });

              const collectByTerms = (selector, terms, limit = 8) => {
                const seen = new Set();
                return Array.from(document.querySelectorAll(selector))
                  .filter(isVisible)
                  .map((element) => {
                    const snapshot = controlSnapshot(element);
                    const haystack = [
                      snapshot.text,
                      snapshot.label,
                      snapshot.placeholder,
                      element.getAttribute('name'),
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase();
                    return { element, snapshot, haystack };
                  })
                  .filter(({ haystack }) => terms.some((term) => haystack.includes(term)))
                  .filter(({ snapshot }) => {
                    const key = `${snapshot.text}|${snapshot.label}|${snapshot.placeholder}|${snapshot.selector}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  })
                  .slice(0, limit)
                  .map(({ snapshot }) => snapshot);
              };

              const isListingLikeText = (text) => {
                const value = (text || '').toLowerCase();
                return (
                  value.includes('$') ||
                  /\\bbed(s)?\\b/.test(value) ||
                  /\\bbath(room)?s?\\b/.test(value) ||
                  /\\bhouse\\b/.test(value) ||
                  /\\bapartment\\b/.test(value) ||
                  /\\btownhouse\\b/.test(value) ||
                  /\\bft\\b/.test(value) ||
                  /\\bsq\\b/.test(value)
                );
              };

              const isRelevantLink = (item) => {
                const href = (item.href || '').toLowerCase();
                const text = (item.text || '').toLowerCase();
                if (!href || !text) return false;
                if (text.length > 60) return false;
                if (href.includes('recover')) return false;
                if (href.includes('/category/')) return false;
                if (href.includes('referral_ui_component=category_menu_item')) return false;
                return true;
              };

              const isPaginationControl = (item) => {
                const combined = `${item.text || ''} ${item.label || ''}`.replace(/\\s+/g, ' ').trim().toLowerCase();
                if (!combined || combined.length > 40) return false;
                if (combined.includes('back to previous')) return false;
                return (
                  combined === 'next' ||
                  combined === 'previous' ||
                  combined === 'prev' ||
                  combined === 'load more' ||
                  combined === 'show more' ||
                  combined === 'see more' ||
                  combined === 'more results' ||
                  combined === 'next page' ||
                  combined === 'previous page'
                );
              };

              const dialogNodes = () => {
                return Array.from(
                  document.querySelectorAll('[role="dialog"], dialog, [aria-modal="true"]')
                )
                  .filter(isVisible)
                  .map((dialog) => {
                    const rect = dialog.getBoundingClientRect();
                    return {
                      node: dialog,
                      top: Math.round(rect.top),
                      left: Math.round(rect.left),
                    };
                  })
                  .sort((a, b) => b.top - a.top || b.left - a.left);
              };

              const rankDialogButtons = (dialog) => {
                const seen = new Set();
                const dialogText = textValue(dialog).toLowerCase();
                const items = Array.from(
                  dialog.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')
                )
                  .filter(isVisible)
                  .map((button) => {
                    const text = textValue(button);
                    const label = button.getAttribute('aria-label');
                    const combined = `${text || ''} ${label || ''}`.trim().toLowerCase();
                    const key = `${text}|${label}|${selectorValue(button)}`;

                    let score = 0;
                    if (!combined) score -= 2;

                    if (
                      combined.includes('close') ||
                      combined.includes('not now') ||
                      combined.includes('dismiss') ||
                      combined.includes('cancel') ||
                      combined.includes('no thanks')
                    ) {
                      score += 15;
                    }

                    if (
                      combined.includes('allow') ||
                      combined.includes('accept') ||
                      combined.includes('agree') ||
                      combined.includes('continue') ||
                      combined.includes('ok')
                    ) {
                      score += 12;
                    }

                    if (
                      combined.includes('decline') ||
                      combined.includes('reject') ||
                      combined.includes('essential') ||
                      combined.includes('optional cookies')
                    ) {
                      score += 10;
                    }

                    if (dialogText.includes('cookie') || dialogText.includes('consent')) {
                      if (combined.includes('allow') || combined.includes('accept')) score += 10;
                      if (combined.includes('decline') || combined.includes('essential')) score += 8;
                    }

                    if (dialogText.includes('log in') || dialogText.includes('sign in')) {
                      if (combined.includes('log in') || combined.includes('create new account')) score -= 12;
                      if (combined.includes('close') || combined.includes('not now')) score += 8;
                    }

                    if (combined.includes('learn more') || combined.includes('language')) {
                      score -= 6;
                    }

                    return {
                      text,
                      label,
                      selector: selectorValue(button),
                      score,
                      key,
                    };
                  })
                  .filter((item) => {
                    if (seen.has(item.key)) return false;
                    seen.add(item.key);
                    return true;
                  })
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 10)
                  .map(({ key, score, ...button }) => button);

                return items;
              };

              const paginationControls = Array.from(
                document.querySelectorAll('button, [role="button"], a[rel="next"], a[aria-label*="next" i], button[aria-label*="next" i]')
              )
                .filter(isVisible)
                .map((element) => ({
                  text: textValue(element),
                  label: element.getAttribute('aria-label'),
                  selector: selectorValue(element),
                }))
                .filter(isPaginationControl)
                .slice(0, 8);

              const dialogs = dialogNodes()
                .slice(0, 5)
                .map(({ node, top, left }) => ({
                  text: textValue(node),
                  selector: selectorValue(node),
                  top,
                  left,
                  buttons: rankDialogButtons(node),
                }));

              const activeDialog = dialogs.length > 0 ? dialogs[dialogs.length-1] : null;
              const locationControls = collectByTerms(
                'button, [role="button"], input:not([type="hidden"]), textarea, [role="combobox"], [role="listbox"], select',
                ['location', 'city', 'town', 'area', 'region', 'postcode', 'zip', 'near me'],
                8,
              ).filter((item) => !isListingLikeText(`${item.text || ''} ${item.label || ''}`));

              return {
                headings: collect('h1, h2, h3', (el) => textValue(el), 8),
                buttons: collect(
                  'button, [role="button"], input[type="button"], input[type="submit"]',
                  (el) => ({
                    text: textValue(el),
                    label: el.getAttribute('aria-label'),
                    selector: selectorValue(el),
                  }),
                  12,
                ),
                inputs: collect(
                  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea',
                  (el) => ({
                    role: el.tagName.toLowerCase(),
                    text: textValue(el),
                    label: el.getAttribute('aria-label'),
                    placeholder: el.getAttribute('placeholder'),
                    type: el.getAttribute('type'),
                    selector: selectorValue(el),
                  }),
                  12,
                ),
                links: collect(
                  'a[href]',
                  (el) => ({
                    text: textValue(el),
                    href: el.getAttribute('href'),
                  }),
                  12,
                ).filter(isRelevantLink).slice(0, 6),
                selects: collect(
                  'select',
                  (el) => ({
                    label: el.getAttribute('aria-label'),
                    selected: el.options[el.selectedIndex]?.text || '',
                    options: Array.from(el.options).slice(0, 8).map((opt) => opt.text.trim()).filter(Boolean),
                    selector: selectorValue(el),
                  }),
                  8,
                ),
                checkboxes: collect(
                  'input[type="checkbox"], [role="checkbox"]',
                  (el) => ({
                    label: el.getAttribute('aria-label'),
                    text: textValue(el.closest('label') || el.parentElement || el),
                    checked: el.checked ?? (el.getAttribute('aria-checked') === 'true'),
                    selector: selectorValue(el),
                  }),
                  10,
                ),
                radios: collect(
                  'input[type="radio"], [role="radio"]',
                  (el) => ({
                    label: el.getAttribute('aria-label'),
                    text: textValue(el.closest('label') || el.parentElement || el),
                    checked: el.checked ?? (el.getAttribute('aria-checked') === 'true'),
                    selector: selectorValue(el),
                  }),
                  10,
                ),
                tabs: collect(
                  '[role="tab"]',
                  (el) => ({
                    text: textValue(el),
                    selected: el.getAttribute('aria-selected'),
                    selector: selectorValue(el),
                  }),
                  10,
                ),
                options: collect(
                  '[role="option"]',
                  (el) => ({
                    text: textValue(el),
                    selected: el.getAttribute('aria-selected'),
                    selector: selectorValue(el),
                  }),
                  10,
                ),
                dialogs,
                active_dialog: activeDialog,
                dialogs_remaining: dialogs.length,
                location_controls: locationControls,
                pagination_controls: paginationControls,
                scrolling_possible: document.body.scrollHeight > (window.innerHeight + 600),
              };
            }
            """
        )

        active_dialog = packet.get("active_dialog")

        return {
            "url": page.url,
            "title": title,
            "headings": packet.get("headings", []),
            "buttons": packet.get("buttons", []),
            "inputs": packet.get("inputs", []),
            "links": packet.get("links", []),
            "selects": packet.get("selects", []),
            "checkboxes": packet.get("checkboxes", []),
            "radios": packet.get("radios", []),
            "tabs": packet.get("tabs", []),
            "options": packet.get("options", []),
            "dialogs": [active_dialog] if active_dialog else [],
            "active_dialog": active_dialog,
            "dialogs_remaining": packet.get("dialogs_remaining", 0),
            "modal_present": bool(active_dialog),
            "location_controls": packet.get("location_controls", []),
            "pagination_controls": packet.get("pagination_controls", []),
            "scrolling_possible": bool(packet.get("scrolling_possible", False)),
            "visible_summary": {
                "buttons_count": len(packet.get("buttons", [])),
                "inputs_count": len(packet.get("inputs", [])),
                "links_count": len(packet.get("links", [])),
                "selects_count": len(packet.get("selects", [])),
                "checkboxes_count": len(packet.get("checkboxes", [])),
                "radios_count": len(packet.get("radios", [])),
                "tabs_count": len(packet.get("tabs", [])),
                "options_count": len(packet.get("options", [])),
                "dialogs_count": int(packet.get("dialogs_remaining", 0)),
                "location_controls_count": len(packet.get("location_controls", [])),
                "pagination_controls_count": len(packet.get("pagination_controls", [])),
                "scrolling_possible": bool(packet.get("scrolling_possible", False)),
            },
        }

    async def plan(
        self,
        request: ScrapeRequest,
        page_packet: dict,
        last_actions: list[dict],
        cached_recipe: dict | None = None,
    ) -> PlannerDecision:
        planner_page_packet = self._build_planner_page_packet(page_packet)
        prompt = build_action_planner_prompt(
            request=request,
            page_packet=planner_page_packet,
            last_actions=last_actions,
            cached_recipe=cached_recipe,
        )
        print(f"Planner prompt: {prompt}")  # --- IGNORE ---
        self.last_prompt = {
            "goal": request.user_goal,
            "keyword": request.keyword,
            "location": request.location,
            "required_fields": request.filters.get("__required_fields__", []),
            "filters": {
                k: v for k, v in request.filters.items() if k != "__required_fields__"
            },
            "page": planner_page_packet,
            "last_actions": last_actions[-3:],
            "cached_recipe": cached_recipe,
        }
        data = await self.ollama.chat_json(
            prompt=prompt, system=ACTION_PLANNER_SYSTEM, temperature=0.0
        )
        self.last_raw_response = data
        print(f"Planner raw response: {data}")  # --- IGNORE ---
        decision = self._parse(data)
        decision.actions = [
            self._enrich_dialog_action_target(page_packet, action)
            for action in decision.actions
        ]
        decision = self._enforce_location_first(
            request=request,
            page_packet=page_packet,
            last_actions=last_actions,
            decision=decision,
        )
        self.last_decision = decision
        print(f"Planner decision: {decision}")  # --- IGNORE ---
        return decision

    def _build_planner_page_packet(self, page_packet: dict) -> dict:
        active_dialog = page_packet.get("active_dialog")
        if active_dialog:
            return {
                "url": page_packet.get("url"),
                "title": page_packet.get("title"),
                "modal_present": True,
                "dialogs_remaining": page_packet.get("dialogs_remaining", 1),
                "active_dialog": active_dialog,
            }

        planner_page_packet = {
            "url": page_packet.get("url"),
            "title": page_packet.get("title"),
            "headings": page_packet.get("headings", []),
            "buttons": page_packet.get("buttons", []),
            "inputs": page_packet.get("inputs", []),
            "selects": page_packet.get("selects", []),
            "checkboxes": page_packet.get("checkboxes", []),
            "radios": page_packet.get("radios", []),
            "tabs": page_packet.get("tabs", []),
            "options": page_packet.get("options", []),
            "links": page_packet.get("links", []),
            "location_controls": page_packet.get("location_controls", []),
            "pagination_controls": page_packet.get("pagination_controls", []),
            "scrolling_possible": page_packet.get("scrolling_possible", False),
            "modal_present": page_packet.get("modal_present", False),
            "dialogs_remaining": page_packet.get("dialogs_remaining", 0),
        }
        return self._strip_nonblocking_auth_controls(planner_page_packet)

    def _strip_nonblocking_auth_controls(self, page_packet: dict) -> dict:
        auth_hints = (
            "log in",
            "login",
            "sign in",
            "signin",
            "sign up",
            "signup",
            "create account",
            "register",
            "subscribe",
            "newsletter",
            "join now",
            "start trial",
            "continue with google",
            "continue with facebook",
            "email or phone",
            "password",
            "forgotten password",
        )

        def is_auth_item(item: dict) -> bool:
            combined = " ".join(
                str(item.get(key) or "")
                for key in ("text", "label", "placeholder", "href")
            ).lower()
            return any(hint in combined for hint in auth_hints)

        page_packet["buttons"] = [
            item for item in page_packet.get("buttons", []) if not is_auth_item(item)
        ]
        page_packet["inputs"] = [
            item for item in page_packet.get("inputs", []) if not is_auth_item(item)
        ]
        page_packet["links"] = [
            item for item in page_packet.get("links", []) if not is_auth_item(item)
        ]
        return page_packet

    def _parse(self, data: dict) -> PlannerDecision:
        actions = []
        normalized_items = self._normalize_action_items(data)
        for item in normalized_items[:3]:
            target = self._build_target(item.get("target"))
            actions.append(
                PlannedAction(
                    action_type=self._normalize_action_type(
                        str(item.get("action_type", "wait") or "wait")
                    ),
                    target=target,
                    value=item.get("value"),
                    wait_ms=item.get("wait_ms"),
                )
            )

        if not actions:
            legacy_action = self._parse_legacy_single_action(data)
            if legacy_action is not None:
                actions.append(legacy_action)

        dlp = data.get("data_load_plan")
        data_load_plan = None
        if isinstance(dlp, dict):
            trigger_target = self._build_target(dlp.get("trigger_target"))
            data_load_plan = DataLoadPlan(
                mode=dlp.get("mode"),
                trigger_target=trigger_target,
                reason=dlp.get("reason"),
            )

        ep = data.get("extraction_plan")
        extraction_plan = None
        if isinstance(ep, dict):
            extraction_plan = ExtractionPlan(
                mode=ep.get("mode"),
                container_hint=ep.get("container_hint"),
                field_hints=ep.get("field_hints", {}),
                html_section_hint=ep.get("html_section_hint"),
                reason=ep.get("reason"),
            )

        return PlannerDecision(
            reason=data.get("reason", data.get("action_type", data.get("action", ""))),
            actions=actions,
            results_ready=bool(data.get("results_ready", False)),
            should_continue=bool(data.get("should_continue", True)),
            data_load_plan=data_load_plan,
            extraction_plan=extraction_plan,
            api_shortlist_ids=data.get("api_shortlist_ids", []),
        )

    def _enrich_dialog_action_target(
        self, page_packet: dict, action: PlannedAction
    ) -> PlannedAction:
        if action.action_type != "click" or not action.target:
            return action

        active_dialog = page_packet.get("active_dialog")
        if not isinstance(active_dialog, dict):
            return action

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

        close_hints = {"close", "dismiss", "not now", "cancel", "skip", "no thanks"}
        if not any(hint in combined for hint in close_hints):
            return action

        for button in active_dialog.get("buttons", []):
            button_text = (button.get("text") or "").lower()
            button_label = (button.get("label") or "").lower()
            if not any(hint in button_text or hint in button_label for hint in close_hints):
                continue

            selector = button.get("selector")
            if selector:
                action.target.css = selector
                print(f"[ENRICH] Injected dialog selector: {selector}")
                return action

        return action

    def _enforce_location_first(
        self,
        request: ScrapeRequest,
        page_packet: dict,
        last_actions: list[dict],
        decision: PlannerDecision,
    ) -> PlannerDecision:
        location = (request.location or "").strip()
        location_controls = page_packet.get("location_controls") or []
        if not location or not location_controls or page_packet.get("active_dialog"):
            return decision

        recent_text = " ".join(
            filter(
                None,
                [
                    str(item.get("target_text") or "")
                    for item in last_actions[-3:]
                ]
                + [
                    str(item.get("target_label") or "")
                    for item in last_actions[-3:]
                ]
                + [str(item.get("value") or "") for item in last_actions[-3:]],
            )
        ).lower()

        if location.lower() in recent_text:
            return decision

        location_selectors = {
            str(control.get("selector") or "")
            for control in location_controls
            if control.get("selector")
        }
        location_texts = {
            str(control.get("text") or "").lower()
            for control in location_controls
            if control.get("text")
        }

        for action in decision.actions:
            target = action.target
            if not target:
                continue
            if target.css and target.css in location_selectors:
                return decision
            combined = " ".join(
                filter(None, [target.text, target.label, target.placeholder])
            ).lower()
            if any(text in combined for text in location_texts):
                return decision

        first_control = location_controls[0]
        forced_action = PlannedAction(
            action_type="click",
            target=ActionTarget(
                role=first_control.get("role"),
                text=first_control.get("text"),
                label=first_control.get("label"),
                placeholder=first_control.get("placeholder"),
                css=first_control.get("selector"),
                button_hint="required location control",
            ),
            value=None,
            wait_ms=None,
        )
        return PlannerDecision(
            reason="Location is required and still pending, so the location control must be opened first.",
            actions=[forced_action],
            results_ready=False,
            should_continue=True,
            data_load_plan=decision.data_load_plan,
            extraction_plan=decision.extraction_plan,
            api_shortlist_ids=decision.api_shortlist_ids,
        )

    def _normalize_action_items(self, data: dict) -> list[dict]:
        items = data.get("actions")
        if isinstance(items, list):
            normalized: list[dict] = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                normalized.extend(self._expand_semantic_action_item(item))
            return normalized

        top_level_action_type = data.get("action_type")
        if top_level_action_type:
            return self._expand_semantic_action_item(
                {
                    "action_type": top_level_action_type,
                    "target": self._extract_target_payload(data),
                    "value": data.get("value"),
                    "submit_after_fill": data.get("submit_after_fill"),
                    "wait_ms": data.get("wait_ms"),
                }
            )

        return []

    def _expand_semantic_action_item(self, item: dict) -> list[dict]:
        action_type = str(item.get("action_type") or "").strip().lower()
        if action_type == "select_location_control":
            target = item.get("target")
            value = item.get("value")
            expanded = []
            if target:
                expanded.append(
                    {
                        "action_type": "click",
                        "target": target,
                        "value": None,
                        "wait_ms": item.get("wait_ms"),
                    }
                )
            expanded.append(
                {
                    "action_type": "fill",
                    "target": target,
                    "value": value,
                    "wait_ms": item.get("wait_ms"),
                }
            )
            expanded.append(
                {
                    "action_type": "press_enter",
                    "target": target,
                    "value": None,
                    "wait_ms": item.get("wait_ms"),
                }
            )
            return expanded

        normalized_action = self._normalize_action_type(action_type)
        if normalized_action == "fill" and item.get("submit_after_fill"):
            target = item.get("target")
            return [
                {
                    "action_type": "fill",
                    "target": target,
                    "value": item.get("value"),
                    "wait_ms": item.get("wait_ms"),
                },
                {
                    "action_type": "press_enter",
                    "target": target,
                    "value": None,
                    "wait_ms": item.get("wait_ms"),
                },
            ]

        return [item]

    def _normalize_action_type(self, action_type: str) -> str:
        normalized = action_type.strip().lower()
        primitive_map = {
            "click": "click",
            "fill": "fill",
            "press_enter": "press_enter",
            "select": "select",
            "scroll": "scroll",
            "wait": "wait",
        }
        semantic_map = {
            "fill_input": "fill",
            "search": "fill",
            "search_keyword": "fill",
            "set_min_price": "fill",
            "set_max_price": "fill",
            "open_filter": "click",
            "toggle_checkbox": "click",
            "click_chip": "click",
            "apply_filter": "click",
            "close_dialog": "click",
            "click_pagination": "click",
            "select_option": "select",
        }
        return primitive_map.get(normalized) or semantic_map.get(normalized) or normalized

    def _extract_target_payload(self, data: dict) -> dict | None:
        if not isinstance(data, dict):
            return None

        payload: dict = {}
        nested_target = data.get("target")
        if isinstance(nested_target, dict):
            payload.update(nested_target)
            if payload.get("selector") and not payload.get("css"):
                payload["css"] = payload.get("selector")

        mappings = {
            "target_role": "role",
            "target_text": "text",
            "target_label": "label",
            "target_placeholder": "placeholder",
            "target_selector": "css",
            "target_css": "css",
            "target_field_hint": "field_hint",
            "target_button_hint": "button_hint",
            "target_nearby_text": "nearby_text",
        }
        for source_key, target_key in mappings.items():
            value = data.get(source_key)
            if value is not None and payload.get(target_key) in (None, ""):
                payload[target_key] = value

        return payload or None

    def _build_target(self, value) -> ActionTarget | None:
        if not isinstance(value, dict):
            return None
        return ActionTarget(
            role=value.get("role"),
            text=value.get("text"),
            label=value.get("label"),
            placeholder=value.get("placeholder"),
            css=value.get("css") or value.get("selector"),
            field_hint=value.get("field_hint"),
            button_hint=value.get("button_hint"),
            nearby_text=value.get("nearby_text"),
        )

    def _parse_legacy_single_action(self, data: dict) -> PlannedAction | None:
        action_name = str(data.get("action") or "").strip().lower()
        if not action_name:
            return None

        legacy_target = self._build_target(data.get("target"))
        button_text = data.get("button_text")
        button_label = data.get("button_label")
        dialog_selector = data.get("dialog_selector")
        input_placeholder = data.get("input_placeholder")
        input_label = data.get("input_label")
        value = data.get("value")

        target = legacy_target or ActionTarget()
        if button_text and not target.text:
            target.text = button_text
        if button_label and not target.label:
            target.label = button_label
        if input_placeholder and not target.placeholder:
            target.placeholder = input_placeholder
        if isinstance(dialog_selector, str) and not target.css:
            target.css = dialog_selector
        if data.get("nearby_text") and not target.nearby_text:
            target.nearby_text = data.get("nearby_text")
        if input_label and not target.label:
            target.label = input_label

        action_map = {
            "accept_cookies": "click",
            "close_dialog": "click",
            "close_popup": "click",
            "dismiss_popup": "click",
            "ignore_login": "click",
            "ignore_subscription": "click",
            "click": "click",
            "open_filter": "click",
            "apply_filter": "click",
            "press_enter": "press_enter",
            "submit_search": "press_enter",
            "click_pagination": "click",
            "scroll": "scroll",
            "fill_input": "fill",
            "search": "fill",
            "search_keyword": "fill",
            "select_option": "select",
            "set_min_price": "fill",
            "set_max_price": "fill",
            "wait": "wait",
        }

        normalized_action = action_map.get(action_name)
        if not normalized_action:
            return None

        if normalized_action == "scroll":
            target = None

        if target and not any(
            [
                target.text,
                target.label,
                target.placeholder,
                target.css,
                target.nearby_text,
            ]
        ):
            target = None

        if normalized_action == "fill" and not value:
            value = data.get("keyword") or data.get("search_text")

        return PlannedAction(
            action_type=normalized_action,
            target=target,
            value=value,
            wait_ms=data.get("wait_ms"),
        )
