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
<a href="https://developers.line.biz/console/"><img src="https://img.shields.io/badge/LINE%20Integration-06C755?style=for-the-badge&logo=line&logoColor=white" alt="LINE Integration"></a>
</p>

---

## 🌟 Overview / 概要

**OpenClaw** is a _personal AI assistant_ you run on your own devices. It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat, **LINE**), plus extension channels like BlueBubbles, Matrix, Zalo, and Zalo Personal. It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control. The Gateway is just the control plane — the product is the assistant.

**OpenClaw**は、自分のデバイス上で実行できる*パーソナルAIアシスタント*です。すでに使用しているチャンネル（WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、Microsoft Teams、WebChat、**LINE**）や、BlueBubbles、Matrix、Zalo、Zalo Personalなどの拡張チャンネルで応答します。macOS/iOS/Androidで音声の入出力が可能で、制御可能なライブCanvasをレンダリングできます。Gatewayはコントロールプレーンであり、製品自体がアシスタントです。

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

ローカルで高速、常時稼働のパーソナルシングルユーザーアシスタントをお求めの方に最適です。

[Website](https://openclaw.ai) · [Docs](https://docs.openclaw.ai) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [Getting Started](https://docs.openclaw.ai/start/getting-started) · [Updating](https://docs.openclaw.ai/install/updating) · [Showcase](https://docs.openclaw.ai/start/showcase) · [FAQ](https://docs.openclaw.ai/start/faq) · [Wizard](https://docs.openclaw.ai/start/wizard) · [Nix](https://github.com/openclaw/nix-clawdbot) · [Docker](https://docs.openclaw.ai/install/docker) · [Discord](https://discord.gg/clawd)

---

## 🚀 Latest Features 2025 / 最新機能（2025年）

| Feature / 機能                    | Description / 説明                                                                                                         | Status / ステータス |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 🟢 **LINE Integration**           | Full LINE Messaging API support with automated ngrok webhook setup / ngrok自動設定スクリプト付きLINE Messaging API完全対応 | ✅ Production Ready |
| 🎙️ **Voice Wake / Talk Mode**     | Always-on speech recognition & conversation mode for macOS/iOS/Android / macOS/iOS/Android向け常時音声認識＆会話モード     | ✅ Available        |
| 🎨 **Live Canvas with A2UI**      | Agent-driven visual workspace with A2UI integration / A2UI統合によるエージェント駆動型ビジュアルワークスペース             | ✅ Available        |
| 🤖 **Codex/OpenCode Integration** | Bidirectional communication with AI coding assistants via LINE / LINE経由でのAIコーディングアシスタントとの双方向通信      | ✅ Available        |
| 📱 **Mobile Nodes**               | iOS/Android companion apps for camera, screen recording, and more / カメラ、画面録画などのiOS/Androidコンパニオンアプリ    | ✅ Available        |
| 🌐 **WebSocket Control Plane**    | Real-time WebSocket gateway for all device communication / すべてのデバイス通信向けリアルタイムWebSocketゲートウェイ       | ✅ Core Feature     |
| 📨 **Multi-Channel Support**      | 14+ messaging channels supported / 14以上のメッセージングチャンネル対応                                                    | ✅ Production Ready |

---

## ✨ Unique Features / 独自機能

### 🟢 LINE Integration (Auto-Setup) / LINE統合（自動設定）

**The only AI assistant with fully automated LINE webhook configuration!**

**完全自動化されたLINE webhook設定機能を持つ唯一のAIアシスタント！**

OpenClaw includes **automated PowerShell and batch scripts** that:

- Automatically start ngrok tunnels
- Fetch the public HTTPS URL
- Configure LINE webhook endpoints
- Copy URLs to clipboard for one-click setup

OpenClawには**自動化されたPowerShellおよびバッチスクリプト**が含まれています：

- ngrokトンネルの自動開始
- パブリックHTTPS URLの取得
- LINE webhookエンドポイントの設定
- クリップボードへのURLコピーでワンクリック設定

```powershell
# PowerShell: One-command LINE setup / ワンコマンドLINE設定
.\scripts\line-ngrok-auto.ps1
```

```batch
:: Batch: Alternative for Windows CMD / Windows CMD用代替方法
scripts\line-ngrok-auto.bat
```

### 🤖 Codex + OpenCode via LINE / LINE経由のCodex＋OpenCode

Communicate bidirectionally with your AI coding assistants:

- Send code review requests from LINE
- Receive Codex responses directly in LINE chat
- Manage OpenCode sessions remotely

AIコーディングアシスタントと双方向に通信：

- LINEからコードレビューリクエストを送信
- Codexの応答をLINEチャットで直接受信
- OpenCodeセッションをリモート管理

---

## 📦 Installation / インストール

### Requirements / 要件

- **Runtime: Node ≥22**
- **LINE Setup: ngrok account (free)**

### Quick Install / クイックインストール

```bash
# Install OpenClaw globally / OpenClawをグローバルにインストール
npm install -g openclaw@latest
# or: pnpm add -g openclaw@latest

# Run onboarding wizard / オンボーディングウィザードを実行
openclaw onboard --install-daemon
```

### From Source / ソースから

```bash
# Clone repository / リポジトリをクローン
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Install dependencies / 依存関係をインストール
pnpm install
pnpm ui:build
pnpm build

# Start onboarding / オンボーディングを開始
pnpm openclaw onboard --install-daemon
```

---

## ⚡ Quick Start / クイックスタート

```bash
# Start the gateway / ゲートウェイを開始
openclaw gateway --port 18789 --verbose

# Send a test message / テストメッセージを送信
openclaw message send --to +1234567890 --message "Hello from OpenClaw!"

# Talk to the assistant / アシスタントと会話
openclaw agent --message "Ship checklist" --thinking high

# Check status / ステータスを確認
openclaw channels status --all
```

---

## 🟢 LINE Integration Setup / LINE統合設定

OpenClaw provides the **most streamlined LINE integration experience** with automated webhook configuration scripts. No manual ngrok URL copying needed!

OpenClawは**最も簡略化されたLINE統合体験**を提供し、自動webhook設定スクリプトで手動のngrok URLコピーが不要になりました！

---

### 📋 Prerequisites / 前提条件

Before starting, ensure you have:

開始する前に、以下を確認してください：

1. **LINE Developers Account** / LINE Developersアカウント
   - Sign up at [https://developers.line.biz/console/](https://developers.line.biz/console/)
   - [https://developers.line.biz/console/](https://developers.line.biz/console/)で登録

2. **ngrok Account (Free)** / ngrokアカウント（無料）
   - Register at [https://ngrok.com/](https://ngrok.com/)
   - Install ngrok and authenticate with your token / ngrokをインストールし、トークンで認証
   - [https://ngrok.com/](https://ngrok.com/)で登録

3. **LINE Channel Created** / LINEチャンネルの作成
   - Create a **Messaging API** channel in LINE Developers Console / LINE Developers Consoleで**Messaging API**チャンネルを作成
   - Note your **Channel ID**, **Channel Secret**, and **Channel Access Token** / **チャンネルID**、**チャンネルシークレット**、**チャンネルアクセストークン**をメモ

---

### 🚀 Automated Setup Scripts / 自動設定スクリプト

OpenClaw includes **three automated setup scripts** to eliminate manual configuration:

OpenClawには**3つの自動設定スクリプト**が含まれ、手動設定を不要にします：

#### Option 1: PowerShell Script (Recommended) / PowerShellスクリプト（推奨）

**File:** `scripts/line-ngrok-auto.ps1`

**Features / 機能：**

- Automatically starts ngrok if not running / ngrokが起動していない場合は自動開始
- Fetches public HTTPS URL from ngrok API / ngrok APIからパブリックHTTPS URLを取得
- Builds complete webhook URL (`https://xxx.ngrok-free.app/line/webhook`) / 完全なwebhook URLを構築
- Copies URL to clipboard automatically / URLを自動的にクリップボードにコピー
- Color-coded output for easy reading / 読みやすい色分け出力

```powershell
# Run from project root / プロジェクトルートから実行
.\scripts\line-ngrok-auto.ps1

# The script will output:
# [SUCCESS] LINE Webhook Auto-Setup Complete!
# [READY] Webhook URL: https://xxxx.ngrok-free.app/line/webhook
# [INFO] Webhook URL copied to clipboard! (Ctrl+V to paste)
```

#### Option 2: Batch Script / バッチスクリプト

**File:** `scripts/line-ngrok-auto.bat`

**Features / 機能：**

- UTF-8 encoded for Japanese character support / 日本語文字サポートのためUTF-8エンコード
- Works on Windows CMD without PowerShell / PowerShell不要でWindows CMDで動作
- 6-step guided process with clear progress / 明確な進捗表示の6ステップガイド付き
- Automatic clipboard copy / 自動クリップボードコピー

```batch
:: Run from project root / プロジェクトルートから実行
scripts\line-ngrok-auto.bat

:: Follow the on-screen instructions
:: 画面の指示に従ってください
```

#### Option 3: Guided Setup (Interactive) / ガイド付き設定（対話型）

**File:** `scripts/line-ngrok-setup.bat`

**Features / 機能：**

- Simplified setup for first-time users / 初回ユーザー向け簡略化設定
- Shows ngrok dashboard link / ngrokダッシュボードリンクを表示
- Provides manual webhook URL construction / 手動webhook URL構築方法を提供

```batch
:: Run for interactive guidance / 対話型ガイダンスで実行
scripts\line-ngrok-setup.bat
```

---

### 🔧 Manual Configuration Steps / 手動設定手順

If you prefer manual setup or need to troubleshoot:

手動設定が必要な場合やトラブルシューティングが必要な場合：

#### Step 1: Configure Environment Variables / 環境変数の設定

Create or edit your `.env` file in the project root:

プロジェクトルートに`.env`ファイルを作成または編集：

```bash
# LINE Bot Configuration / LINEボット設定
LINE_CHANNEL_ID=your_channel_id_here
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_ACCESS_TOKEN=your_channel_access_token_here

# OpenClaw Gateway Port (default: 18789) / OpenClawゲートウェイポート（デフォルト: 18789）
PORT=18789

# Optional: ngrok Auth Token / オプション: ngrok認証トークン
NGROK_AUTH_TOKEN=your_ngrok_token_here
```

#### Step 2: Configure OpenClaw / OpenClawの設定

Add LINE channel to your OpenClaw configuration:

OpenClaw設定にLINEチャンネルを追加：

````json5
// ~/.openclaw/openclaw.json
{
  channels: {
    line: {
      enabled: true,
      channelId: "YOUR_CHANNEL_ID",        // LINEチャンネルID
      channelSecret: "YOUR_CHANNEL_SECRET", // LINEチャンネルシークレット
      accessToken: "YOUR_ACCESS_TOKEN",     // LINEアクセストークン

</p>

**OpenClaw** is a _personal AI assistant_ you run on your own devices.
It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and Zalo Personal. It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control. The Gateway is just the control plane — the product is the assistant.

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

[Website](https://openclaw.ai) · [Docs](https://docs.openclaw.ai) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [Getting Started](https://docs.openclaw.ai/start/getting-started) · [Updating](https://docs.openclaw.ai/install/updating) · [Showcase](https://docs.openclaw.ai/start/showcase) · [FAQ](https://docs.openclaw.ai/start/faq) · [Wizard](https://docs.openclaw.ai/start/wizard) · [Nix](https://github.com/openclaw/nix-clawdbot) · [Docker](https://docs.openclaw.ai/install/docker) · [Discord](https://discord.gg/clawd)

Preferred setup: run the onboarding wizard (`openclaw onboard`). It walks through gateway, workspace, channels, and skills. The CLI wizard is the recommended path and works on **macOS, Linux, and Windows (via WSL2; strongly recommended)**.
Works with npm, pnpm, or bun.
New install? Start here: [Getting started](https://docs.openclaw.ai/start/getting-started)

**Subscriptions (OAuth):**

- **[Anthropic](https://www.anthropic.com/)** (Claude Pro/Max)
- **[OpenAI](https://openai.com/)** (ChatGPT/Codex)

Model note: while any model is supported, I strongly recommend **Anthropic Pro/Max (100/200) + Opus 4.5** for long‑context strength and better prompt‑injection resistance. See [Onboarding](https://docs.openclaw.ai/start/onboarding).

## Models (selection + auth)

- Models config + CLI: [Models](https://docs.openclaw.ai/concepts/models)
- Auth profile rotation (OAuth vs API keys) + fallbacks: [Model failover](https://docs.openclaw.ai/concepts/model-failover)

## Install (recommended)

Runtime: **Node ≥22**.

```bash
npm install -g openclaw@latest
# or: pnpm add -g openclaw@latest

openclaw onboard --install-daemon
````

The wizard installs the Gateway daemon (launchd/systemd user service) so it stays running.

## Quick start (TL;DR)

Runtime: **Node ≥22**.

Full beginner guide (auth, pairing, channels): [Getting started](https://docs.openclaw.ai/start/getting-started)

```bash
openclaw onboard --install-daemon

openclaw gateway --port 18789 --verbose

# Send a message
openclaw message send --to +1234567890 --message "Hello from OpenClaw"

# Talk to the assistant (optionally deliver back to any connected channel: WhatsApp/Telegram/Slack/Discord/Google Chat/Signal/iMessage/BlueBubbles/Microsoft Teams/Matrix/Zalo/Zalo Personal/WebChat)
openclaw agent --message "Ship checklist" --thinking high
```

Upgrading? [Updating guide](https://docs.openclaw.ai/install/updating) (and run `openclaw doctor`).

## Development channels

- **stable**: tagged releases (`vYYYY.M.D` or `vYYYY.M.D-<patch>`), npm dist-tag `latest`.
- **beta**: prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta` (macOS app may be missing).
- **dev**: moving head of `main`, npm dist-tag `dev` (when published).

Switch channels (git + npm): `openclaw update --channel stable|beta|dev`.
Details: [Development channels](https://docs.openclaw.ai/install/development-channels).

## From source (development)

Prefer `pnpm` for builds from source. Bun is optional for running TypeScript directly.

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw

pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build

pnpm openclaw onboard --install-daemon

# Dev loop (auto-reload on TS changes)
pnpm gateway:watch
```

Note: `pnpm openclaw ...` runs TypeScript directly (via `tsx`). `pnpm build` produces `dist/` for running via Node / the packaged `openclaw` binary.

## Security defaults (DM access)

OpenClaw connects to real messaging surfaces. Treat inbound DMs as **untrusted input**.

Full security guide: [Security](https://docs.openclaw.ai/gateway/security)

Default behavior on Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **DM pairing** (`dmPolicy="pairing"` / `channels.discord.dm.policy="pairing"` / `channels.slack.dm.policy="pairing"`): unknown senders receive a short pairing code and the bot does not process their message.
- Approve with: `openclaw pairing approve <channel> <code>` (then the sender is added to a local allowlist store).
- Public inbound DMs require an explicit opt-in: set `dmPolicy="open"` and include `"*"` in the channel allowlist (`allowFrom` / `channels.discord.dm.allowFrom` / `channels.slack.dm.allowFrom`).

Run `openclaw doctor` to surface risky/misconfigured DM policies.

## Highlights

- **[Local-first Gateway](https://docs.openclaw.ai/gateway)** — single control plane for sessions, channels, tools, and events.
- **[Multi-channel inbox](https://docs.openclaw.ai/channels)** — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), iMessage (legacy), Microsoft Teams, Matrix, Zalo, Zalo Personal, WebChat, macOS, iOS/Android.
- **[Multi-agent routing](https://docs.openclaw.ai/gateway/configuration)** — route inbound channels/accounts/peers to isolated agents (workspaces + per-agent sessions).
- **[Voice Wake](https://docs.openclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.openclaw.ai/nodes/talk)** — always-on speech for macOS/iOS/Android with ElevenLabs.
- **[Live Canvas](https://docs.openclaw.ai/platforms/mac/canvas)** — agent-driven visual workspace with [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui).
- **[First-class tools](https://docs.openclaw.ai/tools)** — browser, canvas, nodes, cron, sessions, and Discord/Slack actions.
- **[Companion apps](https://docs.openclaw.ai/platforms/macos)** — macOS menu bar app + iOS/Android [nodes](https://docs.openclaw.ai/nodes).
- **[Onboarding](https://docs.openclaw.ai/start/wizard) + [skills](https://docs.openclaw.ai/tools/skills)** — wizard-driven setup with bundled/managed/workspace skills.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=openclaw/openclaw&type=date&legend=top-left)](https://www.star-history.com/#openclaw/openclaw&type=date&legend=top-left)

## Everything we built so far

### Core platform

- [Gateway WS control plane](https://docs.openclaw.ai/gateway) with sessions, presence, config, cron, webhooks, [Control UI](https://docs.openclaw.ai/web), and [Canvas host](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui).
- [CLI surface](https://docs.openclaw.ai/tools/agent-send): gateway, agent, send, [wizard](https://docs.openclaw.ai/start/wizard), and [doctor](https://docs.openclaw.ai/gateway/doctor).
- [Pi agent runtime](https://docs.openclaw.ai/concepts/agent) in RPC mode with tool streaming and block streaming.
- [Session model](https://docs.openclaw.ai/concepts/session): `main` for direct chats, group isolation, activation modes, queue modes, reply-back. Group rules: [Groups](https://docs.openclaw.ai/concepts/groups).
- [Media pipeline](https://docs.openclaw.ai/nodes/images): images/audio/video, transcription hooks, size caps, temp file lifecycle. Audio details: [Audio](https://docs.openclaw.ai/nodes/audio).

### Channels

- [Channels](https://docs.openclaw.ai/channels): [WhatsApp](https://docs.openclaw.ai/channels/whatsapp) (Baileys), [Telegram](https://docs.openclaw.ai/channels/telegram) (grammY), [Slack](https://docs.openclaw.ai/channels/slack) (Bolt), [Discord](https://docs.openclaw.ai/channels/discord) (discord.js), [Google Chat](https://docs.openclaw.ai/channels/googlechat) (Chat API), [Signal](https://docs.openclaw.ai/channels/signal) (signal-cli), [BlueBubbles](https://docs.openclaw.ai/channels/bluebubbles) (iMessage, recommended), [iMessage](https://docs.openclaw.ai/channels/imessage) (legacy imsg), [Microsoft Teams](https://docs.openclaw.ai/channels/msteams) (extension), [Matrix](https://docs.openclaw.ai/channels/matrix) (extension), [Zalo](https://docs.openclaw.ai/channels/zalo) (extension), [Zalo Personal](https://docs.openclaw.ai/channels/zalouser) (extension), [WebChat](https://docs.openclaw.ai/web/webchat).
- [Group routing](https://docs.openclaw.ai/concepts/group-messages): mention gating, reply tags, per-channel chunking and routing. Channel rules: [Channels](https://docs.openclaw.ai/channels).

### Apps + nodes

- [macOS app](https://docs.openclaw.ai/platforms/macos): menu bar control plane, [Voice Wake](https://docs.openclaw.ai/nodes/voicewake)/PTT, [Talk Mode](https://docs.openclaw.ai/nodes/talk) overlay, [WebChat](https://docs.openclaw.ai/web/webchat), debug tools, [remote gateway](https://docs.openclaw.ai/gateway/remote) control.
- [iOS node](https://docs.openclaw.ai/platforms/ios): [Canvas](https://docs.openclaw.ai/platforms/mac/canvas), [Voice Wake](https://docs.openclaw.ai/nodes/voicewake), [Talk Mode](https://docs.openclaw.ai/nodes/talk), camera, screen recording, Bonjour pairing.
- [Android node](https://docs.openclaw.ai/platforms/android): [Canvas](https://docs.openclaw.ai/platforms/mac/canvas), [Talk Mode](https://docs.openclaw.ai/nodes/talk), camera, screen recording, optional SMS.
- [macOS node mode](https://docs.openclaw.ai/nodes): system.run/notify + canvas/camera exposure.

### Tools + automation

- [Browser control](https://docs.openclaw.ai/tools/browser): dedicated openclaw Chrome/Chromium, snapshots, actions, uploads, profiles.
- [Canvas](https://docs.openclaw.ai/platforms/mac/canvas): [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui) push/reset, eval, snapshot.
- [Nodes](https://docs.openclaw.ai/nodes): camera snap/clip, screen record, [location.get](https://docs.openclaw.ai/nodes/location-command), notifications.
- [Cron + wakeups](https://docs.openclaw.ai/automation/cron-jobs); [webhooks](https://docs.openclaw.ai/automation/webhook); [Gmail Pub/Sub](https://docs.openclaw.ai/automation/gmail-pubsub).
- [Skills platform](https://docs.openclaw.ai/tools/skills): bundled, managed, and workspace skills with install gating + UI.

### Runtime + safety

- [Channel routing](https://docs.openclaw.ai/concepts/channel-routing), [retry policy](https://docs.openclaw.ai/concepts/retry), and [streaming/chunking](https://docs.openclaw.ai/concepts/streaming).
- [Presence](https://docs.openclaw.ai/concepts/presence), [typing indicators](https://docs.openclaw.ai/concepts/typing-indicators), and [usage tracking](https://docs.openclaw.ai/concepts/usage-tracking).
- [Models](https://docs.openclaw.ai/concepts/models), [model failover](https://docs.openclaw.ai/concepts/model-failover), and [session pruning](https://docs.openclaw.ai/concepts/session-pruning).
- [Security](https://docs.openclaw.ai/gateway/security) and [troubleshooting](https://docs.openclaw.ai/channels/troubleshooting).

### Ops + packaging

- [Control UI](https://docs.openclaw.ai/web) + [WebChat](https://docs.openclaw.ai/web/webchat) served directly from the Gateway.
- [Tailscale Serve/Funnel](https://docs.openclaw.ai/gateway/tailscale) or [SSH tunnels](https://docs.openclaw.ai/gateway/remote) with token/password auth.
- [Nix mode](https://docs.openclaw.ai/install/nix) for declarative config; [Docker](https://docs.openclaw.ai/install/docker)-based installs.
- [Doctor](https://docs.openclaw.ai/gateway/doctor) migrations, [logging](https://docs.openclaw.ai/logging).

## How it works (short)

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / BlueBubbles / Microsoft Teams / Matrix / Zalo / Zalo Personal / WebChat
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       (control plane)         │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ Pi agent (RPC)
               ├─ CLI (openclaw …)
               ├─ WebChat UI
               ├─ macOS app
               └─ iOS / Android nodes
```

## Key subsystems

- **[Gateway WebSocket network](https://docs.openclaw.ai/concepts/architecture)** — single WS control plane for clients, tools, and events (plus ops: [Gateway runbook](https://docs.openclaw.ai/gateway)).
- **[Tailscale exposure](https://docs.openclaw.ai/gateway/tailscale)** — Serve/Funnel for the Gateway dashboard + WS (remote access: [Remote](https://docs.openclaw.ai/gateway/remote)).
- **[Browser control](https://docs.openclaw.ai/tools/browser)** — openclaw‑managed Chrome/Chromium with CDP control.
- **[Canvas + A2UI](https://docs.openclaw.ai/platforms/mac/canvas)** — agent‑driven visual workspace (A2UI host: [Canvas/A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui)).
- **[Voice Wake](https://docs.openclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.openclaw.ai/nodes/talk)** — always‑on speech and continuous conversation.
- **[Nodes](https://docs.openclaw.ai/nodes)** — Canvas, camera snap/clip, screen record, `location.get`, notifications, plus macOS‑only `system.run`/`system.notify`.

## Tailscale access (Gateway dashboard)

OpenClaw can auto-configure Tailscale **Serve** (tailnet-only) or **Funnel** (public) while the Gateway stays bound to loopback. Configure `gateway.tailscale.mode`:

- `off`: no Tailscale automation (default).
- `serve`: tailnet-only HTTPS via `tailscale serve` (uses Tailscale identity headers by default).
- `funnel`: public HTTPS via `tailscale funnel` (requires shared password auth).

Notes:

- `gateway.bind` must stay `loopback` when Serve/Funnel is enabled (OpenClaw enforces this).
- Serve can be forced to require a password by setting `gateway.auth.mode: "password"` or `gateway.auth.allowTailscale: false`.
- Funnel refuses to start unless `gateway.auth.mode: "password"` is set.
- Optional: `gateway.tailscale.resetOnExit` to undo Serve/Funnel on shutdown.

Details: [Tailscale guide](https://docs.openclaw.ai/gateway/tailscale) · [Web surfaces](https://docs.openclaw.ai/web)

## Remote Gateway (Linux is great)

It’s perfectly fine to run the Gateway on a small Linux instance. Clients (macOS app, CLI, WebChat) can connect over **Tailscale Serve/Funnel** or **SSH tunnels**, and you can still pair device nodes (macOS/iOS/Android) to execute device‑local actions when needed.

- **Gateway host** runs the exec tool and channel connections by default.
- **Device nodes** run device‑local actions (`system.run`, camera, screen recording, notifications) via `node.invoke`.
  In short: exec runs where the Gateway lives; device actions run where the device lives.

Details: [Remote access](https://docs.openclaw.ai/gateway/remote) · [Nodes](https://docs.openclaw.ai/nodes) · [Security](https://docs.openclaw.ai/gateway/security)

## macOS permissions via the Gateway protocol

The macOS app can run in **node mode** and advertises its capabilities + permission map over the Gateway WebSocket (`node.list` / `node.describe`). Clients can then execute local actions via `node.invoke`:

- `system.run` runs a local command and returns stdout/stderr/exit code; set `needsScreenRecording: true` to require screen-recording permission (otherwise you’ll get `PERMISSION_MISSING`).
- `system.notify` posts a user notification and fails if notifications are denied.
- `canvas.*`, `camera.*`, `screen.record`, and `location.get` are also routed via `node.invoke` and follow TCC permission status.

Elevated bash (host permissions) is separate from macOS TCC:

- Use `/elevated on|off` to toggle per‑session elevated access when enabled + allowlisted.
- Gateway persists the per‑session toggle via `sessions.patch` (WS method) alongside `thinkingLevel`, `verboseLevel`, `model`, `sendPolicy`, and `groupActivation`.

Details: [Nodes](https://docs.openclaw.ai/nodes) · [macOS app](https://docs.openclaw.ai/platforms/macos) · [Gateway protocol](https://docs.openclaw.ai/concepts/architecture)

## Agent to Agent (sessions\_\* tools)

- Use these to coordinate work across sessions without jumping between chat surfaces.
- `sessions_list` — discover active sessions (agents) and their metadata.
- `sessions_history` — fetch transcript logs for a session.
- `sessions_send` — message another session; optional reply‑back ping‑pong + announce step (`REPLY_SKIP`, `ANNOUNCE_SKIP`).

Details: [Session tools](https://docs.openclaw.ai/concepts/session-tool)

## Skills registry (ClawHub)

ClawHub is a minimal skill registry. With ClawHub enabled, the agent can search for skills automatically and pull in new ones as needed.

[ClawHub](https://clawhub.com)

## Chat commands

Send these in WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat (group commands are owner-only):

- `/status` — compact session status (model + tokens, cost when available)
- `/new` or `/reset` — reset the session
- `/compact` — compact session context (summary)
- `/think <level>` — off|minimal|low|medium|high|xhigh (GPT-5.2 + Codex models only)
- `/verbose on|off`
- `/usage off|tokens|full` — per-response usage footer
- `/restart` — restart the gateway (owner-only in groups)
- `/activation mention|always` — group activation toggle (groups only)

## Apps (optional)

The Gateway alone delivers a great experience. All apps are optional and add extra features.

If you plan to build/run companion apps, follow the platform runbooks below.

### macOS (OpenClaw.app) (optional)

- Menu bar control for the Gateway and health.
- Voice Wake + push-to-talk overlay.
- WebChat + debug tools.
- Remote gateway control over SSH.

Note: signed builds required for macOS permissions to stick across rebuilds (see `docs/mac/permissions.md`).

### iOS node (optional)

- Pairs as a node via the Bridge.
- Voice trigger forwarding + Canvas surface.
- Controlled via `openclaw nodes …`.

Runbook: [iOS connect](https://docs.openclaw.ai/platforms/ios).

### Android node (optional)

- Pairs via the same Bridge + pairing flow as iOS.
- Exposes Canvas, Camera, and Screen capture commands.
- Runbook: [Android connect](https://docs.openclaw.ai/platforms/android).

## Agent workspace + skills

- Workspace root: `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`).
- Injected prompt files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`.
- Skills: `~/.openclaw/workspace/skills/<skill>/SKILL.md`.

## Configuration

Minimal `~/.openclaw/openclaw.json` (model + defaults):

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-5",
  },
}
```

[Full configuration reference (all keys + examples).](https://docs.openclaw.ai/gateway/configuration)

## Security model (important)

- **Default:** tools run on the host for the **main** session, so the agent has full access when it’s just you.
- **Group/channel safety:** set `agents.defaults.sandbox.mode: "non-main"` to run **non‑main sessions** (groups/channels) inside per‑session Docker sandboxes; bash then runs in Docker for those sessions.
- **Sandbox defaults:** allowlist `bash`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`; denylist `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`.

Details: [Security guide](https://docs.openclaw.ai/gateway/security) · [Docker + sandboxing](https://docs.openclaw.ai/install/docker) · [Sandbox config](https://docs.openclaw.ai/gateway/configuration)

### [WhatsApp](https://docs.openclaw.ai/channels/whatsapp)

- Link the device: `pnpm openclaw channels login` (stores creds in `~/.openclaw/credentials`).
- Allowlist who can talk to the assistant via `channels.whatsapp.allowFrom`.
- If `channels.whatsapp.groups` is set, it becomes a group allowlist; include `"*"` to allow all.

### [Telegram](https://docs.openclaw.ai/channels/telegram)

- Set `TELEGRAM_BOT_TOKEN` or `channels.telegram.botToken` (env wins).
- Optional: set `channels.telegram.groups` (with `channels.telegram.groups."*".requireMention`); when set, it is a group allowlist (include `"*"` to allow all). Also `channels.telegram.allowFrom` or `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret` as needed.

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",
    },
  },
}
```

#### Step 3: Start ngrok Manually / ngrokの手動起動

```bash
# Terminal 1: Start ngrok tunnel / ターミナル1: ngrokトンネルを開始
ngrok http 18789 --bind-tls true

# Note the HTTPS URL (e.g., https://abc123.ngrok-free.app) / HTTPS URLをメモ（例: https://abc123.ngrok-free.app）
```

#### Step 4: Configure LINE Webhook URL / LINE Webhook URLの設定

1. Open [LINE Developers Console](https://developers.line.biz/console/) / [LINE Developers Console](https://developers.line.biz/console/)を開く
2. Select your channel / チャンネルを選択
3. Go to **Messaging API** → **Webhook settings** / **Messaging API** → **Webhook設定**に移動
4. Set Webhook URL to: `https://your-ngrok-url.ngrok-free.app/line/webhook` / Webhook URLを設定: `https://your-ngrok-url.ngrok-free.app/line/webhook`
5. Click **[Verify]** to test the connection / **[Verify]**をクリックして接続をテスト
6. Enable **Use webhook** toggle / **Use webhook**トグルを有効化
7. Set **Auto-reply messages** to disabled (let OpenClaw handle responses) / **自動応答メッセージ**を無効化（OpenClawが応答を処理）

---

### 🔗 Pairing Approval Process / ペアリング承認プロセス

OpenClaw requires explicit pairing approval for security:

OpenClawはセキュリティのため明示的なペアリング承認を必要とします：

1. **Send a test message** from your LINE app to the bot / LINEアプリからボットに**テストメッセージを送信**
2. **Check OpenClaw logs** - you will see a pairing request / **OpenClawログを確認** - ペアリングリクエストが表示されます
3. **Approve the pairing** using the code shown / 表示されたコードを使用して**ペアリングを承認**

```bash
# Approve LINE pairing / LINEペアリングを承認
openclaw pairing approve line [PAIRING_CODE]

# Example / 例:
openclaw pairing approve line ABC123XYZ
```

Once approved, the user can freely chat with the AI assistant through LINE:

承認後、ユーザーはLINEを通じてAIアシスタントと自由にチャットできます：

---

### ✅ Testing the Integration / 統合のテスト

After setup is complete, test your LINE integration:

設定完了後、LINE統合をテストします：

#### 1. Send a Message from LINE / LINEからメッセージを送信

Open your LINE app and send a message to your bot:

LINEアプリを開いてボットにメッセージを送信：

```
Hello, are you there?
```

#### 2. Check OpenClaw Response / OpenClawの応答を確認

You should see in your OpenClaw logs:

OpenClawログに以下が表示されるはずです：

```
[INFO] Received message from LINE user [USER_ID]
[INFO] Processing with agent...
[INFO] Sending response to LINE
```

#### 3. Verify Response in LINE / LINEでの応答を確認

The response should appear in your LINE chat within seconds:

数秒以内にLINEチャットに応答が表示されるはずです：

#### 4. Test Group Chat (Optional) / グループチャットをテスト（オプション）

Add the bot to a LINE group and mention it:

ボットをLINEグループに追加してメンションします：

```
@YourBotName summarize this discussion
```

---

### 🤖 Codex + OpenCode Integration via LINE / LINE経由のCodex＋OpenCode統合

One of OpenClaw unique features is **bidirectional communication with AI coding assistants** through LINE. This enables you to:

OpenClawの独自機能の1つは、LINEを通じた**AIコーディングアシスタントとの双方向通信**です。これにより以下が可能になります：

#### Features / 機能：

- **Remote Code Review Requests** / **リモートコードレビューリクエスト**
  - Send code snippets from LINE for instant AI review / LINEからコードスニペットを送信して即座にAIレビュー
  - Example: "Review this function: [paste code]" / 例: "この関数をレビューして: [コードを貼り付け]"

- **Codex Session Management** / **Codexセッション管理**
  - Start/stop Codex agents remotely via LINE commands / LINEコマンドでCodexエージェントをリモート開始/停止
  - Check agent status: "status codex" / エージェント状態確認: "status codex"

- **OpenCode Integration** / **OpenCode統合**
  - Trigger OpenCode actions from LINE messages / LINEメッセージからOpenCodeアクションをトリガー
  - Receive code completion suggestions in chat / チャットでコード補完候補を受信

- **Development Notifications** / **開発通知**
  - Get build status alerts via LINE / LINEでビルド状態アラートを受信
  - Receive deployment confirmations / デプロイメント確認を受信

#### Example Workflows / ワークフローの例：

```
You (LINE): @OpenClaw review my latest commit
Bot (LINE): Analyzing commit abc123...
           Found 2 potential issues:
           1. Unused import in line 45
           2. Possible null pointer exception
           Full report: [link]

You (LINE): codex: optimize this SQL query [query]
Bot (LINE): Optimized query reduces execution time by 40%:
           [optimized query]
           Explanation: Added index hint...
```

---

### 🔐 Environment Variables Reference / 環境変数リファレンス

#### Required Variables / 必須変数：

| Variable / 変数       | Description / 説明                                                            | Source / 取得元                 |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| `LINE_CHANNEL_ID`     | Your LINE channel ID / LINEチャンネルID                                       | LINE Console → Channel Settings |
| `LINE_CHANNEL_SECRET` | Channel secret for webhook verification / Webhook検証用チャンネルシークレット | LINE Console → Channel Settings |
| `LINE_ACCESS_TOKEN`   | Long-lived channel access token / 長期チャンネルアクセストークン              | LINE Console → Messaging API    |

#### Optional Variables / オプション変数：

| Variable / 変数     | Description / 説明                                      | Default / デフォルト |
| ------------------- | ------------------------------------------------------- | -------------------- |
| `PORT`              | OpenClaw gateway port / OpenClawゲートウェイポート      | `18789`              |
| `NGROK_AUTH_TOKEN`  | Your ngrok authentication token / ngrok認証トークン     | (none / なし)        |
| `LINE_WEBHOOK_PATH` | Custom webhook path / カスタムwebhookパス               | `/line/webhook`      |
| `LINE_DM_POLICY`    | Direct message security policy / DMセキュリティポリシー | `require-pairing`    |

#### Complete .env Example / 完全な.env例：

```bash
# ============================================
# OpenClaw LINE Integration / OpenClaw LINE統合
# ============================================

# LINE Bot Credentials (Required) / LINEボット認証情報（必須）
LINE_CHANNEL_ID=2000000000
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gateway Configuration / ゲートウェイ設定
PORT=18789
HOST=0.0.0.0

# ngrok Configuration (Optional) / ngrok設定（オプション）
NGROK_AUTH_TOKEN=xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NGROK_REGION=jp

# Security Settings / セキュリティ設定
LINE_DM_POLICY=require-pairing
LINE_AUTO_REPLY=false

# Advanced Settings / 詳細設定
LINE_REQUEST_TIMEOUT=30000
LINE_MAX_MESSAGE_LENGTH=2000
```

---

### 🐛 Troubleshooting / トラブルシューティング

#### Common Issues / 一般的な問題：

| Issue / 問題                                      | Solution / 解決策                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Webhook verification fails / Webhook検証が失敗    | Ensure ngrok is running on port 18789 / ngrokがポート18789で実行されていることを確認 |
| No response in LINE / LINEで応答がない            | Check pairing approval status / ペアリング承認状態を確認                             |
| ngrok URL not copying / ngrok URLがコピーされない | Run PowerShell as Administrator / PowerShellを管理者として実行                       |
| Connection timeout / 接続タイムアウト             | Check firewall settings / ファイアウォール設定を確認                                 |
| "Use webhook" disabled / "Use webhook"が無効      | Enable in LINE Console and click [Verify] / LINE Consoleで有効化し[Verify]をクリック |

#### Debug Commands / デバッグコマンド：

```bash
# Check OpenClaw status / OpenClaw状態を確認
openclaw channels status --all

# Check LINE channel specifically / LINEチャンネルを特に確認
openclaw channels status line

# View logs / ログを表示
openclaw gateway --verbose

# Test ngrok connection / ngrok接続をテスト
curl http://localhost:4040/api/tunnels

# Check pairing list / ペアリングリストを確認
openclaw pairing list
```

---

## 🎮 VRChat Integration / VRChat統合

**Control your VRChat avatar and environment via OSC protocol!**

**OSCプロトコル経由でVRChatアバターと環境を制御！**

The VRChat extension (`extensions/vrchat-relay`) provides bidirectional OSC communication for avatar control, chatbox messaging, and input commands. Perfect for streamers, VTubers, and VR enthusiasts who want AI-powered avatar automation.

VRChat拡張（`extensions/vrchat-relay`）は、アバター制御、チャットボックスメッセージング、入力コマンドのための双方向OSC通信を提供します。AI駆動のアバター自動化を求めるストリーマー、VTuber、VR愛好家に最適です。

---

### 📋 Overview / 概要

| Feature / 機能         | Description / 説明                                                                                      | Status / ステータス |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| 🔄 **OSC Relay**       | Bidirectional OSC message relay / 双方向OSCメッセージリレー                                             | ✅ Available        |
| 🔐 **Auto-Login**      | Automatic authentication with 2FA/TOTP support / 2FA/TOTP対応の自動認証                                 | ✅ Available        |
| 💬 **Chatbox**         | Send messages to VRChat chatbox (max 144 chars) / VRChatチャットボックスへメッセージ送信（最大144文字） | ✅ Available        |
| 🎭 **Avatar Params**   | Control avatar parameters (bool/int/float) / アバターパラメーター制御（真偽値/整数/浮動小数）           | ✅ Available        |
| 🎮 **Input Commands**  | Send Jump/Move/Look/Voice inputs (PRO) / ジャンプ/移動/視点/音声入力送信（PRO）                         | ✅ PRO Only         |
| 📡 **OSC Listener**    | Receive OSC messages from VRChat / VRChatからのOSCメッセージ受信                                        | ✅ Available        |
| 🛡️ **Security Guards** | Permission-based access control / 権限ベースのアクセス制御                                              | ✅ Available        |

---

### 🚀 Quick Setup / クイックセットアップ

#### Prerequisites / 前提条件

1. **VRChat Account** / VRChatアカウント
   - Sign up at [https://vrchat.com/](https://vrchat.com/)
   - [https://vrchat.com/](https://vrchat.com/)で登録

2. **OSC Enabled in VRChat** / VRChatでOSCを有効化
   - Open VRChat Quick Menu → Options → OSC → Enable OSC
   - VRChatクイックメニュー → オプション → OSC → OSCを有効化
   - Default ports: Send 9000, Receive 9001 / デフォルトポート: 送信9000、受信9001

3. **Install VRChat Extension** / VRChat拡張をインストール
   ```bash
   # Install from extensions directory / 拡張ディレクトリからインストール
   cd extensions/vrchat-relay
   npm install --omit=dev
   ```

---

### 🔧 Available Tools / 利用可能なツール

| Tool / ツール             | Description / 説明                                                                         | Permission / 権限 |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----------------- |
| `vrchat_login`            | Authenticate with VRChat (2FA/TOTP auto-support) / VRChat認証（2FA/TOTP自動対応）          | Any / 任意        |
| `vrchat_send_osc`         | Send OSC messages to VRChat / VRChatへOSCメッセージ送信                                    | STANDARD+         |
| `vrchat_chatbox`          | Send messages to chatbox (max 144 chars) / チャットボックスへメッセージ送信（最大144文字） | STANDARD+         |
| `vrchat_set_avatar_param` | Set avatar parameters (bool/int/float) / アバターパラメーター設定                          | STANDARD+         |
| `vrchat_input`            | Send input commands (Jump, Move, Look, Voice) / 入力コマンド送信                           | PRO only          |
| `vrchat_start_listener`   | Start OSC listener to receive messages / OSCリスナー開始                                   | STANDARD+         |
| `vrchat_stop_listener`    | Stop OSC listener / OSCリスナー停止                                                        | STANDARD+         |
| `vrchat_logout`           | Logout and clear session / ログアウトとセッションクリア                                    | Any / 任意        |

---

### 💻 Usage Examples / 使用例

#### Example 1: Login and Send Chatbox Message / ログインとチャットボックスメッセージ送信

```bash
# Login with auto 2FA (if VRCHAT_2FA_SECRET is set) / 自動2FAでログイン
openclaw agent --message "Login to VRChat" --thinking low

# Send a chatbox message / チャットボックスメッセージを送信
openclaw agent --message "Send 'Hello World!' to VRChat chatbox" --thinking low
```

#### Example 2: Control Avatar Parameters / アバターパラメーター制御

```bash
# Set boolean parameter / 真偽値パラメーターを設定
openclaw agent --message "Set avatar parameter 'Smile' to true" --thinking low

# Set float parameter / 浮動小数パラメーターを設定
openclaw agent --message "Set avatar parameter 'EyeBrightness' to 0.8" --thinking low

# Set integer parameter / 整数パラメーターを設定
openclaw agent --message "Set avatar parameter 'Outfit' to 3" --thinking low
```

#### Example 3: Start OSC Listener / OSCリスナーを開始

```bash
# Start listening for incoming OSC messages / 受信OSCメッセージのリスニングを開始
openclaw agent --message "Start VRChat OSC listener on port 9001" --thinking low

# The listener will receive avatar parameter changes and other OSC data / リスナーはアバターパラメーター変更やその他のOSCデータを受信
```

#### Example 4: Send Raw OSC Messages / 生OSCメッセージを送信

```bash
# Send custom OSC message / カスタムOSCメッセージを送信
openclaw agent --message "Send OSC message to /avatar/parameters/MyParam with value 1.0" --thinking low
```

#### Example 5: PRO Input Commands (PRO permission required) / PRO入力コマンド（PRO権限が必要）

```bash
# Send jump command / ジャンプコマンドを送信
openclaw agent --message "Send Jump input to VRChat" --thinking low

# Send movement input / 移動入力を送信
openclaw agent --message "Move forward in VRChat" --thinking low

# Toggle voice / 音声をトグル
openclaw agent --message "Toggle voice in VRChat" --thinking low
```

---

### 🔐 Environment Variables / 環境変数

#### Required Variables / 必須変数：

| Variable / 変数   | Description / 説明                      | Required / 必須 |
| ----------------- | --------------------------------------- | --------------- |
| `VRCHAT_USERNAME` | Your VRChat username / VRChatユーザー名 | ✅ Yes          |
| `VRCHAT_PASSWORD` | Your VRChat password / VRChatパスワード | ✅ Yes          |

#### Optional Variables / オプション変数：

| Variable / 変数             | Description / 説明                                        | Default / デフォルト |
| --------------------------- | --------------------------------------------------------- | -------------------- |
| `VRCHAT_2FA_SECRET`         | TOTP secret for automatic 2FA / 自動2FA用TOTPシークレット | (none / なし)        |
| `VRCHAT_OSC_HOST`           | OSC host address / OSCホストアドレス                      | `127.0.0.1`          |
| `VRCHAT_OSC_SEND_PORT`      | Port to send OSC messages / OSCメッセージ送信ポート       | `9000`               |
| `VRCHAT_OSC_RECEIVE_PORT`   | Port to receive OSC messages / OSCメッセージ受信ポート    | `9001`               |
| `VRCHAT_PERMISSION_PROFILE` | Permission level (STANDARD/PRO) / 権限レベル              | `STANDARD`           |

#### Complete .env Example / 完全な.env例：

```bash
# ============================================
# VRChat Integration / VRChat統合
# ============================================

# VRChat Credentials (Required) / VRChat認証情報（必須）
VRCHAT_USERNAME=your_vrchat_username
VRCHAT_PASSWORD=your_vrchat_password

# 2FA/TOTP (Optional - enables auto-login) / 2FA/TOTP（オプション - 自動ログインを有効化）
VRCHAT_2FA_SECRET=YOUR_TOTP_SECRET_KEY

# OSC Configuration (Optional) / OSC設定（オプション）
VRCHAT_OSC_HOST=127.0.0.1
VRCHAT_OSC_SEND_PORT=9000
VRCHAT_OSC_RECEIVE_PORT=9001

# Permission Profile (Optional) / 権限プロファイル（オプション）
# STANDARD: chatbox, avatar params, OSC listener
# PRO: all features including input commands
VRCHAT_PERMISSION_PROFILE=STANDARD
```

---

### 🛡️ Permission Profiles / 権限プロファイル

VRChat extension uses **security guards** to control access to sensitive features:

VRChat拡張は**セキュリティガード**を使用して機密機能へのアクセスを制御します：

| Profile / プロファイル | Features / 機能                                                                            | Use Case / 用途                          |
| ---------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **STANDARD**           | Chatbox, Avatar Params, OSC Listener / チャットボックス、アバターパラメーター、OSCリスナー | General automation / 一般的な自動化      |
| **PRO**                | All features + Input Commands / 全機能 + 入力コマンド                                      | Full avatar control / 完全なアバター制御 |

**Warning / 警告:** Input commands (`vrchat_input`) can control your avatar's movement and actions. Only enable PRO permissions if you trust the AI agent completely.

入力コマンド（`vrchat_input`）はアバターの動きやアクションを制御できます。AIエージェントを完全に信頼している場合のみPRO権限を有効化してください。

---

### 🐛 Troubleshooting / トラブルシューティング

#### Common Issues / 一般的な問題：

| Issue / 問題                                   | Solution / 解決策                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Login fails / ログイン失敗                     | Check credentials and 2FA secret / 認証情報と2FAシークレットを確認           |
| OSC not received / OSC受信されない             | Verify VRChat OSC is enabled in settings / VRChat設定でOSCが有効か確認       |
| Connection refused / 接続拒否                  | Check firewall and port settings / ファイアウォールとポート設定を確認        |
| Chatbox not appearing / チャットボックス非表示 | Max 144 characters - check message length / 最大144文字 - メッセージ長を確認 |
| Input commands fail / 入力コマンド失敗         | Requires PRO permission profile / PRO権限プロファイルが必要                  |

#### Debug Commands / デバッグコマンド：

```bash
# Check VRChat extension status / VRChat拡張状態を確認
openclaw channels status --all

# Test OSC connection / OSC接続をテスト
curl http://localhost:9000/status

# Check logs / ログを確認
openclaw gateway --verbose
```

---

### 🎮 VRChat Relay Usage Guide / VRChat Relay 使い方ガイド

#### 1. Login / ログイン

**English:**
Authenticate with your VRChat credentials. Supports 2FA/TOTP.

**日本語:**
VRChatアカウントで認証します。2要素認証（TOTP）にも対応。

```bash
openclaw agent --message "VRChatにログイン username password"
```

#### 2. Send Chat Message / チャットメッセージ送信

**English:**
Send a message to the VRChat chatbox with typing animation. Max 144 characters, 9 lines.

**日本語:**
VRChatのチャットボックスにタイピングアニメーション付きでメッセージを送信。最大144文字、9行。

```bash
openclaw agent --message "Send 'Hello everyone!' to chatbox"
```

#### 3. Control Camera / カメラ制御 (DIRECTOR権限)

**English:**
Control VRChat camera parameters (requires DIRECTOR permission). Available: Zoom, Aperture, FocalDistance, etc.

**日本語:**
VRChatカメラを制御（DIRECTOR権限が必要）。利用可能なパラメータ：Zoom、Aperture、FocalDistanceなど。

```bash
# Set zoom to 50
openclaw agent --message "Set camera zoom to 50"

# Set aperture to f/2.8
openclaw agent --message "Set camera aperture to 2.8"

# Enable green screen with custom HSL
openclaw agent --message "Set camera greenscreen hue to 120 saturation to 80"
```

#### 4. Avatar Parameters / アバターパラメータ制御

**English:**
Discover and control avatar parameters via OSC. Supports bool, int, and float types.

**日本語:**
OSC経由でアバターパラメータを探索・制御。bool、int、float型に対応。

```bash
# Discover available parameters
openclaw agent --message "Discover OSC parameters for current avatar"

# Set a parameter
openclaw agent --message "Set avatar parameter ' parameter_name ' to 1.0"
```

#### 5. Input Commands / 入力コマンド (PRO権限)

**English:**
Send input commands like Jump, Move, Interact (requires PRO permission).

**日本語:**
Jump、Move、Interactなどの入力コマンドを送信（PRO権限が必要）。

```bash
# Jump
openclaw agent --message "Send VRChat input command Jump"

# Move forward
openclaw agent --message "Send VRChat input command MoveForward 1.0"

# Interact
openclaw agent --message "Send VRChat input command Interact"
```

#### 6. OSC Listener / OSCリスナー

**English:**
Start listening for OSC messages from VRChat. Useful for triggers and automation.

**日本語:**
VRChatからのOSCメッセージ受信を開始。トリガーや自動化に便利。

```bash
# Start listener
openclaw agent --message "Start VRChat OSC listener"

# Check status
openclaw agent --message "Get VRChat listener status"

# Stop listener
openclaw agent --message "Stop VRChat OSC listener"
```

#### 7. Permission Management / 権限管理

**English:**
Switch between permission levels: SAFE (default), PRO, or DIRECTOR.

**日本語:**
権限レベルを切り替え：SAFE（デフォルト）、PRO、DIRECTOR。

```bash
# Check current permission
openclaw agent --message "Show VRChat permission status"

# Set permission level
openclaw agent --message "Set VRChat permission to PRO"
openclaw agent --message "Set VRChat permission to DIRECTOR"
```

---

## 📨 Supported Channels / 対応チャンネル

| Channel / チャンネル | Type / タイプ | DM Support / DM対応 | Group Support / グループ対応 |
| -------------------- | ------------- | ------------------- | ---------------------------- |
| 🟢 **LINE**          | Extension     | ✅ Yes              | ✅ Yes                       |
| 💬 WhatsApp          | Core          | ✅ Yes              | ✅ Yes                       |
| ✈️ Telegram          | Core          | ✅ Yes              | ✅ Yes                       |
| 💼 Slack             | Core          | ✅ Yes              | ✅ Yes                       |
| 🎮 Discord           | Core          | ✅ Yes              | ✅ Yes                       |
| 🔍 Google Chat       | Core          | ✅ Yes              | ✅ Yes                       |
| 📡 Signal            | Core          | ✅ Yes              | ✅ Yes                       |
| 🍎 iMessage          | Core          | ✅ Yes (macOS)      | ✅ Yes                       |
| 🔵 BlueBubbles       | Extension     | ✅ Yes              | ✅ Yes                       |
| 👥 Microsoft Teams   | Extension     | ✅ Yes              | ✅ Yes                       |
| 🕸️ Matrix            | Extension     | ✅ Yes              | ✅ Yes                       |
| 🇻🇳 Zalo              | Extension     | ✅ Yes              | ✅ Yes                       |
| 👤 Zalo Personal     | Extension     | ✅ Yes              | ❌ No                        |
| 🌐 WebChat           | Core          | ✅ Yes              | ✅ Yes                       |

---

## 🔒 Security / セキュリティ

### Default Security Settings / デフォルトセキュリティ設定

OpenClaw connects to real messaging surfaces. Treat inbound DMs as **untrusted input**.

OpenClawは実際のメッセージングサーフェスに接続します。受信DMは**信頼できない入力**として扱ってください。

**DM Pairing Policy / DMペアリングポリシー:**

- Unknown senders receive a pairing code / 不明な送信者にはペアリングコードが送信されます
- Messages are not processed until approved / 承認されるまでメッセージは処理されません
- Approve with: `openclaw pairing approve <channel> <code>`

### Security Best Practices / セキュリティベストプラクティス

```bash
# Check security configuration / セキュリティ設定を確認
openclaw doctor

# Review DM policies / DMポリシーを確認
openclaw config get channels.*.dmPolicy

# Enable sandbox for non-main sessions / メイン以外のセッションでサンドボックスを有効化
openclaw config set agents.defaults.sandbox.mode "non-main"
```

### LINE-Specific Security / LINE固有のセキュリティ

- LINE channel credentials stored in `~/.openclaw/credentials/` / LINEチャンネル認証情報は`~/.openclaw/credentials/`に保存
- Webhook verification via channel secret / チャンネルシークレットによるwebhook検証
- Pairing required for unknown users / 不明なユーザーにはペアリングが必要

---

## 🛠️ Development / 開発

### Development Channels / 開発チャンネル

- **stable**: Tagged releases (`vYYYY.M.D`), npm dist-tag `latest`
- **beta**: Prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta`
- **dev**: Moving head of `main`, npm dist-tag `dev`

```bash
# Switch channels / チャンネルを切り替え
openclaw update --channel stable|beta|dev
```

### Dev Loop / 開発ループ

```bash
# Watch mode for development / 開発用ウォッチモード
pnpm gateway:watch

# Run tests / テストを実行
pnpm test

# Run linting / リントを実行
pnpm lint
```

---

## 🦞 Molty

### [Slack](https://docs.openclaw.ai/channels/slack)

- Set `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (or `channels.slack.botToken` + `channels.slack.appToken`).

### [Discord](https://docs.openclaw.ai/channels/discord)

- Set `DISCORD_BOT_TOKEN` or `channels.discord.token` (env wins).
- Optional: set `commands.native`, `commands.text`, or `commands.useAccessGroups`, plus `channels.discord.dm.allowFrom`, `channels.discord.guilds`, or `channels.discord.mediaMaxMb` as needed.

```json5
{
  channels: {
    discord: {
      token: "1234abcd",
    },
  },
}
```

### [Signal](https://docs.openclaw.ai/channels/signal)

- Requires `signal-cli` and a `channels.signal` config section.

### [BlueBubbles (iMessage)](https://docs.openclaw.ai/channels/bluebubbles)

- **Recommended** iMessage integration.
- Configure `channels.bluebubbles.serverUrl` + `channels.bluebubbles.password` and a webhook (`channels.bluebubbles.webhookPath`).
- The BlueBubbles server runs on macOS; the Gateway can run on macOS or elsewhere.

### [iMessage (legacy)](https://docs.openclaw.ai/channels/imessage)

- Legacy macOS-only integration via `imsg` (Messages must be signed in).
- If `channels.imessage.groups` is set, it becomes a group allowlist; include `"*"` to allow all.

### [Microsoft Teams](https://docs.openclaw.ai/channels/msteams)

- Configure a Teams app + Bot Framework, then add a `msteams` config section.
- Allowlist who can talk via `msteams.allowFrom`; group access via `msteams.groupAllowFrom` or `msteams.groupPolicy: "open"`.

### [WebChat](https://docs.openclaw.ai/web/webchat)

- Uses the Gateway WebSocket; no separate WebChat port/config.

Browser control (optional):

```json5
{
  browser: {
    enabled: true,
    color: "#FF4500",
  },
}
```

## Docs

Use these when you’re past the onboarding flow and want the deeper reference.

- [Start with the docs index for navigation and “what’s where.”](https://docs.openclaw.ai)
- [Read the architecture overview for the gateway + protocol model.](https://docs.openclaw.ai/concepts/architecture)
- [Use the full configuration reference when you need every key and example.](https://docs.openclaw.ai/gateway/configuration)
- [Run the Gateway by the book with the operational runbook.](https://docs.openclaw.ai/gateway)
- [Learn how the Control UI/Web surfaces work and how to expose them safely.](https://docs.openclaw.ai/web)
- [Understand remote access over SSH tunnels or tailnets.](https://docs.openclaw.ai/gateway/remote)
- [Follow the onboarding wizard flow for a guided setup.](https://docs.openclaw.ai/start/wizard)
- [Wire external triggers via the webhook surface.](https://docs.openclaw.ai/automation/webhook)
- [Set up Gmail Pub/Sub triggers.](https://docs.openclaw.ai/automation/gmail-pubsub)
- [Learn the macOS menu bar companion details.](https://docs.openclaw.ai/platforms/mac/menu-bar)
- [Platform guides: Windows (WSL2)](https://docs.openclaw.ai/platforms/windows), [Linux](https://docs.openclaw.ai/platforms/linux), [macOS](https://docs.openclaw.ai/platforms/macos), [iOS](https://docs.openclaw.ai/platforms/ios), [Android](https://docs.openclaw.ai/platforms/android)
- [Debug common failures with the troubleshooting guide.](https://docs.openclaw.ai/channels/troubleshooting)
- [Review security guidance before exposing anything.](https://docs.openclaw.ai/gateway/security)

## Advanced docs (discovery + control)

- [Discovery + transports](https://docs.openclaw.ai/gateway/discovery)
- [Bonjour/mDNS](https://docs.openclaw.ai/gateway/bonjour)
- [Gateway pairing](https://docs.openclaw.ai/gateway/pairing)
- [Remote gateway README](https://docs.openclaw.ai/gateway/remote-gateway-readme)
- [Control UI](https://docs.openclaw.ai/web/control-ui)
- [Dashboard](https://docs.openclaw.ai/web/dashboard)

## Operations & troubleshooting

- [Health checks](https://docs.openclaw.ai/gateway/health)
- [Gateway lock](https://docs.openclaw.ai/gateway/gateway-lock)
- [Background process](https://docs.openclaw.ai/gateway/background-process)
- [Browser troubleshooting (Linux)](https://docs.openclaw.ai/tools/browser-linux-troubleshooting)
- [Logging](https://docs.openclaw.ai/logging)

## Deep dives

- [Agent loop](https://docs.openclaw.ai/concepts/agent-loop)
- [Presence](https://docs.openclaw.ai/concepts/presence)
- [TypeBox schemas](https://docs.openclaw.ai/concepts/typebox)
- [RPC adapters](https://docs.openclaw.ai/reference/rpc)
- [Queue](https://docs.openclaw.ai/concepts/queue)

## Workspace & skills

- [Skills config](https://docs.openclaw.ai/tools/skills-config)
- [Default AGENTS](https://docs.openclaw.ai/reference/AGENTS.default)
- [Templates: AGENTS](https://docs.openclaw.ai/reference/templates/AGENTS)
- [Templates: BOOTSTRAP](https://docs.openclaw.ai/reference/templates/BOOTSTRAP)
- [Templates: IDENTITY](https://docs.openclaw.ai/reference/templates/IDENTITY)
- [Templates: SOUL](https://docs.openclaw.ai/reference/templates/SOUL)
- [Templates: TOOLS](https://docs.openclaw.ai/reference/templates/TOOLS)
- [Templates: USER](https://docs.openclaw.ai/reference/templates/USER)

## Platform internals

- [macOS dev setup](https://docs.openclaw.ai/platforms/mac/dev-setup)
- [macOS menu bar](https://docs.openclaw.ai/platforms/mac/menu-bar)
- [macOS voice wake](https://docs.openclaw.ai/platforms/mac/voicewake)
- [iOS node](https://docs.openclaw.ai/platforms/ios)
- [Android node](https://docs.openclaw.ai/platforms/android)
- [Windows (WSL2)](https://docs.openclaw.ai/platforms/windows)
- [Linux app](https://docs.openclaw.ai/platforms/linux)

## Email hooks (Gmail)

- [docs.openclaw.ai/gmail-pubsub](https://docs.openclaw.ai/automation/gmail-pubsub)

## Molty

OpenClaw was built for **Molty**, a space lobster AI assistant. 🦞
by Peter Steinberger and the community.

OpenClawは、宇宙ロブスターAIアシスタント**Molty**のために構築されました。🦞
Peter Steinbergerとコミュニティによる作品です。

> > > > > > > upstream/main

- [openclaw.ai](https://openclaw.ai)
- [soul.md](https://soul.md)
- [steipete.me](https://steipete.me)
- [@openclaw](https://x.com/openclaw)
