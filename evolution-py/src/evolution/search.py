"""
Search API Module - DuckDuckGo, Brave, Perplexity Integration
Implements web search with rate limiting, caching, and fallback.

MILSPEC Compliance:
- Error Handling: Graceful degradation
- Rate Limiting: Respect API limits
- Caching: Reduce redundant requests
- Logging: Full audit trail
"""

import hashlib
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

import requests
from ddgs import DDGS

logger = logging.getLogger(__name__)


class SearchProvider(Enum):
    """Supported search providers."""

    DUCKDUCKGO = "duckduckgo"
    BRAVE = "brave"
    PERPLEXITY = "perplexity"
    GOOGLE = "google"


@dataclass
class SearchResult:
    """Represents a single search result.

    Attributes:
        title: Result title
        url: Result URL
        snippet: Result snippet/description
        provider: Source provider
        timestamp: Search timestamp
    """

    title: str
    url: str
    snippet: str
    provider: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class SearchResponse:
    """Response from search API.

    Attributes:
        results: List of search results
        query: Original search query
        provider: Provider used
        total_results: Total results available
        cached: Whether result was cached
    """

    results: list[SearchResult]
    query: str
    provider: str
    total_results: int = 0
    cached: bool = False


class SearchCache:
    """In-memory cache for search results with TTL."""

    def __init__(self, ttl_minutes: int = 15):
        """Initialize cache.

        Args:
            ttl_minutes: Time to live for cached results
        """
        self._cache: dict[str, tuple[SearchResponse, datetime]] = {}
        self._ttl = timedelta(minutes=ttl_minutes)
        self._hits = 0
        self._misses = 0

    def _make_key(self, query: str, provider: str) -> str:
        """Generate cache key from query and provider."""
        key_data = f"{provider}:{query.lower().strip()}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, query: str, provider: str) -> Optional[SearchResponse]:
        """Get cached result.

        Args:
            query: Search query
            provider: Search provider

        Returns:
            Cached response or None
        """
        key = self._make_key(query, provider)
        if key in self._cache:
            response, timestamp = self._cache[key]
            if datetime.now() - timestamp < self._ttl:
                self._hits += 1
                response.cached = True
                logger.debug(f"Cache hit for: {query}")
                return response
            else:
                del self._cache[key]
        self._misses += 1
        return None

    def set(self, query: str, provider: str, response: SearchResponse) -> None:
        """Cache a search response.

        Args:
            query: Search query
            provider: Search provider
            response: Response to cache
        """
        key = self._make_key(query, provider)
        self._cache[key] = (response, datetime.now())
        logger.debug(f"Cached result for: {query}")

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": hit_rate,
            "size": len(self._cache),
        }


