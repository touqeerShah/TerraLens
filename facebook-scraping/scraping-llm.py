import asyncio
import json
import random
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

import httpx
from playwright.async_api import (
    async_playwright,
    TimeoutError as PlaywrightTimeout,
)
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
    "sign up",
    "sign in",
    "create new account",
    "create account",
    "continue as",
    "forgot account?",
    "forgot password",
    "subscribe",
    "start free trial",
}

SAFE_CLOSE_TEXTS = [
    "close",
    "not now",
    "maybe later",
    "skip",
    "dismiss",
    "x",
    "no thanks",
    "no, thanks",
]

EMAIL_SUBSCRIPTION_HINTS = [
    "email",
    "subscribe",
    "subscription",
    "newsletter",
    "sign up for updates",
    "enter your email",
    "your email",
    "join our mailing list",
]

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────


def random_delay(min_ms=1200, max_ms=3000):
    return random.uniform(min_ms, max_ms) / 1000


def parse_listing(node: dict) -> dict | None:
    try:
        listing_id = node.get("id")
        if not listing_id:
            return None

        price_data = node.get("listing_price") or node.get("price_amount") or {}
        location_data = node.get("location", {}).get("reverse_geocode", {})
        photo = node.get("primary_listing_photo", {}).get("image", {}).get(
            "uri"
        ) or node.get("cover_media_source", {}).get("photo", {}).get("image", {}).get(
            "uri"
        )
        description = node.get("redacted_description") or {}

        return {
            "id": listing_id,
            "title": node.get("marketplace_listing_title") or node.get("name"),
            "price": price_data.get("amount_with_offset_in_currency"),
            "currency": price_data.get("currency", "USD"),
            "location": location_data.get("city") or location_data.get("state"),
            "condition": node.get("condition"),
            "category": node.get("category_name"),
            "description": (
                description.get("text") if isinstance(description, dict) else None
            ),
            "image_url": photo,
            "url": f"https://www.facebook.com/marketplace/item/{listing_id}",
            "posted_at": (
                datetime.utcfromtimestamp(node["creation_time"]).isoformat()
                if node.get("creation_time")
                else None
            ),
            "scraped_at": datetime.utcnow().isoformat(),
        }
    except Exception:
        return None


def extract_listings(data, listings: dict):
    if not isinstance(data, dict):
        return

    typename = data.get("__typename", "")
    if typename in (
        "MarketplaceListing",
        "Marketplace2PDPContainerQueryRelayPreloader",
    ):
        item = parse_listing(data)
        if item and item["id"]:
            listings[item["id"]] = item

    if "listing" in data and isinstance(data["listing"], dict):
        item = parse_listing(data["listing"])
        if item and item["id"]:
            listings[item["id"]] = item

    for value in data.values():
        if isinstance(value, dict):
            extract_listings(value, listings)
        elif isinstance(value, list):
            for v in value:
                if isinstance(v, dict):
                    extract_listings(v, listings)


async def handle_response(response, listings: dict):
    try:
        if "graphql" not in response.url:
            return
        if response.request.method != "POST":
            return

        text = await response.text()
        for line in text.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                extract_listings(data, listings)
            except json.JSONDecodeError:
                pass
    except Exception:
        pass


async def log_interesting_response(response):
    try:
        url = response.url
        if "graphql" in url or "marketplace" in url:
            print(f"  [RESP] {response.status} {url[:220]}")
    except Exception:
        pass


async def block_heavy_resources(route):
    try:
        url = route.request.url.lower()
        if re.search(r"\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|mp4|webp)(\?.*)?$", url):
            await route.abort()
        else:
            await route.continue_()
    except Exception:
        try:
            await route.continue_()
        except Exception:
            pass


# ─────────────────────────────────────────────
# Page understanding / blocker detection
# ─────────────────────────────────────────────

