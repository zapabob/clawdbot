#!/usr/bin/env python3
"""
Training launcher for Ollama Fine-tuning
Supports SDF + KL + GRPO + Manifold Scaling + imatrix + Unsloth
"""

import argparse
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.evolution.distillation import (
    TrainingConfig,
    DistillationTrainer,
    create_coding_training_pipeline,
)


def main():
    parser = argparse.ArgumentParser(description="Ollama Model Training Pipeline")

    # Model selection
    parser.add_argument(
        "--teacher",
        type=str,
        default="meta-llama/Llama-3.1-8B-Instruct",
        help="Teacher model (larger)",
    )
    parser.add_argument(
        "--student",
        type=str,
        default="Qwen/Qwen2.5-3B-Instruct",
        help="Student model (smaller, to train)",
    )
    parser.add_argument("--output", type=str, default="./output", help="Output directory")

    # Training options
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--seq-length", type=int, default=2048, help="Max sequence length")

    # Technique toggles
    parser.add_argument(
        "--no-distillation", action="store_true", help="Disable distillation (KL loss)"
    )
    parser.add_argument("--no-grpo", action="store_true", help="Disable GRPO")
    parser.add_argument("--no-imatrix", action="store_true", help="Disable importance matrix")
    parser.add_argument("--no-manifold", action="store_true", help="Disable manifold scaling")

    # Dataset
    parser.add_argument("--dataset", type=str, default="openai/gsm8k", help="Dataset name")

    # Quick start
    parser.add_argument("--quick", action="store_true", help="Quick start with defaults")

    args = parser.parse_args()

    if args.quick:
        # Quick start mode
        print("Starting quick training mode...")
        trainer = create_coding_training_pipeline()
    else:
        # Custom config
        config = TrainingConfig(
            teacher_model=args.teacher,
            student_model=args.student,
            output_dir=args.output,
            num_train_epochs=args.epochs,
            per_device_train_batch_size=args.batch_size,
            learning_rate=args.lr,
            max_seq_length=args.seq_length,
            use_distillation=not args.no_distillation,
            use_grpo=not args.no_grpo,
            use_imatrix=not args.no_imatrix,
            use_manifold_scaling=not args.no_manifold,
            dataset_name=args.dataset,
        )

        print(f"Teacher: {config.teacher_model}")
        print(f"Student: {config.student_model}")
        print(f"Distillation: {config.use_distillation}")
        print(f"GRPO: {config.use_grpo}")
        print(f"imatrix: {config.use_imatrix}")
        print(f"Manifold Scaling: {config.use_manifold_scaling}")

        trainer = DistillationTrainer(config)

    # Train
    print("\nStarting training...")
    trainer.train()

    # Export to Ollama format
    print("\nExporting to Ollama...")
    model_path = trainer.export_to_ollama()

    print(f"\nTraining complete! Model saved to: {model_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