class SearchAPI:
    """Multi-provider search API with fallback support.

    Implements:
    - DuckDuckGo (free, no API key)
    - Brave Search (API key required)
    - Perplexity (API key required)
    - Automatic fallback on failure

    Example:
        >>> api = SearchAPI()
        >>> results = api.search("Python evolution algorithm")
    """

    def __init__(
        self,
        brave_api_key: Optional[str] = None,
        perplexity_api_key: Optional[str] = None,
        cache_ttl_minutes: int = 15,
        rate_limit_delay: float = 1.0,
    ):
        """Initialize search API.

        Args:
            brave_api_key: Brave Search API key
            perplexity_api_key: Perplexity API key
            cache_ttl_minutes: Cache TTL in minutes
            rate_limit_delay: Delay between requests (seconds)
        """
        self.brave_api_key = brave_api_key
        self.perplexity_api_key = perplexity_api_key
        self.rate_limit_delay = rate_limit_delay
        self.cache = SearchCache(ttl_minutes=cache_ttl_minutes)
        self._last_request_time = 0.0

        self._session = requests.Session()
        self._session.headers.update(
            {"User-Agent": "OpenClaw-Evolution/1.0 (Research; +https://openclaw.ai)"}
        )

        logger.info(
            f"SearchAPI initialized: providers available: "
            f"DuckDuckGO(free), Brave({'yes' if brave_api_key else 'no'}), "
            f"Perplexity({'yes' if perplexity_api_key else 'no'})"
        )

    def search(
        self, query: str, provider: Optional[SearchProvider] = None, max_results: int = 10
    ) -> SearchResponse:
        """Search using specified provider or auto-detect.

        Args:
            query: Search query string
            provider: Specific provider to use (optional)
            max_results: Maximum number of results

        Returns:
            SearchResponse with results
        """
        # Check cache first
        provider_str = provider.value if provider else "auto"
        cached = self.cache.get(query, provider_str)
        if cached:
            return cached

        # Rate limiting
        self._apply_rate_limit()

        # Try providers in order
        providers_to_try = self._get_provider_order(provider)

        last_error = None
        for p in providers_to_try:
            try:
                response = self._search_with_provider(query, p, max_results)
                if response.results:
                    self.cache.set(query, provider_str, response)
                    return response
            except Exception as e:
                logger.warning(f"Search failed with {p.value}: {e}")
                last_error = e
                continue

        # Return empty response if all fail
        logger.error(f"All search providers failed for: {query}")
        return SearchResponse(results=[], query=query, provider="none", total_results=0)

    def _get_provider_order(self, preferred: Optional[SearchProvider]) -> list[SearchProvider]:
        """Get ordered list of providers to try.

        Args:
            preferred: Preferred provider

        Returns:
            Ordered list of providers
        """
        if preferred:
            return [preferred]

        # Auto-detect: free first, then paid
        order = [SearchProvider.DUCKDUCKGO]

        if self.brave_api_key:
            order.append(SearchProvider.BRAVE)
        if self.perplexity_api_key:
            order.append(SearchProvider.PERPLEXITY)

        return order

    def _apply_rate_limit(self) -> None:
        """Apply rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    def _search_with_provider(
        self, query: str, provider: SearchProvider, max_results: int
    ) -> SearchResponse:
        """Search with specific provider.

        Args:
            query: Search query
            provider: Provider to use
            max_results: Maximum results

        Returns:
            SearchResponse
        """
        if provider == SearchProvider.DUCKDUCKGO:
            return self._search_duckduckgo(query, max_results)
        elif provider == SearchProvider.BRAVE:
            return self._search_brave(query, max_results)
        elif provider == SearchProvider.PERPLEXITY:
            return self._search_perplexity(query, max_results)
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def _search_duckduckgo(self, query: str, max_results: int) -> SearchResponse:
        """Search using DuckDuckGo (ddgs library - free, no API key).

        Args:
            query: Search query
            max_results: Maximum results

        Returns:
            SearchResponse
        """
        results = []

        try:
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    results.append(
                        SearchResult(
                            title=r.get("title", ""),
                            url=r.get("href", ""),
                            snippet=r.get("body", ""),
                            provider="duckduckgo",
                        )
                    )

        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {e}")
            raise

        logger.info(f"DuckDuckGo: {len(results)} results for '{query}'")
        return SearchResponse(
            results=results, query=query, provider="duckduckgo", total_results=len(results)
        )

    def _search_brave(self, query: str, max_results: int) -> SearchResponse:
        """Search using Brave Search API.

        Args:
            query: Search query
            max_results: Maximum results

        Returns:
            SearchResponse
        """
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {"Accept": "application/json", "X-Subscription-Token": self.brave_api_key}
        params = {"q": query, "count": max_results}

        response = self._session.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        results = []

        for item in data.get("web", {}).get("results", [])[:max_results]:
            results.append(
                SearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    snippet=item.get("description", ""),
                    provider="brave",
                )
            )

        logger.info(f"Brave: {len(results)} results for '{query}'")
        return SearchResponse(
            results=results,
            query=query,
            provider="brave",
            total_results=data.get("web", {}).get("total", len(results)),
        )

    def _search_perplexity(self, query: str, max_results: int) -> SearchResponse:
        """Search using Perplexity API.

        Args:
            query: Search query
            max_results: Maximum results

        Returns:
            SearchResponse
        """
        url = "https://api.perplexity.ai/search"
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json",
        }
        payload = {"query": query, "max_results": max_results}

        response = self._session.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()
        results = []

        for item in data.get("results", [])[:max_results]:
            results.append(
                SearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    snippet=item.get("snippet", ""),
                    provider="perplexity",
                )
            )

        logger.info(f"Perplexity: {len(results)} results for '{query}'")
        return SearchResponse(
            results=results, query=query, provider="perplexity", total_results=len(results)
        )

    def get_stats(self) -> dict:
        """Get search API statistics.

        Returns:
            Statistics dictionary
        """
        return {
            "cache": self.cache.get_stats(),
            "rate_limit_delay": self.rate_limit_delay,
            "available_providers": {
                "duckduckgo": True,
                "brave": bool(self.brave_api_key),
                "perplexity": bool(self.perplexity_api_key),
            },
        }
