# llama.cpp env-backed model selection and launch helper

- **Date**: 2026-04-19
- **Scope**: llama.cpp provider follow-up
- **Owner**: Codex

## What changed

- Extended the bundled `llama.cpp` provider to advertise `LLAMA_CPP_MODEL` in
  addition to `LLAMA_CPP_API_KEY`.
- Added provider-local model-id resolution so non-interactive setup can use
  `LLAMA_CPP_MODEL` when `--custom-model-id` is omitted.
- Updated the provider hint text to mention both `LLAMA_CPP_API_KEY` and
  `LLAMA_CPP_MODEL`.
- Added a top-level launch helper at `scripts/llama-cpp-launch.ts`.
  - Loads repo/global dotenv files with the existing runtime dotenv helper.
  - Reads `LLAMA_CPP_MODEL_PATH` and optional `LLAMA_CPP_MMPROJ_PATH`.
  - Derives a default model id from the GGUF basename when `LLAMA_CPP_MODEL`
    is unset.
  - Starts `llama-server` with `-m`, `--host`, `--port`, optional `--api-key`,
    and optional `--mmproj`.
- Added docs and `.env.example` entries for:
  - `LLAMA_CPP_API_KEY`
  - `LLAMA_CPP_MODEL`
  - `LLAMA_CPP_MODEL_PATH`
  - `LLAMA_CPP_MMPROJ_PATH`
- Added tests for:
  - provider env registration and model-id resolution behavior
  - launch helper command construction and path handling

## Verification commands

- `pnpm test -- extensions/llama-cpp/index.test.ts scripts/llama-cpp-launch.test.ts`
- `pnpm test -- extensions/vllm/index.test.ts`
