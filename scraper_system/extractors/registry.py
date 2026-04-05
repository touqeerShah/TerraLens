from __future__ import annotations

from urllib.parse import urlparse

from extractors.facebook_marketplace import FacebookMarketplaceDOMExtractor
from extractors.generic_api import GenericAPIExtractor
from extractors.generic_dom import GenericDOMExtractor


class ExtractorRegistry:
    def __init__(self) -> None:
        self.generic_dom = GenericDOMExtractor()
        self.generic_api = GenericAPIExtractor()
        self.facebook_marketplace_dom = FacebookMarketplaceDOMExtractor()

    def get_dom_extractor_for_url(self, url: str):
        host = (urlparse(url).netloc or "").lower()

        if "facebook.com" in host or "m.facebook.com" in host:
            if "/marketplace" in url.lower():
                return self.facebook_marketplace_dom

        return self.generic_dom

    def get_api_extractor_for_url(self, url: str):
        # For now we use generic API extraction everywhere.
        # Later this can route to site-specific API extractors.
        return self.generic_api