# LINE AI Bridge (Terminal Mode)

Bidirectional communication between LINE and AI development tools (Codex CLI, Gemini CLI, Opencode) with **terminal integration**.

## Features

- **Terminal Integration**: Opens actual terminal windows on your PC
- **Repository Selection**: Automatically scans and lets you choose which repository to work with
- **Multi-Tool Support**: Switch between Codex, Gemini, and Opencode seamlessly
- **Interactive Sessions**: Execute commands directly in the terminal from LINE
- **Repository Management**: Auto-discovers git repositories on your PC

## How It Works

```
LINE User
    ↓ sends "/terminal"
Bridge
    ↓ scans PC
Lists Repositories
    ↓ user selects
Opens Terminal
    ↓ with AI tool ready
User can execute commands!
```

## Installation

```bash
cd extensions/line-ai-bridge
npm install --omit=dev
```

## Required AI CLIs

### Codex CLI (GitHub)

```bash
npm install -g @github/codex-cli
export OPENAI_API_KEY="your-key"
```

### Gemini CLI (Google)

```bash
npm install -g @google/gemini-cli
export GEMINI_API_KEY="your-key"
```

### Opencode

```bash
# Follow Opencode installation guide
# Ensure 'opencode' command is available in PATH
```

## Configuration

```json
{
  "extensions": {
    "line-ai-bridge": {
      "enabled": true,
      "defaultTool": "codex",
      "sessionTimeoutMinutes": 30,
      "maxMessageLength": 5000
    }
  }
}
```

## Usage

### 1. Start the Bridge

```bash
openclaw line_bridge_start --default-tool codex
```

### 2. From LINE, Send Commands

**Getting Started:**

- `/terminal` or `/start` - Begin repository selection
- `/repos` - List all available repositories
- `/status` - Check your current session
- `/reset` - Reset and start over
- `/help` - Show help

**After Selecting Repository:**

- `/codex` or `/gpt` - Switch to Codex
- `/gemini` or `/google` - Switch to Gemini
- `/opencode` or `/code` - Switch to Opencode

**Any Other Message:**

- Sent as a command to the terminal!

### Example Workflow

1. **User sends from LINE:**

   ```
   /terminal
   ```

2. **Bot responds:**

   ```
   🔍 Scanning for repositories...

   📁 Found 5 repositories:

   1. my-project
      📁 /home/user/Projects/my-project

   2. openclaw
      📁 /home/user/github/openclaw

   ...

   Reply with the number (1-5) to select a repository:
   ```

3. **User replies:**

   ```
   2
   ```

4. **Bot responds:**

   ```
   ✅ Selected: openclaw
   📁 /home/user/github/openclaw

   🔧 Opening terminal with codex...

   💻 Terminal opened!

   You can now:
   • Send any message to run as a command
   • Use /codex, /gemini, or /opencode to switch tools
   • Use /reset to start over
   ```

5. **A terminal window opens** on your PC with Codex ready!

6. **User sends from LINE:**

   ```
   What files are in the current directory?
   ```

7. **Command executes in terminal** and result sent back to LINE

## CLI Tools

- `line_bridge_start` - Start the bridge
- `line_bridge_stop` - Stop the bridge
- `line_bridge_status` - Check status
- `line_bridge_repos` - List repositories on PC
- `line_bridge_test_connection` - Test CLI installations
- `line_bridge_send` - Send test message
- `line_bridge_user_state` - Check user session state

## Repository Detection

The extension automatically scans for git repositories in:

- Home directory (`~`)
- `~/Documents`
- `~/Projects`
- `~/workspace`
- `~/dev`
- `~/code`
- `~/github`
- `~/gitlab`
- Current working directory

## Terminal Behavior

### Windows

- Opens Command Prompt or uses `start` command
- Repository path is automatically set
- Ready for commands

### macOS

- Opens Terminal.app
- Changes to repository directory
- Shows ready message

### Linux

- Tries: GNOME Terminal, Konsole, xterm
- Falls back to current terminal
- Changes to repository directory

## Security Notes

- Only responds to configured LINE users
- Terminal commands execute with your user permissions
- API keys should be set via environment variables
- Session timeout after 30 minutes of inactivity

## Troubleshooting

### "No repositories found"

- Make sure you have git repositories (`git init` or cloned)
- Check that repositories are in standard locations
- Use `/repos` to see what was detected

### "Terminal not opening"

- On Windows: Make sure `cmd.exe` is available
- On macOS: Check Terminal.app permissions
- On Linux: Install a terminal emulator (gnome-terminal, konsole, or xterm)

### "Command not found" for AI tools

- Install the CLI tools globally: `npm install -g ...`
- Check they're in PATH: `codex --version`
- Set API keys as environment variables

### "Permission denied"

- On macOS: Grant Terminal automation permissions
- Check file permissions in repository

## Architecture

```
LINE Message
    ↓
LINE Webhook
    ↓
Bridge Router
    ↓
Repository Scanner
    ↓
User Selects Repo
    ↓
Terminal Spawner
    ↓
New Terminal Window
    ↓
Command Execution
    ↓
Output to LINE
```

## License

MIT
