import asyncio
import json
import random
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from playwright.async_api import async_playwright
from playwright_stealth import Stealth


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

DEBUG_DIR = Path("debug")
DEBUG_DIR.mkdir(exist_ok=True)

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen2.5-coder:7b"

FORBIDDEN_TARGET_TEXTS = {
    "log in",
    "login",
    "sign in",
    "sign up",
    "create account",
    "create new account",
    "continue as",
    "forgot account?",
    "forgot password",
    "subscribe",
    "start free trial",
    "try for free",
    "get started",
}

SAFE_CLOSE_TEXTS = [
    "close",
    "dismiss",
    "not now",
    "maybe later",
    "skip",
    "x",
    "no thanks",
    "no, thanks",
    "cancel",
]

COOKIE_ACCEPT_TEXTS = [
    "Allow all cookies",
    "Accept all",
    "Accept All",
    "Accept",
    "I agree",
    "Agree",
    "Allow essential and optional cookies",
    "Only allow essential cookies",
]

EMAIL_SUBSCRIPTION_HINTS = [
    "email",
    "subscribe",
    "subscription",
    "newsletter",
    "join our mailing list",
    "sign up for updates",
    "enter your email",
    "your email",
]

RESULT_TEXT_HINTS = [
    "price",
    "rent",
    "sale",
    "bedroom",
    "bathroom",
    "property",
    "listing",
    "results",
    "apartment",
    "house",
    "product",
]


@dataclass
class ScrapeRequest:
    url: str
    user_goal: str
    keyword: str | None = None
    location: str | None = None
    filters: dict[str, Any] = field(default_factory=dict)
    max_items: int = 50
    headless: bool = False
    retry: int = 2
    proxy: dict | None = None


def random_delay(min_ms: int = 1200, max_ms: int = 3000) -> float:
    return random.uniform(min_ms, max_ms) / 1000


async def capture_page_state(page, label: str = "state") -> dict:
    ts = int(time.time() * 1000)
    screenshot_path = DEBUG_DIR / f"{label}_{ts}.png"

    try:
        await page.screenshot(path=str(screenshot_path), full_page=True)
    except Exception:
        pass

    try:
        title = await page.title()
    except Exception:
        title = ""

    try:
        body_text = await page.locator("body").inner_text(timeout=4000)
    except Exception:
        body_text = ""

    return {
        "url": page.url,
        "title": title,
        "body_text": (body_text or "")[:15000],
        "screenshot_path": str(screenshot_path),
    }


async def discover_controls(page) -> dict:
    js = """
    () => {
      function clean(s) {
        return (s || '').replace(/\\s+/g, ' ').trim();
      }

      function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style &&
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          rect.width > 0 &&
          rect.height > 0
        );
      }

      function getLabel(el) {
        const aria = el.getAttribute('aria-label');
        if (aria) return clean(aria);

        const labelledby = el.getAttribute('aria-labelledby');
        if (labelledby) {
          const ids = labelledby.split(/\\s+/);
          const text = ids
            .map(id => document.getElementById(id))
            .filter(Boolean)
            .map(node => clean(node.innerText || node.textContent))
            .join(' ');
          if (text) return clean(text);
        }

        const id = el.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return clean(label.innerText || label.textContent);
        }

        const parentLabel = el.closest('label');
        if (parentLabel) return clean(parentLabel.innerText || parentLabel.textContent);

        const prev = el.previousElementSibling;
        if (prev) {
          const txt = clean(prev.innerText || prev.textContent);
          if (txt && txt.length < 120) return txt;
        }

        return '';
      }

      function serialize(nodes, kind) {
        const out = [];
        for (const el of nodes) {
          if (!isVisible(el)) continue;

          const rect = el.getBoundingClientRect();
          const text = clean(el.innerText || el.textContent);
          const label = getLabel(el);

          let options = [];
          if (el.tagName && el.tagName.toLowerCase() === 'select') {
            options = Array.from(el.options || []).map(o => clean(o.textContent)).filter(Boolean).slice(0, 30);
          }

          out.push({
            kind,
            tag: (el.tagName || '').toLowerCase(),
            role: el.getAttribute('role'),
            type: el.getAttribute('type'),
            text,
            label,
            placeholder: el.getAttribute('placeholder'),
            name: el.getAttribute('name'),
            value: el.value || '',
            checked: !!el.checked,
            disabled: !!el.disabled,
            options,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            width: rect.width,
            height: rect.height
          });
        }
        return out;
      }

      return {
        buttons: serialize(document.querySelectorAll('button, [role="button"]'), 'button').slice(0, 100),
        links: serialize(document.querySelectorAll('a[href]'), 'link').slice(0, 100),
        inputs: serialize(document.querySelectorAll('input, textarea, [role="textbox"]'), 'input').slice(0, 60),
        selects: serialize(document.querySelectorAll('select, [role="combobox"]'), 'select').slice(0, 40),
        checkboxes: serialize(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'), 'checkbox').slice(0, 60),
        radios: serialize(document.querySelectorAll('input[type="radio"], [role="radio"]'), 'radio').slice(0, 60),
        dialogs: serialize(document.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog')).slice(0, 20),
      };
    }
    """
    return await page.evaluate(js)


