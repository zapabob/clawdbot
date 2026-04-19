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

## Quick start

1. Start llama.cpp with an OpenAI-compatible server.

Your base URL should expose `/v1` endpoints (e.g. `/v1/models`,
`/v1/chat/completions`). `llama.cpp` commonly runs on:

- `http://127.0.0.1:8080/v1`

2. Opt in (any value works if no auth is configured):

```bash
export LLAMA_CPP_API_KEY="llama-cpp-local"
```

3. Select a model (replace with one of your llama.cpp model IDs):

```json5
{
  agents: {
    defaults: {
      model: { primary: "llama-cpp/your-model-id" },
    },
  },
}
```

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
  models: {
    providers: {
      "llama-cpp": {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "${LLAMA_CPP_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local llama.cpp Model",
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

## Troubleshooting

- Check the server is reachable:

```bash
curl http://127.0.0.1:8080/v1/models
```

- If requests fail with auth errors, set a real `LLAMA_CPP_API_KEY` that matches
  your server configuration, or configure the provider explicitly under
  `models.providers.llama-cpp`.

## Proxy-style behavior

`llama.cpp` is treated as a proxy-style OpenAI-compatible `/v1` backend, not a
native OpenAI endpoint.

- native OpenAI-only request shaping does not apply here
- no `service_tier`, no Responses `store`, no prompt-cache hints, and no
  OpenAI reasoning-compat payload shaping
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
  are not injected on custom llama.cpp base URLs

