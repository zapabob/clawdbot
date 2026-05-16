# VRChat Relay Extension (Pro Edition)

VRChat integration plugin for OpenClaw with OSC protocol support. This is the **Pro Edition** featuring advanced camera control, permission management, rate limiting, and OSCQuery discovery.

## Features

### Basic Features

- **OSC Communication**: Send and receive OSC messages to/from VRChat
- **Chatbox Control**: Send messages with typing animation and notification sounds
- **Avatar Parameters**: Control avatar parameters (bool/int/float)
- **Input Commands**: Send VRChat input commands (Jump, Move, Look, etc.)
- **OSC Listener**: Receive OSC messages from VRChat
- **Authentication**: VRChat API authentication with 2FA/TOTP support

### Pro Features

- **Camera Control**: Full control over VRChat camera (Zoom, Aperture, Focal Distance, etc.)
- **GreenScreen HSL**: Chroma key color adjustment
- **LookAtMe Composition**: Camera framing with offsets
- **Permission Profiles**: SAFE/PRO/DIRECTOR permission levels
- **Rate Limiting**: Token bucket algorithm (5 msg/5 sec for chat)
- **OSCQuery Discovery**: Automatic avatar parameter discovery
- **Audit Logging**: Full operation logging for safety

## Installation

```bash
cd extensions/vrchat-relay
npm install
```

## Configuration

Add to your OpenClaw configuration:

```json
{
  "vrchat-relay": {
    "osc": {
      "outgoingPort": 9000,
      "incomingPort": 9001,
      "host": "127.0.0.1"
    },
    "security": {
      "defaultPermissionLevel": "SAFE"
    },
    "topology": {
      "controlPlane": "relay-primary",
      "autoStartOscListener": true,
      "autoStartGuardianPulse": true
    }
  }
}
```

### Own Avatar Controller

The own-avatar controller drives the avatar you are already wearing in the
official VRChat client. It does not log in for you, read credentials, modify the
VRChat client, or load FBX files at runtime. The FBX or avatar package must be
prepared in Unity with VRChat SDK3 first; OpenClaw only sends OSC values to
parameters that VRChat exposes for the currently worn avatar.

Recommended OpenClaw config:

```json
{
  "vrchat-relay": {
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
      "allowInPublicInstances": false,
      "alwaysResetToZero": true
    },
    "safety": {
      "requireOscJsonParameterPresence": true,
      "disableChatBoxByDefault": true,
      "emergencyStopHotkey": "Ctrl+Alt+O"
    },
    "mirror": {
      "syncAiResponseToChatbox": false
    }
  }
}
```

Unity setup:

| Parameter        | Type  | Saved | Synced | Purpose                                                                              |
| ---------------- | ----- | ----- | ------ | ------------------------------------------------------------------------------------ |
| `OC_AutoEnabled` | Bool  | false | false  | OpenClaw autonomy on/off                                                             |
| `OC_State`       | Int   | false | true   | 0 idle, 1 listening, 2 thinking, 3 speaking, 4 tool, 5 reacting, 6 sleeping, 7 error |
| `OC_Emotion`     | Int   | false | true   | 0 neutral, 1 happy, 2 sad, 3 angry, 4 surprised, 5 confused, 6 relaxed               |
| `OC_Action`      | Int   | false | true   | Action id, 0 none                                                                    |
| `OC_ActionPulse` | Bool  | false | true   | Toggles to replay the same action                                                    |
| `OC_LookX`       | Float | false | false  | Local eye or head X nuance                                                           |
| `OC_LookY`       | Float | false | false  | Local eye or head Y nuance                                                           |
| `OC_Reset`       | Bool  | false | false  | Emergency neutral reset                                                              |
| `OC_ManualLock`  | Bool  | false | false  | Blocks autonomous sends while you operate manually                                   |

Animator setup:

1. Add the `OC_*` parameters to the avatar Expression Parameters asset.
2. In the FX layer, route `OC_Emotion` and `OC_State == 3` to expression or
   blendshape states. Make every state able to return to neutral.
3. In the Action or additive layer, route `OC_Action` plus `OC_ActionPulse` to
   small actions such as nod, wave, think pose, head tilt, small laugh, surprise,
   working, stretch, and reset pose.
4. Prefer upper-body or additive clips. Use Animator Tracking Control only when
   a clip must take over body parts, especially for VR or full-body tracking.
5. Use Build & Test for local iteration, then Build & Publish so VRChat writes
   the avatar OSC JSON under `AppData/LocalLow/VRChat/VRChat/OSC/...`.

Runtime flow:

1. Log into the official VRChat client yourself.
2. Wear the OpenClaw-ready avatar.
3. Enable OSC in the VRChat Action Menu.
4. Start OpenClaw and check `vrchat_own_avatar_status`.
5. Enable control with `vrchat_own_avatar_enable`.
6. Smoke test with `vrchat_own_avatar_test_command` using `happy`, `think`,
   `wave`, and `reset`.

Chatbox mirroring is opt-in when `disableChatBoxByDefault` is true. Set
`mirror.syncAiResponseToChatbox=true` only when you explicitly want assistant
responses written to the VRChat ChatBox.

### Topology Modes

- `relay-primary`: existing `vrchat-relay` remains the main OSC writer/listener.
- `mcp-primary`: external `vendor/submodules/vrchat-mcp-osc` is primary, and relay auto-start loops can be disabled to avoid duplicate writes.
- Recommended for mixed setup:
  - set `controlPlane` to `mcp-primary`
  - set both `autoStartOscListener` and `autoStartGuardianPulse` to `false`

## Permission Levels

### SAFE (Default)

- Chatbox messaging
- Avatar parameter control
- OSC listener
- Discovery

