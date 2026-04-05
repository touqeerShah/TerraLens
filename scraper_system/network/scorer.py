from __future__ import annotations

from models.network import NetworkCandidate


POSITIVE_URL_HINTS = [
    "search",
    "query",
    "graphql",
    "list",
    "listing",
    "results",
    "items",
    "product",
    "products",
    "feed",
    "browse",
    "inventory",
    "marketplace",
    "api",
    "cursor",
    "offset",
    "limit",
    "page",
]

NEGATIVE_URL_HINTS = [
    "analytics",
    "telemetry",
    "metrics",
    "track",
    "tracking",
    "beacon",
    "ads",
    "advert",
    "pixel",
    "static",
    "bundle",
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    "hotjar",
    "sentry",
]

POSITIVE_RESPONSE_HINTS = [
    '"id"',
    '"title"',
    '"name"',
    '"price"',
    '"items"',
    '"results"',
    '"data"',
    '"edges"',
    '"node"',
    '"cursor"',
    '"pageinfo"',
]

NEGATIVE_CONTENT_TYPES = [
    "text/css",
    "application/javascript",
    "text/javascript",
    "image/",
    "font/",
]


def score_candidate_endpoint_heuristic(candidate: NetworkCandidate) -> float:
    score = 0.0
    notes: list[str] = []
    tags: set[str] = set()

    url_lower = candidate.url.lower()
    content_type = (candidate.content_type or "").lower()
    response_preview = (candidate.response_preview or "").lower()
    method = candidate.method.upper()

    if candidate.resource_type in {"xhr", "fetch"}:
        score += 2
        notes.append("+2 xhr/fetch")
        tags.add("xhr_or_fetch")

    if "json" in content_type:
        score += 3
        notes.append("+3 json content-type")
        tags.add("json")

    if "graphql" in url_lower or "graphql" in response_preview:
        score += 3
        notes.append("+3 graphql")
        tags.add("graphql")

    for hint in POSITIVE_URL_HINTS:
        if hint in url_lower:
            score += 1
            notes.append(f"+1 url:{hint}")

    for hint in NEGATIVE_URL_HINTS:
        if hint in url_lower:
            score -= 3
            notes.append(f"-3 url:{hint}")

    for bad_type in NEGATIVE_CONTENT_TYPES:
        if bad_type in content_type:
            score -= 4
            notes.append(f"-4 content-type:{bad_type}")
            tags.add("asset_or_non_data")
            break

    if candidate.status and 200 <= candidate.status < 300:
        score += 1
        notes.append("+1 success status")

    if candidate.status and candidate.status >= 400:
        score -= 2
        notes.append("-2 error status")

    if method in {"GET", "POST"}:
        score += 0.5
        notes.append("+0.5 GET/POST")

    if candidate.query_params:
        interesting_keys = {"q", "query", "search", "page", "offset", "limit", "cursor"}
        hits = [k for k in candidate.query_params.keys() if k.lower() in interesting_keys]
        if hits:
            score += 2
            notes.append(f"+2 interesting query params:{hits}")
            tags.add("has_search_or_paging_params")

    if candidate.response_json_shape:
        score += 2
        notes.append("+2 parseable json shape")
        tags.add("structured_payload")

    for hint in POSITIVE_RESPONSE_HINTS:
        if hint in response_preview:
            score += 0.75
            notes.append(f"+0.75 body:{hint}")

    if "<html" in response_preview:
        score -= 2
        notes.append("-2 html shell")
        tags.add("html_shell")

    if len(response_preview) > 100:
        score += 0.5
        notes.append("+0.5 meaningful preview")

    if "login" in url_lower or "signin" in url_lower or "auth" in url_lower:
        score -= 4
        notes.append("-4 auth-like endpoint")
        tags.add("auth_like")

    candidate.heuristic_score = round(score, 3)
    candidate.notes.extend(notes)
    candidate.tags = sorted(set(candidate.tags).union(tags))
    return candidate.heuristic_score


def score_candidate_extractability(candidate: NetworkCandidate) -> float:
    score = 0.0
    notes: list[str] = []
    preview = (candidate.response_preview or "").lower()
    shape = (candidate.response_json_shape or "").lower()
    url_lower = candidate.url.lower()

    if "array<" in shape:
        score += 2.5
        notes.append("+2.5 array payload")

    if "object<" in shape and any(k in shape for k in ["items", "results", "data", "edges"]):
        score += 2.0
        notes.append("+2.0 container with likely records")

    if any(k in preview for k in ['"id"', '"title"', '"name"', '"price"']):
        score += 1.5
        notes.append("+1.5 record-like fields")

    if any(k in preview for k in ['"cursor"', '"next"', '"hasnextpage"', '"pageinfo"', '"offset"', '"limit"']):
        score += 2.0
        notes.append("+2.0 pagination signals")

    if any(k in url_lower for k in ["page", "cursor", "offset", "limit"]):
        score += 1.0
        notes.append("+1.0 pagination in url")

    if "<html" in preview:
        score -= 2.0
        notes.append("-2.0 html not extractable")

    if candidate.status and candidate.status >= 400:
        score -= 2.0
        notes.append("-2.0 failing endpoint")

    candidate.extractability_score = round(score, 3)
    candidate.notes.extend(notes)
    return candidate.extractability_score


def combine_candidate_scores(
    candidate: NetworkCandidate,
    heuristic_weight: float = 0.35,
    semantic_weight: float = 0.35,
    extractability_weight: float = 0.30,
) -> float:
    final_score = (
        candidate.heuristic_score * heuristic_weight
        + candidate.semantic_score * semantic_weight
        + candidate.extractability_score * extractability_weight
    )
    candidate.final_score = round(final_score, 4)
    return candidate.final_score


def score_candidate_endpoint(candidate: NetworkCandidate) -> NetworkCandidate:
    score_candidate_endpoint_heuristic(candidate)
    score_candidate_extractability(candidate)
    combine_candidate_scores(candidate)
    return candidate


def score_many_candidates(candidates: list[NetworkCandidate]) -> list[NetworkCandidate]:
    scored = [score_candidate_endpoint(c) for c in candidates]
    return sorted(scored, key=lambda x: x.final_score, reverse=True)