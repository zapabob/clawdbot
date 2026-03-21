---
title: VRChat Relay
description: VRChat integration via OSC protocol — chatbox, avatar control, camera, and Guardian Pulse
---

# VRChat Relay

The `vrchat-relay` extension provides comprehensive VRChat integration using the OSC protocol. It enables the agent to control avatars, send chatbox messages, manage camera settings, and run autonomous presence heartbeats.

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
        "oscPort": 9000,
        "oscListenPort": 9001,
        "mirror": { "enabled": true }
      }
    }
  }
}
```

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