async def discover_filters(page) -> list[dict]:
    js = """
    () => {
      function clean(s) {
        return (s || '').replace(/\\s+/g, ' ').trim();
      }

      function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      }

      const candidates = [];
      const labels = Array.from(document.querySelectorAll('label, legend, h1, h2, h3, h4, [role="heading"], span, div, button'));

      for (const el of labels) {
        if (!isVisible(el)) continue;
        const text = clean(el.innerText || el.textContent);
        if (!text) continue;

        const low = text.toLowerCase();
        if (
          low.includes('filter') ||
          low.includes('sort by') ||
          low.includes('price') ||
          low.includes('condition') ||
          low.includes('date listed') ||
          low.includes('availability') ||
          low.includes('categories') ||
          low.includes('delivery method') ||
          low.includes('location') ||
          low.includes('beds') ||
          low.includes('baths') ||
          low.includes('property type')
        ) {
          candidates.push({
            name: text,
            type: 'unknown'
          });
        }
      }

      const seen = new Set();
      return candidates.filter(x => {
        const key = x.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 40);
    }
    """
    return await page.evaluate(js)


async def detect_result_signals(page) -> dict:
    js = """
    () => {
      function collectText(limit = 1200) {
        return Array.from(document.querySelectorAll('body *'))
          .slice(0, limit)
          .map(el => (el.innerText || '').trim())
          .filter(Boolean)
          .join('\\n')
          .toLowerCase();
      }

      const texts = collectText();
      return {
        link_count: document.querySelectorAll('a[href]').length,
        table_rows: document.querySelectorAll('table tr').length,
        list_items: document.querySelectorAll('li').length,
        article_like: document.querySelectorAll('article, [role="article"]').length,
        detail_links: document.querySelectorAll('a[href*="/item/"], a[href*="/listing/"], a[href*="/product/"], a[href*="/property/"], a[href*="/details"]').length,
        has_price_like_text: /[$€£₹]|usd|eur|gbp|rent|sale|bedroom|bathroom|property|product/i.test(texts)
      };
    }
    """
    return await page.evaluate(js)


def page_has_email_or_subscription_overlay(state: dict, controls: dict) -> bool:
    hay = " ".join(
        [
            state.get("title", ""),
            state.get("body_text", ""),
            " ".join((x.get("text") or "") for x in controls.get("dialogs", [])),
            " ".join((x.get("text") or "") for x in controls.get("buttons", [])[:30]),
        ]
    ).lower()
    return any(hint in hay for hint in EMAIL_SUBSCRIPTION_HINTS)


def page_has_cookie_banner(state: dict, controls: dict) -> bool:
    hay = " ".join(
        [
            state.get("title", ""),
            state.get("body_text", ""),
            " ".join((x.get("text") or "") for x in controls.get("buttons", [])[:30]),
        ]
    ).lower()
    keys = [
        "allow all cookies",
        "accept all",
        "cookies",
        "we use cookies",
        "essential cookies",
        "cookie preferences",
    ]
    return any(k in hay for k in keys)


def page_has_login_wall(state: dict, result_signals: dict) -> bool:
    t = (state.get("body_text") or "").lower()
    has_login = any(x in t for x in ["log in", "sign up", "forgot account?", "forgot password"])
    has_results = (
        result_signals.get("article_like", 0) > 0
        or result_signals.get("table_rows", 0) > 2
        or result_signals.get("detail_links", 0) > 0
        or result_signals.get("has_price_like_text", False)
    )
    return has_login and not has_results


