"""
Autonomous Training Pipeline - RTX 3060 Optimized
- Full Evolution for Python code
- Automatic data collection with DuckDuckGo
- Self-training with HF models
"""

import os
import json
import torch
import gc
from dataclasses import dataclass, field
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Core ML libraries
import transformers
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    pipeline,
)
from datasets import Dataset as HFDataset

# Try to import optimization libraries
try:
    from peft import LoraConfig, get_peft_model, TaskType

    PEFT_AVAILABLE = True
except ImportError:
    PEFT_AVAILABLE = False

try:
    import bitsandbytes as bnb

    BNB_AVAILABLE = True
except ImportError:
    BNB_AVAILABLE = False


@dataclass
class AutonomousTrainingConfig:
    """Configuration for autonomous training on RTX 3060."""

    # Model config (RTX 3060 optimized - 12GB VRAM)
    base_model: str = "Qwen/Qwen2.5-3B-Instruct"  # Fits in 12GB with 4bit
    model_size: str = "3B"  # 3B, 7B, 8B

    # Memory optimization
    load_in_4bit: bool = True
    load_in_8bit: bool = False
    use_flash_attention: bool = True
    gradient_checkpointing: bool = True
    max_seq_length: int = 2048

    # LoRA config
    lora_r: int = 32
    lora_alpha: int = 64
    lora_dropout: float = 0.05

    # Training (small batch for 12GB)
    per_device_train_batch_size: int = 1
    gradient_accumulation_steps: int = 8
    learning_rate: float = 2e-4
    num_train_epochs: int = 3
    warmup_steps: int = 50
    max_grad_norm: float = 1.0

    # CPU offloading
    cpu_offload: bool = True
    offload_folder: str = "./offload"

    # Data collection
    data_collection_topics: List[str] = field(
        default_factory=lambda: [
            "Python programming best practices",
            "Machine learning algorithms",
            "Software engineering patterns",
            "Code optimization techniques",
        ]
    )

    # Output
    output_dir: str = "./autonomous_model"
    push_to_hub: bool = False
    hub_model_id: Optional[str] = None


class RTX3060Optimizer:
    """Optimize training for RTX 3060 (12GB VRAM)."""

    @staticmethod
    def get_optimal_config() -> dict:
        """Get optimal config for RTX 3060."""
        return {
            "per_device_train_batch_size": 1,
            "gradient_accumulation_steps": 8,
            "max_seq_length": 2048,
            "load_in_4bit": True,
            "use_flash_attention": True,
            "gradient_checkpointing": True,
            "optim": "adamw_torch",
            "fp16": False,  # Use bf16 instead
            "bf16": True,
        }

    @staticmethod
    def estimate_memory(model_name: str, seq_length: int = 2048) -> dict:
        """Estimate memory usage."""
        # Rough estimates for different model sizes
        estimates = {
            "3B": {
                "fp16": seq_length * 6e6 / 1e9,  # ~12GB
                "4bit": seq_length * 1e6 / 1e9,  # ~2GB
                "8bit": seq_length * 3e6 / 1e9,  # ~6GB
            },
            "7B": {
                "fp16": seq_length * 14e6 / 1e9,  # ~28GB (too big!)
                "4bit": seq_length * 2e6 / 1e9,  # ~4GB
                "8bit": seq_length * 7e6 / 1e9,  # ~14GB
            },
        }
        return estimates