### PRO

- SAFE + Input commands
- Jump, Move, Interact controls

### DIRECTOR

- SAFE + Camera control
- Zoom, Aperture, Focus
- GreenScreen HSL
- LookAtMe offsets
- Camera capture

## Available Tools

### Authentication

- `vrchat_login` - Authenticate with VRChat
- `vrchat_logout` - Logout and clear session
- `vrchat_status` - Check status

### Permission Management

- `vrchat_permission_set` - Change permission level
- `vrchat_permission_status` - View current permissions

### Chatbox

- `vrchat_chatbox` - Send message with typing animation
- `vrchat_typing` - Set typing indicator

### Avatar

- `vrchat_set_avatar_param` - Set avatar parameter
- `vrchat_autonomy_react` - Map conversation emotion to facial params + optional follow movement
- `vrchat_discover` - Discover avatar parameters via OSCQuery
- `vrchat_send_osc` - Send raw OSC message

### Own Avatar Controller

- `vrchat_own_avatar_status` - Show readiness, current avatar id, support status, and missing `OC_*` parameters
- `vrchat_own_avatar_enable` - Enable or disable autonomous own-avatar control
- `vrchat_own_avatar_set_state` - Send a state, optional emotion, and optional action id
- `vrchat_own_avatar_test_command` - Run smoke commands such as `happy`, `think`, `wave`, and `reset`
- `vrchat_own_avatar_look` - Set clamped `OC_LookX` and `OC_LookY` values
- `vrchat_own_avatar_emergency_stop` - Stop autonomy and return the avatar to neutral parameters

### Input (PRO)

- `vrchat_input` - Send input command

### Camera (DIRECTOR)

- `vrchat_camera_set` - Set camera parameter
- `vrchat_camera_greenscreen` - Set GreenScreen HSL
- `vrchat_camera_lookatme` - Set LookAtMe composition
- `vrchat_camera_capture` - Trigger camera capture

### OSC Listener

- `vrchat_start_listener` - Start OSC listener
- `vrchat_stop_listener` - Stop OSC listener
- `vrchat_listener_status` - Get listener status

### Audit & Safety

- `vrchat_audit_logs` - View operation logs
- `vrchat_reset_rate_limits` - Reset rate limiters

## Camera Parameters

Official VRChat 2025.3.3 Open Beta ranges:

| Parameter         | Range     | Type     |
| ----------------- | --------- | -------- |
| Zoom              | 20 - 150  | FOV mm   |
| Aperture          | 1.4 - 32  | F-stop   |
| FocalDistance     | 0 - 10    | meters   |
| Exposure          | 0 - 10    | EV       |
| PhotoRate         | 0.1 - 2.0 | sec      |
| Duration          | 0.1 - 60  | sec      |
| FlySpeed          | 0.1 - 15  | speed    |
| TurnSpeed         | 0.1 - 5   | speed    |
| SmoothingStrength | 0.1 - 10  | strength |
| Hue               | 0 - 360   | degrees  |
| Saturation        | 0 - 100   | %        |
| Lightness         | 0 - 50    | %        |
| LookAtMeXOffset   | -25 - 25  | units    |
| LookAtMeYOffset   | -25 - 25  | units    |

## Usage Examples

### Send Chatbox Message with Typing

```bash
openclaw agent --message "Send 'Hello VRChat!' to chatbox with typing animation"
```

### Set Camera Zoom

```bash
openclaw agent --message "Set VRChat camera zoom to 50 (requires DIRECTOR permission)"
```

### Change Permission Level

```bash
openclaw agent --message "Switch to DIRECTOR mode for camera control"
```

### Discover Avatar Parameters

```bash
openclaw agent --message "Discover OSC parameters for current avatar"
```

## Rate Limits

- **Chatbox**: 5 messages / 5 seconds (30s jail on violation)
- **Input**: 20 commands / second
- **Camera**: 10 commands / second

## Safety Features

1. **Permission System**: Operations blocked based on permission level
2. **Rate Limiting**: Token bucket algorithm prevents spam
3. **Value Clamping**: Camera values automatically clamped to valid ranges
4. **Audit Logging**: All operations logged for debugging
5. **127.0.0.1 Only**: OSC communication restricted to localhost

## File Structure

```
extensions/vrchat-relay/
├── index.ts                      # Plugin entry point
├── package.json                  # Dependencies
├── openclaw.plugin.json          # Plugin metadata
├── README.md                     # This file
└── src/
    ├── osc/
    │   ├── types.ts              # OSC type definitions
    │   ├── codec.ts              # OSC encoder/decoder
    │   ├── client.ts             # OSC client
    │   └── camera.ts             # Camera parameter definitions
    ├── auth/
    │   ├── types.ts              # Authentication types
    │   └── index.ts              # VRChat API auth
    └── tools/
        ├── chatbox.ts            # Basic chatbox
        ├── chatbox-enhanced.ts   # Enhanced chatbox with typing
        ├── avatar.ts             # Avatar parameters
        ├── input.ts              # Input commands
        ├── listener.ts           # OSC listener
        ├── camera.ts             # Camera control
        ├── permissions.ts        # Permission management
        ├── rate-limiter.ts       # Token bucket rate limiting
        ├── discovery.ts          # OSCQuery discovery
        └── audit.ts              # Audit logging
```

## References

- [VRChat OSC Documentation](https://docs.vrchat.com/docs/osc-overview)
- [VRChat Camera OSC (2025.3.3)](https://docs.vrchat.com/docs/vrchat-202533-openbeta)
- [OSCQuery Protocol](https://github.com/vrchat-community/vrc-oscquery-lib)

## License

MIT
