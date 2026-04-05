from __future__ import annotations

from dataclasses import dataclass, field
from urllib.parse import urlparse


@dataclass
class SiteProfile:
    name: str
    family: str

    prefer_api_first: bool = False
    prefer_dom_first: bool = True

    dom_fragile: bool = False
    api_likely_available: bool = False
    supports_pagination: bool = True
    supports_filters: bool = True
    supports_search: bool = True

    network_rank_threshold: float = 6.5
    initial_wait_seconds: float = 1.0
    post_action_wait_seconds: float = 0.8

    notes: list[str] = field(default_factory=list)


GENERIC_SITE_PROFILE = SiteProfile(
    name="generic",
    family="generic_web",
    prefer_api_first=False,
    prefer_dom_first=True,
    dom_fragile=False,
    api_likely_available=True,
    supports_pagination=True,
    supports_filters=True,
    supports_search=True,
    network_rank_threshold=6.5,
    initial_wait_seconds=1.0,
    post_action_wait_seconds=0.8,
    notes=[
        "Default balanced strategy.",
        "Try DOM if page is already scrapeable.",
        "Keep network route active in parallel.",
    ],
)


FACEBOOK_MARKETPLACE_PROFILE = SiteProfile(
    name="facebook_marketplace",
    family="social_marketplace",
    prefer_api_first=True,
    prefer_dom_first=False,
    dom_fragile=True,
    api_likely_available=True,
    supports_pagination=True,
    supports_filters=True,
    supports_search=True,
    network_rank_threshold=6.0,
    initial_wait_seconds=1.5,
    post_action_wait_seconds=1.0,
    notes=[
        "DOM often changes and may be brittle.",
        "Network/API hunting should be prioritized.",
        "Marketplace item cards may be nested and inconsistent.",
    ],
)


def resolve_site_profile(url: str) -> SiteProfile:
    host = (urlparse(url).netloc or "").lower()
    url_lower = url.lower()

    if ("facebook.com" in host or "m.facebook.com" in host) and "/marketplace" in url_lower:
        return FACEBOOK_MARKETPLACE_PROFILE

    return GENERIC_SITE_PROFILE