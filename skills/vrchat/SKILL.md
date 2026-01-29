---
name: vrchat
description: Interact with VRChat via OSC (Chatbox, Avatar Parameters) and monitor VRChat logs for events like users joining/leaving.
metadata: { "moltbot": { "emoji": "👓", "requires": { "os": ["win32"] } } }
---

# VRChat Integration

Use this skill to interact with a running VRChat instance on the local machine.

## Features

- **OSC Chatbox**: Send text to the in-game chatbox.
- **Avatar Parameters**: Control avatar expressions or animations.
- **Log Monitoring**: Detect in-world events from VRChat log files.

## OSC Control

Use the bundled helper script `scripts/vrc-osc.cjs` to send messages.

### Send to Chatbox

```bash
node scripts/vrc-osc.cjs chat "Hello from Moltbot!"
```

### Update Avatar Parameter (Float 0.0 - 1.0)

```bash
node scripts/vrc-osc.cjs param "FaceVibe" 0.8
```

## Log Monitoring

VRChat logs are located in `~/AppData/LocalLow/VRChat/VRChat/`.
The latest log matches `output_log_*.txt`.

### Find Latest Log (PowerShell)

```powershell
$logDir = "$env:USERPROFILE\AppData\LocalLow\VRChat\VRChat"
$latestLog = Get-ChildItem $logDir -Filter "output_log_*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$latestLog.FullName
```

### Watch for Join/Leave Events

You can use `Get-Content -Wait` to watch for specific patterns:

- `[Behaviour] OnPlayerJoined` : A player joined the instance.
- `[Behaviour] OnPlayerLeft` : A player left the instance.
- `[Behaviour] Entering Room:` : You changed worlds.

Example Pattern to look for:
`[Behaviour] OnPlayerJoined <DisplayName> (<ID>)`

## Example Usage

1. **Auto-Greeting**: Watch the log for `OnPlayerJoined`, then use the `chat` command to say "Welcome, <DisplayName>!" in-world.
2. **Status Updates**: Post system status or new notifications from other channels (Discord/LINE) into the VRChat Chatbox.
3. **Sentiment Expression**: If the user sends a happy message in chat, set an avatar parameter like `Smile` to `1.0`.

## Requirements

- VRChat must have **OSC Enabled** in the Action Menu (Options > OSC > Enabled).
- Default OSC Input Port: 9000.