async def observe_page(page, request: ScrapeRequest, history: list[dict]) -> dict:
    state = await capture_page_state(page, label="observe")
    controls = await discover_controls(page)
    filters = await discover_filters(page)
    result_signals = await detect_result_signals(page)

    can_scrape_now = (
        result_signals["article_like"] > 0
        or result_signals["table_rows"] > 2
        or result_signals["detail_links"] > 0
        or result_signals["has_price_like_text"]
    )

    return {
        "goal": request.user_goal,
        "url": state["url"],
        "title": state["title"],
        "body_text": state["body_text"],
        "screenshot_path": state["screenshot_path"],
        "controls": controls,
        "filters": filters,
        "result_signals": result_signals,
        "history": history[-8:],
        "requested_inputs": {
            "keyword": request.keyword,
            "location": request.location,
            "filters": request.filters,
        },
        "signals": {
            "cookie_banner": page_has_cookie_banner(state, controls),
            "email_or_subscription_popup": page_has_email_or_subscription_overlay(state, controls),
            "login_wall": page_has_login_wall(state, result_signals),
        },
        "can_scrape_now": can_scrape_now,
    }


async def try_safe_close_popup(page) -> bool:
    for text in SAFE_CLOSE_TEXTS:
        candidates = [
            page.get_by_role("button", name=text).first,
            page.get_by_text(text, exact=False).locator("xpath=ancestor-or-self::button[1]").first,
            page.get_by_text(text, exact=False).first,
        ]
        for loc in candidates:
            try:
                await loc.wait_for(state="visible", timeout=1200)
                await loc.click(timeout=3000)
                print(f"  [RULE] closed popup with: {text}")
                await asyncio.sleep(1.5)
                return True
            except Exception:
                pass
    return False


async def try_cookie_accept(page) -> bool:
    for name in COOKIE_ACCEPT_TEXTS:
        candidates = [
            page.get_by_role("button", name=name).first,
            page.get_by_text(name, exact=False).locator("xpath=ancestor-or-self::button[1]").first,
            page.get_by_text(name, exact=False).first,
        ]
        for loc in candidates:
            try:
                await loc.wait_for(state="visible", timeout=1200)
                await loc.click(timeout=3000)
                print(f"  [RULE] cookie action: {name}")
                await asyncio.sleep(2)
                return True
            except Exception:
                pass
    return False


def build_agent_schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "page_state": {"type": "string"},
            "goal_status": {"type": "string"},
            "reason": {"type": "string"},
            "next_action": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "click",
                            "fill",
                            "select",
                            "check",
                            "uncheck",
                            "scroll",
                            "wait",
                            "close",
                            "scrape",
                            "stop",
                        ],
                    },
                    "target": {
                        "type": "object",
                        "properties": {
                            "role": {"type": ["string", "null"]},
                            "text": {"type": ["string", "null"]},
                            "label": {"type": ["string", "null"]},
                            "placeholder": {"type": ["string", "null"]},
                            "css": {"type": ["string", "null"]},
                            "approximate_position": {
                                "type": ["object", "null"],
                                "properties": {
                                    "x": {"type": "number"},
                                    "y": {"type": "number"},
                                },
                                "required": ["x", "y"],
                            },
                        },
                        "required": ["role", "text", "label", "placeholder", "css", "approximate_position"],
                    },
                    "value": {"type": ["string", "null"]},
                    "wait_ms": {"type": ["integer", "null"]},
                },
                "required": ["type", "target", "value", "wait_ms"],
            },
            "available_filters": {"type": "array"},
            "can_scrape_now": {"type": "boolean"},
            "can_continue": {"type": "boolean"},
        },
        "required": [
            "page_state",
            "goal_status",
            "reason",
            "next_action",
            "available_filters",
            "can_scrape_now",
            "can_continue",
        ],
    }


