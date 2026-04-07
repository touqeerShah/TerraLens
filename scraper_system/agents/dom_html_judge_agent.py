from __future__ import annotations

from agents.page_observer_agent import PageObserverAgent
from core.browser_session import BrowserSession
from llm.ollama_client import OllamaClient
from llm.prompts import DOM_HTML_JUDGE_SYSTEM, build_dom_html_judge_prompt
from models.requests import ScrapeRequest


class DOMHTMLJudgeAgent:
    def __init__(
        self,
        observer: PageObserverAgent,
        ollama: OllamaClient,
    ) -> None:
        self.observer = observer
        self.ollama = ollama

    async def judge(
        self,
        browser: BrowserSession,
        request: ScrapeRequest,
    ) -> dict:
        dom_packet = await self.observer.build_dom_html_packet(browser)
        prompt = build_dom_html_judge_prompt(request, dom_packet)
        return await self.ollama.chat_json(prompt=prompt, system=DOM_HTML_JUDGE_SYSTEM, temperature=0.0)