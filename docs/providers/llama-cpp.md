---
summary: "Run OpenClaw with llama.cpp (OpenAI-compatible local server)"
read_when:
  - You want to run OpenClaw against a local llama.cpp server
  - You want OpenAI-compatible /v1 endpoints with your own local models
title: "llama.cpp"
---

# llama.cpp

`llama.cpp` can serve open-source (and custom) models via an **OpenAI-compatible**
HTTP API. OpenClaw can connect to llama.cpp using the `openai-completions` API.

OpenClaw can also **auto-discover** available models when you opt in with
`LLAMA_CPP_API_KEY` (any value works if your server does not enforce auth) and
you do not define an explicit `models.providers.llama-cpp` entry.

For env-first local setups, use:

- `LLAMA_CPP_API_KEY`: auth marker or real server API key
- `LLAMA_CPP_MODEL`: the API model id OpenClaw should select
- `LLAMA_CPP_MODEL_PATH`: the GGUF path for the launch helper script
- `LLAMA_CPP_MMPROJ_PATH`: optional multimodal projector path for the launch helper

## Quick start

1. Export your local llama.cpp env vars.

```bash
export LLAMA_CPP_API_KEY="llama-cpp-local"
export LLAMA_CPP_MODEL="Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf"
export LLAMA_CPP_MODEL_PATH="/path/to/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf"
export LLAMA_CPP_MMPROJ_PATH="/path/to/mmproj-Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-f16.gguf"
```

2. Start llama.cpp with the bundled launch helper.

```bash
pnpm llama-cpp:launch
```

The helper launches `llama-server` with your GGUF path and adds `--mmproj`
only when `LLAMA_CPP_MMPROJ_PATH` is set.

3. Point OpenClaw at the same `/v1` server.

Your base URL should expose `/v1` endpoints (e.g. `/v1/models`,
`/v1/chat/completions`). `llama.cpp` commonly runs on:

- `http://127.0.0.1:8080/v1`

4. Select a model:

```json5
{
  agents: {
    defaults: {
      model: { primary: "llama-cpp/${LLAMA_CPP_MODEL}" },
    },
  },
}
```

If you prefer to start `llama-server` yourself, the equivalent command shape is:

```bash
llama-server -m "$LLAMA_CPP_MODEL_PATH" --host 127.0.0.1 --port 8080 --api-key "$LLAMA_CPP_API_KEY" --mmproj "$LLAMA_CPP_MMPROJ_PATH"
```

Omit `--mmproj` when you do not need multimodal input.

## Model discovery (implicit provider)

When `LLAMA_CPP_API_KEY` is set (or an auth profile exists) and you **do not**
define `models.providers.llama-cpp`, OpenClaw will query:

- `GET http://127.0.0.1:8080/v1/models`

and convert the returned IDs into model entries.

If you set `models.providers.llama-cpp` explicitly, auto-discovery is skipped and
you must define models manually.

## Explicit configuration (manual models)

Use explicit config when:

- llama.cpp runs on a different host/port.
- You want to pin `contextWindow`/`maxTokens` values.
- Your server requires a real API key (or you want to control headers).

```json5
{
  agents: {
    defaults: {
      model: { primary: "llama-cpp/${LLAMA_CPP_MODEL}" },
    },
  },
  models: {
    providers: {
      "llama-cpp": {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "${LLAMA_CPP_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "${LLAMA_CPP_MODEL}",
            name: "Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`LLAMA_CPP_MODEL` should match the model id exposed by `/v1/models`. For many
single-model servers, that is the same as the GGUF basename.

`LLAMA_CPP_MMPROJ_PATH` is **not** sent in OpenClaw requests. It is only used by
the launch helper to start `llama-server --mmproj ...` for multimodal models.

## Troubleshooting

- Check the server is reachable:

```bash
curl http://127.0.0.1:8080/v1/models
```

- If requests fail with auth errors, set a real `LLAMA_CPP_API_KEY` that matches
  your server configuration, or configure the provider explicitly under
  `models.providers.llama-cpp`.
- If non-interactive setup complains about `--custom-model-id`, set
  `LLAMA_CPP_MODEL` or pass `--custom-model-id` explicitly.
- If image input does not work, confirm the server was started with
  `--mmproj` and that `LLAMA_CPP_MMPROJ_PATH` points at the matching projector
  GGUF.

## Proxy-style behavior

`llama.cpp` is treated as a proxy-style OpenAI-compatible `/v1` backend, not a
native OpenAI endpoint.

- native OpenAI-only request shaping does not apply here
- no `service_tier`, no Responses `store`, no prompt-cache hints, and no
  OpenAI reasoning-compat payload shaping
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
  are not injected on custom llama.cpp base URLs
