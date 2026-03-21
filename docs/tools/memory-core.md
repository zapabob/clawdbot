---
title: Memory (Core)
description: File-backed persistent memory search and retrieval tools
---

# Memory (Core)

The `memory-core` extension provides file-backed persistent memory tools that allow the agent to store and retrieve information across sessions.

## Tools

### `memory_search`

Search through the agent's persistent memory using keywords.

**Parameters**

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `query`   | string | Yes      | Keyword or phrase to search for |

**When to use**

- Before answering questions about past conversations or user preferences
- When the user references something from a previous session
- To retrieve facts, settings, or context stored in memory

**Example**

```
memory_search({ query: "user preferences" })
memory_search({ query: "previous project context" })
```

### `memory_get`

Retrieve a specific memory entry by its ID.

**Parameters**

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `id`      | string | Yes      | The unique ID of the memory entry |

**When to use**

- When you have a specific memory entry ID from a previous `memory_search` result
- To fetch the full content of a memory entry

## Configuration

Memory is stored in the agent's session directory. The `memory-core` plugin occupies the `memory` slot in the plugin system — only one memory plugin can be active at a time.

```json
"plugins": {
  "slots": { "memory": "memory-core" },
  "entries": {
    "memory-core": { "enabled": true }
  }
}
```

## CLI

```bash
openclaw memory list
openclaw memory search <query>
openclaw memory get <id>
openclaw memory delete <id>
```

## Related

- [LLM Task](/tools/llm-task) — for subtask delegation with structured output
- [Lobster](/tools/lobster) — for shell workflow automation
