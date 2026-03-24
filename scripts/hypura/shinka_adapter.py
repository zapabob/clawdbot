"""ShinkaEvolve adapter — evolution engine backed by Ollama native API."""
from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
REPO_ROOT = ROOT.parent.parent
SHINKA_PATH = REPO_ROOT / "vendor" / "ShinkaEvolve"
if SHINKA_PATH.exists() and str(SHINKA_PATH) not in sys.path:
    sys.path.insert(0, str(SHINKA_PATH))

CONFIG_PATH = ROOT / "harness.config.json"
_config: dict = {}
if CONFIG_PATH.exists():
    _config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

_OLLAMA_URL = _config.get("models", {}).get("ollama_base_url", "http://127.0.0.1:11434")
_PRIMARY_MODEL = _config.get("models", {}).get("primary", "qwen-hakua-core")
_LITE_MODEL = _config.get("models", {}).get("lite", "qwen-hakua-core-lite")

os.environ.setdefault("OLLAMA_BASE_URL", _OLLAMA_URL)
os.environ.setdefault("OLLAMA_API_KEY", "ollama-local")

try:
    from shinka.llm import AsyncLLMClient

    _SHINKA_AVAILABLE = True
except ImportError:
    AsyncLLMClient = None  # type: ignore[misc, assignment]
    _SHINKA_AVAILABLE = False
    logger.warning("ShinkaEvolve not available — evolve endpoint will use stub")


class ShinkaAdapter:
    def __init__(self) -> None:
        os.environ.setdefault("OLLAMA_BASE_URL", _OLLAMA_URL)
        if AsyncLLMClient is not None:
            self._client = AsyncLLMClient(
                model_names=[_PRIMARY_MODEL, _LITE_MODEL],
                temperatures=[0.8, 0.6],
                model_sample_probs=[0.7, 0.3],
            )
        else:
            self._client = None

    async def evolve_code(
        self, seed: str, fitness_hint: str, generations: int = 5
    ) -> str | None:
        if self._client is None:
            logger.warning("ShinkaEvolve unavailable, returning seed unchanged")
            return seed
        best = seed
        for gen in range(generations):
            prompt = (
                f"Improve this Python code based on: {fitness_hint}\n\n"
                f"Current code:\n```python\n{best}\n```\n\n"
                "Return only the improved code in a ```python block."
            )
            result = await self._client.query(
                msg=prompt,
                system_msg="You are a Python code optimizer. Return only code.",
            )
            if result and hasattr(result, "content") and result.content:
                from code_runner import extract_code_block

                improved = extract_code_block(result.content)
                if improved and improved != best:
                    best = improved
                    logger.info("[evolve] generation %s: improved", gen + 1)
        return best

    async def evolve_skill(
        self, skill_md: str, examples: list[str], generations: int = 3
    ) -> str:
        if self._client is None:
            return skill_md
        prompt = (
            "Improve this SKILL.md to better trigger on these examples:\n"
            + "\n".join(f"- {e}" for e in examples)
            + f"\n\nCurrent SKILL.md:\n{skill_md}"
        )
        result = await self._client.query(
            msg=prompt, system_msg="Return only the improved SKILL.md."
        )
        if result and hasattr(result, "content"):
            return result.content or skill_md
        return skill_md
