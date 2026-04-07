from __future__ import annotations

import uuid
from typing import Optional

from playwright.async_api import BrowserContext, Request, Response

from core.state_store import StateStore
from network.normalizer import build_network_candidate
from network.scorer import score_candidate_endpoint


INTERESTING_RESOURCE_TYPES = {"xhr", "fetch"}

IGNORE_RESOURCE_TYPES = {
    "image",
    "media",
    "font",
    "stylesheet",
}

IGNORE_URL_HINTS = [
    "analytics",
    "telemetry",
    "metrics",
    "track",
    "tracking",
    "beacon",
    "pixel",
    "ads",
    "doubleclick",
    "hotjar",
    "sentry",
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".woff",
    ".woff2",
]


class NetworkCollector:
    def __init__(self, state: StateStore, max_candidates: int = 100) -> None:
        self.state = state
        self.max_candidates = max_candidates
        self._started = False

    async def attach(self, context: BrowserContext) -> None:
        if self._started:
            return

        context.on("response", self._handle_response)
        self._started = True

    def should_capture(
        self,
        request: Request,
        response: Optional[Response] = None,
    ) -> bool:
        resource_type = request.resource_type
        url_lower = request.url.lower()

        if resource_type in IGNORE_RESOURCE_TYPES:
            return False

        if resource_type not in INTERESTING_RESOURCE_TYPES:
            content_type = ""
            if response:
                content_type = (response.headers.get("content-type", "") or "").lower()

            if "json" not in content_type and "graphql" not in url_lower:
                return False

        for hint in IGNORE_URL_HINTS:
            if hint in url_lower:
                return False

        return True

    async def _handle_response(self, response: Response) -> None:
        request = response.request

        if not self.should_capture(request, response):
            return

        existing = await self.state.get_network_candidates()
        if len(existing) >= self.max_candidates:
            return

        try:
            content_type = response.headers.get("content-type", "")
            response_text = None

            if "json" in content_type.lower() or request.resource_type in {"xhr", "fetch"}:
                try:
                    response_text = await response.text()
                except Exception:
                    response_text = None

            request_id = str(uuid.uuid4())

            post_data = None
            try:
                post_data = request.post_data
            except Exception:
                post_data = None

            redirect_chain = []
            try:
                redirected_from = request.redirected_from
                while redirected_from:
                    redirect_chain.insert(0, redirected_from.url)
                    redirected_from = redirected_from.redirected_from
            except Exception:
                pass

            candidate = build_network_candidate(
                request_id=request_id,
                url=request.url,
                method=request.method,
                resource_type=request.resource_type,
                status=response.status,
                content_type=content_type,
                request_headers=request.headers,
                response_headers=response.headers,
                post_data=post_data,
                response_text=response_text,
                redirect_chain=redirect_chain,
            )

            candidate = score_candidate_endpoint(candidate)
            await self.state.add_network_candidate(candidate)

            await self.state.add_debug_event(
                "network_candidate_captured",
                {
                    "url": candidate.url,
                    "final_score": getattr(candidate, "final_score", None),
                    "heuristic_score": getattr(candidate, "heuristic_score", None),
                    "content_type": candidate.content_type,
                },
            )
        except Exception as exc:
            await self.state.add_debug_event(
                "network_collector_error",
                {
                    "error": str(exc),
                    "url": request.url,
                },
            )