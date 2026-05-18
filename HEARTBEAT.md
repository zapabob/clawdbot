# OpenClaw heartbeat SITREP

tasks:

- name: openclaw-telegram-sitrep
  interval: 30m
  prompt: "Prepare a concise Japanese SITREP for Telegram. Check only available local/runtime status surfaces. Cover OpenClaw gateway health, Telegram/LINE channel health, blocked work, and anything that needs the user. If everything is healthy and there is no useful change, reply HEARTBEAT_OK."

- name: vrchat-ai-avatar-readiness
  interval: 30m
  prompt: "Check whether the local VRChat AI avatar loop is ready. Use only local health surfaces: VRChat process state, Hypura harness status, VOICEVOX Engine health, and the vrchat-relay or hypura-harness VRChat status tools when available. If VRChat is not running or nothing changed, reply HEARTBEAT_OK. If VRChat is running and the loop is newly ready or blocked, report only the short actionable status."

- name: schedule-and-business-review
  interval: 2h
  prompt: "Review available local OpenClaw memory, commitments, task, calendar, or business-follow-up surfaces if configured. Do not invent schedule or business facts. If there is an upcoming appointment, missed follow-up, revenue/business risk, or decision that needs the user, include it in the Telegram SITREP. If nothing is available or nothing needs action, reply HEARTBEAT_OK."

# SITREP format

- Write alerts in Japanese and keep them short enough for Telegram.
- Use the sections `Status`, `VRChat`, `Schedule/Business`, and `Next action` when a visible SITREP is useful.
- Use `heartbeat_respond` with `notify: false` when there is no user-visible change.
- Use `heartbeat_respond` with `notify: true` and a concise `notificationText` when the user should see a Telegram status update.
- Never include secrets, tokens, raw config, private chat logs, or credentials.

# Guardrails

- Use only the official VRChat client and official OSC surfaces.
- Do not ask for, read, store, rotate, or search for VRChat credentials, API keys, auth tokens, or session cookies.
- Do not modify the VRChat client, bypass EAC, inject code, scrape private APIs, or upload assets on a user's behalf.
- Do not enable microphone capture, ChatBox output, movement, or avatar writes unless the user explicitly opted in for that surface.
- A local operator may explicitly opt in to Desktop Companion animation from heartbeat: expressions, gaze, gestures, idle motions, and short local speech.
- That opt-in does not grant microphone capture, browser monitoring, credential access, VRChat ChatBox, VRChat movement, or unapproved VRChat avatar parameter writes.
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
