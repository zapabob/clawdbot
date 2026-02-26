#!/usr/bin/env python3
"""
launch_self_reinforcement.py - Launches ShinkaEvolve for self-improvement.
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
import traceback

# Load .env for API keys
load_dotenv(Path(__file__).parent.parent.parent / ".env")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--task",
        type=str,
        default="conflict_resolver",
        choices=["conflict_resolver", "asi_ascension"],
    )
    parser.add_argument("--generations", type=int, default=5)
    args = parser.parse_args()

    repo_root = Path(__file__).parent.parent.parent.resolve()
    task_dir = repo_root / "scripts" / "evolution" / args.task
    results_dir = repo_root / "scripts" / "evolution" / "results" / args.task

    # Ensure vendor/ShinkaEvolve is in the path for the subprocess
    shinka_path = (repo_root / "vendor" / "ShinkaEvolve").resolve()

    # Model ID from .env or default to gpt-5.2
    model_id = os.getenv("DEFAULT_AI_MODEL", "gpt-5.2")
    openai_key = os.getenv("OPENAI_API_KEY")

    if not openai_key:
        print("Error: OPENAI_API_KEY not found in .env")
        return

    # Export for ShinkaEvolve subprocess
    os.environ["OPENAI_API_KEY"] = openai_key

    # Construct shinka_run command
    # We use 'openai/' prefix as ShinkaEvolve uses it to identify the provider
    full_model_name = f"openai/gpt-5.2"

    print(f"Launching Self-Evolution using {full_model_name}...")

    # Inject PYTHONPATH manually and run the module's main
    sys.path.append(str(shinka_path))
    import shinka.cli.run as shinka_main

    os.makedirs(results_dir, exist_ok=True)

    # Simulate CLI arguments
    shinka_argv = [
        "--task-dir",
        str(task_dir.resolve()),
        "--results_dir",
        str(results_dir.resolve()),
        "--num_generations",
        str(args.generations),
        "--set",
        f'evo.llm_models=["{full_model_name}"]',
        "--set",
        "evo.max_parallel_jobs=2",
        "--set",
        "db.num_islands=1",
    ]

    try:
        shinka_main.main(shinka_argv)
    except SystemExit as e:
        if e.code != 0:
            print(f"Evolution exited with code: {e.code}")
    except Exception as e:
        print(f"An error occurred during evolution: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
