# MILSPEC Evolution System
"""
MILSPEC-STD-1553-inspired evolution system for OpenClaw.
Implements ShinkaEvolve-style code evolution with CUDA/ROCm support.

Version: 1.0.0
Author: OpenClaw Autonomous Agent
"""

__version__ = "1.0.0"

from .core import EvolutionEngine
from .search import SearchAPI
from .deep_research import DeepResearch
from .ollama_client import OllamaClient
from .system import create_system, EvolutionSystem
from .voice import VoiceAPI, create_voice_api, STTProvider, TTSProvider

__all__ = [
    "EvolutionEngine",
    "SearchAPI",
    "DeepResearch",
    "OllamaClient",
    "create_system",
    "EvolutionSystem",
    "VoiceAPI",
    "create_voice_api",
    "STTProvider",
    "TTSProvider",
]
