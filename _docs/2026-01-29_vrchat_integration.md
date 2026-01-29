# VRChat Integration Implementation Log (2026-01-29)

Implemented VRChat integration for Moltbot, enabling interaction via OSC and message relaying from LINE/Discord.

## Changes

### 1. VRChat Skill (`skills/vrchat/`)

Created a new skill for Moltbot to interact with VRChat.

- [SKILL.md](file:///c:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/skills/vrchat/SKILL.md): Defines skill metadata, features, and usage examples.
- [vrc-osc.cjs](file:///c:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/skills/vrchat/scripts/vrc-osc.cjs): A Node.js helper script for sending OSC packets (UDP) to VRChat. Supports:
  - `/chatbox/input`: Sending text to the in-game chatbox.
  - `/avatar/parameters/*`: Controlling avatar parameters (bool, float).

### 2. VRChat Relay Plugin (`extensions/vrchat-relay/`)

Implemented a Moltbot extension to provide a direct relay from LINE/Discord to VRChat.

- [index.ts](file:///c:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/extensions/vrchat-relay/index.ts): Registers a `/vrc` slash command.
- [package.json](file:///c:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/extensions/vrchat-relay/package.json) & [clawdbot.plugin.json](file:///c:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/extensions/vrchat-relay/clawdbot.plugin.json): Plugin metadata.

### 3. Configuration Overrides

- [moltbot.json](file:///c:/Users/downl/.clawdbot/moltbot.json): Enabled the `vrchat-relay` plugin.

## How to Use

### From LINE/Discord (Relay)

Send a slash command to the bot:

- `/vrc [メッセージ]`: VRChatのテキストボックスにメッセージを入力します。
  - 例: `/vrc こんにちは！`

### Automated Interaction (via Agent)

Ask the bot to interact with VRChat:

- "VRChatで『こんにちは』と言って"
- "VRChatのアバターのパラメータ [name] を [value] にして"

### Monitoring Logs (PowerShell Example)

The `SKILL.md` includes examples for monitoring VRChat logs:

```powershell
Get-Content "$env:USERPROFILE\AppData\LocalLow\VRChat\VRChat\output_log_*.txt" -Wait -Tail 10 | Select-String "Joining", "Leaving"
```

## Verification

- Verified `vrc-osc.cjs` correctly sends UDP packets to `127.0.0.1:9000`.
- Verified plugin registration and slash command handling.
