---
title: VRChat Relay
summary: "VRChat integration via OSC protocol: chatbox, avatar control, camera, own-avatar control, and Guardian Pulse"
read_when:
  - Connecting OpenClaw to VRChat through OSC
  - Configuring own-avatar OC_* parameter control
  - Debugging VRChat relay tools, safety gates, or OSC ports
description: VRChat integration via OSC protocol — chatbox, avatar control, camera, and Guardian Pulse
---

# VRChat Relay

The `vrchat-relay` extension provides comprehensive VRChat integration using the OSC protocol. It enables the agent to control avatars, send chatbox messages, manage camera settings, and run autonomous presence heartbeats.

Own-avatar control uses the official VRChat OSC avatar-parameter API. It only
drives the avatar you are already wearing in the official VRChat client, and it
does not handle VRChat credentials, modify the client, or load FBX files at
runtime.

## Permission Levels

Tools are gated behind three permission levels (default: `SAFE`):

| Level      | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| `SAFE`     | Chatbox messaging, avatar params, OSC listener, friends/world info |
| `PRO`      | Input commands (Jump, Move, Look, Voice)                           |
| `DIRECTOR` | Camera control (Zoom, Aperture, GreenScreen, LookAtMe, Capture)    |

Use `vrchat_permission_set` to escalate. Always start with `vrchat_login`.

## Authentication

```
vrchat_login({ username, password, totpSecret? })
vrchat_status()
vrchat_logout()
```

## Tools Reference

### Chatbox & Presence

| Tool             | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `vrchat_chatbox` | Send message to VRChat chatbox (max 144 chars, 9 lines) |
| `vrchat_typing`  | Set typing indicator on/off                             |

### Avatar Control

| Tool                      | Description                             |
| ------------------------- | --------------------------------------- |
| `vrchat_set_avatar_param` | Set avatar parameter (bool/int/float)   |
| `vrchat_discover`         | Discover avatar parameters via OSCQuery |
| `vrchat_change_avatar`    | Change avatar via OSC                   |

### Own avatar controller

| Tool                               | Description                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| `vrchat_own_avatar_status`         | Show current avatar readiness and missing `OC_*` parameters  |
| `vrchat_own_avatar_enable`         | Enable or disable autonomous own-avatar OSC control          |
| `vrchat_own_avatar_set_state`      | Send a state, optional emotion, and optional action id       |
| `vrchat_own_avatar_test_command`   | Run smoke commands such as `happy`, `think`, `wave`, `reset` |
| `vrchat_own_avatar_look`           | Set clamped `OC_LookX` and `OC_LookY` values                 |
| `vrchat_own_avatar_emergency_stop` | Stop autonomy and return the avatar to neutral parameters    |

Prepare the avatar in Unity with VRChat SDK3 before using these tools. Add
Expression Parameters named `OC_AutoEnabled`, `OC_State`, `OC_Emotion`,
`OC_Action`, `OC_ActionPulse`, `OC_LookX`, `OC_LookY`, `OC_Reset`, and
`OC_ManualLock`, then route them in the FX, Action, or additive layers. Build
and publish the avatar so VRChat can generate its OSC JSON config under the
standard `OSC/<userId>/Avatars/<avatarId>.json` storage path.

### World & Friends

| Tool                        | Description                             |
| --------------------------- | --------------------------------------- |
| `vrchat_get_location`       | Get current user location               |
| `vrchat_get_world_info`     | Get details for a specific world        |
| `vrchat_get_online_friends` | List online friends and their locations |

### OSC & Input (PRO)

| Tool              | Description                               |
| ----------------- | ----------------------------------------- |
| `vrchat_send_osc` | Send raw OSC message                      |
| `vrchat_input`    | Send VRChat input commands (requires PRO) |

### Camera Control (DIRECTOR)

| Tool                        | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `vrchat_camera_set`         | Set camera parameters (Zoom, Aperture, Focal Distance) |
| `vrchat_camera_greenscreen` | Set GreenScreen HSL for chroma key                     |
| `vrchat_camera_lookatme`    | Set LookAtMe composition                               |
| `vrchat_camera_capture`     | Trigger camera capture                                 |

### OSC Listener

| Tool                     | Description                             |
| ------------------------ | --------------------------------------- |
| `vrchat_start_listener`  | Start OSC listener on port 9001         |
| `vrchat_stop_listener`   | Stop OSC listener                       |
| `vrchat_listener_status` | Get listener status and recent messages |

### Guardian Pulse

Autonomous heartbeat that periodically sends chatbox messages and avatar emotion changes to maintain presence in VRChat.

| Tool                           | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `vrchat_guardian_pulse_start`  | Start autonomous periodic messages and emotions |
| `vrchat_guardian_pulse_stop`   | Stop the Guardian Pulse                         |
| `vrchat_guardian_pulse_status` | Get current pulse status                        |

Guardian Pulse auto-starts when the plugin loads (5-minute interval).

### Audit & Diagnostics

| Tool                       | Description                        |
| -------------------------- | ---------------------------------- |
| `vrchat_audit_logs`        | View operation logs                |
| `vrchat_reset_rate_limits` | Reset rate limiters (testing only) |

## Rate Limits

| Action           | Limit                    |
| ---------------- | ------------------------ |
| Chatbox messages | 5 messages per 5 seconds |
| Input commands   | 20 commands per second   |
| Camera commands  | 10 commands per second   |

## Configuration

```json
"plugins": {
  "entries": {
    "vrchat-relay": {
      "enabled": true,
      "config": {
        "osc": {
          "outgoingPort": 9000,
          "incomingPort": 9001,
          "host": "127.0.0.1"
        },
        "vrchatOsc": {
          "enabled": true,
          "host": "127.0.0.1",
          "sendPort": 9000,
          "receivePort": 9001,
          "allowRemoteOsc": false,
          "autoDiscoverAvatarConfig": true
        },
        "avatarControl": {
          "requiredPrefix": "OC_",
          "autoEnabledOnStart": false
        },
        "behavior": {
          "mode": "subtle",
          "idleMinIntervalMs": 30000,
          "idleMaxIntervalMs": 90000,
          "actionCooldownMs": 15000,
          "emotionCooldownMs": 3000,
          "maxCommandsPerSecond": 6
        },
        "movement": {
          "enabled": false,
          "allowInPublicInstances": false
        },
        "safety": {
          "requireOscJsonParameterPresence": true,
          "disableChatBoxByDefault": true
        },
        "mirror": { "syncAiResponseToChatbox": false }
      }
    }
  }
}
```

With `disableChatBoxByDefault=true`, assistant replies are not mirrored into
the VRChat ChatBox unless you explicitly set
`mirror.syncAiResponseToChatbox=true`.

## Typical Workflow

```
1. vrchat_login        — authenticate
2. vrchat_status       — verify connection
3. vrchat_chatbox      — send a message
4. vrchat_set_avatar_param — control avatar expression
5. vrchat_guardian_pulse_start — enable autonomous presence
```

## Related

- [Lobster](/tools/lobster) — for shell automation workflows
- [LLM Task](/tools/llm-task) — for delegating structured subtasks
