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

## Channel readiness tools

`hypura_harness_channel_readiness` calls `GET /channels/readiness` and returns a
redacted readiness summary for LINE and Telegram. It separates credential
presence from live roundtrip readiness, counts target candidates without
printing raw routing ids, includes local channel `allowFrom` store candidates
when present, counts structured session-route metadata from prior inbound
activity, includes recent Telegram sent-message history when present, and
reports what input is still needed before a live message/reply proof can run.

Use it before declaring LINE or Telegram complete. A successful credential or
webhook probe proves setup, but a live roundtrip still requires a real LINE
`userId`/`groupId`/`roomId` or Telegram chat id from an inbound message or an
explicit operator-provided target.

## Voice I/O tools

The plugin exposes the daemon voice endpoints as OpenClaw tools so agents can
use the local microphone, WAV transcription, VOICEVOX playback, and Desktop
Companion transcript loop without guessing raw HTTP paths.
VOICEVOX speech defaults to Kasukabe Tsumugi speaker 8 unless a tool call
explicitly selects a different speaker.

| Tool                                  | Endpoint                     | Use                                                                                              |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `hypura_harness_voice_devices`        | `GET /voice/devices`         | List local input/output devices and defaults.                                                    |
| `hypura_harness_voice_test_say`       | `POST /voice/test-say`       | Synthesize a short VOICEVOX line and verify output routing.                                      |
| `hypura_harness_voice_transcribe`     | `POST /voice/transcribe`     | Transcribe an existing WAV file through whisper.cpp.                                             |
| `hypura_harness_voice_turn`           | `POST /voice/turn`           | Record a local mic turn, call OpenClaw, and speak the reply.                                     |
| `hypura_harness_companion_mic`        | `POST /voice/companion-mic`  | Enable or disable Desktop Companion mic capture after explicit permission.                       |
| `hypura_harness_companion_voice_turn` | `POST /voice/companion-turn` | Send a Companion transcript through OpenClaw and optionally speak/animate the reply.             |
| `hypura_harness_companion`            | `POST /companion/control`    | Mirror `control_companion` speech/avatar/status/mic/permission/snapshot/window-capture controls. |

Companion animation uses the same Desktop Companion bridge as `control_companion`: `animate=true` forwards the inferred emotion before speech, and VRM/FBX renderers fall back to procedural motion when a model has no matching animation clip.
Agents can use either `control_companion` or `hypura_harness_companion` for companion-local voice state (`status`, `permission`, `mic`, `input_snapshot`, and `window_capture`) when they do not need the Hypura mic-to-agent-to-VOICEVOX loop. The returned Companion `status` includes `state.avatar` fields for the latest renderer-reported action, emotion, motion, expression, and speech timestamp.
Direct companion speech calls can also pass `emotion` and `tts_provider`; the SDK bridge forwards Hypura-inferred emotions and TTS provider overrides through the same speech payload.
The SDK bridge does not grant microphone permission implicitly; use the `permission` action first, and treat `success=false` or nested `micResult.ok=false` as an actionable local-consent/device failure.

Agent-facing operating guidance lives in
[extensions/hypura-harness/skills/voice-io/SKILL.md](./skills/voice-io/SKILL.md).
Run `hypura_harness_voice_devices` before selecting device ids, and use
explicit `output_devices` when routing to both monitor speakers and a virtual
audio cable.

## VRChat existing avatar tools

The VRChat existing-avatar path controls only the avatar the user is already
wearing in the official VRChat client. OpenClaw does not log in to VRChat,
does not read VRChat credentials, does not modify the client, and does not
require custom avatar parameters. Instead, the daemon reads the OSC JSON that
VRChat generates for the published avatar and writes only through an approved
per-avatar action profile.
`OC_*` Custom Parameters are unnecessary for this mode.

Operator setup:

1. Log in with the official VRChat client.
2. Enable OSC from the VRChat Action Menu.
3. Wear the published avatar once so VRChat writes
   `OSC/<userId>/Avatars/<avatarId>.json` under the local VRChat config tree.
4. Start the Hypura harness daemon.
5. Run `hypura_harness_vrc_status`, inspect the catalog, generate a suggested
   profile, review it, and approve it only after confirming the mappings.

