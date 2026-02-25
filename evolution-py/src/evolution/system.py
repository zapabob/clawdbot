"""
Main entry point for the Evolution System
Combines all modules into a unified API.

MILSPEC Compliance:
- Configuration Management
- Logging & Auditing
- Error Handling
- Documentation
"""

import logging
import sys
from typing import Optional

from .core import EvolutionEngine, EvolutionConfig, Individual
from .search import SearchAPI, SearchProvider
from .deep_research import DeepResearch, ResearchReport
from .ollama_client import OllamaClient, OllamaConfig
from .gpu import GPUManager, get_optimal_device

logger = logging.getLogger(__name__)


class EvolutionSystem:
    """Unified evolution system combining all components.

    This is the main interface for the ShinkaEvolve-inspired
    autonomous evolution system.

    Example:
        >>> system = EvolutionSystem()
        >>> report = system.research("latest AI trends")
        >>> best = system.evolve(initial_code, eval_fn)
        >>> print(report.summary)
    """

    def __init__(
        self,
        ollama_model: str = "dolphin-llama3:latest",
        ollama_url: str = "http://localhost:11434",
        brave_api_key: Optional[str] = None,
        perplexity_api_key: Optional[str] = None,
        use_gpu: bool = True,
    ):
        """Initialize the evolution system.

        Args:
            ollama_model: Ollama model to use
            ollama_url: Ollama API URL
            brave_api_key: Brave Search API key (optional)
            perplexity_api_key: Perplexity API key (optional)
            use_gpu: Enable GPU acceleration
        """
        # Initialize GPU manager
        self.gpu_manager = GPUManager()

        # Determine compute device
        if use_gpu and self.gpu_manager.has_gpu():
            device = get_optimal_device()
        else:
            device = torch.device("cpu")

        logger.info(f"Using device: {device}")

        # Initialize Ollama client
        self.ollama = OllamaClient(OllamaConfig(model=ollama_model, base_url=ollama_url))

        # Initialize search API
        self.search = SearchAPI(brave_api_key=brave_api_key, perplexity_api_key=perplexity_api_key)

        # Initialize deep research
        self.researcher = DeepResearch(self.search)

        # Evolution engine (initialized later)
        self.evolution_engine: Optional[EvolutionEngine] = None

        logger.info("EvolutionSystem initialized successfully")

    def research(self, query: str, deep: bool = True) -> ResearchReport:
        """Conduct deep research on a topic.

        Args:
            query: Research query
            deep: Enable deep analysis

        Returns:
            ResearchReport with findings
        """
        return self.researcher.research(query, deep=deep)

    def evolve(self, initial_code: list[str], eval_fn, max_generations: int = 50) -> Individual:
        """Run evolutionary optimization on code.

        Args:
            initial_code: Initial code solutions
            eval_fn: Evaluation function (code) -> fitness
            max_generations: Maximum generations

        Returns:
            Best Individual found
        """
        # Create evolution config
        config = EvolutionConfig(
            population_size=10,
            max_generations=max_generations,
            device="cuda" if self.gpu_manager.has_gpu() else "cpu",
        )

        # Initialize and run
        self.evolution_engine = EvolutionEngine(config)
        self.evolution_engine.initialize(initial_code)

        best = self.evolution_engine.run(eval_fn, self.ollama)

        return best

    def evolve_with_research(
        self, task: str, eval_fn, max_generations: int = 50
    ) -> tuple[Individual, ResearchReport]:
        """Research topic then evolve code.

        Args:
            task: Evolution task
            eval_fn: Evaluation function
            max_generations: Max generations

        Returns:
            Tuple of (best_individual, research_report)
        """
        # First research the topic
        logger.info(f"Researching: {task}")
        report = self.research(task)

        # Then evolve
        logger.info(f"Evolving with research context")
        initial_code = [self._generate_initial_from_research(report)]

        best = self.evolve(initial_code, eval_fn, max_generations)

        return best, report

    def _generate_initial_from_research(self, report: ResearchReport) -> str:
        """Generate initial code from research.

        Args:
            report: Research report

        Returns:
            Initial code string
        """
        # Use research findings to create initial solution
        prompt = f"""Based on research about '{report.query}':

Summary: {report.summary[:200]}

Generate Python code that implements the core concepts found in the research.
Focus on best practices and efficiency."""

        response = self.ollama.generate(prompt=prompt, temperature=0.5, num_predict=1024)

        return response.response

    def get_system_status(self) -> dict:
        """Get system status.

        Returns:
            Status dictionary
        """
        return {
            "gpu": self.gpu_manager.get_info(),
            "ollama": {
                "models": self.ollama.get_available_models(),
                "current_model": self.ollama.config.model,
                "device_info": self.ollama.get_device_info(),
            },
            "search": self.search.get_stats(),
            "evolution": (self.evolution_engine.get_state() if self.evolution_engine else None),
        }

    def close(self) -> None:
        """Clean up resources."""
        self.ollama.close()
        self.gpu_manager.clear_cache()
        logger.info("EvolutionSystem closed")


# Convenience function
def create_system(ollama_model: str = "dolphin-llama3:latest", **kwargs) -> EvolutionSystem:
    """Create configured evolution system.

    Args:
        ollama_model: Ollama model name
        **kwargs: Additional arguments

    Returns:
        Configured EvolutionSystem
    """
    return EvolutionSystem(ollama_model=ollama_model, **kwargs)


# Required import for device
import torch
