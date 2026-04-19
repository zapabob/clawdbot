# Vendor Submodules

`vendor/submodules/` is the canonical home for external Git submodules that OpenClaw and Hypura may invoke through the registry-backed `submodule_run` surface.

- Source of truth for runnable repos: [registry.json](/C:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/vendor/submodules/registry.json)
- Runtime policy: only registered `repoId + preset` combinations may execute.
- Do not call raw `exec` against these repos from HTTP surfaces; use `submodule_run` or `hypura_harness_submodule`.
