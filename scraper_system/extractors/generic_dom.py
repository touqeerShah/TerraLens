from __future__ import annotations

from typing import Any


class GenericDOMExtractor:
    async def extract(
        self,
        page,
        max_items: int = 50,
        container_hint: str | None = None,
        field_hints: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        field_hints = field_hints or {}

        script = """
        ({maxItems, containerHint, fieldHints}) => {
          const selectors = [];
          if (containerHint) selectors.push(containerHint);

          selectors.push(
            'article',
            '[role="article"]',
            'li',
            '.item',
            '.card',
            '[data-testid*="item"]',
            '[data-testid*="listing"]',
            '[class*="listing"]',
            '[class*="product"]'
          );

          const seen = new Set();
          const results = [];

          function cleanText(text) {
            return (text || '').trim().replace(/\\s+/g, ' ');
          }

          function safeSelect(node, selector) {
            try { return selector ? node.querySelector(selector) : null; }
            catch { return null; }
          }

          for (const selector of selectors) {
            let nodes = [];
            try {
              nodes = Array.from(document.querySelectorAll(selector)).slice(0, maxItems * 4);
            } catch {
              continue;
            }

            for (const node of nodes) {
              const text = cleanText(node.innerText);
              if (!text || text.length < 20) continue;
              if (seen.has(text)) continue;
              seen.add(text);

              const titleNode =
                safeSelect(node, fieldHints.title) ||
                node.querySelector('h1,h2,h3,h4,strong,[data-testid*="title"]');

              const priceNode =
                safeSelect(node, fieldHints.price);

              const linkNode =
                safeSelect(node, fieldHints.link) ||
                node.querySelector('a');

              const imageNode =
                safeSelect(node, fieldHints.image) ||
                node.querySelector('img');

              let price = null;
              if (priceNode) {
                price = cleanText(priceNode.innerText);
              } else {
                const match = text.match(/(€|\\$|£)\\s?\\d+[\\d,\\.]*|\\d+[\\d,\\.]*\\s?(eur|usd|gbp)/i);
                if (match) price = match[0];
              }

              results.push({
                title: titleNode ? cleanText(titleNode.innerText) : null,
                text,
                price,
                link: linkNode?.href || null,
                image: imageNode?.src || null,
                source: "dom"
              });

              if (results.length >= maxItems) return results;
            }
          }

          return results;
        }
        """

        items = await page.evaluate(script, {
            "maxItems": max_items,
            "containerHint": container_hint,
            "fieldHints": field_hints,
        })
        return items or []