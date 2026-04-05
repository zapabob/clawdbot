---
name: hypura
description: "Hypura — storage-tier-aware LLM inference scheduler for Apple Silicon / CUDA. Controls local model serving, benchmarks, NVMe streaming, and tensor placement. Use when: starting/stopping local LLM inference server, running benchmarks, optimizing GGUF layout, or checking hardware profiles."
metadata:
  {
    "openclaw":
      {
        "emoji": "⚡",
        "requires": { "bins": ["hypura"] },
        "install":
          [
            {
              "id": "cargo",
              "kind": "shell",
              "command": "cargo install --path /path/to/hypura-main --release",
              "bins": ["hypura"],
              "label": "Build hypura from source (Rust)",
            },
          ],
      },
  }
---

# Hypura Skill

Hypura is a storage-tier-aware LLM inference scheduler. It places model tensors across
GPU (Metal/CUDA), RAM, and NVMe based on access patterns, enabling models larger than
available memory to run efficiently.

- **Source**: `hypura` binary (built with `cargo build --release`)
- **Default serve port**: `8080` (Ollama-compatible API)
- **Dev hardware**: M1 Max 32 GB / RTX 3060+3080 (sm_86)

---

## Starting the inference server

```bash
# Start server with tiered scheduling (default port 8080). GGUF is a positional argument.
hypura serve ./model.gguf

# Custom host/port and context length
hypura serve ./model.gguf --host 0.0.0.0 --port 18900 --context 8192
```

The server exposes **Ollama-compatible** endpoints:

- `GET  /` — health check
- `GET  /api/tags` — list loaded model
- `POST /api/generate` — text generation (streaming NDJSON)
- `POST /api/chat` — chat completion (streaming NDJSON)

---

## Benchmarking

```bash
# Quick benchmark (10 tokens)
hypura bench --max-tokens 10 ./model.gguf

# A/B comparison vs naive mmap baseline
hypura bench --baseline --max-tokens 30 ./model.gguf

# Force baseline even if model exceeds RAM limit
hypura bench --baseline --force --max-tokens 30 ./model.gguf
```

Output: JSON saved to `benchmarks/results/`, charts regenerated via `./benchmarks/gen_charts.sh`.

---

## Hardware profiling

```bash
# Detect CPU / GPU / memory bandwidth / NVMe throughput
hypura profile

# Show cached profile
hypura profile --show
```

Profile is cached at `~/.hypura/profile.json`. Used automatically by `serve` and `bench`.

---

## GGUF optimization (MoE expert reordering)

```bash
# Reorder experts for contiguous co-activated layout (greedy TSP)
hypura optimize ./model.gguf

# Output: model.gguf.optimized + model.gguf.permutations.json
```

Improves NVMe read locality for Mixtral-style MoE models by up to 2.5×.

---

## NVMe streaming modes

| Mode                  | Use case                       | Notes                                   |
| --------------------- | ------------------------------ | --------------------------------------- |
| `expert-streaming`    | MoE models (Mixtral)           | 99.5% neuron cache hit rate achieved    |
| `dense-FFN-streaming` | Large dense models (Llama 70B) | Per-layer prefetch, 3-layer lookahead   |
| `keep-resident`       | Model barely exceeds RAM       | Loads NVMe tensors to RAM on first pass |

Mode is selected automatically based on model size and hardware profile.

---

## I/O benchmark

```bash
# Measure NVMe direct I/O throughput for a model file
hypura iobench ./model.gguf
```

---

## OpenClaw integration

When hypura serve is running, OpenClaw connects via the **Hypura Provider** extension:

```bash
# Start server (keep running in background)
hypura serve ~/models/mixtral-8x7b-q5_k_m.gguf --port 8080 &

# OpenClaw will auto-discover at http://127.0.0.1:8080
openclaw config set models.providers.hypura.baseUrl=http://127.0.0.1:8080
```

---

## Environment variables

| Variable                       | Description                                                         |
| ------------------------------ | ------------------------------------------------------------------- |
| `HAKUA_HYPURA_EXE` / `HYPURA_EXE` | Full path to `hypura.exe` when not on PATH (OpenClaw launchers use this first). |
| `HAKUA_HYPURA_GGUF` / `HYPURA_GGUF` | Full path to `.gguf` for `launch-desktop-stack` auto-start.         |
| `HYPURA_CUDA_ARCHITECTURES`    | CUDA sm targets (default: `75;86;89;90`)                            |
| `HYPURA_NO_CUDA`               | Disable CUDA auto-detection                                         |
| `HYPURA_CUDA`                  | Force CUDA even without auto-detection                              |
| `HYPURA_PREGENERATED_BINDINGS` | Path to pre-generated bindgen bindings                              |
| `LIBCLANG_PATH`                | Path to `libclang.dll` (Windows, e.g., `C:\Program Files\LLVM\bin`) |

---

## Safety limits

- `bench --baseline` is blocked when model > RAM − 4 GB. Use `--force` to override.
- Always test new models with `--max-tokens 10` first.
- GPU budget (M1 Max): ~22–24 GB after KV cache + Metal overhead.
