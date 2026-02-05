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
    }
  }
}
```

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
- `vrchat_discover` - Discover avatar parameters via OSCQuery
- `vrchat_send_osc` - Send raw OSC message

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

## Usage Examples / 使い方例

### Send Chatbox Message with Typing / チャットボックスにタイピング付きでメッセージ送信

```bash
openclaw agent --message "Send 'Hello VRChat!' to chatbox with typing animation"
```

### Set Camera Zoom / カメラズーム設定

```bash
openclaw agent --message "Set VRChat camera zoom to 50 (requires DIRECTOR permission)"
```

### Change Permission Level / 権限レベル変更

```bash
openclaw agent --message "Switch to DIRECTOR mode for camera control"
```

### Discover Avatar Parameters / アバターパラメータ探索

```bash
openclaw agent --message "Discover OSC parameters for current avatar"
```

## Usage Guide / 使い方ガイド

### 1. Login / ログイン

**English:**
Authenticate with your VRChat credentials. Supports 2FA/TOTP.

**日本語:**
VRChatアカウントで認証します。2要素認証（TOTP）にも対応。

```bash
openclaw agent --message "VRChatにログイン username password"
```

### 2. Send Chat Message / チャットメッセージ送信

**English:**
Send a message to the VRChat chatbox with typing animation. Max 144 characters, 9 lines.

**日本語:**
VRChatのチャットボックスにタイピングアニメーション付きでメッセージを送信。最大144文字、9行。

```bash
openclaw agent --message "Send 'Hello everyone!' to chatbox"
```

### 3. Control Camera / カメラ制御

**English:**
Control VRChat camera parameters (requires DIRECTOR permission). Available: Zoom, Aperture, FocalDistance, etc.

**日本語:**
VRChatカメラを制御（DIRECTOR権限が必要）。利用可能なパラメータ：Zoom、Aperture、FocalDistanceなど。

```bash
# Set zoom to 50
openclaw agent --message "Set camera zoom to 50"

# Set aperture to f/2.8
openclaw agent --message "Set camera aperture to 2.8"

# Enable green screen with custom HSL
openclaw agent --message "Set camera greenscreen hue to 120 saturation to 80"
```

### 4. Avatar Parameters / アバターパラメータ制御

**English:**
Discover and control avatar parameters via OSC. Supports bool, int, and float types.

**日本語:**
OSC経由でアバターパラメータを探索・制御。bool、int、float型に対応。

```bash
# Discover available parameters
openclaw agent --message "Discover OSC parameters for current avatar"

# Set a parameter
openclaw agent --message "Set avatar parameter ' parameter_name ' to 1.0"
```

### 5. Input Commands / 入力コマンド

**English:**
Send input commands like Jump, Move, Interact (requires PRO permission).

**日本語:**
Jump、Move、Interactなどの入力コマンドを送信（PRO権限が必要）。

```bash
# Jump
openclaw agent --message "Send VRChat input command Jump"

# Move forward
openclaw agent --message "Send VRChat input command MoveForward 1.0"

# Interact
openclaw agent --message "Send VRChat input command Interact"
```

### 6. OSC Listener / OSCリスナー

**English:**
Start listening for OSC messages from VRChat. Useful for triggers and automation.

**日本語:**
VRChatからのOSCメッセージ受信を開始。トリガーや自動化に便利。

```bash
# Start listener
openclaw agent --message "Start VRChat OSC listener"

# Check status
openclaw agent --message "Get VRChat listener status"

# Stop listener
openclaw agent --message "Stop VRChat OSC listener"
```

### 7. Permission Management / 権限管理

**English:**
Switch between permission levels: SAFE (default), PRO, or DIRECTOR.

**日本語:**
権限レベルを切り替え：SAFE（デフォルト）、PRO、DIRECTOR。

```bash
# Check current permission
openclaw agent --message "Show VRChat permission status"

# Set permission level
openclaw agent --message "Set VRChat permission to PRO"
openclaw agent --message "Set VRChat permission to DIRECTOR"
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
