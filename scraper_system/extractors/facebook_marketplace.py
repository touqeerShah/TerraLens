from __future__ import annotations

from typing import Any


class FacebookMarketplaceDOMExtractor:
    async def extract(
        self,
        page,
        max_items: int = 50,
    ) -> list[dict[str, Any]]:
        script = """
        (maxItems) => {
          const results = [];
          const seen = new Set();

          function cleanText(text) {
            return (text || '').trim().replace(/\\s+/g, ' ');
          }

          function findPrice(text) {
            if (!text) return null;
            const priceRegex = /(€|\\$|£)\\s?\\d+[\\d,.]*|\\d+[\\d,.]*\\s?(eur|usd|gbp)/i;
            const match = text.match(priceRegex);
            return match ? match[0] : null;
          }

          const candidateSelectors = [
            'a[href*="/marketplace/item/"]',
            'div[role="main"] a[href*="/marketplace/item/"]',
            'a[href*="marketplace/item"]'
          ];

          const anchors = [];
          for (const selector of candidateSelectors) {
            anchors.push(...Array.from(document.querySelectorAll(selector)));
          }

          for (const anchor of anchors) {
            const href = anchor.href || null;
            if (!href) continue;

            const card =
              anchor.closest('div[role="article"]') ||
              anchor.closest('div[role="link"]') ||
              anchor.closest('div') ||
              anchor;

            const text = cleanText(card.innerText || anchor.innerText || '');
            if (!text || text.length < 10) continue;
            if (seen.has(href) || seen.has(text)) continue;

            seen.add(href);
            seen.add(text);

            const lines = text.split(/\\n+/).map(cleanText).filter(Boolean);
            const price = findPrice(text);

            let title = null;
            if (lines.length > 0) {
              title = lines.find(line => line !== price) || lines[0];
            }

            const imgEl = card.querySelector('img');

            results.push({
              source: "facebook_marketplace_dom",
              title: title || null,
              text,
              price,
              link: href,
              image: imgEl?.src || null
            });

            if (results.length >= maxItems) break;
          }

          return results;
        }
        """

        items = await page.evaluate(script, max_items)
        return items or []