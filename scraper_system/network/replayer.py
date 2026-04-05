from __future__ import annotations

import json
from typing import Any, Optional

from playwright.async_api import BrowserContext

from models.network import NetworkCandidate


SAFE_REQUEST_HEADER_ALLOWLIST = {
    "accept",
    "content-type",
    "x-requested-with",
    "referer",
    "origin",
    "user-agent",
}


def filter_replay_headers(headers: dict[str, Any]) -> dict[str, str]:
    filtered: dict[str, str] = {}
    for key, value in headers.items():
        if key.lower() in SAFE_REQUEST_HEADER_ALLOWLIST and isinstance(value, str):
            filtered[key] = value
    return filtered


class ReplayResult:
    def __init__(
        self,
        ok: bool,
        status: Optional[int],
        content_type: Optional[str],
        data: Any = None,
        text_preview: Optional[str] = None,
        error: Optional[str] = None,
    ) -> None:
        self.ok = ok
        self.status = status
        self.content_type = content_type
        self.data = data
        self.text_preview = text_preview
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "status": self.status,
            "content_type": self.content_type,
            "data": self.data,
            "text_preview": self.text_preview,
            "error": self.error,
        }


class NetworkReplayer:
    async def replay_candidate(
        self,
        context: BrowserContext,
        candidate: NetworkCandidate,
    ) -> ReplayResult:
        request_client = context.request
        headers = filter_replay_headers(candidate.request_headers)

        try:
            if candidate.method.upper() == "GET":
                response = await request_client.get(
                    candidate.url,
                    headers=headers,
                )
            elif candidate.method.upper() == "POST":
                post_body = candidate.post_data_preview
                json_payload = None
                content_payload = None

                if post_body:
                    try:
                        json_payload = json.loads(post_body)
                    except Exception:
                        content_payload = post_body

                response = await request_client.post(
                    candidate.url,
                    headers=headers,
                    json=json_payload,
                    data=content_payload,
                )
            else:
                return ReplayResult(
                    ok=False,
                    status=None,
                    content_type=None,
                    error=f"Unsupported method for replay: {candidate.method}",
                )

            content_type = response.headers.get("content-type", "")
            status = response.status

            text = await response.text()
            preview = text[:2000] if text else None

            parsed_data: Any = None
            if "json" in content_type.lower():
                try:
                    parsed_data = json.loads(text)
                except Exception:
                    parsed_data = None

            return ReplayResult(
                ok=200 <= status < 300,
                status=status,
                content_type=content_type,
                data=parsed_data,
                text_preview=preview,
                error=None if 200 <= status < 300 else f"HTTP {status}",
            )
        except Exception as exc:
            return ReplayResult(
                ok=False,
                status=None,
                content_type=None,
                data=None,
                text_preview=None,
                error=str(exc),
            )