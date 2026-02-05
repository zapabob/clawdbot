# Environment Configuration Guide

## Overview

OpenClaw uses a `.env` file to manage all environment variables. This file is **not committed to version control** (see `.gitignore`).

## Quick Start

1. Copy the template:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:

   ```bash
   nano .env
   # or
   code .env
   ```

3. Load environment variables (optional, for development):

   ```bash
   # PowerShell
   . .\scripts\load-env.ps1

   # Bash
   source scripts/load-env.sh
   ```

## Variable Categories

### Required

| Variable                    | Description                     |
| --------------------------- | ------------------------------- |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API access token |
| `LINE_CHANNEL_SECRET`       | LINE Messaging API secret       |

### AI Tools

| Variable           | Description              |
| ------------------ | ------------------------ |
| `OPENAI_API_KEY`   | OpenAI API key for Codex |
| `GEMINI_API_KEY`   | Google Gemini API key    |
| `OPENCODE_API_KEY` | Opencode API key         |

### Messaging Platforms

| Variable             | Description                   |
| -------------------- | ----------------------------- |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (WhatsApp) |
| `TWILIO_AUTH_TOKEN`  | Twilio Auth Token             |
| `DISCORD_BOT_TOKEN`  | Discord Bot Token             |
| `SLACK_BOT_TOKEN`    | Slack Bot Token               |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token            |

### VRChat

| Variable            | Description         |
| ------------------- | ------------------- |
| `VRCHAT_USERNAME`   | VRChat username     |
| `VRCHAT_PASSWORD`   | VRChat password     |
| `VRCHAT_2FA_SECRET` | TOTP secret for 2FA |

### Network

| Variable                | Description                  |
| ----------------------- | ---------------------------- |
| `CLAWDBOT_GATEWAY_PORT` | Gateway port (default: 3000) |
| `NGROK_AUTH_TOKEN`      | ngrok authentication token   |
| `TAILSCALE_FUNNEL_PORT` | Tailscale funnel port        |

### Auto-Agent

| Variable                       | Description                          |
| ------------------------------ | ------------------------------------ |
| `ENABLE_AUTO_IMPROVE`          | Enable auto-improvement (true/false) |
| `ENABLE_AUTO_REPAIR`           | Enable auto-repair (true/false)      |
| `ENABLE_GIT_AUTO_COMMIT`       | Enable auto-commit (true/false)      |
| `AUTO_AGENT_CHECK_INTERVAL_MS` | Check interval in milliseconds       |

## Loading Environment Variables

### PowerShell

```powershell
# Load all variables from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#]+?)\s*=\s*(.*)\s*$') {
        $env:$matches[1] = $matches[2]
    }
}
```

### Bash

```bash
# Load all variables from .env
set -a
source .env
set +a
```

### Node.js

```javascript
import dotenv from "dotenv";
dotenv.config();
```

## Security Notes

- **Never commit `.env`** to version control
- Use strong random values for secrets
- Rotate API keys regularly
- Use different credentials for development/production

## Example .env

```env
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here

OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

CLAWDBOT_GATEWAY_PORT=3000
LOG_LEVEL=info

ENABLE_AUTO_IMPROVE=true
ENABLE_AUTO_REPAIR=true
```

## Troubleshooting

### Variables not loaded

- Ensure `.env` is in the project root
- Check for syntax errors in `.env`
- Restart your terminal after changes

### Permission denied

- Check file permissions: `chmod 600 .env`
