---
name: hypura-harness
description: Operate the local Hypura Harness daemon from OpenClaw tools for VRChat OSC, VOICEVOX speech, Desktop Companion control, registry-backed vendor submodules, local Python jobs, skill generation, Shinka evolve, and LoRA workflows.
user-invocable: false
---

# Hypura Harness

Use this skill when the user asks OpenClaw to operate the local Hypura harness, VRChat actuator, VOICEVOX speech path, Desktop Companion bridge, local Python harness jobs, Shinka evolve, LoRA jobs, or sanctioned vendor submodule presets.

## First step

Call `hypura_harness_status` before using other harness tools unless the current turn already proved the daemon is healthy.

If the daemon is unavailable, tell the user the local start paths:

```powershell
.\scripts\launchers\Start-Hypura-Harness.ps1
```

```bash
cd extensions/hypura-harness/scripts && uv run harness_daemon.py
```

Default daemon URL: `http://127.0.0.1:18794`.

## Tool routing

- Use `hypura_harness_companion` for Desktop Companion control through the harness bridge.
- Use `control_companion` directly when the user only wants local avatar speech, emotion, motion, gaze, or model loading and does not need the harness bridge.
- Use `hypura_harness_speak` for VOICEVOX speech through the harness.
- Use `hypura_harness_osc` for VRChat OSC chatbox, movement, emotion, avatar parameter, and input actions.
- Use `hypura_harness_submodule` for external repository presets. Do not use raw subprocess execution for vendor repo commands.
- Use `hypura_harness_run` for local harness-managed Python generation/execution tasks.
- Use `hypura_harness_skill` only when the user asks to generate or update a skill.
- Use `hypura_harness_evolve` for Shinka-style iterative improvement tasks.
- Use `hypura_harness_lora_*` for LoRA curriculum, SFT, and GRPO jobs.

## Companion examples

```json
{ "action": "speak", "value": "Harness bridge online." }
```

```json
{ "action": "emotion", "value": "happy" }
```

```json
{ "action": "load_model", "model_path": "assets/NFD/Hakua/FBX/FBX/Hakua.fbx" }
```

## VRChat OSC examples

```json
{ "action": "chatbox", "payload": { "text": "OpenClaw online." } }
```

```json
{ "action": "emotion", "payload": { "emotion": "happy" } }
```

```json
{ "action": "jump", "payload": {} }
```

```json
{ "action": "param", "payload": { "name": "FaceEmotion", "value": 1 } }
```

## Vendor submodule examples

Use only registered repos and presets from `vendor/submodules/registry.json`.

```json
{ "repoId": "vrchat-mcp-osc", "preset": "status" }
```

```json
{ "repoId": "vrchat-mcp-osc", "preset": "test" }
```

## Safety

- Keep harness work local by default.
- Do not expose raw HTTP `exec` as a replacement for `hypura_harness_submodule` or `submodule_run`.
- Do not print secrets from `.env`, `.openclaw-desktop/.env`, or credential files.
- Confirm user asset rights before loading or activating VRM/FBX/Live2D files.
- Keep `SOUL.md` unchanged unless the user explicitly asks for a SOUL edit.
