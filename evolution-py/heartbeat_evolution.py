#!/usr/bin/env python3
"""
OpenClaw Heartbeat Integration Script
Run autonomous evolution from OpenClaw Heartbeat

Usage:
    python heartbeat_evolution.py --research "query"
    python heartbeat_evolution.py --evolve --code-file path/to/code.py
    python heartbeat_evolution.py --full --task "optimization task"
"""

import argparse
import json
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from evolution import create_system
from evolution.core import EvolutionConfig


def run_research(query: str) -> dict:
    """Run research and return results."""
    system = create_system()

    try:
        report = system.research(query)

        result = {
            "status": "success",
            "query": report.query,
            "summary": report.summary,
            "sources": [{"title": s.title, "url": s.url} for s in report.sources[:5]],
            "facts": [
                {"statement": f.statement, "confidence": f.confidence.value}
                for f in report.facts[:10]
            ],
            "recommendations": report.recommendations,
        }

        # Save to memory
        memory_file = Path(__file__).parent / "memory" / "latest_research.json"
        memory_file.parent.mkdir(exist_ok=True)
        with open(memory_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        return result

    finally:
        system.close()


def run_evolve(initial_code: str, eval_fn_name: str = "default") -> dict:
    """Run evolution on code."""
    system = create_system()

    try:
        # Simple evaluation function
        def eval_fn(code):
            # Default: return 0.5 as placeholder
            # In real use, this would run actual tests
            return 0.5

        best = system.evolve([initial_code], eval_fn)

        result = {
            "status": "success",
            "best_fitness": best.fitness,
            "best_code": best.code[:500],  # First 500 chars
            "generation": best.generation,
        }

        return result

    finally:
        system.close()


def run_full(task: str) -> dict:
    """Run full research + evolution."""
    system = create_system()

    try:

        def eval_fn(code):
            # Placeholder evaluation
            return 0.6

        best, report = system.evolve_with_research(task, eval_fn)

        result = {
            "status": "success",
            "task": task,
            "research_summary": report.summary,
            "best_fitness": best.fitness,
            "best_code": best.code[:500],
            "sources": [s.title for s in report.sources[:3]],
        }

        return result

    finally:
        system.close()


def main():
    parser = argparse.ArgumentParser(description="OpenClaw Evolution Heartbeat")
    parser.add_argument("--research", type=str, help="Run research on query")
    parser.add_argument("--evolve", action="store_true", help="Run evolution")
    parser.add_argument("--code", type=str, help="Initial code for evolution")
    parser.add_argument("--full", type=str, metavar="TASK", help="Run full research + evolution")
    parser.add_argument("--output", type=str, help="Output JSON file")

    args = parser.parse_args()

    if args.research:
        result = run_research(args.research)
    elif args.evolve and args.code:
        result = run_evolve(args.code)
    elif args.full:
        result = run_full(args.full)
    else:
        print("Usage:")
        print('  --research "query"    # Run research')
        print('  --evolve --code "code" # Run evolution')
        print('  --full "task"          # Run full research + evolution')
        sys.exit(1)

    # Output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Results saved to {args.output}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
