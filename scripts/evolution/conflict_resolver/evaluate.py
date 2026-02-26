#!/usr/bin/env python3
"""
evaluate.py - Evaluator for conflict resolution evolution.
"""

import os
import sys
import argparse
import traceback
from typing import List, Tuple, Dict, Any, Optional

# Ensure we can import shinka
sys.path.append(os.path.join(os.getcwd(), "vendor", "ShinkaEvolve"))

from shinka.core import run_shinka_eval


def validate_resolution(
    run_output: str,
    expected_output: str,
) -> Tuple[bool, Optional[str]]:
    """Validates if the resolved content matches expected."""
    if run_output.strip() == expected_output.strip():
        return True, "Success"
    else:
        return False, f"Output mismatch.\nExpected: {expected_output}\nGot: {run_output}"


def get_experiment_kwargs(run_idx: int) -> dict:
    """Provides test cases for evolution."""
    test_cases = [
        {
            "content": "<<<<<<< OURS\nOUR CODE\n=======\nTHEIR CODE\n>>>>>>> THEIRS\n",
            "strategy": "ours",
            "filepath": "dummy.txt",
            "expected": "OUR CODE\n",
        },
        {
            "content": "<<<<<<< OURS\nOUR CODE\n=======\nTHEIR CODE\n>>>>>>> THEIRS\n",
            "strategy": "theirs",
            "filepath": "dummy.txt",
            "expected": "THEIR CODE\n",
        },
        {
            "content": "import { a } from 'b';\n<<<<<<< OURS\nimport { registerEvoCommands } from \"../evo-cli.js\";\n=======\n>>>>>>> THEIRS\n",
            "strategy": "merge",
            "filepath": "src/cli/program/command-registry.ts",
            "expected": "import { a } from 'b';\nimport { registerEvoCommands } from \"../evo-cli.js\";\n",
        },
    ]
    return test_cases[run_idx % len(test_cases)]


def aggregate_metrics(results: list) -> dict:
    """Aggregates results into a score."""
    # We'll return 1.0 if all tests pass, otherwise fraction.
    # We assume 'results' is a list of tuples from each run
    # Wait, results is what run_experiment returns.
    # run_shinka_eval calls aggregate_metrics_fn(experiment_results)

    # Let's check how many were correct.
    # Actually, run_shinka_eval handles validation itself if validate_fn is provided.

    score = sum(1 for r in results if r is not None) / len(results) if results else 0.0
    return {"combined_score": score, "num_tests": len(results)}


def main(program_path: str, results_dir: str):
    program_path = os.path.abspath(program_path)
    results_dir = os.path.abspath(results_dir)
    os.makedirs(results_dir, exist_ok=True)

    # Pre-create subdirectories to avoid race conditions/path issues on Windows
    for i in range(3):
        os.makedirs(os.path.join(results_dir, f"run_{i}"), exist_ok=True)

    # Nested validator to check against expected in kwargs
    def _validate_with_expected(run_output, run_idx):
        expected = get_experiment_kwargs(run_idx)["expected"]
        if run_output.strip() == expected.strip():
            return True, "Match"
        return False, f"Mismatch on test {run_idx}"

    try:
        metrics, correct, err = run_shinka_eval(
            program_path=program_path,
            results_dir=results_dir,
            experiment_fn_name="run_experiment",
            num_runs=3,
            get_experiment_kwargs=get_experiment_kwargs,
            validate_fn=_validate_with_expected,
            aggregate_metrics_fn=aggregate_metrics,
        )
        print(f"Metrics: {metrics}")
        sys.exit(0 if correct else 1)
    except Exception:
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--program_path", type=str, default="initial.py")
    parser.add_argument("--results_dir", type=str, default="results")
    args = parser.parse_args()
    main(args.program_path, args.results_dir)