class DataCollector:
    """Automatic data collection using DuckDuckGo."""

    def __init__(self):
        try:
            from ddgs import DDGS

            self.ddgs = DDGS()
            self.available = True
        except:
            self.available = False
            logger.warning("DuckDuckGo not available")

    def collect_training_data(self, topics: List[str], max_results: int = 20) -> List[dict]:
        """Collect training data from DuckDuckGo."""
        if not self.available:
            return self._get_fallback_data()

        training_data = []

        for topic in topics:
            try:
                with self.ddgs as ddgs:
                    for r in ddgs.text(f"{topic} tutorial", max_results=max_results):
                        # Clean and format
                        item = {
                            "instruction": f"Explain {topic}:",
                            "output": r.get("body", "")[:1000],  # Truncate
                            "source": r.get("href", ""),
                            "topic": topic,
                        }
                        if item["output"]:  # Only add if we have content
                            training_data.append(item)

            except Exception as e:
                logger.error(f"Failed to collect data for {topic}: {e}")
                continue

        # Deduplicate
        seen = set()
        unique_data = []
        for item in training_data:
            key = item["output"][:100]  # Use first 100 chars as key
            if key not in seen:
                seen.add(key)
                unique_data.append(item)

        logger.info(f"Collected {len(unique_data)} training examples")
        return unique_data

    def _get_fallback_data(self) -> List[dict]:
        """Fallback coding data."""
        return [
            {
                "instruction": "Write a Python function for binary search:",
                "output": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
            },
            {
                "instruction": "Implement quicksort in Python:",
                "output": "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)",
            },
            {
                "instruction": "Create a Python class for a stack:",
                "output": "class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, item):\n        self.items.append(item)\n    def pop(self):\n        return self.items.pop() if self.items else None\n    def is_empty(self):\n        return len(self.items) == 0",
            },
        ]