| Tool                                 | Endpoint                           | Use                                                                          |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------- |
| `hypura_harness_vrc_status`          | `GET /vrc/status`                  | Inspect bridge, current avatar, catalog/profile state, and emergency stop.   |
| `hypura_harness_vrc_current_avatar`  | `GET /vrc/avatar/current`          | Show the current avatar id and loaded catalog.                               |
| `hypura_harness_vrc_parameters`      | `GET /vrc/avatar/parameters`       | List readable/writable parameters from the generated OSC JSON.               |
| `hypura_harness_vrc_profile`         | `GET /vrc/avatar/profile`          | Show approved and suggested action profiles.                                 |
| `hypura_harness_vrc_suggest_profile` | `POST /vrc/avatar/profile/suggest` | Write an unapproved candidate profile under `state/vrchat/avatar-profiles`.  |
| `hypura_harness_vrc_approve_profile` | `POST /vrc/avatar/profile/approve` | Operator-only profile approval after explicit user review.                   |
| `hypura_harness_vrc_action`          | `POST /vrc/action`                 | Execute approved profile actions through cooldown and rate-limit checks.     |
| `hypura_harness_vrc_chatbox`         | `POST /vrc/chatbox`                | Send a rate-limited ChatBox message only when ChatBox is explicitly enabled. |
| `hypura_harness_vrc_emergency_stop`  | `POST /vrc/emergency-stop`         | Reset movement/typing and block further actions until safety is reset.       |

`POST /vrc/parameter` and `POST /vrc/input` exist for local developer
diagnostics but are not exposed as normal agent tools. Direct parameter writes,
ChatBox, and movement are disabled by default.

## Desktop Companion 3D tools

Companion3D is a separate local browser or Electron overlay layer for the AI
body. It can load local VRM, GLB, GLTF, or FBX assets from
`state/companion3d/assets`; it does not inject those assets into VRChat and it
does not load remote model URLs.

| Tool                                    | Endpoint                       | Use                                                                    |
| --------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `hypura_harness_companion3d_status`     | `GET /companion3d/status`      | Inspect event state and the configured local companion policy.         |
| `hypura_harness_companion3d_load_model` | `POST /companion3d/load-model` | Load a user-approved local model under the configured asset root.      |
| `hypura_harness_companion3d_event`      | `POST /companion3d/event`      | Send state, emotion, speech, gesture, look, idle, or load-model event. |
| `hypura_harness_companion3d_set_state`  | `POST /companion3d/state`      | Record companion state when VRChat profile actions are unavailable.    |

When a VRChat profile is missing or unapproved, agents should keep VRChat idle
and use Companion3D for expression, speech, and gesture feedback.

## Docker

`docker-compose.override.yml` defines a `hypura-harness` service (image build context: this directory). Adjust compose env if you change ports.

## Operator docs

- Workspace skill: [skills/hypura-harness/SKILL.md](../../skills/hypura-harness/SKILL.md)
- Plugin skills: [extensions/hypura-harness/skills](./skills) are registered through `openclaw.plugin.json` so enabled installations expose the harness operating guides like other bundled plugins.
- Voice I/O skill: [extensions/hypura-harness/skills/voice-io/SKILL.md](./skills/voice-io/SKILL.md)
- VRChat existing avatar skill: [extensions/hypura-harness/skills/vrchat-existing-avatar/SKILL.md](./skills/vrchat-existing-avatar/SKILL.md)
- Desktop Companion 3D skill: [extensions/hypura-harness/skills/desktop-companion-3d/SKILL.md](./skills/desktop-companion-3d/SKILL.md)
- LoRA pipeline: [extensions/hypura-harness/scripts/LORA_PIPELINE.md](./scripts/LORA_PIPELINE.md)
- Layout vs `scripts/hypura/`: [\_docs/2026-04-05_OpenClaw-layout-Sovereign-overlay_clawdbot-main.md](../../_docs/2026-04-05_OpenClaw-layout-Sovereign-overlay_clawdbot-main.md)

## Extension boundary

Production code imports `openclaw/plugin-sdk/*` only; see [extensions/AGENTS.md](../AGENTS.md).
