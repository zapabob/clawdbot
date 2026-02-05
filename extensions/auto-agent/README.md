# Auto Agent Plugin

Autonomous self-improving, self-repairing agent with Codex/GeminiCLI/Opencode integration.

## Features

### Self-Improvement

- Analyzes code for performance, readability, security, and maintainability issues
- Generates improvement suggestions using AI tools
- Automatically applies fixes for critical issues

### Self-Repair

- Detects code errors and warnings
- Uses Codex/GeminiCLI/Opencode to generate fixes
- Automatically repairs critical issues (severity >= 8)

### Git Automation

- Monitors file changes
- Auto-commits and pushes changes
- Creates meaningful commit messages
- Pulls latest changes before committing

## Installation

```bash
cd extensions/auto-agent
npm install
npm run build
```

## Usage

### Start the Agent

```typescript
// Via plugin tool
await tools.auto_agent_start({
  checkIntervalMs: 60000, // Check every 60 seconds
  autoImprove: true, // Enable auto-improvement
  autoRepair: true, // Enable auto-repair
  autoGitCommit: true, // Enable auto-commit
});
```

### Available Tools

| Tool                    | Description                |
| ----------------------- | -------------------------- |
| `auto_agent_start`      | Start the autonomous agent |
| `auto_agent_stop`       | Stop the agent             |
| `auto_agent_status`     | Check current status       |
| `auto_agent_check`      | Trigger manual check       |
| `auto_agent_analyze`    | Analyze specific file      |
| `auto_agent_improve`    | Generate improvements      |
| `auto_agent_git_status` | Git status & auto-commit   |
| `auto_agent_git_log`    | View commit history        |

## Configuration

```json
{
  "enabled": true,
  "aiTools": ["codex", "gemini", "opencode"],
  "autoImprove": true,
  "autoRepair": true,
  "autoGitCommit": true,
  "checkIntervalMs": 60000,
  "maxChangesPerCommit": 10
}
```

## AI Tools Integration

### Codex

```bash
npm install -g @github/codex-cli
```

### Gemini CLI

```bash
npm install -g @google/gemini-cli
```

### Opencode

See: https://opencode.ai

## Architecture

```
auto-agent/
├── src/
│   ├── agent.ts          # Main agent loop
│   ├── ai-tools.ts       # AI tool clients
│   ├── git-manager.ts    # Git operations
│   └── types.ts          # Type definitions
├── index.ts              # Plugin entry
├── openclaw.plugin.json  # Plugin config
└── tsconfig.json
```

## Session Tracking

The agent tracks:

- Improvements made
- Repairs applied
- Commits created
- Start time

## License

MIT
