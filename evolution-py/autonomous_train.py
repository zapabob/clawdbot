#!/usr/bin/env python3
"""
Autonomous Training Launcher
Run SDF+KL+GRPO+MHC+imatrix training with automatic data collection
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from evolution.autonomous_train import (
    AutonomousTrainingConfig,
    AutonomousTrainer,
    run_autonomous_training,
)


def main():
    parser = argparse.ArgumentParser(description="Autonomous Training Pipeline")

    # Model
    parser.add_argument("--model", default="Qwen/Qwen2.5-3B-Instruct", help="Base model to train")
    parser.add_argument("--output", default="./autonomous_output", help="Output directory")

    # Training
    parser.add_argument("--epochs", type=int, default=3, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=1, help="Batch size")
    parser.add_argument("--generations", type=int, default=2, help="Code evolution generations")

    # Data collection
    parser.add_argument(
        "--topics",
        nargs="+",
        default=["Python programming", "Machine learning", "Algorithms"],
        help="Topics for data collection",
    )

    # Quick start
    parser.add_argument("--quick", action="store_true", help="Quick start with defaults")

    args = parser.parse_args()

    if args.quick:
        print("🚀 Starting quick autonomous training...")
        run_autonomous_training()
    else:
        print(f"Model: {args.model}")
        print(f"Output: {args.output}")
        print(f"Topics: {args.topics}")

        config = AutonomousTrainingConfig(
            base_model=args.model,
            output_dir=args.output,
            num_train_epochs=args.epochs,
            per_device_train_batch_size=args.batch_size,
            data_collection_topics=args.topics,
        )

        trainer = AutonomousTrainer(config)
        trainer.run_full_pipeline(num_generations=args.generations)

    print("\n✅ Training complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
