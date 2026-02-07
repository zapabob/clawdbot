# 🦞 OpenClaw — Personal AI Assistant / パーソナルAIアシスタント

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text-dark.png">
        <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.png" alt="OpenClaw" width="500">
    </picture>
</p>

<p align="center">
  <strong>EXFOLIATE! EXFOLIATE!</strong>
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/openclaw/openclaw/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/openclaw/openclaw/releases"><img src="https://img.shields.io/github/v/release/openclaw/openclaw?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

## Overview / 概要

**OpenClaw** is a _personal AI assistant_ you run on your own devices.
It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and Zalo Personal. It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control. The Gateway is just the control plane — the product is the assistant.

**OpenClaw**は、自分のデバイス上で実行する*パーソナルAIアシスタント*です。すでに使っているチャンネル（WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat）で応答し、BlueBubbles、Matrix、Zalo、Zalo Personalなどの拡張チャンネルにも対応。macOS/iOS/Androidで音声の入出力や、ライブCanvasのレンダリングも可能。ゲートウェイはコントロールプレーンのみで、製品はアシスタント本身です。

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

ローカルで高速、常時稼働のパーソナルなシングルユーザーアシスタントをお求めの方は、これがそうです。

---

## Quick Links / クイックリンク

[Website](https://openclaw.ai) · [Docs](https://docs.openclaw.ai) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [Getting Started](https://docs.openclaw.ai/start/getting-started) · [Updating](https://docs.openclaw.ai/install/updating) · [Showcase](https://docs.openclaw.ai/start/showcase) · [FAQ](https://docs.openclaw.ai/start/faq) · [Wizard](https://docs.openclaw.ai/start/wizard) · [Nix](https://github.com/openclaw/nix-clawdbot) · [Docker](https://docs.openclaw.ai/install/docker) · [Discord](https://discord.gg/clawd)

---

## Installation / インストール

**Runtime: Node ≥22**

### Recommended / 推奨

```bash
npm install -g openclaw@latest
# or: pnpm add -g openclaw@latest

openclaw onboard --install-daemon
```

ウィザードを実行してゲートウェイ、ワークスペース、チャンネル、スキルをセットアップ。CLIウィザードは推奨されるパスで、**macOS、Linux、Windows（WSL2経由、強く推奨）**で動作します。

Preferred setup: run the onboarding wizard (`openclaw onboard`). It walks through gateway, workspace, channels, and skills. The CLI wizard is the recommended path and works on **macOS, Linux, and Windows (via WSL2; strongly recommended)**.

The wizard installs the Gateway daemon (launchd/systemd user service) so it stays running.

ウィザードはゲートウェイデーモン（launchd/systemdユーザーサービス）をインストールし、継続的な稼働を実現します。

---

## Subscription Providers / サブスクリプションプロバイダー

### Anthropic / Anthropic

- **[Claude Pro/Max](https://www.anthropic.com/)** - Recommended for long-context strength and better prompt-injection resistance.
- 長いコンテキスト強度とプロンプトインジェクション耐性が高く推奨。

Model note: while any model is supported, I strongly recommend **Anthropic Pro/Max (100/200) + Opus 4.6** for long‑context strength and better prompt‑injection resistance. See [Onboarding](https://docs.openclaw.ai/start/onboarding).

### OpenAI / OpenAI

- **[ChatGPT/Codex](https://openai.com/)** - Flexible model selection.
- 柔軟なモデル選択が可能。

### Google Gemini CLI / Google Gemini CLI

- **[Gemini CLI](https://github.com/google/gemini-cli)** (OAuth2) - Custom fork primary provider.
- **独自フォークのプライマリプロバイダー**としてGemini CLI（OAuth2）に対応。

Custom fork maintains **Google Gemini CLI** as the primary provider with enhanced OAuth2 support.

---

## Quick Start / クイックスタート

```bash
openclaw onboard --install-daemon

openclaw gateway --port 18789 --verbose

# Send a message / メッセージ送信
openclaw message send --to +1234567890 --message "Hello from OpenClaw"

# Talk to the assistant / アシスタントと会話
openclaw agent --message "Ship checklist" --thinking high
```

Full beginner guide: [Getting started](https://docs.openclaw.ai/start/getting-started)

包括的な初心者ガイド: [Getting started](https://docs.openclaw.ai/start/getting-started)

---

## Development Channels / 開発チャンネル

| Channel    | Description                                                |
| ---------- | ---------------------------------------------------------- |
| **stable** | Tagged releases (`vYYYY.M.D`), npm dist-tag `latest`       |
| **beta**   | Prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta`  |
| **dev**    | Moving head of `main`, npm dist-tag `dev` (when published) |

Switch channels: `openclaw update --channel stable|beta|dev`

---

## Features / 機能

### Multi-Channel Support / マルチチャンネル対応

- WhatsApp, Telegram, Slack, Discord, Google Chat
- Signal, iMessage (via BlueBubbles), Microsoft Teams
- Matrix, Zalo, Zalo Personal, WebChat

### Core Capabilities / コア機能

- **Voice / 音声**: macOS/iOS/Android with Talk Mode and Voice Wake
- **Canvas / キャンバス**: Live visual workspace with A2UI
- **Memory / メモリ**: Persistent session memory and skills
- **Automation / 自動化**: Cron jobs, webhooks, Gmail triggers

### Security / セキュリティ

- Local-first execution / ローカルファースト実行
- Docker sandbox for groups / グループのDockerサンドボックス
- Tool allowlist/denylist / ツール許可・拒否リスト

---

## Development / 開発

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw

pnpm install
pnpm ui:build
pnpm build

pnpm openclaw onboard --install-daemon
```

Prefer `pnpm` for builds from source. Bun is optional for running TypeScript directly.

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=openclaw/openclaw&type=date&legend=top-left)](https://www.star-history.com/#openclaw/openclaw&type=date&legend=top-left)

---

## License / ライセンス

MIT License - See [LICENSE](LICENSE) for details.

---

## Community / コミュニティ

- [Discord](https://discord.gg/clawd) - Join the community
- [Contributing](CONTRIBUTING.md) - How to contribute

---

OpenClaw was built for **Molty**, a space lobster AI assistant. 🦞

by Peter Steinberger and the community.
