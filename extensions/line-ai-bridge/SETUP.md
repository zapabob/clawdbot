# LINE AI Bridge - Setup Guide

## Prerequisites

### 1. LINE Messaging API Channel

1. **Create a LINE Developer Account**
   - Go to https://developers.line.me/
   - Sign in with your LINE account

2. **Create a Provider**
   - Click "Create a new provider"
   - Enter your provider name

3. **Create a Messaging API Channel**
   - Click "Create a new channel"
   - Select "Messaging API"
   - Fill in:
     - Channel name: Your bot name
     - Channel description: Description of your bot
     - Category: Select appropriate category
     - Sub-category: Select appropriate sub-category
   - Agree to LINE Terms of Use
   - Click "Create"

4. **Get Channel Credentials**
   - Go to "Messaging API settings" tab
   - Find "Channel access token"
   - Click "Issue" (or "Regenerate" if already issued)
   - **Copy the token** - You'll need this!
   - Find "Channel secret" at the top
   - **Copy the secret** - You'll need this!

### 2. Configure Webhook

1. **Get Channel ID** (optional, for debugging)
   - Found in Basic Information tab

2. **Set Up Webhook**
   - In "Messaging API settings"
   - Scroll to "Webhook settings"
   - Enable "Use webhook"
   - Click "Edit" under webhook URL

### 3. Environment Variables

Create a `.env` file or set environment variables:

```bash
# Required for sending messages
export LINE_CHANNEL_ACCESS_TOKEN="your-channel-access-token-here"

# Required for webhook verification
export LINE_CHANNEL_SECRET="your-channel-secret-here"

# Optional: Webhook server port (default: 3000)
export WEBHOOK_PORT=3000

# Optional: Server hostname for webhook URL generation
export WEBHOOK_HOST="your-domain.com"
```

### 4. Start the Webhook Server

```bash
# Navigate to the extension directory
cd extensions/line-ai-bridge

# Install dependencies
npm install

# Start the webhook server
npm run build
node dist/webhook-server.js
```

Or for development with auto-reload:

```bash
bun run src/webhook-server.ts
```

### 5. Configure LINE Webhook URL

Once the server is running:

```bash
# Get your webhook URL
openclaw line_bridge_webhook_url --host your-domain.com --port 3000
```

Output:

```
🔗 Webhook URL:
https://your-domain.com:3000/webhook/line

📋 Setup Steps:
1. Go to LINE Developers Console
2. Select your channel
3. Go to Messaging API settings
4. Enable webhook
5. Enter the URL above
6. Save
```

**For local testing**, use ngrok:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this in line_bridge_webhook_url
```

### 6. Verify Setup

```bash
# Check configuration status
openclaw line_bridge_config_status

# Send a test message (requires LINE_CHANNEL_ACCESS_TOKEN)
openclaw line_bridge_send_message --userId "U123456..." --message "Hello from LINE AI Bridge!"
```

## Troubleshooting

### "LINE_CHANNEL_ACCESS_TOKEN not configured"

```bash
# Check if token is set
echo $LINE_CHANNEL_ACCESS_TOKEN

# If empty, set it
export LINE_CHANNEL_ACCESS_TOKEN="your-token-here"
```

### Webhook not receiving messages

1. **Verify webhook URL is correct and accessible**
   - Use https://your-domain.com/webhook/line
   - Not localhost!

2. **Check firewall settings**
   - Port 3000 must be open
   - For LINE servers, port must be publicly accessible

3. **Check LINE console**
   - Webhook must be "Enabled"
   - URL must be HTTPS (for production)

4. **Test with curl**

```bash
curl -X POST https://your-domain.com:3000/health
# Should return: {"status":"ok"}
```

### Messages not sending

1. **Check Channel Access Token**
   - Token must be valid and not expired
   - Regenerate if needed in LINE Console

2. **Check user ID format**
   - LINE User IDs start with "U"
   - Example: U1234567890abcdef1234567890abcd

3. **Verify user has approved the bot**
   - User must have sent a message to the bot first
   - Or use LINE Login with LINE Messaging API

### Terminal not opening

1. **Check if bridge is running**

```bash
openclaw line_bridge_status
```

2. **Restart the bridge**

```bash
openclaw line_bridge_stop
openclaw line_bridge_start
```

3. **Check terminal emulator**
   - On macOS: Terminal.app must be installed
   - On Linux: Install gnome-terminal, konsole, or xterm
   - On Windows: cmd.exe must be available

## Security Notes

- **Never commit tokens to git!**
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate tokens periodically

## Architecture

```
LINE User
    ↓ sends message
LINE Platform
    ↓ webhook POST
Webhook Server (Express)
    ↓ processes event
Bridge Router
    ↓ routes to terminal
Terminal (Codex/Gemini/Opencode)
    ↓ executes command
Response
    ↓ LINE Push API
LINE User
```

## Files Created

```
extensions/line-ai-bridge/
├── index.ts                    # Main plugin with OpenClaw tools
├── src/
│   ├── webhook-server.ts        # Express server for LINE webhooks
│   ├── bridge/index.ts         # Bridge router
│   ├── ai-tools/index.ts       # AI tool clients (Codex, Gemini, Opencode)
│   ├── session/index.ts        # Session management
│   ├── free-tier/index.ts      # Free tier tracking
│   └── types.ts                # TypeScript types
├── package.json                # Dependencies
└── README.md                   # This file
```

## Next Steps

1. User sends `/terminal` from LINE
2. Bot scans for repositories
3. User selects repository
4. Terminal opens with Codex/Gemini/Opencode
5. User can now code from LINE!
