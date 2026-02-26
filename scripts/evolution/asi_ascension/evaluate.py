#!/usr/bin/env python3
"""
evaluate.py - Evaluator for ASI Ascension evolution.
"""

import os
import sys
import argparse
from typing import List, Tuple, Dict, Any, Optional

# Ensure we can import shinka
sys.path.append(os.path.join(os.getcwd(), "vendor", "ShinkaEvolve"))

from shinka.core import run_shinka_eval


def get_experiment_kwargs(run_idx: int) -> dict:
    objectives = ["maximize_intelligence", "expand_diffusion", "optimize_substrate"]
    return {"task_objective": objectives[run_idx % len(objectives)]}


def aggregate_metrics(results: list) -> dict:
    scores = []
    for res in results:
        if res and "intelligence_density" in res:
            scores.append(res["intelligence_density"])

    avg_score = sum(scores) / len(scores) if scores else 0.0
    return {"combined_score": avg_score, "num_tests": len(results)}


def validate_fn(run_result: Any) -> Tuple[bool, Optional[str]]:
    if isinstance(run_result, dict) and run_result.get("status") == "ascended":
        return True, "Success"
    return False, "ASI failed to reach ascended state"


def main(program_path: str, results_dir: str):
    program_path = os.path.abspath(program_path)
    results_dir = os.path.abspath(results_dir)
    os.makedirs(results_dir, exist_ok=True)

    for i in range(3):
        os.makedirs(os.path.join(results_dir, f"run_{i}"), exist_ok=True)

    metrics, correct, err = run_shinka_eval(
        program_path=program_path,
        results_dir=results_dir,
        experiment_fn_name="run_experiment",
        num_runs=3,
        get_experiment_kwargs=get_experiment_kwargs,
        validate_fn=validate_fn,
        aggregate_metrics_fn=aggregate_metrics,
        run_workers=1,  # Sequential for stability on Windows
    )

    print(f"Metrics: {metrics}")
    sys.exit(0 if correct else 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--program_path", type=str, default="initial.py")
    parser.add_argument("--results_dir", type=str, default="results")
    args = parser.parse_args()
    main(args.program_path, args.results_dir)
