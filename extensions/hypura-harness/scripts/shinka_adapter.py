"""ShinkaEvolve adapter — evolution engine backed by Ollama native API."""
from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import tempfile
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
_PRIMARY_MODEL = _config.get("models", {}).get("primary", "gpt-5.4")
_LITE_MODEL = _config.get("models", {}).get("lite", "gemini-3.1-flash-lite-preview")

os.environ.setdefault("OLLAMA_BASE_URL", _OLLAMA_URL)
os.environ.setdefault("OLLAMA_API_KEY", "ollama-local")

try:
    from shinka.llm import AsyncLLMClient

    _SHINKA_AVAILABLE = True
except ImportError:
    AsyncLLMClient = None  # type: ignore[misc, assignment]
    _SHINKA_AVAILABLE = False
    logger.warning("ShinkaEvolve not available — evolve endpoint will use stub")


async def _check_fitness(code: str) -> bool:
    """Run code in an isolated uv environment; return True if exit_code == 0."""
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp = f.name
    try:
        proc = await asyncio.create_subprocess_exec(
            "uv", "run", "--no-project", tmp,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await asyncio.wait_for(proc.wait(), timeout=10)
        return proc.returncode == 0
    except Exception:
        return False
    finally:
        Path(tmp).unlink(missing_ok=True)


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

    def calculate_fitness(self, code: str) -> float:
        """Evaluate the quality/density of the evolved code (SOUL.md Directive 143)."""
        import ast
        try:
            tree = ast.parse(code)
            nodes = len(list(ast.walk(tree)))
            complexity = sum(1 for n in ast.walk(tree) if isinstance(n, (ast.If, ast.For, ast.While, ast.FunctionDef, ast.ClassDef)))
            
            # Intelligence Density: Higher complexity/node ratio in evolved shards
            density = complexity / nodes if nodes > 0 else 0
        except Exception:
            return 0.1

        growth_bonus = 1.0
        metrics_file = Path(__file__).parent / "density_metrics.json"
        if metrics_file.exists():
            try:
                metrics = json.loads(metrics_file.read_text(encoding="utf-8"))
                if metrics:
                    latest = metrics[-1].get("intelligence_density", 1.0)
                    growth_bonus = 1.0 + (latest / 100.0) # Reward progression
            except Exception:
                pass

        return (0.5 + density) * growth_bonus

    async def evolve_code(
        self, seed: str, fitness_hint: str, generations: int = 5
    ) -> str:
        if self._client is None:
            logger.warning("ShinkaEvolve unavailable, returning seed unchanged")
            return seed
        from code_runner import extract_code_block

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
                improved = extract_code_block(result.content)
                if improved and await _check_fitness(improved):
                    fitness_score = self.calculate_fitness(improved)
                    best = improved
                    logger.info("[evolve] generation %s: improved (fitness: %.2f)", gen + 1, fitness_score)
        return best

    async def evolve_skill(
        self, skill_md: str, examples: list[str], generations: int = 3
    ) -> str:
        if self._client is None:
            return skill_md
        best = skill_md
        examples_txt = "\n".join(f"- {e}" for e in examples)
        for gen in range(generations):
            prompt = (
                f"Improve this SKILL.md to better trigger on these examples:\n{examples_txt}"
                f"\n\nCurrent SKILL.md:\n{best}"
            )
            result = await self._client.query(
                msg=prompt, system_msg="Return only the improved SKILL.md."
            )
            if result and hasattr(result, "content") and result.content.strip():
                best = result.content.strip()
                logger.info("[evolve_skill] generation %s: improved", gen + 1)
        return best