async def ask_llm_for_next_action(observation: dict, request: ScrapeRequest) -> dict:
    schema = build_agent_schema()

    prompt = f"""
You are a web automation planner.

Goal:
{request.user_goal}

Requested user inputs:
- keyword: {request.keyword}
- location: {request.location}
- filters: {json.dumps(request.filters, ensure_ascii=False)}

Rules:
- Never choose login, sign up, account creation, authentication, or email submission actions.
- If a popup asks for email/subscription, first try to close it.
- If it cannot be safely closed, ignore it and continue with page actions.
- Prefer removing blockers before interacting with results.
- If the page has a search box and keyword is provided, use it.
- If the page has a location input and location is provided, use it.
- If the page has matching filters and filter values are provided, apply them.
- If results are already visible, prefer scrape or scroll.
- Choose only one next action.
- If no useful action remains, return stop.
- Return JSON only.

Current URL:
{observation["url"]}

Title:
{observation["title"]}

Signals:
{json.dumps(observation["signals"], ensure_ascii=False)}

Result signals:
{json.dumps(observation["result_signals"], ensure_ascii=False)}

Visible filters:
{json.dumps(observation["filters"], ensure_ascii=False)}

Visible controls summary:
{json.dumps({
    "buttons": observation["controls"]["buttons"][:25],
    "links": observation["controls"]["links"][:25],
    "inputs": observation["controls"]["inputs"][:20],
    "selects": observation["controls"]["selects"][:10],
    "checkboxes": observation["controls"]["checkboxes"][:15],
    "dialogs": observation["controls"]["dialogs"][:10],
}, ensure_ascii=False)}

Visible body text sample:
{observation["body_text"][:5000]}

Previous actions:
{json.dumps(observation["history"], ensure_ascii=False)}
""".strip()

    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": "Return only valid JSON matching the schema."},
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                "format": schema,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    content = data.get("message", {}).get("content", "{}")
    print("[LLM] raw plan:", content)
    return json.loads(content)


def build_target_locators(page, target: dict):
    role = (target.get("role") or "").strip()
    text = (target.get("text") or "").strip()
    label = (target.get("label") or "").strip()
    placeholder = (target.get("placeholder") or "").strip()
    css = (target.get("css") or "").strip()

    locators = []

    if role and text:
        try:
            locators.append(page.get_by_role(role, name=text).first)
        except Exception:
            pass

    if label:
        try:
            locators.append(page.get_by_label(label, exact=False).first)
        except Exception:
            pass

    if placeholder:
        try:
            locators.append(page.get_by_placeholder(placeholder, exact=False).first)
        except Exception:
            pass

    if text:
        try:
            locators.append(page.get_by_text(text, exact=False).first)
        except Exception:
            pass
        try:
            locators.append(page.get_by_text(text, exact=False).locator("xpath=ancestor-or-self::button[1]").first)
        except Exception:
            pass
        try:
            locators.append(page.get_by_text(text, exact=False).locator("xpath=ancestor-or-self::a[1]").first)
        except Exception:
            pass

    if css:
        try:
            locators.append(page.locator(css).first)
        except Exception:
            pass

    return locators


async def first_visible_locator(locators, timeout_ms: int = 1500):
    for loc in locators:
        try:
            await loc.wait_for(state="visible", timeout=timeout_ms)
            return loc
        except Exception:
            pass
    return None


async def click_locator_or_position(page, target: dict) -> bool:
    text_value = ((target or {}).get("text") or "").strip().lower()
    if text_value in FORBIDDEN_TARGET_TEXTS:
        print(f"  [EXEC] blocked forbidden target: {text_value}")
        return False

    locators = build_target_locators(page, target)
    visible = await first_visible_locator(locators, timeout_ms=1500)

    if visible:
        try:
            await visible.click(timeout=4000)
            return True
        except Exception:
            try:
                box = await visible.bounding_box()
                if box:
                    await page.mouse.click(
                        box["x"] + box["width"] / 2,
                        box["y"] + box["height"] / 2,
                    )
                    return True
            except Exception:
                pass

    pos = (target or {}).get("approximate_position")
    if pos and text_value not in FORBIDDEN_TARGET_TEXTS:
        try:
            await page.mouse.click(float(pos["x"]), float(pos["y"]))
            return True
        except Exception:
            pass

    return False


async def execute_plan(page, plan: dict) -> bool:
    action = plan["next_action"]["type"]
    target = plan["next_action"]["target"]
    value = plan["next_action"]["value"]
    wait_ms = plan["next_action"]["wait_ms"] or 1500

    print(f"  [PLAN] state={plan['page_state']} goal_status={plan['goal_status']}")
    print(f"  [PLAN] reason={plan['reason']}")
    print(f"  [PLAN] next_action={plan['next_action']}")

    if action in {"stop", "scrape"}:
        return False

    if action == "wait":
        await asyncio.sleep(max(500, min(wait_ms, 10000)) / 1000)
        return True

    if action == "scroll":
        await page.evaluate(
            "(amt) => window.scrollBy({ top: amt, behavior: 'smooth' })",
            1000,
        )
        await asyncio.sleep(1.5)
        return True

    locators = build_target_locators(page, target)
    visible = await first_visible_locator(locators, timeout_ms=1500)

    if action in {"click", "close"}:
        ok = await click_locator_or_position(page, target)
        if ok:
            await asyncio.sleep(2)
        return ok

    if action == "fill":
        text_value = ((target or {}).get("text") or "").strip().lower()
        if text_value in FORBIDDEN_TARGET_TEXTS:
            return False
        if visible and value is not None:
            try:
                await visible.fill(str(value), timeout=4000)
                await asyncio.sleep(1)
                return True
            except Exception:
                pass
        return False

    if action == "select":
        if visible and value is not None:
            try:
                await visible.select_option(label=str(value))
                await asyncio.sleep(1)
                return True
            except Exception:
                try:
                    await visible.select_option(value=str(value))
                    await asyncio.sleep(1)
                    return True
                except Exception:
                    pass
        return False

    if action == "check":
        if visible:
            try:
                await visible.check(timeout=4000)
                await asyncio.sleep(1)
                return True
            except Exception:
                pass
        return False

    if action == "uncheck":
        if visible:
            try:
                await visible.uncheck(timeout=4000)
                await asyncio.sleep(1)
                return True
            except Exception:
                pass
        return False

    return False


