from __future__ import annotations

from urllib.parse import urlparse

from models.network import NetworkCandidate


def build_candidate_text(candidate: NetworkCandidate) -> str:
    parsed = urlparse(candidate.url)

    parts: list[str] = []

    parts.append(f"URL host: {parsed.netloc}")
    parts.append(f"URL path: {parsed.path}")
    parts.append(f"Method: {candidate.method}")

    if candidate.resource_type:
        parts.append(f"Resource type: {candidate.resource_type}")

    if candidate.status is not None:
        parts.append(f"Status: {candidate.status}")

    if candidate.content_type:
        parts.append(f"Content-Type: {candidate.content_type}")

    if candidate.query_params:
        qp = ", ".join(sorted(candidate.query_params.keys()))
        parts.append(f"Query params: {qp}")

    if candidate.request_headers:
        safe_headers = ", ".join(sorted(candidate.request_headers.keys())[:12])
        parts.append(f"Request headers: {safe_headers}")

    if candidate.response_json_shape:
        parts.append(f"JSON shape: {candidate.response_json_shape}")

    if candidate.post_data_preview:
        parts.append(f"Post preview: {candidate.post_data_preview[:500]}")

    if candidate.response_preview:
        parts.append(f"Response preview: {candidate.response_preview[:900]}")

    return "\n".join(parts)