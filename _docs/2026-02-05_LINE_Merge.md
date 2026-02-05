# 2026-02-05 LINE Plugin Merge

## Summary

Official LINE plugin (`extensions/line`) merged with LINE AI Bridge features (`extensions/line-ai-bridge`).

## Changes

### Disabled Plugin

- `extensions/line-ai-bridge` - disabled, features merged into official plugin

### Updated Plugin

- `extensions/line` - updated to v2026.2.3 with merged features

## Merged Features

1. **Webhook Server** - Bidirectional communication endpoint
2. **Terminal Bridge** - AI tool integration (Codex, Gemini, Opencode)
3. **Session Management** - User sessions with timeout
4. **Free Tier Tracking** - Request limits per AI tool
5. **Repository Scanner** - Git repository discovery

## Usage

Official LINE plugin now includes AI Bridge capabilities. Configure via:

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `WEBHOOK_PORT` (default: 3000)

## Migration

Users of `line-ai-bridge` should migrate to official `line` plugin.
