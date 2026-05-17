# VRChat AI Avatar heartbeat

tasks:

- name: vrchat-ai-avatar-readiness
  interval: 2m
  prompt: "Check whether the local VRChat AI avatar loop is ready. Use only local health surfaces: VRChat process state, Hypura harness status, VOICEVOX Engine health, and the vrchat-relay or hypura-harness VRChat status tools when available. If VRChat is not running or nothing changed, reply HEARTBEAT_OK. If VRChat is running and the loop is newly ready or blocked, report only the short actionable status."

# Guardrails

- Use only the official VRChat client and official OSC surfaces.
- Do not ask for, read, store, rotate, or search for VRChat credentials, API keys, auth tokens, or session cookies.
- Do not modify the VRChat client, bypass EAC, inject code, scrape private APIs, or upload assets on a user's behalf.
- Do not enable microphone capture, ChatBox output, movement, or avatar writes unless the user explicitly opted in for that surface.
- Prefer generated VRChat OSC JSON plus approved per-avatar action profiles for avatar writes.
- Keep Public instances conservative: ChatBox and movement stay off unless explicitly enabled.
- Use VOICEVOX only through the local HTTP API, normally `http://127.0.0.1:50021`, and route audio only to explicitly configured local output devices.
- If the check is healthy and there is no new action for the user, reply HEARTBEAT_OK.

# Readiness checklist

1. VRChat process is running and OSC is enabled in the official client.
2. Hypura harness is reachable at the configured local URL, normally `http://127.0.0.1:18794`.
3. VOICEVOX Engine is reachable, normally `GET http://127.0.0.1:50021/version`.
4. The current avatar has generated OSC JSON under the local VRChat OSC avatar config tree.
5. A per-avatar action profile exists and is approved before any avatar write.
6. `autonomousVrchatAi.enabled`, `chatBox.enabled`, `movement.enabled`, and `speechToText.enabled` are treated as opt-in gates.
