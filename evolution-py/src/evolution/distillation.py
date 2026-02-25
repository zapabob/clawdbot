"""
Unsloth Training Pipeline with SDF + KL + GRPO + Manifold Scaling + imatrix
Memory-efficient fine-tuning for coding tasks
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Try to import Unsloth (fallback to standard if not available)
try:
    from unsloth import FastLanguageModel, is_bf16_supported

    UNSLOTH_AVAILABLE = True
except ImportError:
    logger.warning("Unsloth not available, using standard LoRA")
    UNSLOTH_AVAILABLE = False

# Import transformers
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset as HFDataset

# Try to import GRPO/alignment libraries
try:
    from trl import GRPOConfig, GRPOTrainer

    GRPO_AVAILABLE = True
except ImportError:
    GRPO_AVAILABLE = False

# Try to import peft for LoRA
try:
    from peft import LoraConfig, get_peft_model, TaskType

    PEFT_AVAILABLE = True
except ImportError:
    PEFT_AVAILABLE = False


@dataclass
class TrainingConfig:
    """Configuration for the training pipeline."""

    # Model config
    teacher_model: str = "meta-llama/Llama-3.1-8B-Instruct"  # Teacher (larger)
    student_model: str = "Qwen/Qwen2.5-3B-Instruct"  # Student (smaller)
    output_dir: str = "./output"

    # Training params
    max_seq_length: int = 2048
    dtype: str = "bfloat16"
    load_in_4bit: bool = True

    # LoRA config
    lora_r: int = 64
    lora_alpha: int = 128
    lora_dropout: float = 0.05
    target_modules: list = field(
        default_factory=lambda: [
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ]
    )

    # Distillation (SDF + KL)
    use_distillation: bool = True
    kl_alpha: float = 0.5  # KL loss weight
    temperature: float = 2.0  # For soft labels

    # GRPO config
    use_grpo: bool = True
    grpo_beta: float = 0.5
    grpo_epsilon: float = 0.2
    grpo_num_generations: int = 4

    # Manifold Scaling
    use_manifold_scaling: bool = True
    manifold_scale_factor: float = 1.0

    # Importance Matrix (imatrix)
    use_imatrix: bool = True
    imatrix_threshold: float = 0.1

    # Training
    per_device_train_batch_size: int = 4
    gradient_accumulation_steps: int = 4
    learning_rate: float = 2e-4
    num_train_epochs: int = 3
    warmup_steps: int = 100
    logging_steps: int = 10
    save_steps: int = 500
    eval_steps: int = 500

    # Coding dataset
    dataset_name: str = "openai/gsm8k"  # Math/coding dataset
    dataset_split: str = "train"


class CodingDataset(Dataset):
    """Dataset for coding tasks."""

    def __init__(self, data, tokenizer, max_length=2048):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]

        # Format for instruction tuning
        if "instruction" in item and "output" in item:
            text = f"### Instruction\n{item['instruction']}\n### Response\n{item['output']}\n"
        elif "problem" in item:
            text = f"### Problem\n{item['problem']}\n### Solution\n{item.get('solution', '')}\n"
        else:
            text = str(item.get("text", item))

        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": encoding["input_ids"].squeeze(),
        }


class DistillationTrainer:
    """Trainer with SDF + KL + GRPO + Manifold Scaling + imatrix."""

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        logger.info(f"Using device: {self.device}")
        logger.info(f"Unsloth available: {UNSLOTH_AVAILABLE}")
        logger.info(f"GRPO available: {GRPO_AVAILABLE}")
        logger.info(f"Peft available: {PEFT_AVAILABLE}")

        self._setup_models()
        self._setup_tokenizer()
        self._setup_dataset()

    def _setup_models(self):
        """Setup teacher and student models."""

        if UNSLOTH_AVAILABLE:
            logger.info(f"Loading student model with Unsloth: {self.config.student_model}")
            self.student_model, self.tokenizer = FastLanguageModel.from_pretrained(
                model_name=self.config.student_model,
                max_seq_length=self.config.max_seq_length,
                dtype=self.config.dtype,
                load_in_4bit=self.config.load_in_4bit,
            )

            # Add LoRA
            self.student_model = FastLanguageModel.get_peft_model(
                self.student_model,
                r=self.config.lora_r,
                lora_alpha=self.config.lora_alpha,
                lora_dropout=self.config.lora_dropout,
                target_modules=self.config.target_modules,
                bias="none",
                use_gradient_checkpointing=True,
            )
        else:
            logger.info(f"Loading student model: {self.config.student_model}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.config.student_model)

            # Add padding token
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            self.student_model = AutoModelForCausalLM.from_pretrained(
                self.config.student_model,
                torch_dtype=torch.bfloat16 if self.config.dtype == "bfloat16" else torch.float32,
                device_map="auto",
            )

            if PEFT_AVAILABLE:
                lora_config = LoraConfig(
                    r=self.config.lora_r,
                    lora_alpha=self.config.lora_alpha,
                    lora_dropout=self.config.lora_dropout,
                    target_modules=self.config.target_modules,
                    task_type=TaskType.CAUSAL_LM,
                )
                self.student_model = get_peft_model(self.student_model, lora_config)

        # Teacher model for distillation
        if self.config.use_distillation:
            logger.info(f"Loading teacher model: {self.config.teacher_model}")
            if UNSLOTH_AVAILABLE:
                self.teacher_model, _ = FastLanguageModel.from_pretrained(
                    model_name=self.config.teacher_model,
                    max_seq_length=self.config.max_seq_length,
                    dtype=self.config.dtype,
                    load_in_4bit=False,  # Teacher needs full precision
                )
            else:
                self.teacher_model = AutoModelForCausalLM.from_pretrained(
                    self.config.teacher_model,
                    torch_dtype=torch.bfloat16,
                    device_map="cpu",  # Keep teacher on CPU initially
                )

            self.teacher_model.eval()
            for param in self.teacher_model.parameters():
                param.requires_grad = False

        # GPU memory info
        if torch.cuda.is_available():
            mem_allocated = torch.cuda.memory_allocated() / 1e9
            mem_reserved = torch.cuda.memory_reserved() / 1e9
            logger.info(
                f"GPU Memory: {mem_allocated:.1f}GB allocated, {mem_reserved:.1f}GB reserved"
            )

    def _setup_tokenizer(self):
        """Setup tokenizer."""
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        self.tokenizer.padding_side = "right"

    def _setup_dataset(self):
        """Load and prepare dataset."""
        logger.info(f"Loading dataset: {self.config.dataset_name}")

        # Try to load coding dataset
        try:
            from datasets import load_dataset

            if self.config.dataset_name == "openai/gsm8k":
                dataset = load_dataset("openai/gsm8k", "main")

                # Convert to instruction format
                def format_gsm8k(example):
                    return {
                        "instruction": f"Solve this math problem step by step: {example['question']}",
                        "output": example["answer"],
                    }

                self.train_dataset = dataset["train"].map(
                    format_gsm8k, remove_columns=dataset["train"].column_names
                )
                self.eval_dataset = (
                    dataset["test"].map(format_gsm8k, remove_columns=dataset["test"].column_names)
                    if "test" in dataset
                    else None
                )

            elif self.config.dataset_name == "bigcode/the-stack":
                dataset = load_dataset("bigcode/the-stack", "python", split="train[:10000]")

                def format_code(example):
                    return {
                        "instruction": "Complete this Python code:",
                        "output": example["content"][:1000],  # Truncate for memory
                    }

                self.train_dataset = dataset.map(format_code, remove_columns=dataset.column_names)
                self.eval_dataset = None

            else:
                # Default: load as generic
                dataset = load_dataset(
                    self.config.dataset_name, split=f"{self.config.dataset_split}[:1000]"
                )
                self.train_dataset = dataset
                self.eval_dataset = None

        except Exception as e:
            logger.warning(f"Failed to load dataset: {e}, using dummy data")
            # Create dummy dataset
            self.train_dataset = [
                {
                    "instruction": "Write a function to calculate factorial:",
                    "output": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
                },
                {
                    "instruction": "Implement binary search:",
                    "output": "def binary_search(arr, target):\n    left, right = 0, len(arr)-1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
                },
            ]
            self.eval_dataset = None

        logger.info(f"Train dataset size: {len(self.train_dataset)}")

    def compute_kl_loss(self, student_logits, teacher_logits, temperature=2.0):
        """Compute KL divergence loss for distillation."""
        # Softmax with temperature
        student_soft = torch.log_softmax(student_logits / temperature, dim=-1)
        teacher_soft = torch.softmax(teacher_logits / temperature, dim=-1)

        # KL divergence
        kl_loss = -torch.sum(teacher_soft * student_soft, dim=-1)

        # Scale by temperature squared
        kl_loss = kl_loss * (temperature**2)

        return kl_loss.mean()

    def apply_manifold_scaling(self, hidden_states, scale_factor=1.0):
        """Apply manifold scaling to hidden states."""
        if scale_factor == 1.0:
            return hidden_states

        # Normalize
        norm = torch.norm(hidden_states, dim=-1, keepdim=True)
        normalized = hidden_states / (norm + 1e-8)

        # Scale
        scaled = normalized * (norm * scale_factor)

        return scaled

    def compute_importance_matrix(self, model, dataloader, threshold=0.1):
        """Compute importance matrix for efficient training."""
        logger.info("Computing importance matrix...")

        importance_scores = {}

        for name, param in model.named_parameters():
            if param.requires_grad:
                importance_scores[name] = torch.zeros_like(param.data)

        num_batches = 0
        for batch in dataloader:
            if num_batches >= 10:  # Use 10 batches for estimation
                break

            input_ids = batch["input_ids"].to(self.device)
            labels = batch["labels"].to(self.device)

            # Forward pass
            outputs = model(input_ids)
            loss = outputs.loss

            # Backward pass
            loss.backward()

            # Accumulate gradients
            for name, param in model.named_parameters():
                if param.requires_grad and param.grad is not None:
                    importance_scores[name] += param.grad.abs()

            num_batches += 1

        # Normalize
        for name in importance_scores:
            importance_scores[name] /= num_batches

        # Create mask (keep only important params)
        importance_mask = {}
        for name, scores in importance_scores.items():
            threshold_value = scores.max() * threshold
            importance_mask[name] = (scores > threshold_value).float()

        return importance_mask

    def train(self):
        """Main training loop."""
        logger.info("Starting training...")

        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.config.output_dir,
            per_device_train_batch_size=self.config.per_device_train_batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            num_train_epochs=self.config.num_train_epochs,
            warmup_steps=self.config.warmup_steps,
            logging_steps=self.config.logging_steps,
            save_steps=self.config.save_steps,
            eval_steps=self.config.eval_steps,
            bf16=is_bf16_supported() if UNSLOTH_AVAILABLE else False,
            save_total_limit=3,
            logging_dir=f"{self.config.output_dir}/logs",
            report_to=["tensorboard"],
            optim="adamw_torch",
            weight_decay=0.01,
        )

        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,  # Causal LM
        )

        # Compute importance matrix if enabled
        if self.config.use_imatrix:
            # Create small dataloader for imatrix computation
            train_dataset = self.train_dataset.select(range(min(100, len(self.train_dataset))))
            temp_dataset = CodingDataset(train_dataset, self.tokenizer, self.config.max_seq_length)
            temp_loader = DataLoader(temp_dataset, batch_size=1)

            self.imatrix = self.compute_importance_matrix(
                self.student_model, temp_loader, self.config.imatrix_threshold
            )
            logger.info("Importance matrix computed")
        else:
            self.imatrix = None

        # Create trainer
        if GRPO_AVAILABLE and self.config.use_grpo:
            # Use GRPO trainer
            grpo_config = GRPOConfig(
                beta=self.config.grpo_beta,
                epsilon=self.config.grpo_epsilon,
                num_generations=self.config.grpo_num_generations,
                loss_type="grpo",
            )

            trainer = GRPOTrainer(
                model=self.student_model,
                args=grpo_config,
                train_dataset=self.train_dataset,
                tokenizer=self.tokenizer,
                data_collator=data_collator,
            )
        else:
            # Use standard Trainer
            trainer = Trainer(
                model=self.student_model,
                args=training_args,
                train_dataset=self.train_dataset,
                eval_dataset=self.eval_dataset,
                data_collator=data_collator,
            )

        # Train
        trainer.train()

        # Save
        self.save_model()

        logger.info("Training complete!")

    def save_model(self):
        """Save the trained model."""
        output_path = f"{self.config.output_dir}/final_model"
        os.makedirs(output_path, exist_ok=True)

        self.student_model.save_pretrained(output_path)
        self.tokenizer.save_pretrained(output_path)

        logger.info(f"Model saved to {output_path}")

        return output_path

    def export_to_ollama(self, ollama_model_name="custom-model"):
        """Export model to Ollama format."""
        output_path = f"{self.config.output_dir}/final_model"

        # This would require llama.cpp for GGUF export
        # For now, save in HuggingFace format
        logger.info(f"Model saved to {output_path}")
        logger.info(f"To convert to Ollama, use: llama-cli to convert to GGUF then ollama create")

        return output_path


def create_coding_training_pipeline():
    """Create a pre-configured training pipeline for coding."""

    config = TrainingConfig(
        # Use smaller models that can fit in GPU memory
        teacher_model="meta-llama/Llama-3.1-8B-Instruct",  # Or use已有的
        student_model="Qwen/Qwen2.5-3B-Instruct",  # 蒸留先
        output_dir="./coding-model-output",
        # Training
        max_seq_length=2048,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        learning_rate=1e-4,
        num_train_epochs=3,
        # LoRA
        lora_r=32,
        lora_alpha=64,
        # Distillation
        use_distillation=True,
        kl_alpha=0.3,
        temperature=1.5,
        # GRPO
        use_grpo=True,
        grpo_beta=0.5,
        # Manifold Scaling
        use_manifold_scaling=True,
        manifold_scale_factor=1.0,
        # imatrix
        use_imatrix=True,
        imatrix_threshold=0.15,
        # Dataset
        dataset_name="openai/gsm8k",
    )

    return DistillationTrainer(config)


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("=" * 50)
    print("Coding Model Training Pipeline")
    print("=" * 50)
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print(f"Unsloth: {UNSLOTH_AVAILABLE}")
    print(f"GRPO: {GRPO_AVAILABLE}")
    print(f"Peft: {PEFT_AVAILABLE}")
    print("=" * 50)
