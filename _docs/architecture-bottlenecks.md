# Architecture bottlenecks (quick deep-dive)

Date: 2026-02-27 (JST)

## 1) Config loading: sync FS + very short TTL cache

- `src/config/io.ts` reads and parses config with **sync fs** (`existsSync`, `readFileSync`) and then runs fairly heavy normalization/validation logic.
- The global wrapper cache defaults to **200ms** (`DEFAULT_CONFIG_CACHE_MS = 200`). In a busy gateway (multiple messages/sec, multiple channels), that can mean repeated disk reads + JSON5 parse + schema validation several times per second.
- `loadConfig()` is called from many runtime paths (send/monitor/tools/etc). See `rg "\\bloadConfig\\(\\)" src ...`.

Why it matters:

- Sync fs blocks the Node event loop.
- Short TTL means the cache is almost ineffective for high-throughput traffic.

Suggested architectural fix:

- Switch to a **watch-based invalidation** model (fs watcher on configPath + include files) and keep an in-memory snapshot.
- Or increase default cache to something like **2–5s** and document it (keep env override for “immediate consistency”).
- Additionally: encourage passing `cfg` through call chains (many call sites already accept `opts.config` but still default to global `loadConfig()`).

Key file:

- `src/config/io.ts` (load + cache wrapper)

## 2) Memory indexing/search: synchronous SQLite + heavy IO on main thread

- Memory manager uses `node:sqlite` **DatabaseSync** and mixes in `fsSync` in `src/memory/manager-sync-ops.ts`.
- This class also orchestrates chokidar file watching + indexing + vector extension load (`sqlite-vec`) and can do substantial work on the main event loop.

Why it matters:

- Large reindex operations or bursts of transcript updates can stall message handling.
- SQLite “busy/locked” behavior is explicitly handled in tests, indicating real contention risk.

Suggested architectural fix:

- Move indexing/search to a **worker thread** (or a separate service/process) so the gateway remains responsive.
- Consider async DB access patterns, batching, and backpressure (queue + concurrency caps) beyond current helpers.

Key file:

- `src/memory/manager-sync-ops.ts`

## 3) Hot-path sync filesystem reads for auth + identity

- WhatsApp web auth helpers do multiple sync operations (`existsSync/statSync/readFileSync/copyFileSync`) in `src/web/auth-store.ts`.

Why it matters:

- If invoked frequently (e.g., periodic status / send flows), this is extra event-loop blocking and repeated JSON parsing.

Suggested fix:

- Cache parsed creds/self-id in memory with an mtime-based invalidation (or reuse the async `webAuthExists` patterns).

Key file:

- `src/web/auth-store.ts`

## 4) Watcher scaling and duplicated watchers

- `chokidar` is used in memory sync ops; if per-agent watchers are created, that scales poorly with many agents/workspaces.

Suggested fix:

- Prefer a **shared watcher per root directory** with routing to interested agents, rather than N watchers.

## 5) Repository/runtime footprint signals (operational bottleneck)

- There is a very large `agents.db` at repo root (~3.5GB). Even if not “code architecture”, this can:
  - slow backups / CI / virus scanners
  - cause accidental commits or workspace bloat

Suggested fix:

- Ensure it’s gitignored (it is present; verify `.gitignore` coverage) and consider moving to user state dir (e.g. `~/.openclaw/`) by default.

---

## Recommended next steps (lowest effort → highest)

1. **Raise config cache default** (200ms → 2s) and/or make gateway long-lived code paths pass `cfg` down explicitly.
2. Add a config watcher to invalidate cache on change, enabling a long TTL safely.
3. Move memory indexing/search to a worker thread (or separate process) and keep gateway’s event loop mostly I/O bound.
4. Audit remaining sync fs usage in runtime paths (`rg "readFileSync|statSync" src`) and convert to async/cached where feasible.