async def achieve_goal(page, request: ScrapeRequest, max_steps: int = 10) -> dict:
    history: list[dict] = []

    for step in range(1, max_steps + 1):
        print(f"\n[AGENT] step {step}/{max_steps}")
        observation = await observe_page(page, request, history)

        print(f"  [OBSERVE] url={observation['url']}")
        print(f"  [OBSERVE] result_signals={observation['result_signals']}")
        print(f"  [OBSERVE] signals={observation['signals']}")
        print(f"  [OBSERVE] filters={observation['filters'][:10]}")

        if observation["can_scrape_now"]:
            print("  [AGENT] data looks ready to scrape")
            return observation

        acted = False

        if observation["signals"]["cookie_banner"]:
            acted = await try_cookie_accept(page)
            history.append(
                {
                    "step": step,
                    "kind": "rule",
                    "action": "cookie_accept" if acted else "cookie_accept_failed",
                }
            )
            if acted:
                continue

        if observation["signals"]["email_or_subscription_popup"]:
            acted = await try_safe_close_popup(page)
            history.append(
                {
                    "step": step,
                    "kind": "rule",
                    "action": "close_popup" if acted else "ignore_popup",
                }
            )
            if acted:
                continue

        if observation["signals"]["login_wall"]:
            print("  [AGENT] login wall detected, but login actions are forbidden")
            history.append(
                {
                    "step": step,
                    "kind": "guard",
                    "action": "login_forbidden",
                }
            )

        plan = await ask_llm_for_next_action(observation, request)

        if plan.get("can_scrape_now"):
            print("  [AGENT] LLM says page is ready to scrape")
            return observation

        if not plan.get("can_continue", True):
            print("  [AGENT] no useful next action")
            return observation

        changed = await execute_plan(page, plan)
        history.append(
            {
                "step": step,
                "kind": "llm",
                "changed": changed,
                "plan": plan,
            }
        )

        if not changed:
            print("  [AGENT] action had no effect, stopping")
            return observation

    return await observe_page(page, request, history)


async def extract_generic_results(page, max_items: int = 80) -> list[dict]:
    js = """
    (maxItems) => {
      function clean(s) {
        return (s || '').replace(/\\s+/g, ' ').trim();
      }

      function visible(el) {
        if (!el) return false;
        const st = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return st.display !== 'none' && st.visibility !== 'hidden' && r.width > 20 && r.height > 20;
      }

      const out = [];

      for (const tr of document.querySelectorAll('table tr')) {
        if (!visible(tr)) continue;
        const cells = Array.from(tr.querySelectorAll('th,td'))
          .map(td => clean(td.innerText || td.textContent))
          .filter(Boolean);

        if (cells.length >= 2) {
          out.push({
            type: 'table_row',
            title: cells[0] || null,
            fields: cells,
            text: cells.join(' | '),
            url: null
          });
        }
      }

      for (const a of document.querySelectorAll('a[href]')) {
        if (!visible(a)) continue;
        const txt = clean(a.innerText || a.textContent);
        if (!txt || txt.length < 8) continue;

        out.push({
          type: 'link_block',
          title: txt.split('\\n')[0] || txt,
          fields: [],
          text: txt,
          url: a.href || null
        });
      }

      for (const li of document.querySelectorAll('li')) {
        if (!visible(li)) continue;
        const txt = clean(li.innerText || li.textContent);
        if (!txt || txt.length < 12) continue;

        out.push({
          type: 'list_item',
          title: txt.split('\\n')[0] || txt,
          fields: [],
          text: txt,
          url: null
        });
      }

      for (const article of document.querySelectorAll('article, [role="article"], [data-testid], section')) {
        if (!visible(article)) continue;
        const txt = clean(article.innerText || article.textContent);
        if (!txt || txt.length < 12) continue;

        const link = article.querySelector('a[href]');
        out.push({
          type: 'content_block',
          title: txt.split('\\n')[0] || txt,
          fields: [],
          text: txt,
          url: link ? link.href : null
        });
      }

      const seen = new Set();
      const deduped = [];
      for (const item of out) {
        const key = (item.url || item.text || '').slice(0, 300);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
        if (deduped.length >= maxItems) break;
      }

      return deduped;
    }
    """
    return await page.evaluate(js, max_items)


