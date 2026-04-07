from __future__ import annotations

import re
from typing import Any
from bs4 import BeautifulSoup


class GenericHTMLExtractor:
    def extract(
        self,
        html: str,
        max_items: int = 50,
        section_hint: str | None = None,
        field_hints: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        field_hints = field_hints or {}

        selectors = []
        if section_hint:
            selectors.append(section_hint)

        selectors.extend([
            "article",
            "li",
            ".item",
            ".card",
            "[data-testid*='item']",
            "[data-testid*='listing']",
            "tbody tr",
        ])

        seen: set[str] = set()
        results: list[dict[str, Any]] = []

        for selector in selectors:
            try:
                nodes = soup.select(selector)
            except Exception:
                continue

            for node in nodes[: max_items * 3]:
                text = self._clean(node.get_text(" ", strip=True))
                if not text or len(text) < 20:
                    continue
                if text in seen:
                    continue
                seen.add(text)

                link = None
                a = node.select_one("a[href]")
                if a:
                    link = a.get("href")

                image = None
                img = node.select_one("img[src]")
                if img:
                    image = img.get("src")

                title = None
                if field_hints.get("title"):
                    tnode = node.select_one(field_hints["title"])
                    if tnode:
                        title = self._clean(tnode.get_text(" ", strip=True))

                if not title:
                    tnode = node.select_one("h1, h2, h3, h4, strong")
                    if tnode:
                        title = self._clean(tnode.get_text(" ", strip=True))

                price = None
                if field_hints.get("price"):
                    pnode = node.select_one(field_hints["price"])
                    if pnode:
                        price = self._clean(pnode.get_text(" ", strip=True))

                if not price:
                    m = re.search(r"(€|\$|£)\s?\d[\d,\.]*|\d[\d,\.]*\s?(eur|usd|gbp)", text, flags=re.I)
                    if m:
                        price = m.group(0)

                results.append({
                    "title": title,
                    "text": text,
                    "price": price,
                    "link": link,
                    "image": image,
                    "source": "html",
                })

                if len(results) >= max_items:
                    return results

        return results

    def _clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", text or "").strip()