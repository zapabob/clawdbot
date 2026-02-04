---
skillKey: openai-codex
name: codex
emoji: 🤖
description: Generate and edit code using OpenAI Codex API with OAuth2
primaryEnv: OPENAI_CLIENT_ID
requires:
  bins: []
  env:
    - OPENAI_CLIENT_ID
    - OPENAI_CLIENT_SECRET
    - OPENAI_API_KEY
  config: []
install:
  - id: openai-oauth2
    kind: oauth2
    provider: openai
    label: Configure OpenAI OAuth2 for Codex
    os: []
    callbackUrl: "http://localhost:3000/oauth/callback"
---
# OpenAI Codex Skill (OAuth2)

Use OpenAI Codex to generate, edit, and explain code with OAuth2 authentication.

## Authentication (OAuth2)

### Option 1: OAuth2 (Recommended)
1. Register OAuth2 app at https://platform.openai.com/settings/organization/oauth
2. Set callback URL: `http://localhost:3000/oauth/callback`
3. Set environment variables:
   - `OPENAI_CLIENT_ID` - OAuth2 Client ID
   - `OPENAI_CLIENT_SECRET` - OAuth2 Client Secret

### Option 2: API Key (Fallback)
Set `OPENAI_API_KEY` environment variable directly.

## Usage

```
/codex generate <prompt>
```

Generate code based on a natural language prompt.

```
/codex edit <file> <instructions>
```

Edit an existing file based on instructions.

```
/codex explain <code>
```

Explain what a piece of code does.

## LINE Examples

```
/ai codex "Write a Fibonacci function in Python"
/ai codex "Create a React component for a button"
/ai codex "Explain this code: function foo() { return 42; }"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| OPENAI_CLIENT_ID | Yes* | OpenAI OAuth2 Client ID |
| OPENAI_CLIENT_SECRET | Yes* | OpenAI OAuth2 Client Secret |
| OPENAI_API_KEY | Yes* | OpenAI API Key (*use one method) |

## OAuth2 Flow

1. User initiates OAuth2 flow
2. Browser opens OpenAI consent screen
3. After approval, tokens are stored securely
4. Codex uses tokens for API requests
