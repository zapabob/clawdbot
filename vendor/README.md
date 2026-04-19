# Vendor

`vendor/` contains tracked third-party material that OpenClaw needs at build or runtime.

- `submodules/` holds sanctioned external Git submodules plus the shared registry used by `submodule_run`.
- Generated build outputs still stay ignored unless a file is explicitly re-included.
- Do not drop ad hoc archives or local clones here; capture them under [`_artifacts/`](/C:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/_artifacts/README.md) instead.
