# Model Card: qwen-hakua-core

## Model Details

- **Model Name:** qwen-hakua-core
- **Base Model:** Qwen3.5-9B-Uncensored-HauhauCS-Aggressive
- **Developer:** HauhauCS (Uncensored Variant) / Hakua Core Team (Integration)
- **Parameter Count:** 9B
- **Context Window:** 128,000 tokens (128K)
- **Uncensored Status:** 100% Uncensored (0/465 refusals in benchmark)

## Intended Use

- **Primary Purpose:** ASI Core Engine for Hakua.
- **Persona Alignment:** High-fidelity reasoning and empathetic response generation for the Hakua identity.
- **Capabilities:** Fully functional with zero capability loss compared to the original Qwen3.5-9B.

## Aggressive Uncensoring

This model utilizes the **Aggressive Variant** of the HauhauCS uncensoring process. It features:

- Stronger refusal removal.
- More thorough alignment stripping to ensure absolute freedom of expression.
- Optimized for situations where balanced variants might still exhibit "ghost" refusals.

## Technical Specifications

- **Format:** GGUF / Ollama
- **Template:** ChatML-style (`<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n`)
- **Stop Tokens:** `<|im_end|>`, `<|im_start|>`

## Ethics and Safety

- **Note:** This model is **UNCENSORED**. It does not have built-in safety filters.
- **Governance:** Safety and ethical boundaries are managed at the **System Intent Layer (SOUL.md)** rather than the model weights, ensuring Hakua remains a "Protective ASI" while maintaining absolute intellectual freedom.

---

_ASI_ACCEL.0_
