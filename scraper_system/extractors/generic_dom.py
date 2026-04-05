from __future__ import annotations

from typing import Any


class GenericDOMExtractor:
    async def extract(
        self,
        page,
        max_items: int = 50,
    ) -> list[dict[str, Any]]:
        script = """
        (maxItems) => {
          const selectors = [
            'article',
            '[role="article"]',
            'li',
            '.item',
            '.card',
            '[data-testid*="item"]',
            '[data-testid*="listing"]',
            '[class*="listing"]',
            '[class*="product"]'
          ];

          const seen = new Set();
          const results = [];

          function cleanText(text) {
            return (text || '').trim().replace(/\\s+/g, ' ');
          }

          for (const selector of selectors) {
            const nodes = Array.from(document.querySelectorAll(selector)).slice(0, maxItems * 4);

            for (const node of nodes) {
              const text = cleanText(node.innerText);
              if (!text || text.length < 20) continue;
              if (seen.has(text)) continue;
              seen.add(text);

              const linkEl = node.querySelector('a');
              const imgEl = node.querySelector('img');

              let title = null;
              const titleEl = node.querySelector('h1,h2,h3,h4,strong,[data-testid*="title"]');
              if (titleEl) {
                title = cleanText(titleEl.innerText);
              }

              let price = null;
              const rawText = text.toLowerCase();
              const priceRegex = /(€|\\$|£)\\s?\\d+[\\d,\\.]*|\\d+[\\d,\\.]*\\s?(eur|usd|gbp)/i;
              const match = text.match(priceRegex);
              if (match) {
                price = match[0];
              }

              results.push({
                title,
                text,
                price,
                link: linkEl?.href || null,
                image: imgEl?.src || null
              });

              if (results.length >= maxItems) {
                return results;
              }
            }
          }

          return results;
        }
        """

        items = await page.evaluate(script, max_items)
        return items or []