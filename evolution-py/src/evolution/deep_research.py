"""
Deep Research Module - Multi-source Investigation System
Implements comprehensive research with fact-checking and synthesis.

MILSPEC Compliance:
- Traceability: Full source attribution
- Verification: Cross-reference facts
- Synthesis: Multi-source integration
- Documentation: Comprehensive logging
"""

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

from .search import SearchAPI, SearchProvider, SearchResult

logger = logging.getLogger(__name__)


class ConfidenceLevel(Enum):
    """Research confidence levels."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNVERIFIED = "unverified"


@dataclass
class Fact:
    """Represents a verified fact from research.

    Attributes:
        statement: Fact statement
        source: Source URL
        confidence: Confidence level
        timestamp: When verified
    """

    statement: str
    source: str
    confidence: ConfidenceLevel
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ResearchSource:
    """Represents a research source.

    Attributes:
        url: Source URL
        title: Page title
        content: Relevant content extracted
        credibility_score: Source credibility (0-1)
        relevance_score: Relevance to query (0-1)
    """

    url: str
    title: str
    content: str
    credibility_score: float = 0.5
    relevance_score: float = 0.5


@dataclass
class ResearchReport:
    """Complete research report.

    Attributes:
        query: Original research query
        summary: Executive summary
        facts: Verified facts
        sources: Sources used
        recommendations: Actionable recommendations
        created_at: Report creation time
    """

    query: str
    summary: str
    facts: list[Fact]
    sources: list[ResearchSource]
    recommendations: list[str]
    created_at: datetime = field(default_factory=datetime.now)


class DeepResearch:
    """Deep research system with multi-source verification.

    Implements:
    - Parallel search across providers
    - Fact extraction and verification
    - Credibility scoring
    - Synthesis into actionable reports

    Example:
        >>> researcher = DeepResearch()
        >>> report = researcher.research("ShinkaEvolve algorithm")
        >>> print(report.summary)
    """

    # Trusted domains for credibility
    TRUSTED_DOMAINS = {
        "arxiv.org": 0.9,
        "github.com": 0.8,
        "stackoverflow.com": 0.7,
        "wikipedia.org": 0.6,
        "medium.com": 0.5,
        "reddit.com": 0.4,
        "twitter.com": 0.3,
    }

    def __init__(
        self, search_api: SearchAPI, min_sources: int = 3, verification_enabled: bool = True
    ):
        """Initialize deep research system.

        Args:
            search_api: Search API instance
            min_sources: Minimum sources for verification
            verification_enabled: Enable fact verification
        """
        self.search_api = search_api
        self.min_sources = min_sources
        self.verification_enabled = verification_enabled

        logger.info(
            f"DeepResearch initialized: min_sources={min_sources}, "
            f"verification={verification_enabled}"
        )

    def research(self, query: str, max_sources: int = 10, deep: bool = True) -> ResearchReport:
        """Conduct comprehensive research on a query.

        Args:
            query: Research query
            max_sources: Maximum sources to gather
            deep: Enable deep analysis (more queries)

        Returns:
            ResearchReport with findings
        """
        logger.info(f"Starting research: {query}")

        # Generate search queries
        search_queries = self._generate_search_queries(query, deep)

        # Gather sources
        all_sources = []
        for sq in search_queries:
            results = self.search_api.search(sq, max_results=5)
            sources = self._convert_to_sources(results)
            all_sources.extend(sources)

        # Deduplicate and rank
        unique_sources = self._deduplicate_sources(all_sources)
        ranked_sources = self._rank_sources(unique_sources, query)

        # Extract and verify facts
        facts = []
        if self.verification_enabled:
            facts = self._verify_facts(ranked_sources[:max_sources])

        # Generate summary and recommendations
        summary = self._generate_summary(query, ranked_sources[:max_sources])
        recommendations = self._generate_recommendations(query, ranked_sources[:max_sources], facts)

        report = ResearchReport(
            query=query,
            summary=summary,
            facts=facts,
            sources=ranked_sources[:max_sources],
            recommendations=recommendations,
        )

        logger.info(
            f"Research completed: {len(ranked_sources)} sources, {len(facts)} facts verified"
        )
        return report

    def _generate_search_queries(self, query: str, deep: bool) -> list[str]:
        """Generate multiple search queries for comprehensive coverage.

        Args:
            query: Original query
            deep: Enable deep search

        Returns:
            List of search queries
        """
        queries = [query]

        # Add variations for deep research
        if deep:
            # What/How/Why variations
            queries.extend(
                [
                    f"what is {query}",
                    f"how does {query} work",
                    f"why {query}",
                    f"{query} tutorial",
                    f"{query} implementation",
                ]
            )

        return queries[:5]  # Limit to avoid rate limiting

    def _convert_to_sources(self, results: "SearchResponse") -> list[ResearchSource]:
        """Convert search results to research sources.

        Args:
            results: Search API response

        Returns:
            List of ResearchSource objects
        """
        sources = []
        for result in results.results:
            source = ResearchSource(
                url=result.url,
                title=result.title,
                content=result.snippet,
                credibility_score=self._calculate_credibility(result.url),
            )
            sources.append(source)
        return sources

    def _calculate_credibility(self, url: str) -> float:
        """Calculate source credibility score.

        Args:
            url: Source URL

        Returns:
            Credibility score (0-1)
        """
        # Check trusted domains
        for domain, score in self.TRUSTED_DOMAINS.items():
            if domain in url.lower():
                return score

        # Default credibility
        return 0.5

    def _deduplicate_sources(self, sources: list[ResearchSource]) -> list[ResearchSource]:
        """Remove duplicate sources.

        Args:
            sources: List of sources

        Returns:
            Deduplicated list
        """
        seen_urls = set()
        unique = []

        for source in sources:
            if source.url not in seen_urls:
                seen_urls.add(source.url)
                unique.append(source)

        return unique

    def _rank_sources(self, sources: list[ResearchSource], query: str) -> list[ResearchSource]:
        """Rank sources by relevance and credibility.

        Args:
            sources: List of sources
            query: Original query

        Returns:
            Ranked list (best first)
        """
        query_terms = set(query.lower().split())

        for source in sources:
            # Calculate relevance score
            content_terms = set(source.content.lower().split())
            overlap = len(query_terms & content_terms)
            source.relevance_score = overlap / max(len(query_terms), 1)

            # Combined score
            source.relevance_score = source.relevance_score * 0.6 + source.credibility_score * 0.4

        return sorted(sources, key=lambda x: x.relevance_score, reverse=True)

    def _verify_facts(self, sources: list[ResearchSource]) -> list[Fact]:
        """Verify facts by cross-referencing multiple sources.

        Args:
            sources: Ranked sources

        Returns:
            List of verified facts
        """
        facts = []

        # Extract potential facts from top sources
        for source in sources[: self.min_sources]:
            extracted = self._extract_facts(source)
            for statement in extracted:
                # Verify against other sources
                confidence = self._verify_statement(statement, sources)
                facts.append(Fact(statement=statement, source=source.url, confidence=confidence))

        return facts

    def _extract_facts(self, source: ResearchSource) -> list[str]:
        """Extract factual statements from source.

        Args:
            source: Research source

        Returns:
            List of statements
        """
        # Simple extraction: sentences with numbers or key terms
        sentences = re.split(r"[.!?]+", source.content)
        facts = []

        for sentence in sentences:
            sentence = sentence.strip()
            # Look for factual statements
            if any(
                keyword in sentence.lower()
                for keyword in [
                    "is",
                    "are",
                    "was",
                    "were",
                    "has",
                    "have",
                    "can",
                    "based on",
                    "according to",
                    "research shows",
                ]
            ):
                if len(sentence) > 20:  # Minimum length
                    facts.append(sentence)

        return facts[:5]  # Limit per source

    def _verify_statement(self, statement: str, sources: list[ResearchSource]) -> ConfidenceLevel:
        """Verify statement against multiple sources.

        Args:
            statement: Statement to verify
            sources: Sources to check

        Returns:
            Confidence level
        """
        # Count how many sources mention similar content
        matches = 0
        statement_lower = statement.lower()

        for source in sources:
            # Simple keyword matching
            statement_words = set(statement_lower.split())
            source_words = set(source.content.lower().split())
            overlap = len(statement_words & source_words)

            if overlap >= 3:  # At least 3 common words
                matches += 1

        # Determine confidence
        if matches >= 3:
            return ConfidenceLevel.HIGH
        elif matches >= 2:
            return ConfidenceLevel.MEDIUM
        elif matches >= 1:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.UNVERIFIED

    def _generate_summary(self, query: str, sources: list[ResearchSource]) -> str:
        """Generate research summary.

        Args:
            query: Original query
            sources: Top sources

        Returns:
            Summary string
        """
        if not sources:
            return "No sources found for research query."

        # Use top source content as basis
        top_content = sources[0].content

        summary = f"Research on '{query}' based on {len(sources)} sources.\n\n"
        summary += f"Primary finding: {top_content[:200]}..."

        return summary

    def _generate_recommendations(
        self, query: str, sources: list[ResearchSource], facts: list[Fact]
    ) -> list[str]:
        """Generate actionable recommendations.

        Args:
            query: Research query
            sources: Sources used
            facts: Verified facts

        Returns:
            List of recommendations
        """
        recommendations = []

        # Based on high-confidence facts
        high_confidence = [f for f in facts if f.confidence == ConfidenceLevel.HIGH]

        if high_confidence:
            recommendations.append(
                f"Based on {len(high_confidence)} verified facts, "
                f"consider implementing the core concepts."
            )

        # Based on sources
        if sources:
            top_source = sources[0]
            recommendations.append(f"Primary reference: {top_source.title} ({top_source.url})")

        # General recommendation
        recommendations.append("Further experimentation and validation recommended.")

        return recommendations

    def research_with_retry(self, query: str, max_retries: int = 3, **kwargs) -> ResearchReport:
        """Conduct research with automatic retry on failure.

        Args:
            query: Research query
            max_retries: Maximum retry attempts
            **kwargs: Additional args for research()

        Returns:
            ResearchReport
        """
        last_error = None

        for attempt in range(max_retries):
            try:
                return self.research(query, **kwargs)
            except Exception as e:
                last_error = e
                logger.warning(f"Research attempt {attempt + 1} failed: {e}")
                continue

        logger.error(f"Research failed after {max_retries} attempts")
        return ResearchReport(
            query=query,
            summary=f"Research failed: {last_error}",
            facts=[],
            sources=[],
            recommendations=["Manual research required"],
        )