def normalize_generic_results(items: list[dict]) -> list[dict]:
    normalized = []

    for i, item in enumerate(items, start=1):
        text = item.get("text") or ""
        title = item.get("title")
        url = item.get("url")

        price_match = re.search(r"([$€£₹]\s?[\d,]+(?:\.\d{1,2})?)", text)
        normalized.append(
            {
                "id": f"result_{i}",
                "type": item.get("type"),
                "title": title,
                "url": url,
                "price": price_match.group(1) if price_match else None,
                "text": text,
                "fields": item.get("fields", []),
                "scraped_at": datetime.utcnow().isoformat(),
            }
        )

    return normalized


async def scrape_site(request: ScrapeRequest) -> dict:
    for attempt in range(1, request.retry + 2):
        try:
            stealth = Stealth()

            async with stealth.use_async(async_playwright()) as p:
                launch_kwargs = {
                    "headless": request.headless,
                    "slow_mo": 120 if not request.headless else 0,
                    "args": [
                        "--disable-blink-features=AutomationControlled",
                        "--lang=en-US",
                        "--window-size=1280,800",
                    ],
                }
                if request.proxy:
                    launch_kwargs["proxy"] = request.proxy

                browser = await p.chromium.launch(**launch_kwargs)

                context = await browser.new_context(
                    user_agent=random.choice(USER_AGENTS),
                    locale="en-US",
                    viewport={"width": 1280, "height": 800},
                    extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
                )

                page = await context.new_page()
                await page.goto(request.url, wait_until="networkidle", timeout=60000)

                final_observation = await achieve_goal(page, request=request, max_steps=10)

                print("Ready to scrape:", final_observation["can_scrape_now"])
                print("Available filters:", final_observation["filters"])

                items: list[dict] = []
                if final_observation["can_scrape_now"]:
                    raw_items = await extract_generic_results(page, max_items=request.max_items)
                    items = normalize_generic_results(raw_items)[: request.max_items]

                await context.close()
                await browser.close()

                return {
                    "url": request.url,
                    "goal": request.user_goal,
                    "ready_to_scrape": final_observation["can_scrape_now"],
                    "filters_detected": final_observation["filters"],
                    "applied_inputs": {
                        "keyword": request.keyword,
                        "location": request.location,
                        "filters": request.filters,
                    },
                    "result_signals": final_observation["result_signals"],
                    "items": items,
                }

        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            if attempt <= request.retry:
                await asyncio.sleep(2**attempt)
            else:
                return {
                    "url": request.url,
                    "goal": request.user_goal,
                    "ready_to_scrape": False,
                    "filters_detected": [],
                    "applied_inputs": {
                        "keyword": request.keyword,
                        "location": request.location,
                        "filters": request.filters,
                    },
                    "result_signals": {},
                    "items": [],
                    "error": str(e),
                }


async def scrape_many(requests: list[ScrapeRequest], concurrency: int = 2) -> dict:
    semaphore = asyncio.Semaphore(concurrency)
    results: dict[str, dict] = {}

    async def run_job(req: ScrapeRequest):
        key = req.url
        async with semaphore:
            print(f"\n{'=' * 60}\nStarting job: {key}\n{'=' * 60}")
            results[key] = await scrape_site(req)

    await asyncio.gather(*[run_job(r) for r in requests])
    return results


# Example:
# request = ScrapeRequest(
#     url="https://www.facebook.com/marketplace/category/propertyrentals",
#     user_goal="Remove blockers, ignore login, apply search inputs if available, list available filters, then scrape visible property rental results.",
#     keyword="2 bedroom apartment",
#     location="New York",
#     filters={"price_max": "3000"},
#     max_items=40,
#     headless=False,
# )
#
# result = asyncio.run(scrape_site(request))
# print(json.dumps(result, indent=2, ensure_ascii=False))