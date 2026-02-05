# LINE Bot Power-On Auto-Start Setup

LINEボットを電源投入時に自動起動する設定

## Files

| File                                      | Description                |
| ----------------------------------------- | -------------------------- |
| `scripts/openclaw-line-poweron-start.ps1` | Power-On Auto-Start script |
| `scripts/install-auto-start.ps1`          | Auto-start installer       |
| `openclaw-line-startup.bat`               | Batch wrapper for startup  |

## Installation

### Method 1: Run Installer

```powershell
cd C:\path\to\clawdbot
.\scripts\install-auto-start.ps1
```

### Method 2: Manual Startup Shortcut

1. Copy `openclaw-line-startup.bat` to:
   ```
   C:\Users\<USERNAME>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
   ```

### Method 3: Manual PowerShell Script

```powershell
cd C:\path\to\clawdbot
.\scripts\openclaw-line-poweron-start.ps1
```

## What It Does

1. **Starts ngrok** - HTTPS tunnel for webhook
2. **Starts Webhook Server** - LINE message receiver
3. **Starts OpenClaw Gateway** - AI processing
4. **Gets Webhook URL** - Displays LINE Developers setup

## Requirements

- Windows 10/11
- PowerShell 5.1+
- ngrok (auto-installed if missing)
- LINE Messaging API credentials:
  - `LINE_CHANNEL_ACCESS_TOKEN`
  - `LINE_CHANNEL_SECRET`

## Environment Variables

Set in System Properties or `.env` file:

```env
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret
```

## Log Files

- `%USERPROFILE%\.openclaw\logs\openclaw-poweron-YYYYMMDD.log`
- `%USERPROFILE%\.openclaw\logs\openclaw-line-auto.log`

## Troubleshooting

### ngrok not starting

```powershell
winget install ngrok.ngrok
```

### Port already in use

Change port in script:

```powershell
$Config.GatewayPort = 3001
```

### Services not running

Check logs in `%USERPROFILE%\.openclaw\logs\`
