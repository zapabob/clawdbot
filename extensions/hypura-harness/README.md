# hypura-harness (bundled extension)

OpenClaw bundled plugin **`hypura-harness`**: HTTP proxy tools (`hypura_harness_*`) to the Hypura Python harness (VRChat OSC, voice input/output, VOICEVOX, code run, skills, Shinka evolve, LoRA).

## Repo layout notes

- The daemon entry path stays fixed at `extensions/hypura-harness/scripts/harness_daemon.py`.
- External repositories are resolved through `vendor/submodules/registry.json`.
- The `hypura_harness_submodule` tool proxies the core `submodule_run` surface instead of exposing raw subprocess execution over HTTP.

## Canonical paths

| Item              | Path                                                   |
| ----------------- | ------------------------------------------------------ |
| Python project    | `extensions/hypura-harness/scripts/pyproject.toml`     |
| Daemon entry      | `extensions/hypura-harness/scripts/harness_daemon.py`  |
| Config            | `extensions/hypura-harness/config/harness.config.json` |
| Default HTTP port | **18794** (avoids OpenClaw Bridge default **18790**)   |

## Start the daemon

From repository root (after `uv` is installed):

```bash
cd extensions/hypura-harness/scripts && uv run harness_daemon.py
```

Windows (env merge + optional `openclaw.json` → harness model sync):

```powershell
.\scripts\launchers\Start-Hypura-Harness.ps1
```

Full desktop stack (Gateway, TUI, harness, etc.): `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1` or `Sovereign-Portal.ps1`. See [scripts/launchers/README.md](../../scripts/launchers/README.md).

## OpenClaw config

- Enable the plugin in `openclaw.json` under `plugins.entries["hypura-harness"]`.
- Set `plugins.entries["hypura-harness"].config.baseUrl` to match `harness.config.json` / daemon port (default `http://127.0.0.1:18794`).

## Voice I/O tools

The plugin exposes the daemon voice endpoints as OpenClaw tools so agents can
use the local microphone, WAV transcription, VOICEVOX playback, and Desktop
Companion transcript loop without guessing raw HTTP paths.

| Tool                                  | Endpoint                     | Use                                                                                  |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| `hypura_harness_voice_devices`        | `GET /voice/devices`         | List local input/output devices and defaults.                                        |
| `hypura_harness_voice_test_say`       | `POST /voice/test-say`       | Synthesize a short VOICEVOX line and verify output routing.                          |
| `hypura_harness_voice_transcribe`     | `POST /voice/transcribe`     | Transcribe an existing WAV file through whisper.cpp.                                 |
| `hypura_harness_voice_turn`           | `POST /voice/turn`           | Record a local mic turn, call OpenClaw, and speak the reply.                         |
| `hypura_harness_companion_mic`        | `POST /voice/companion-mic`  | Enable or disable Desktop Companion mic capture.                                     |
| `hypura_harness_companion_voice_turn` | `POST /voice/companion-turn` | Send a Companion transcript through OpenClaw and optionally speak/animate the reply. |

Agent-facing operating guidance lives in
[extensions/hypura-harness/skills/voice-io/SKILL.md](./skills/voice-io/SKILL.md).
Run `hypura_harness_voice_devices` before selecting device ids, and use
explicit `output_devices` when routing to both monitor speakers and a virtual
audio cable.

## Docker

`docker-compose.override.yml` defines a `hypura-harness` service (image build context: this directory). Adjust compose env if you change ports.

## Operator docs

- Workspace skill: [skills/hypura-harness/SKILL.md](../../skills/hypura-harness/SKILL.md)
- Plugin skills: [extensions/hypura-harness/skills](./skills) are registered through `openclaw.plugin.json` so enabled installations expose the harness operating guides like other bundled plugins.
- Voice I/O skill: [extensions/hypura-harness/skills/voice-io/SKILL.md](./skills/voice-io/SKILL.md)
- LoRA pipeline: [extensions/hypura-harness/scripts/LORA_PIPELINE.md](./scripts/LORA_PIPELINE.md)
- Layout vs `scripts/hypura/`: [\_docs/2026-04-05_OpenClaw-layout-Sovereign-overlay_clawdbot-main.md](../../_docs/2026-04-05_OpenClaw-layout-Sovereign-overlay_clawdbot-main.md)

## Extension boundary

Production code imports `openclaw/plugin-sdk/*` only; see [extensions/AGENTS.md](../AGENTS.md).
