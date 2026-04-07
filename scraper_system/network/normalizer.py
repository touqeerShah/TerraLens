from __future__ import annotations

import json
from typing import Any, Optional
from urllib.parse import parse_qs, urlparse

from models.network import NetworkCandidate


SENSITIVE_HEADER_KEYS = {
    "cookie",
    "authorization",
    "proxy-authorization",
    "x-csrf-token",
    "x-xsrf-token",
    "set-cookie",
}


def redact_headers(headers: dict[str, str]) -> dict[str, str]:
    cleaned: dict[str, str] = {}

    for key, value in headers.items():
        key_lower = key.lower().strip()
        if key_lower in SENSITIVE_HEADER_KEYS:
            cleaned[key] = "[REDACTED]"
        else:
            cleaned[key] = value

    return cleaned


def parse_query_params(url: str) -> dict[str, Any]:
    parsed = urlparse(url)
    raw = parse_qs(parsed.query, keep_blank_values=True)

    result: dict[str, Any] = {}
    for key, values in raw.items():
        if len(values) == 1:
            result[key] = values[0]
        else:
            result[key] = values
    return result


def preview_text(value: Optional[str], max_len: int = 1200) -> Optional[str]:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    return text[:max_len]


def guess_json_shape_from_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None

    text = text.strip()
    if not text:
        return None

    try:
        parsed = json.loads(text)
    except Exception:
        return None

    return guess_json_shape(parsed)


def guess_json_shape(data: Any, depth: int = 0) -> str:
    if depth > 2:
        return "..."

    if isinstance(data, dict):
        keys = list(data.keys())[:8]
        inner = {k: guess_json_shape(data[k], depth + 1) for k in keys}
        return f"object<{inner}>"

    if isinstance(data, list):
        if not data:
            return "array<empty>"
        return f"array<{guess_json_shape(data[0], depth + 1)}>"

    if isinstance(data, str):
        return "string"
    if isinstance(data, bool):
        return "boolean"
    if isinstance(data, int):
        return "integer"
    if isinstance(data, float):
        return "float"
    if data is None:
        return "null"

    return type(data).__name__


def build_network_candidate(
    request_id: str,
    url: str,
    method: str,
    resource_type: Optional[str] = None,
    status: Optional[int] = None,
    content_type: Optional[str] = None,
    request_headers: Optional[dict[str, str]] = None,
    response_headers: Optional[dict[str, str]] = None,
    post_data: Optional[str] = None,
    response_text: Optional[str] = None,
    redirect_chain: Optional[list[str]] = None,
) -> NetworkCandidate:
    safe_request_headers = redact_headers(request_headers or {})
    safe_response_headers = redact_headers(response_headers or {})

    response_preview = preview_text(response_text)
    post_data_preview = preview_text(post_data, max_len=800)
    response_json_shape = guess_json_shape_from_text(response_preview)

    return NetworkCandidate(
        request_id=request_id,
        url=url,
        method=method.upper(),
        resource_type=resource_type,
        status=status,
        content_type=content_type,
        query_params=parse_query_params(url),
        request_headers=safe_request_headers,
        response_headers=safe_response_headers,
        post_data_preview=post_data_preview,
        response_preview=response_preview,
        response_json_shape=response_json_shape,
        redirect_chain=redirect_chain or [],
        heuristic_score=0.0,
        semantic_score=0.0,
        extractability_score=0.0,
        final_score=0.0,
        notes=[],
        tags=[],
    )
