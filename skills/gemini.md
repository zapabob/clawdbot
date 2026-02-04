---
skillKey: google-gemini-cli
name: gemini
emoji: ✨
description: Use Google Gemini CLI with OAuth2 for AI-powered conversations
primaryEnv: GEMINI_CLIENT_ID
requires:
  bins:
    - gemini
  env:
    - GEMINI_CLIENT_ID
    - GEMINI_CLIENT_SECRET
    - GEMINI_CLI_AUTH
  config: []
install:
  - id: gemini-cli
    kind: node
    label: Install Google Gemini CLI
    os: []
    module: "@google/gemini-cli"
---
# Google Gemini CLI Skill (OAuth2)

Use Google Gemini CLI for AI-powered conversations and code generation with OAuth2.

## Authentication (OAuth2)

### Option 1: OAuth2 (Recommended)
1. Register OAuth2 app at Google Cloud Console
2. Enable Gemini API
3. Set environment variables:
   - `GEMINI_CLIENT_ID` - Google OAuth2 Client ID
   - `GEMINI_CLIENT_SECRET` - Google OAuth2 Client Secret

### Option 2: CLI Auth (Fallback)
Run `gemini` CLI once to authenticate:
```bash
npx @google/gemini-cli
```

## Usage

```
/gemini <message>
```

Send a message to Gemini and get a response.

```
/gemini code <prompt>
```

Ask Gemini to generate code.

```
/gemini explain <topic>
```

Get an explanation of a technical topic.

## LINE Examples

```
/ai gemini "Explain how OAuth2 works"
/ai gemini "Write a TypeScript interface for a User"
/ai gemini "Compare React vs Vue.js"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GEMINI_CLIENT_ID | Yes* | Google OAuth2 Client ID |
| GEMINI_CLIENT_SECRET | Yes* | Google OAuth2 Client Secret |
| GEMINI_CLI_AUTH | Yes* | Gemini CLI auth token (*use one method) |

## OAuth2 Setup (Google Cloud Console)

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Gemini API (Generative Language API)
4. Go to Credentials → Create OAuth2 Client ID
5. Set application type: Desktop application
6. Download credentials and extract Client ID/Secret
7. Set environment variables in `.env`

## Security Notes

- OAuth2 tokens are stored securely
- Refresh tokens are automatically managed
- Revoke access via Google Account settings