# -------------------------------------------------
# Page observation
# -------------------------------------------------


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

      function take(nodes, kind) {
        const out = [];
        for (const el of nodes) {
          if (!isVisible(el)) continue;
          const text = clean(el.innerText || el.textContent || el.getAttribute('aria-label') || '');
          const rect = el.getBoundingClientRect();
          out.push({
            kind,
            text,
            tag: (el.tagName || '').toLowerCase(),
            role: el.getAttribute('role'),
            aria_label: el.getAttribute('aria-label'),
            placeholder: el.getAttribute('placeholder'),
            type: el.getAttribute('type'),
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            width: rect.width,
            height: rect.height
          });
        }
        return out;
      }

      const buttons = take(document.querySelectorAll('button, [role="button"]'), 'button');
      const links = take(document.querySelectorAll('a'), 'link');
      const inputs = take(document.querySelectorAll('input, textarea, [role="textbox"]'), 'input');
      const selects = take(document.querySelectorAll('select, [role="combobox"]'), 'select');
      const dialogs = take(document.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog'), 'dialog');
      const headings = take(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'), 'heading');

      return {
        buttons: buttons.slice(0, 80),
        links: links.slice(0, 80),
        inputs: inputs.slice(0, 40),
        selects: selects.slice(0, 30),
        dialogs: dialogs.slice(0, 20),
        headings: headings.slice(0, 50)
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
      const labels = Array.from(document.querySelectorAll('label, legend, h2, h3, h4, [role="heading"], span, div'));

      for (const el of labels) {
        if (!isVisible(el)) continue;
        const text = clean(el.innerText || el.textContent);
        if (!text) continue;

        const low = text.toLowerCase();
        if (
          low.includes('filter') ||
          low.includes('sort by') ||
          low === 'price' ||
          low.includes('condition') ||
          low.includes('date listed') ||
          low.includes('availability') ||
          low.includes('categories') ||
          low.includes('delivery method') ||
          low.includes('location')
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
      }).slice(0, 30);
    }
    """
    return await page.evaluate(js)


async def count_result_links(page) -> int:
    try:
        return await page.locator('a[href*="/marketplace/item/"]').count()
    except Exception:
        return 0


def page_has_email_or_subscription_overlay(state: dict, controls: dict) -> bool:
    hay = " ".join(
        [
            state.get("title", ""),
            state.get("body_text", ""),
            " ".join([(x.get("text") or "") for x in controls.get("dialogs", [])]),
            " ".join([(x.get("text") or "") for x in controls.get("buttons", [])[:30]]),
        ]
    ).lower()

    return any(hint in hay for hint in EMAIL_SUBSCRIPTION_HINTS)


def page_has_cookie_banner(state: dict, controls: dict) -> bool:
    hay = " ".join(
        [
            state.get("title", ""),
            state.get("body_text", ""),
            " ".join([(x.get("text") or "") for x in controls.get("buttons", [])[:30]]),
        ]
    ).lower()

    keys = [
        "allow all cookies",
        "accept all",
        "cookies",
        "we use cookies",
        "essential cookies",
    ]
    return any(k in hay for k in keys)


def page_has_login_wall(state: dict) -> bool:
    t = (state.get("body_text") or "").lower()
    has_login = any(
        x in t for x in ["log in", "sign up", "forgot account?", "forgot password"]
    )
    has_results = any(x in t for x in ["search results", "marketplace", "$"])
    return has_login and not has_results


async def observe_page(page, user_goal: str, history: list[dict]) -> dict:
    state = await capture_page_state(page, label="observe")
    controls = await discover_controls(page)
    filters = await discover_filters(page)
    result_links = await count_result_links(page)

    return {
        "goal": user_goal,
        "url": state["url"],
        "title": state["title"],
        "body_text": state["body_text"],
        "screenshot_path": state["screenshot_path"],
        "controls": controls,
        "filters": filters,
        "result_links": result_links,
        "history": history[-6:],
        "signals": {
            "cookie_banner": page_has_cookie_banner(state, controls),
            "email_or_subscription_popup": page_has_email_or_subscription_overlay(
                state, controls
            ),
            "login_wall": page_has_login_wall(state),
        },
        "can_scrape_now": result_links > 0,
    }


# -------------------------------------------------
# Fast rule-based actions first
# -------------------------------------------------


async def try_safe_close_popup(page) -> bool:
    for text in SAFE_CLOSE_TEXTS:
        candidates = [
            page.get_by_role("button", name=text).first,
            page.get_by_text(text, exact=False).first,
        ]
        for loc in candidates:
            try:
                await loc.wait_for(state="visible", timeout=1000)
                await loc.click(timeout=2500)
                print(f"  [RULE] closed popup with: {text}")
                await asyncio.sleep(1.5)
                return True
            except Exception:
                pass
    return False


async def try_cookie_accept(page) -> bool:
    names = [
        "Allow all cookies",
        "Accept all",
        "Accept All",
        "Accept",
        "Allow essential and optional cookies",
        "Only allow essential cookies",
    ]
    for name in names:
        candidates = [
            page.get_by_role("button", name=name).first,
            page.get_by_text(name, exact=False)
            .locator("xpath=ancestor-or-self::button[1]")
            .first,
            page.get_by_text(name, exact=False).first,
        ]
        for loc in candidates:
            try:
                await loc.wait_for(state="visible", timeout=1000)
                await loc.click(timeout=2500)
                print(f"  [RULE] cookie action: {name}")
                await asyncio.sleep(2)
                return True
            except Exception:
                pass
    return False


# -------------------------------------------------
# LLM planner
# -------------------------------------------------


def build_agent_schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "page_state": {
                "type": "string",
                "enum": [
                    "cookie_banner",
                    "subscription_popup",
                    "modal",
                    "results_visible",
                    "pagination_visible",
                    "filter_panel",
                    "unknown",
                ],
            },
            "goal_status": {
                "type": "string",
                "enum": ["blocked", "progressing", "ready_to_scrape", "exhausted"],
            },
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
                        "required": ["role", "text", "css", "approximate_position"],
                    },
                    "value": {"type": ["string", "null"]},
                    "wait_ms": {"type": ["integer", "null"]},
                },
                "required": ["type", "target", "value", "wait_ms"],
            },
            "available_filters": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "type": {"type": "string"},
                    },
                    "required": ["name", "type"],
                },
            },
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


async def ask_llm_for_next_action(observation: dict) -> dict:
    schema = build_agent_schema()

    prompt = f"""
You are a web automation planner.

Goal:
{observation["goal"]}

Rules:
- Never choose login, sign up, account creation, authentication, or email submission actions.
- If a popup asks for email/subscription, first try to close it.
- If it cannot be safely closed, ignore it and continue with page actions.
- Prefer removing blockers before interacting with results.
- If visible result cards/links already exist, prefer action "scrape" or a small scroll.
- Only choose one next action.
- If no useful action remains, return stop.
- Return only JSON.

Current URL:
{observation["url"]}

Title:
{observation["title"]}

Signals:
{json.dumps(observation["signals"], ensure_ascii=False)}

Visible filters:
{json.dumps(observation["filters"], ensure_ascii=False)}

Visible controls summary:
{json.dumps({
    "buttons": observation["controls"]["buttons"][:25],
    "links": observation["controls"]["links"][:25],
    "inputs": observation["controls"]["inputs"][:15],
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
                    {
                        "role": "system",
                        "content": "Return only valid JSON matching the schema.",
                    },
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


# -------------------------------------------------
# Executor
# -------------------------------------------------


def build_target_locators(page, target: dict):
    role = (target.get("role") or "").strip()
    text = (target.get("text") or "").strip()
    css = (target.get("css") or "").strip()

    locators = []

    if role and text:
        try:
            locators.append(page.get_by_role(role, name=text).first)
        except Exception:
            pass

    if text:
        try:
            locators.append(page.get_by_text(text, exact=False).first)
        except Exception:
            pass
        try:
            locators.append(
                page.get_by_text(text, exact=False)
                .locator("xpath=ancestor-or-self::button[1]")
                .first
            )
        except Exception:
            pass
        try:
            locators.append(
                page.get_by_text(text, exact=False)
                .locator("xpath=ancestor-or-self::*[@role='button'][1]")
                .first
            )
        except Exception:
            pass
        try:
            locators.append(
                page.get_by_text(text, exact=False)
                .locator("xpath=ancestor-or-self::a[1]")
                .first
            )
        except Exception:
            pass

    if css:
        try:
            locators.append(page.locator(css).first)
        except Exception:
            pass

    return locators


async def first_visible_locator(locators, timeout_ms: int = 1200):
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
    visible = await first_visible_locator(locators, timeout_ms=1200)

    if visible:
        try:
            await visible.click(timeout=4000)
            return True
        except Exception:
            try:
                box = await visible.bounding_box()
                if box:
                    await page.mouse.click(
                        box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
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

    if action == "stop":
        return False

    if action == "scrape":
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

    if action in {"click", "close"}:
        ok = await click_locator_or_position(page, target)
        if ok:
            await asyncio.sleep(2)
        return ok

    if action == "fill":
        text_value = ((target or {}).get("text") or "").strip().lower()
        if text_value in FORBIDDEN_TARGET_TEXTS:
            return False
        locators = build_target_locators(page, target)
        visible = await first_visible_locator(locators, timeout_ms=1200)
        if visible and value:
            try:
                await visible.fill(value, timeout=4000)
                await asyncio.sleep(1)
                return True
            except Exception:
                pass
        return False

    return False


# -------------------------------------------------
# Generic action loop
# -------------------------------------------------


async def achieve_goal(page, user_goal: str, max_steps: int = 10) -> dict:
    history: list[dict] = []

    for step in range(1, max_steps + 1):
        print(f"\n[AGENT] step {step}/{max_steps}")
        observation = await observe_page(page, user_goal, history)

        print(f"  [OBSERVE] url={observation['url']}")
        print(f"  [OBSERVE] result_links={observation['result_links']}")
        print(f"  [OBSERVE] signals={observation['signals']}")
        print(f"  [OBSERVE] filters={observation['filters'][:10]}")

        if observation["can_scrape_now"]:
            print("  [AGENT] data looks ready to scrape")
            return observation

        acted = False

        # rule-based cookie handling first
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

        # rule-based close for email/subscription/modal
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

        # do not ever pursue login
        if observation["signals"]["login_wall"]:
            print("  [AGENT] login wall detected, but login actions are forbidden")
            history.append(
                {
                    "step": step,
                    "kind": "guard",
                    "action": "login_forbidden",
                }
            )

        plan = await ask_llm_for_next_action(observation)

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

    return await observe_page(page, user_goal, history)


# ─────────────────────────────────────────────
# Smart scroll engine
# ─────────────────────────────────────────────


async def smart_scroll(page, listings: dict, pages: int = 3, items_per_page: int = 20):
    total_target = pages * items_per_page
    scrolls_per_page = 4
    total_scrolls = pages * scrolls_per_page
    no_new_streak = 0
    max_no_new_streak = scrolls_per_page

    print(
        f"\n  Scroll plan: {pages} pages × {scrolls_per_page} scrolls = {total_scrolls} total scrolls"
    )
    print(f"  Target: ~{total_target} listings\n")

    for scroll_num in range(1, total_scrolls + 1):
        page_num = ((scroll_num - 1) // scrolls_per_page) + 1
        count_before = len(listings)

        await page.evaluate(
            """
            window.scrollBy({
                top: window.innerHeight * 1.2,
                behavior: 'smooth'
            });
        """
        )

        if scroll_num % scrolls_per_page == 0:
            delay = random_delay(2500, 4500)
            print(
                f"  [Page {page_num} complete] Pausing {delay:.1f}s to let content load..."
            )
        else:
            delay = random_delay(1200, 2500)

        await asyncio.sleep(delay)

        try:
            await page.wait_for_load_state("networkidle", timeout=5000)
        except PlaywrightTimeout:
            pass

        count_after = len(listings)
        new_items = count_after - count_before

        print(
            f"  Scroll {scroll_num:>2}/{total_scrolls} | Page {page_num} | "
            f"+{new_items} new | Total: {count_after} listings"
        )

        if new_items == 0:
            no_new_streak += 1
            if no_new_streak >= max_no_new_streak:
                print(
                    f"\n  No new listings after {max_no_new_streak} scrolls — stopping early."
                )
                break
        else:
            no_new_streak = 0

        if count_after >= total_target:
            print(f"\n  Reached target of {total_target} listings.")
            break

    return listings


# ─────────────────────────────────────────────
# Main scraper
# ─────────────────────────────────────────────


async def extract_dom_listings(page) -> list[dict]:
    js = """
    () => {
      const results = [];
      const links = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'));

      for (const a of links) {
        const href = a.href || "";
        const m = href.match(/\\/marketplace\\/item\\/(\\d+)/);
        if (!m) continue;

        const text = (a.innerText || a.textContent || "").trim();
        if (!text) continue;

        const lines = text.split("\\n").map(x => x.trim()).filter(Boolean);
        const title = lines[1] || lines[0] || null;
        const price = lines.find(x => /^[$€£]/.test(x)) || null;

        results.push({
          id: m[1],
          title,
          price_text: price,
          url: href
        });
      }

      const seen = new Set();
      return results.filter(x => {
        if (!x.id || seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
      });
    }
    """
    return await page.evaluate(js)


async def extract_visible_cards(page, max_cards: int = 80) -> list[dict]:
    js = """
    (maxCards) => {
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
          rect.width > 30 &&
          rect.height > 30 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight + 200
        );
      }

      function absUrl(href) {
        try {
          return new URL(href, window.location.href).href;
        } catch {
          return href || null;
        }
      }

      function getTextLines(el) {
        const txt = clean(el.innerText || el.textContent || '');
        return txt.split('\\n').map(x => clean(x)).filter(Boolean);
      }

      function findPrice(lines) {
        return (
          lines.find(x =>
            /^([$€£]|usd|eur|gbp|aed|cad|aud|pkr|rs\\.?|₹)/i.test(x)
          ) || null
        );
      }

      function findBestTitle(el, lines) {
        const heading =
          el.querySelector('h1,h2,h3,h4,[role="heading"]') ||
          el.querySelector('strong') ||
          el.querySelector('[data-testid]');

        if (heading) {
          const t = clean(heading.innerText || heading.textContent || '');
          if (t) return t;
        }

        for (const line of lines) {
          if (!line) continue;
          if (line.length < 2) continue;
          if (/^([$€£]|usd|eur|gbp|aed|cad|aud|pkr|rs\\.?|₹)/i.test(line)) continue;
          if (/^(log in|sign up|allow all cookies|accept all|see more)/i.test(line)) continue;
          return line;
        }

        return null;
      }

      function getImage(el) {
        const img = el.querySelector('img');
        if (!img) return null;
        return img.currentSrc || img.src || null;
      }

      function firstUsefulLink(el) {
        const anchors = Array.from(el.querySelectorAll('a[href]'));
        for (const a of anchors) {
          const href = a.getAttribute('href') || '';
          if (!href) continue;
          if (href.startsWith('#')) continue;
          if (/login|signup|register|help|privacy|terms/i.test(href)) continue;
          return a;
        }
        return null;
      }

      function getCardCandidates() {
        const selectors = [
          '[role="article"]',
          '[data-testid]',
          'article',
          'li',
          'div'
        ];

        const nodes = [];
        for (const sel of selectors) {
          for (const el of document.querySelectorAll(sel)) {
            if (!isVisible(el)) continue;
            const links = el.querySelectorAll('a[href]').length;
            const text = clean(el.innerText || el.textContent || '');
            if (links === 0) continue;
            if (text.length < 10) continue;
            nodes.push(el);
          }
        }
        return nodes;
      }

      function dedupeContainers(nodes) {
        const out = [];
        const seen = new Set();

        for (const el of nodes) {
          const rect = el.getBoundingClientRect();
          const key = [
            Math.round(rect.x),
            Math.round(rect.y),
            Math.round(rect.width),
            Math.round(rect.height)
          ].join(':');

          if (seen.has(key)) continue;
          seen.add(key);
          out.push(el);
        }
        return out;
      }

      const candidates = dedupeContainers(getCardCandidates());
      const results = [];

      for (const el of candidates) {
        if (results.length >= maxCards) break;

        const link = firstUsefulLink(el);
        if (!link) continue;

        const url = absUrl(link.href);
        if (!url) continue;

        const lines = getTextLines(el);
        const title = findBestTitle(el, lines);
        const price = findPrice(lines);
        const image_url = getImage(el);

        const rect = el.getBoundingClientRect();
        results.push({
          url,
          title,
          price_text: price,
          image_url,
          snippet: clean(lines.slice(0, 8).join(' | ')),
          visible_text: clean(lines.join(' | ')),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }

      const seenUrls = new Set();
      return results.filter(item => {
        if (!item.url) return false;
        if (seenUrls.has(item.url)) return false;
        seenUrls.add(item.url);
        return true;
      });
    }
    """
    return await page.evaluate(js, max_cards)

def normalize_extracted_cards(cards: list[dict]) -> list[dict]:
    normalized = []

    for i, item in enumerate(cards, start=1):
        url = item.get("url")
        item_id = None

        if url:
            m = re.search(r"/marketplace/item/(\\d+)", url)
            if m:
                item_id = m.group(1)

        normalized.append({
            "id": item_id or f"card_{i}",
            "url": url,
            "title": item.get("title"),
            "price": item.get("price_text"),
            "image_url": item.get("image_url"),
            "snippet": item.get("snippet"),
            "visible_text": item.get("visible_text"),
            "scraped_at": datetime.utcnow().isoformat(),
        })

    return normalized

async def collect_visible_cards_with_scroll(
    page,
    max_rounds: int = 5,
    max_cards: int = 120,
    scroll_px: int = 1400,
) -> list[dict]:
    collected = {}
    stale_rounds = 0

    for round_no in range(1, max_rounds + 1):
        cards = await extract_visible_cards(page, max_cards=max_cards)
        before = len(collected)

        for card in cards:
            url = card.get("url")
            key = url or f"{card.get('title')}::{card.get('price_text')}::{round_no}"
            collected[key] = card

        after = len(collected)
        gained = after - before

        print(f"  [COLLECT] round {round_no}/{max_rounds} | +{gained} | total={after}")

        if after >= max_cards:
            break

        if gained == 0:
            stale_rounds += 1
        else:
            stale_rounds = 0

        if stale_rounds >= 2:
            break

        await page.evaluate(
            "(amt) => window.scrollBy({ top: amt, behavior: 'smooth' })",
            scroll_px,
        )
        await asyncio.sleep(2.0)

    return list(collected.values())
async def scrape_marketplace(
    keyword: str = "iphone",
    city: str = "london",
    pages: int = 3,
    items_per_page: int = 20,
    max_items: int = None,
    proxy: dict = None,
    headless: bool = False,
    retry: int = 2,
    use_ollama_recovery: bool = True,
) -> list[dict]:
    if max_items is None:
        max_items = pages * items_per_page

    for attempt in range(1, retry + 2):
        listings: dict = {}

        try:
            stealth = Stealth()

            async with stealth.use_async(async_playwright()) as p:
                browser = await p.chromium.launch(
                    headless=False,
                    slow_mo=120 if not headless else 0,
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--lang=en-US",
                        "--window-size=1280,800",
                    ],
                )

                context = await browser.new_context(
                    user_agent=random.choice(USER_AGENTS),
                    locale="en-US",
                    timezone_id="America/New_York",
                    viewport={"width": 1280, "height": 800},
                    extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
                )

                page = await context.new_page()

                page.on(
                    "response",
                    lambda res: asyncio.create_task(handle_response(res, listings)),
                )
                page.on(
                    "response",
                    lambda res: asyncio.create_task(log_interesting_response(res)),
                )

                user_goal = (
                    "Remove blockers, ignore login, list available filters, "
                    "then get the page ready for scraping marketplace property rental results."
                )

                await page.goto(
                    "https://www.facebook.com/marketplace/category/propertyrentals",
                    wait_until="networkidle",
                    timeout=60000,
                )

                # await page.goto(url, wait_until="networkidle", timeout=60000)

                final_observation = await achieve_goal(page, user_goal=user_goal, max_steps=10)

                print("Ready to scrape:", final_observation["can_scrape_now"])
                print("Available filters:", final_observation["filters"])
                print("Result links:", final_observation["result_links"])

                if final_observation["can_scrape_now"]:
                    raw_cards = await collect_visible_cards_with_scroll(
                        page,
                        max_rounds=6,
                        max_cards=max_items or 120,
                    )
                    dom_items = normalize_extracted_cards(raw_cards)

                    for item in dom_items:
                        listings[item["id"]] = item

                results = list(listings.values())[:max_items]

                await context.close()
                await browser.close()

                return results

        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            if attempt <= retry:
                await asyncio.sleep(2**attempt)
            else:
                return []


# ─────────────────────────────────────────────
# Parallel multi-job scraper
# ─────────────────────────────────────────────


async def scrape_many(jobs: list[dict], concurrency: int = 2) -> dict:
    semaphore = asyncio.Semaphore(concurrency)
    results = {}

    async def run_job(job):
        key = f"{job['keyword']}::{job['city']}"
        async with semaphore:
            print(f"\n{'=' * 60}\nStarting job: {key}\n{'=' * 60}")
            data = await scrape_marketplace(**job)
            results[key] = data

    await asyncio.gather(*[run_job(j) for j in jobs])
    return results