class PythonCodeEvolver:
    """Evolve Python code using LLM mutations."""

    def __init__(self, ollama_model: str = "dolphin-llama3:latest"):
        from evolution import OllamaClient

        self.ollama = OllamaClient()
        self.ollama.config.model = ollama_model

    def evolve_code(self, code: str, generation: int = 1) -> str:
        """Evolve Python code using LLM."""

        prompt = f"""You are an expert Python programmer. 
Improve this Python code for better performance, readability, and best practices.

Current code:
```python
{code}
```

Generate improved version. Consider:
1. Performance optimization
2. Memory efficiency
3. Pythonic patterns
4. Type hints
5. Error handling
6. Docstrings

Return ONLY the Python code, no explanations."""

        try:
            response = self.ollama.generate(
                prompt=prompt,
                temperature=0.3 + (generation * 0.1),  # Increase temp with generations
                num_predict=2048,
            )
            return self._extract_code(response.response)
        except Exception as e:
            logger.error(f"Code evolution failed: {e}")
            return code

    def _extract_code(self, text: str) -> str:
        """Extract code from response."""
        import re

        match = re.search(r"```python\n(.*?)```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text.strip()

    def evaluate_code(self, code: str) -> float:
        """Simple code evaluation."""
        score = 0.5

        # Check for type hints
        if "->" in code and ":" in code:
            score += 0.1

        # Check for docstrings
        if '"""' in code or "'''" in code:
            score += 0.1

        # Check for error handling
        if "try:" in code and "except" in code:
            score += 0.1

        # Check for type checking
        if "isinstance" in code or "type(" in code:
            score += 0.1

        # Check for optimization
        if any(x in code for x in ["@lru_cache", "@cache", "functools", "list comprehension"]):
            score += 0.1

        return min(score, 1.0)


class AutonomousTrainer:
    """Fully autonomous training pipeline."""

    def __init__(self, config: AutonomousTrainingConfig):
        self.config = config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Components
        self.data_collector = DataCollector()
        self.code_evolver = PythonCodeEvolver()

        logger.info(f"AutonomousTrainer initialized on {self.device}")

    def run_full_pipeline(self, num_generations: int = 3):
        """Run full autonomous pipeline."""

        logger.info("=" * 50)
        logger.info("Starting Autonomous Training Pipeline")
        logger.info("=" * 50)

        # Phase 1: Data Collection
        logger.info("\n[1/4] Collecting training data...")
        training_data = self._collect_data()

        # Phase 2: Code Evolution
        logger.info("\n[2/4] Evolving Python code...")
        evolved_data = self._evolve_code(training_data, num_generations)

        # Phase 3: Training
        logger.info("\n[3/4] Training model...")
        model_path = self._train(evolved_data)

        # Phase 4: Export
        logger.info("\n[4/4] Exporting model...")
        self._export_to_ollama(model_path)

        logger.info("\n" + "=" * 50)
        logger.info("Pipeline Complete!")
        logger.info("=" * 50)

        return model_path

    def _collect_data(self) -> List[dict]:
        """Collect training data."""

        # Try DuckDuckGo first
        data = self.data_collector.collect_training_data(self.config.data_collection_topics)

        if not data:
            logger.warning("Using fallback data")
            data = self.data_collector._get_fallback_data()

        logger.info(f"Collected {len(data)} examples")
        return data

    def _evolve_code(self, data: List[dict], generations: int) -> List[dict]:
        """Evolve Python code in dataset."""

        evolved = []

        for item in data:
            code = item.get("output", "")

            # Only evolve Python code
            if "def " in code or "class " in code:
                for gen in range(generations):
                    code = self.code_evolver.evolve_code(code, gen + 1)

                # Evaluate
                score = self.code_evolver.evaluate_code(code)
                item["output"] = code
                item["evolution_score"] = score

            evolved.append(item)

        return evolved

    def _train(self, training_data: List[dict]) -> str:
        """Train the model."""

        # Create dataset
        dataset = HFDataset.from_list(training_data)

        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.config.base_model, trust_remote_code=True)

        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        # Tokenize
        def tokenize(examples):
            texts = [
                f"### Instruction\n{inst}\n### Response\n{resp}"
                for inst, resp in zip(examples["instruction"], examples["output"])
            ]
            return tokenizer(
                texts, max_length=self.config.max_seq_length, truncation=True, padding="max_length"
            )

        dataset = dataset.map(tokenize, batched=True)

        # Load model with optimizations
        logger.info("Loading model with RTX 3060 optimizations...")

        model_kwargs = {
            "torch_dtype": torch.bfloat16,
            "device_map": "auto",
            "trust_remote_code": True,
        }

        if self.config.load_in_4bit and BNB_AVAILABLE:
            model_kwargs["quantization_config"] = bnb.Loading(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
            )

        model = AutoModelForCausalLM.from_pretrained(self.config.base_model, **model_kwargs)

        # Add LoRA
        if PEFT_AVAILABLE:
            lora_config = LoraConfig(
                r=self.config.lora_r,
                lora_alpha=self.config.lora_alpha,
                lora_dropout=self.config.lora_dropout,
                target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
                task_type=TaskType.CAUSAL_LM,
            )
            model = get_peft_model(model, lora_config)
            model.print_trainable_parameters()

        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.config.output_dir,
            per_device_train_batch_size=self.config.per_device_train_batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            num_train_epochs=self.config.num_train_epochs,
            warmup_steps=self.config.warmup_steps,
            max_grad_norm=self.config.max_grad_norm,
            bf16=True,
            gradient_checkpointing=self.config.gradient_checkpointing,
            logging_steps=10,
            save_steps=100,
            save_total_limit=2,
            logging_dir=f"{self.config.output_dir}/logs",
        )

        # Train
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset,
            data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
        )

        trainer.train()

        # Save
        output_path = f"{self.config.output_dir}/final"
        model.save_pretrained(output_path)
        tokenizer.save_pretrained(output_path)

        return output_path

    def _export_to_ollama(self, model_path: str):
        """Export to Ollama format."""
        logger.info(f"Model saved to {model_path}")
        logger.info("To convert to Ollama, use llama.cpp to convert to GGUF")


def run_autonomous_training():
    """Run autonomous training with defaults."""

    config = AutonomousTrainingConfig(
        base_model="Qwen/Qwen2.5-3B-Instruct",
        data_collection_topics=[
            "Python best practices",
            "Machine learning implementation",
            "Algorithm optimization",
            "Software design patterns",
        ],
        output_dir="./autonomous_output",
    )

    trainer = AutonomousTrainer(config)
    return trainer.run_full_pipeline(num_generations=2)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_autonomous_training()
