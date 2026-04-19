# llama.cpp Provider Plugin Integration

- **Date**: 2026-04-19
- **Scope**: provider-extension implementation
- **Owner**: Claude

## What I changed

- Added a new bundled provider extension at `extensions/llama-cpp` with files aligned to existing local OpenAI-compatible provider patterns:
  - `index.ts`
  - `api.ts`
  - `defaults.ts`
  - `models.ts`
  - `openclaw.plugin.json`
  - `package.json`
  - `register.runtime.ts`
  - `README.md`
- Added OpenAI-compatible self-hosted setup using shared helpers from
  `openclaw/plugin-sdk/provider-setup`:
  - `promptAndConfigureOpenAICompatibleSelfHostedProviderAuth`
  - `configureOpenAICompatibleSelfHostedProviderNonInteractive`
  - `discoverOpenAICompatibleSelfHostedProvider`
  - `discoverOpenAICompatibleLocalModels`
- Registered provider metadata:
  - id: `llama-cpp`
  - label: `llama.cpp`
  - default base URL: `http://127.0.0.1:8080/v1`
  - API key env var: `LLAMA_CPP_API_KEY`
  - default model placeholder: `llama-3.1-8b-instruct`
  - docs link: `/providers/llama-cpp`
- Added docs:
  - `docs/providers/llama-cpp.md`
  - `docs/providers/index.md` (new link entry)
- Added tests:
  - `extensions/llama-cpp/index.test.ts`
  - Covers interactive auth, non-interactive auth, discovery flow, and model discovery
    builder behavior.

## Verification run

- `pnpm test -- extensions/llama-cpp/index.test.ts`

