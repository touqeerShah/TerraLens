from __future__ import annotations

from core.browser_session import BrowserSession
from llm.ollama_client import OllamaClient
from llm.prompts import DOM_HTML_JUDGE_SYSTEM, build_dom_html_judge_prompt
from models.requests import ScrapeRequest


class DOMHTMLJudgeAgent:
    def __init__(
        self,
        ollama: OllamaClient,
    ) -> None:
        self.ollama = ollama

    async def judge(
        self,
        browser: BrowserSession,
        request: ScrapeRequest,
    ) -> dict:
        if not browser.page:
            raise RuntimeError("Browser page is not initialized.")

        page = browser.page
        html = await page.content()
        dom_packet = {
            "html_preview": html[:12000],
            "container_samples": await page.evaluate(
                """
                () => {
                  const selectors = ['article', '[role="article"]', 'li', '.item', '.card', 'table', 'tbody tr'];
                  const out = [];
                  for (const selector of selectors) {
                    const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 5);
                    for (const node of nodes) {
                      const text = (node.innerText || '').trim().replace(/\\s+/g, ' ');
                      if (!text) continue;
                      out.push({
                        selector,
                        text: text.slice(0, 500)
                      });
                    }
                  }
                  return out.slice(0, 12);
                }
                """
            ),
        }
        prompt = build_dom_html_judge_prompt(request, dom_packet)
        return await self.ollama.chat_json(prompt=prompt, system=DOM_HTML_JUDGE_SYSTEM, temperature=0.0)
