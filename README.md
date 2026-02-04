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

**OpenClaw**は、自分のデバイス上で実行できる_パーソナルAIアシスタント_です。すでに使用しているチャンネル（WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、Microsoft Teams、WebChat、**LINE**）や、BlueBubbles、Matrix、Zalo、Zalo Personalなどの拡張チャンネルで応答します。macOS/iOS/Androidで音声の入出力が可能で、制御可能なライブCanvasをレンダリングできます。Gatewayはコントロールプレーンであり、製品自体がアシスタントです。

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

ローカルで高速、常時稼働のパーソナルシングルユーザーアシスタントをお求めの方に最適です。

[Website](https://openclaw.ai) · [Docs](https://docs.openclaw.ai) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [Getting Started](https://docs.openclaw.ai/start/getting-started) · [Updating](https://docs.openclaw.ai/install/updating) · [Showcase](https://docs.openclaw.ai/start/showcase) · [FAQ](https://docs.openclaw.ai/start/faq) · [Wizard](https://docs.openclaw.ai/start/wizard) · [Nix](https://github.com/openclaw/nix-clawdbot) · [Docker](https://docs.openclaw.ai/install/docker) · [Discord](https://discord.gg/clawd)

---

## 🚀 Latest Features 2025 / 最新機能（2025年）

| Feature / 機能 | Description / 説明 | Status / ステータス |
|---------------|-------------------|-------------------|
| 🟢 **LINE Integration** | Full LINE Messaging API support with automated ngrok webhook setup / ngrok自動設定スクリプト付きLINE Messaging API完全対応 | ✅ Production Ready |
| 🎙️ **Voice Wake / Talk Mode** | Always-on speech recognition & conversation mode for macOS/iOS/Android / macOS/iOS/Android向け常時音声認識＆会話モード | ✅ Available |
| 🎨 **Live Canvas with A2UI** | Agent-driven visual workspace with A2UI integration / A2UI統合によるエージェント駆動型ビジュアルワークスペース | ✅ Available |
| 🤖 **Codex/OpenCode Integration** | Bidirectional communication with AI coding assistants via LINE / LINE経由でのAIコーディングアシスタントとの双方向通信 | ✅ Available |
| 📱 **Mobile Nodes** | iOS/Android companion apps for camera, screen recording, and more / カメラ、画面録画などのiOS/Androidコンパニオンアプリ | ✅ Available |
| 🌐 **WebSocket Control Plane** | Real-time WebSocket gateway for all device communication / すべてのデバイス通信向けリアルタイムWebSocketゲートウェイ | ✅ Core Feature |
| 📨 **Multi-Channel Support** | 14+ messaging channels supported / 14以上のメッセージングチャンネル対応 | ✅ Production Ready |

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

```json5
// ~/.openclaw/openclaw.json
{
  channels: {
    line: {
      enabled: true,
      channelId: "YOUR_CHANNEL_ID",        // LINEチャンネルID
      channelSecret: "YOUR_CHANNEL_SECRET", // LINEチャンネルシークレット
      accessToken: "YOUR_ACCESS_TOKEN",     // LINEアクセストークン
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

| Variable / 変数 | Description / 説明 | Source / 取得元 |
|-----------------|-------------------|----------------|
| `LINE_CHANNEL_ID` | Your LINE channel ID / LINEチャンネルID | LINE Console → Channel Settings |
| `LINE_CHANNEL_SECRET` | Channel secret for webhook verification / Webhook検証用チャンネルシークレット | LINE Console → Channel Settings |
| `LINE_ACCESS_TOKEN` | Long-lived channel access token / 長期チャンネルアクセストークン | LINE Console → Messaging API |

#### Optional Variables / オプション変数：

| Variable / 変数 | Description / 説明 | Default / デフォルト |
|-----------------|-------------------|---------------------|
| `PORT` | OpenClaw gateway port / OpenClawゲートウェイポート | `18789` |
| `NGROK_AUTH_TOKEN` | Your ngrok authentication token / ngrok認証トークン | (none / なし) |
| `LINE_WEBHOOK_PATH` | Custom webhook path / カスタムwebhookパス | `/line/webhook` |
| `LINE_DM_POLICY` | Direct message security policy / DMセキュリティポリシー | `require-pairing` |

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

| Issue / 問題 | Solution / 解決策 |
|--------------|-------------------|
| Webhook verification fails / Webhook検証が失敗 | Ensure ngrok is running on port 18789 / ngrokがポート18789で実行されていることを確認 |
| No response in LINE / LINEで応答がない | Check pairing approval status / ペアリング承認状態を確認 |
| ngrok URL not copying / ngrok URLがコピーされない | Run PowerShell as Administrator / PowerShellを管理者として実行 |
| Connection timeout / 接続タイムアウト | Check firewall settings / ファイアウォール設定を確認 |
| "Use webhook" disabled / "Use webhook"が無効 | Enable in LINE Console and click [Verify] / LINE Consoleで有効化し[Verify]をクリック |

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

| Feature / 機能 | Description / 説明 | Status / ステータス |
|---------------|-------------------|-------------------|
| 🔄 **OSC Relay** | Bidirectional OSC message relay / 双方向OSCメッセージリレー | ✅ Available |
| 🔐 **Auto-Login** | Automatic authentication with 2FA/TOTP support / 2FA/TOTP対応の自動認証 | ✅ Available |
| 💬 **Chatbox** | Send messages to VRChat chatbox (max 144 chars) / VRChatチャットボックスへメッセージ送信（最大144文字） | ✅ Available |
| 🎭 **Avatar Params** | Control avatar parameters (bool/int/float) / アバターパラメーター制御（真偽値/整数/浮動小数） | ✅ Available |
| 🎮 **Input Commands** | Send Jump/Move/Look/Voice inputs (PRO) / ジャンプ/移動/視点/音声入力送信（PRO） | ✅ PRO Only |
| 📡 **OSC Listener** | Receive OSC messages from VRChat / VRChatからのOSCメッセージ受信 | ✅ Available |
| 🛡️ **Security Guards** | Permission-based access control / 権限ベースのアクセス制御 | ✅ Available |

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

| Tool / ツール | Description / 説明 | Permission / 権限 |
|--------------|-------------------|------------------|
| `vrchat_login` | Authenticate with VRChat (2FA/TOTP auto-support) / VRChat認証（2FA/TOTP自動対応） | Any / 任意 |
| `vrchat_send_osc` | Send OSC messages to VRChat / VRChatへOSCメッセージ送信 | STANDARD+ |
| `vrchat_chatbox` | Send messages to chatbox (max 144 chars) / チャットボックスへメッセージ送信（最大144文字） | STANDARD+ |
| `vrchat_set_avatar_param` | Set avatar parameters (bool/int/float) / アバターパラメーター設定 | STANDARD+ |
| `vrchat_input` | Send input commands (Jump, Move, Look, Voice) / 入力コマンド送信 | PRO only |
| `vrchat_start_listener` | Start OSC listener to receive messages / OSCリスナー開始 | STANDARD+ |
| `vrchat_stop_listener` | Stop OSC listener / OSCリスナー停止 | STANDARD+ |
| `vrchat_logout` | Logout and clear session / ログアウトとセッションクリア | Any / 任意 |

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

| Variable / 変数 | Description / 説明 | Required / 必須 |
|-----------------|-------------------|----------------|
| `VRCHAT_USERNAME` | Your VRChat username / VRChatユーザー名 | ✅ Yes |
| `VRCHAT_PASSWORD` | Your VRChat password / VRChatパスワード | ✅ Yes |

#### Optional Variables / オプション変数：

| Variable / 変数 | Description / 説明 | Default / デフォルト |
|-----------------|-------------------|---------------------|
| `VRCHAT_2FA_SECRET` | TOTP secret for automatic 2FA / 自動2FA用TOTPシークレット | (none / なし) |
| `VRCHAT_OSC_HOST` | OSC host address / OSCホストアドレス | `127.0.0.1` |
| `VRCHAT_OSC_SEND_PORT` | Port to send OSC messages / OSCメッセージ送信ポート | `9000` |
| `VRCHAT_OSC_RECEIVE_PORT` | Port to receive OSC messages / OSCメッセージ受信ポート | `9001` |
| `VRCHAT_PERMISSION_PROFILE` | Permission level (STANDARD/PRO) / 権限レベル | `STANDARD` |

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

| Profile / プロファイル | Features / 機能 | Use Case / 用途 |
|----------------------|-----------------|----------------|
| **STANDARD** | Chatbox, Avatar Params, OSC Listener / チャットボックス、アバターパラメーター、OSCリスナー | General automation / 一般的な自動化 |
| **PRO** | All features + Input Commands / 全機能 + 入力コマンド | Full avatar control / 完全なアバター制御 |

**Warning / 警告:** Input commands (`vrchat_input`) can control your avatar's movement and actions. Only enable PRO permissions if you trust the AI agent completely.

入力コマンド（`vrchat_input`）はアバターの動きやアクションを制御できます。AIエージェントを完全に信頼している場合のみPRO権限を有効化してください。

---

### 🐛 Troubleshooting / トラブルシューティング

#### Common Issues / 一般的な問題：

| Issue / 問題 | Solution / 解決策 |
|--------------|-------------------|
| Login fails / ログイン失敗 | Check credentials and 2FA secret / 認証情報と2FAシークレットを確認 |
| OSC not received / OSC受信されない | Verify VRChat OSC is enabled in settings / VRChat設定でOSCが有効か確認 |
| Connection refused / 接続拒否 | Check firewall and port settings / ファイアウォールとポート設定を確認 |
| Chatbox not appearing / チャットボックス非表示 | Max 144 characters - check message length / 最大144文字 - メッセージ長を確認 |
| Input commands fail / 入力コマンド失敗 | Requires PRO permission profile / PRO権限プロファイルが必要 |

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

## 📨 Supported Channels / 対応チャンネル

| Channel / チャンネル | Type / タイプ | DM Support / DM対応 | Group Support / グループ対応 |
|---------------------|--------------|---------------------|---------------------------|
| 🟢 **LINE** | Extension | ✅ Yes | ✅ Yes |
| 💬 WhatsApp | Core | ✅ Yes | ✅ Yes |
| ✈️ Telegram | Core | ✅ Yes | ✅ Yes |
| 💼 Slack | Core | ✅ Yes | ✅ Yes |
| 🎮 Discord | Core | ✅ Yes | ✅ Yes |
| 🔍 Google Chat | Core | ✅ Yes | ✅ Yes |
| 📡 Signal | Core | ✅ Yes | ✅ Yes |
| 🍎 iMessage | Core | ✅ Yes (macOS) | ✅ Yes |
| 🔵 BlueBubbles | Extension | ✅ Yes | ✅ Yes |
| 👥 Microsoft Teams | Extension | ✅ Yes | ✅ Yes |
| 🕸️ Matrix | Extension | ✅ Yes | ✅ Yes |
| 🇻🇳 Zalo | Extension | ✅ Yes | ✅ Yes |
| 👤 Zalo Personal | Extension | ✅ Yes | ❌ No |
| 🌐 WebChat | Core | ✅ Yes | ✅ Yes |

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

OpenClaw was built for **Molty**, a space lobster AI assistant. 🦞
by Peter Steinberger and the community.

OpenClawは、宇宙ロブスターAIアシスタント**Molty**のために構築されました。🦞
Peter Steinbergerとコミュニティによる作品です。

- [openclaw.ai](https://openclaw.ai)
- [soul.md](https://soul.md)
- [steipete.me](https://steipete.me)
- [@openclaw](https://x.com/openclaw)

---

## 🤝 Community & Contributing / コミュニティと貢献

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, maintainers, and how to submit PRs.
AI/vibe-coded PRs welcome! 🤖

ガイドライン、メンテナー、PRの提出方法については[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。
AI/vibe-coded PRも歓迎します！🤖

### Special Thanks / 特別な感謝

Special thanks to [Mario Zechner](https://mariozechner.at/) for his support and for [pi-mono](https://github.com/badlogic/pi-mono).
Special thanks to Adam Doppelt for lobster.bot.

[Mario Zechner](https://mariozechner.at/)のサポートと[pi-mono](https://github.com/badlogic/pi-mono)に感謝します。
Adam Doppeltのlobster.botにも特別な感謝を。

### Thanks to all clawtributors / すべてのclawtributorに感謝

<p align="left">
  <a href="https://github.com/steipete"><img src="https://avatars.githubusercontent.com/u/58493?v=4&s=48" width="48" height="48" alt="steipete" title="steipete"/></a> <a href="https://github.com/cpojer"><img src="https://avatars.githubusercontent.com/u/13352?v=4&s=48" width="48" height="48" alt="cpojer" title="cpojer"/></a> <a href="https://github.com/plum-dawg"><img src="https://avatars.githubusercontent.com/u/5909950?v=4&s=48" width="48" height="48" alt="plum-dawg" title="plum-dawg"/></a> <a href="https://github.com/bohdanpodvirnyi"><img src="https://avatars.githubusercontent.com/u/31819391?v=4&s=48" width="48" height="48" alt="bohdanpodvirnyi" title="bohdanpodvirnyi"/></a> <a href="https://github.com/iHildy"><img src="https://avatars.githubusercontent.com/u/25069719?v=4&s=48" width="48" height="48" alt="iHildy" title="iHildy"/></a> <a href="https://github.com/jaydenfyi"><img src="https://avatars.githubusercontent.com/u/213395523?v=4&s=48" width="48" height="48" alt="jaydenfyi" title="jaydenfyi"/></a> <a href="https://github.com/joaohlisboa"><img src="https://avatars.githubusercontent.com/u/8200873?v=4&s=48" width="48" height="48" alt="joaohlisboa" title="joaohlisboa"/></a> <a href="https://github.com/mneves75"><img src="https://avatars.githubusercontent.com/u/2423436?v=4&s=48" width="48" height="48" alt="mneves75" title="mneves75"/></a> <a href="https://github.com/MatthieuBizien"><img src="https://avatars.githubusercontent.com/u/173090?v=4&s=48" width="48" height="48" alt="MatthieuBizien" title="MatthieuBizien"/></a> <a href="https://github.com/MaudeBot"><img src="https://avatars.githubusercontent.com/u/255777700?v=4&s=48" width="48" height="48" alt="MaudeBot" title="MaudeBot"/></a>
  <a href="https://github.com/Glucksberg"><img src="https://avatars.githubusercontent.com/u/80581902?v=4&s=48" width="48" height="48" alt="Glucksberg" title="Glucksberg"/></a> <a href="https://github.com/rahthakor"><img src="https://avatars.githubusercontent.com/u/8470553?v=4&s=48" width="48" height="48" alt="rahthakor" title="rahthakor"/></a> <a href="https://github.com/vrknetha"><img src="https://avatars.githubusercontent.com/u/20596261?v=4&s=48" width="48" height="48" alt="vrknetha" title="vrknetha"/></a> <a href="https://github.com/radek-paclt"><img src="https://avatars.githubusercontent.com/u/50451445?v=4&s=48" width="48" height="48" alt="radek-paclt" title="radek-paclt"/></a> <a href="https://github.com/vignesh07"><img src="https://avatars.githubusercontent.com/u/1436853?v=4&s=48" width="48" height="48" alt="vignesh07" title="vignesh07"/></a> <a href="https://github.com/joshp123"><img src="https://avatars.githubusercontent.com/u/1497361?v=4&s=48" width="48" height="48" alt="joshp123" title="joshp123"/></a> <a href="https://github.com/tobiasbischoff"><img src="https://avatars.githubusercontent.com/u/711564?v=4&s=48" width="48" height="48" alt="Tobias Bischoff" title="Tobias Bischoff"/></a> <a href="https://github.com/sebslight"><img src="https://avatars.githubusercontent.com/u/19554889?v=4&s=48" width="48" height="48" alt="sebslight" title="sebslight"/></a> <a href="https://github.com/czekaj"><img src="https://avatars.githubusercontent.com/u/1464539?v=4&s=48" width="48" height="48" alt="czekaj" title="czekaj"/></a> <a href="https://github.com/mukhtharcm"><img src="https://avatars.githubusercontent.com/u/56378562?v=4&s=48" width="48" height="48" alt="mukhtharcm" title="mukhtharcm"/></a>
  <a href="https://github.com/maxsumrall"><img src="https://avatars.githubusercontent.com/u/628843?v=4&s=48" width="48" height="48" alt="maxsumrall" title="maxsumrall"/></a> <a href="https://github.com/xadenryan"><img src="https://avatars.githubusercontent.com/u/165437834?v=4&s=48" width="48" height="48" alt="xadenryan" title="xadenryan"/></a> <a href="https://github.com/mbelinky"><img src="https://avatars.githubusercontent.com/u/132747814?v=4&s=48" width="48" height="48" alt="Mariano Belinky" title="Mariano Belinky"/></a> <a href="https://github.com/rodrigouroz"><img src="https://avatars.githubusercontent.com/u/384037?v=4&s=48" width="48" height="48" alt="rodrigouroz" title="rodrigouroz"/></a> <a href="https://github.com/tyler6204"><img src="https://avatars.githubusercontent.com/u/64381258?v=4&s=48" width="48" height="48" alt="tyler6204" title="tyler6204"/></a> <a href="https://github.com/juanpablodlc"><img src="https://avatars.githubusercontent.com/u/92012363?v=4&s=48" width="48" height="48" alt="juanpablodlc" title="juanpablodlc"/></a> <a href="https://github.com/conroywhitney"><img src="https://avatars.githubusercontent.com/u/249891?v=4&s=48" width="48" height="48" alt="conroywhitney" title="conroywhitney"/></a> <a href="https://github.com/hsrvc"><img src="https://avatars.githubusercontent.com/u/129702169?v=4&s=48" width="48" height="48" alt="hsrvc" title="hsrvc"/></a> <a href="https://github.com/magimetal"><img src="https://avatars.githubusercontent.com/u/36491250?v=4&s=48" width="48" height="48" alt="magimetal" title="magimetal"/></a> <a href="https://github.com/zerone0x"><img src="https://avatars.githubusercontent.com/u/39543393?v=4&s=48" width="48" height="48" alt="zerone0x" title="zerone0x"/></a>
  <a href="https://github.com/meaningfool"><img src="https://avatars.githubusercontent.com/u/2862331?v=4&s=48" width="48" height="48" alt="meaningfool" title="meaningfool"/></a> <a href="https://github.com/patelhiren"><img src="https://avatars.githubusercontent.com/u/172098?v=4&s=48" width="48" height="48" alt="patelhiren" title="patelhiren"/></a> <a href="https://github.com/NicholasSpisak"><img src="https://avatars.githubusercontent.com/u/129075147?v=4&s=48" width="48" height="48" alt="NicholasSpisak" title="NicholasSpisak"/></a> <a href="https://github.com/jonisjongithub"><img src="https://avatars.githubusercontent.com/u/86072337?v=4&s=48" width="48" height="48" alt="jonisjongithub" title="jonisjongithub"/></a> <a href="https://github.com/AbhisekBasu1"><img src="https://avatars.githubusercontent.com/u/40645221?v=4&s=48" width="48" height="48" alt="abhisekbasu1" title="abhisekbasu1"/></a> <a href="https://github.com/jamesgroat"><img src="https://avatars.githubusercontent.com/u/2634024?v=4&s=48" width="48" height="48" alt="jamesgroat" title="jamesgroat"/></a> <a href="https://github.com/claude"><img src="https://avatars.githubusercontent.com/u/81847?v=4&s=48" width="48" height="48" alt="claude" title="claude"/></a> <a href="https://github.com/JustYannicc"><img src="https://avatars.githubusercontent.com/u/52761674?v=4&s=48" width="48" height="48" alt="JustYannicc" title="JustYannicc"/></a> <a href="https://github.com/Hyaxia"><img src="https://avatars.githubusercontent.com/u/36747317?v=4&s=48" width="48" height="48" alt="Hyaxia" title="Hyaxia"/></a> <a href="https://github.com/dantelex"><img src="https://avatars.githubusercontent.com/u/631543?v=4&s=48" width="48" height="48" alt="dantelex" title="dantelex"/></a>
  <a href="https://github.com/SocialNerd42069"><img src="https://avatars.githubusercontent.com/u/118244303?v=4&s=48" width="48" height="48" alt="SocialNerd42069" title="SocialNerd42069"/></a> <a href="https://github.com/daveonkels"><img src="https://avatars.githubusercontent.com/u/533642?v=4&s=48" width="48" height="48" alt="daveonkels" title="daveonkels"/></a> <a href="https://github.com/apps/google-labs-jules"><img src="https://avatars.githubusercontent.com/in/842251?v=4&s=48" width="48" height="48" alt="google-labs-jules[bot]" title="google-labs-jules[bot]"/></a> <a href="https://github.com/lc0rp"><img src="https://avatars.githubusercontent.com/u/2609441?v=4&s=48" width="48" height="48" alt="lc0rp" title="lc0rp"/></a> <a href="https://github.com/mousberg"><img src="https://avatars.githubusercontent.com/u/57605064?v=4&s=48" width="48" height="48" alt="mousberg" title="mousberg"/></a> <a href="https://github.com/adam91holt"><img src="https://avatars.githubusercontent.com/u/9592417?v=4&s=48" width="48" height="48" alt="adam91holt" title="adam91holt"/></a> <a href="https://github.com/hougangdev"><img src="https://avatars.githubusercontent.com/u/105773686?v=4&s=48" width="48" height="48" alt="hougangdev" title="hougangdev"/></a> <a href="https://github.com/gumadeiras"><img src="https://avatars.githubusercontent.com/u/5599352?v=4&s=48" width="48" height="48" alt="gumadeiras" title="gumadeiras"/></a> <a href="https://github.com/shakkernerd"><img src="https://avatars.githubusercontent.com/u/165377636?v=4&s=48" width="48" height="48" alt="shakkernerd" title="shakkernerd"/></a> <a href="https://github.com/mteam88"><img src="https://avatars.githubusercontent.com/u/84196639?v=4&s=48" width="48" height="48" alt="mteam88" title="mteam88"/></a>
  <a href="https://github.com/hirefrank"><img src="https://avatars.githubusercontent.com/u/183158?v=4&s=48" width="48" height="48" alt="hirefrank" title="hirefrank"/></a> <a href="https://github.com/joeynyc"><img src="https://avatars.githubusercontent.com/u/17919866?v=4&s=48" width="48" height="48" alt="joeynyc" title="joeynyc"/></a> <a href="https://github.com/orlyjamie"><img src="https://avatars.githubusercontent.com/u/6668807?v=4&s=48" width="48" height="48" alt="orlyjamie" title="orlyjamie"/></a> <a href="https://github.com/dbhurley"><img src="https://avatars.githubusercontent.com/u/5251425?v=4&s=48" width="48" height="48" alt="dbhurley" title="dbhurley"/></a> <a href="https://github.com/omniwired"><img src="https://avatars.githubusercontent.com/u/322761?v=4&s=48" width="48" height="48" alt="Eng. Juan Combetto" title="Eng. Juan Combetto"/></a> <a href="https://github.com/TSavo"><img src="https://avatars.githubusercontent.com/u/877990?v=4&s=48" width="48" height="48" alt="TSavo" title="TSavo"/></a> <a href="https://github.com/julianengel"><img src="https://avatars.githubusercontent.com/u/10634231?v=4&s=48" width="48" height="48" alt="julianengel" title="julianengel"/></a> <a href="https://github.com/bradleypriest"><img src="https://avatars.githubusercontent.com/u/167215?v=4&s=48" width="48" height="48" alt="bradleypriest" title="bradleypriest"/></a> <a href="https://github.com/benithors"><img src="https://avatars.githubusercontent.com/u/20652882?v=4&s=48" width="48" height="48" alt="benithors" title="benithors"/></a> <a href="https://github.com/rohannagpal"><img src="https://avatars.githubusercontent.com/u/4009239?v=4&s=48" width="48" height="48" alt="rohannagpal" title="rohannagpal"/></a>
  <a href="https://github.com/timolins"><img src="https://avatars.githubusercontent.com/u/1440854?v=4&s=48" width="48" height="48" alt="timolins" title="timolins"/></a> <a href="https://github.com/f-trycua"><img src="https://avatars.githubusercontent.com/u/195596869?v=4&s=48" width="48" height="48" alt="f-trycua" title="f-trycua"/></a> <a href="https://github.com/benostein"><img src="https://avatars.githubusercontent.com/u/31802821?v=4&s=48" width="48" height="48" alt="benostein" title="benostein"/></a> <a href="https://github.com/elliotsecops"><img src="https://avatars.githubusercontent.com/u/141947839?v=4&s=48" width="48" height="48" alt="elliotsecops" title="elliotsecops"/></a> <a href="https://github.com/Nachx639"><img src="https://avatars.githubusercontent.com/u/71144023?v=4&s=48" width="48" height="48" alt="nachx639" title="nachx639"/></a> <a href="https://github.com/pvoo"><img src="https://avatars.githubusercontent.com/u/20116814?v=4&s=48" width="48" height="48" alt="pvoo" title="pvoo"/></a> <a href="https://github.com/sreekaransrinath"><img src="https://avatars.githubusercontent.com/u/50989977?v=4&s=48" width="48" height="48" alt="sreekaransrinath" title="sreekaransrinath"/></a> <a href="https://github.com/gupsammy"><img src="https://avatars.githubusercontent.com/u/20296019?v=4&s=48" width="48" height="48" alt="gupsammy" title="gupsammy"/></a> <a href="https://github.com/cristip73"><img src="https://avatars.githubusercontent.com/u/24499421?v=4&s=48" width="48" height="48" alt="cristip73" title="cristip73"/></a> <a href="https://github.com/stefangalescu"><img src="https://avatars.githubusercontent.com/u/52995748?v=4&s=48" width="48" height="48" alt="stefangalescu" title="stefangalescu"/></a>
  <a href="https://github.com/nachoiacovino"><img src="https://avatars.githubusercontent.com/u/50103937?v=4&s=48" width="48" height="48" alt="nachoiacovino" title="nachoiacovino"/></a> <a href="https://github.com/vsabavat"><img src="https://avatars.githubusercontent.com/u/50385532?v=4&s=48" width="48" height="48" alt="Vasanth Rao Naik Sabavat" title="Vasanth Rao Naik Sabavat"/></a> <a href="https://github.com/petter-b"><img src="https://avatars.githubusercontent.com/u/62076402?v=4&s=48" width="48" height="48" alt="petter-b" title="petter-b"/></a> <a href="https://github.com/thewilloftheshadow"><img src="https://avatars.githubusercontent.com/u/35580099?v=4&s=48" width="48" height="48" alt="thewilloftheshadow" title="thewilloftheshadow"/></a> <a href="https://github.com/scald"><img src="https://avatars.githubusercontent.com/u/1215913?v=4&s=48" width="48" height="48" alt="scald" title="scald"/></a> <a href="https://github.com/andranik-sahakyan"><img src="https://avatars.githubusercontent.com/u/8908029?v=4&s=48" width="48" height="48" alt="andranik-sahakyan" title="andranik-sahakyan"/></a> <a href="https://github.com/davidguttman"><img src="https://avatars.githubusercontent.com/u/431696?v=4&s=48" width="48" height="48" alt="davidguttman" title="davidguttman"/></a> <a href="https://github.com/sleontenko"><img src="https://avatars.githubusercontent.com/u/7135949?v=4&s=48" width="48" height="48" alt="sleontenko" title="sleontenko"/></a> <a href="https://github.com/denysvitali"><img src="https://avatars.githubusercontent.com/u/4939519?v=4&s=48" width="48" height="48" alt="denysvitali" title="denysvitali"/></a> <a href="https://github.com/sircrumpet"><img src="https://avatars.githubusercontent.com/u/4436535?v=4&s=48" width="48" height="48" alt="sircrumpet" title="sircrumpet"/></a>
  <a href="https://github.com/peschee"><img src="https://avatars.githubusercontent.com/u/63866?v=4&s=48" width="48" height="48" alt="peschee" title="peschee"/></a> <a href="https://github.com/nonggialiang"><img src="https://avatars.githubusercontent.com/u/14367839?v=4&s=48" width="48" height="48" alt="nonggialiang" title="nonggialiang"/></a> <a href="https://github.com/rafaelreis-r"><img src="https://avatars.githubusercontent.com/u/57492577?v=4&s=48" width="48" height="48" alt="rafaelreis-r" title="rafaelreis-r"/></a> <a href="https://github.com/dominicnunez"><img src="https://avatars.githubusercontent.com/u/43616264?v=4&s=48" width="48" height="48" alt="dominicnunez" title="dominicnunez"/></a> <a href="https://github.com/lploc94"><img src="https://avatars.githubusercontent.com/u/28453843?v=4&s=48" width="48" height="48" alt="lploc94" title="lploc94"/></a> <a href="https://github.com/ratulsarna"><img src="https://avatars.githubusercontent.com/u/105903728?v=4&s=48" width="48" height="48" alt="ratulsarna" title="ratulsarna"/></a> <a href="https://github.com/lutr0"><img src="https://avatars.githubusercontent.com/u/76906369?v=4&s=48" width="48" height="48" alt="lutr0" title="lutr0"/></a> <a href="https://github.com/sfo2001"><img src="https://avatars.githubusercontent.com/u/103369858?v=4&s=48" width="48" height="48" alt="sfo2001" title="sfo2001"/></a> <a href="https://github.com/kiranjd"><img src="https://avatars.githubusercontent.com/u/25822851?v=4&s=48" width="48" height="48" alt="kiranjd" title="kiranjd"/></a> <a href="https://github.com/danielz1z"><img src="https://avatars.githubusercontent.com/u/235270390?v=4&s=48" width="48" height="48" alt="danielz1z" title="danielz1z"/></a>
  <a href="https://github.com/AdeboyeDN"><img src="https://avatars.githubusercontent.com/u/65312338?v=4&s=48" width="48" height="48" alt="AdeboyeDN" title="AdeboyeDN"/></a> <a href="https://github.com/Alg0rix"><img src="https://avatars.githubusercontent.com/u/53804949?v=4&s=48" width="48" height="48" alt="Alg0rix" title="Alg0rix"/></a> <a href="https://github.com/Takhoffman"><img src="https://avatars.githubusercontent.com/u/781889?v=4&s=48" width="48" height="48" alt="Takhoffman" title="Takhoffman"/></a> <a href="https://github.com/papago2355"><img src="https://avatars.githubusercontent.com/u/68721273?v=4&s=48" width="48" height="48" alt="papago2355" title="papago2355"/></a> <a href="https://github.com/emanuelst"><img src="https://avatars.githubusercontent.com/u/9994339?v=4&s=48" width="48" height="48" alt="emanuelst" title="emanuelst"/></a> <a href="https://github.com/evanotero"><img src="https://avatars.githubusercontent.com/u/13204105?v=4&s=48" width="48" height="48" alt="evanotero" title="evanotero"/></a> <a href="https://github.com/KristijanJovanovski"><img src="https://avatars.githubusercontent.com/u/8942284?v=4&s=48" width="48" height="48" alt="KristijanJovanovski" title="KristijanJovanovski"/></a> <a href="https://github.com/jlowin"><img src="https://avatars.githubusercontent.com/u/153965?v=4&s=48" width="48" height="48" alt="jlowin" title="jlowin"/></a> <a href="https://github.com/rdev"><img src="https://avatars.githubusercontent.com/u/8418866?v=4&s=48" width="48" height="48" alt="rdev" title="rdev"/></a> <a href="https://github.com/rhuanssauro"><img src="https://avatars.githubusercontent.com/u/164682191?v=4&s=48" width="48" height="48" alt="rhuanssauro" title="rhuanssauro"/></a>
  <a href="https://github.com/joshrad-dev"><img src="https://avatars.githubusercontent.com/u/62785552?v=4&s=48" width="48" height="48" alt="joshrad-dev" title="joshrad-dev"/></a> <a href="https://github.com/osolmaz"><img src="https://avatars.githubusercontent.com/u/2453968?v=4&s=48" width="48" height="48" alt="osolmaz" title="osolmaz"/></a> <a href="https://github.com/adityashaw2"><img src="https://avatars.githubusercontent.com/u/41204444?v=4&s=48" width="48" height="48" alt="adityashaw2" title="adityashaw2"/></a> <a href="https://github.com/CashWilliams"><img src="https://avatars.githubusercontent.com/u/613573?v=4&s=48" width="48" height="48" alt="CashWilliams" title="CashWilliams"/></a> <a href="https://github.com/search?q=sheeek"><img src="assets/avatar-placeholder.svg" width="48" height="48" alt="sheeek" title="sheeek"/></a> <a href="https://github.com/obviyus"><img src="https://avatars.githubusercontent.com/u/22031114?v=4&s=48" width="48" height="48" alt="obviyus" title="obviyus"/></a> <a href="https://github.com/ryancontent"><img src="https://avatars.githubusercontent.com/u/39743613?v=4&s=48" width="48" height="48" alt="ryancontent" title="ryancontent"/></a> <a href="https://github.com/jasonsschin"><img src="https://avatars.githubusercontent.com/u/1456889?v=4&s=48" width="48" height="48" alt="jasonsschin" title="jasonsschin"/></a> <a href="https://github.com/artuskg"><img src="https://avatars.githubusercontent.com/u/11966157?v=4&s=48" width="48" height="48" alt="artuskg" title="artuskg"/></a> <a href="https://github.com/onutc"><img src="https://avatars.githubusercontent.com/u/152018508?v=4&s=48" width="48" height="48" alt="onutc" title="onutc"/></a>
  <a href="https://github.com/pauloportella"><img src="https://avatars.githubusercontent.com/u/22947229?v=4&s=48" width="48" height="48" alt="pauloportella" title="pauloportella"/></a> <a href="https://github.com/HirokiKobayashi-R"><img src="https://avatars.githubusercontent.com/u/37167840?v=4&s=48" width="48" height="48" alt="HirokiKobayashi-R" title="HirokiKobayashi-R"/></a> <a href="https://github.com/ThanhNguyxn"><img src="https://avatars.githubusercontent.com/u/74597207?v=4&s=48" width="48" height="48" alt="ThanhNguyxn" title="ThanhNguyxn"/></a> <a href="https://github.com/yuting0624"><img src="https://avatars.githubusercontent.com/u/32728916?v=4&s=48" width="48" height="48" alt="yuting0624" title="yuting0624"/></a> <a href="https://github.com/neooriginal"><img src="https://avatars.githubusercontent.com/u/54811660?v=4&s=48" width="48" height="48" alt="neooriginal" title="neooriginal"/></a> <a href="https://github.com/ManuelHettich"><img src="https://avatars.githubusercontent.com/u/17690367?v=4&s=48" width="48" height="48" alt="manuelhettich" title="manuelhettich"/></a> <a href="https://github.com/minghinmatthewlam"><img src="https://avatars.githubusercontent.com/u/14224566?v=4&s=48" width="48" height="48" alt="minghinmatthewlam" title="minghinmatthewlam"/></a> <a href="https://github.com/manikv12"><img src="https://avatars.githubusercontent.com/u/49544491?v=4&s=48" width="48" height="48" alt="manikv12" title="manikv12"/></a> <a href="https://github.com/myfunc"><img src="https://avatars.githubusercontent.com/u/19294627?v=4&s=48" width="48" height="48" alt="myfunc" title="myfunc"/></a> <a href="https://github.com/travisirby"><img src="https://avatars.githubusercontent.com/u/5958376?v=4&s=48" width="48" height="48" alt="travisirby" title="travisirby"/></a>
  <a href="https://github.com/buddyh"><img src="https://avatars.githubusercontent.com/u/31752869?v=4&s=48" width="48" height="48" alt="buddyh" title="buddyh"/></a> <a href="https://github.com/connorshea"><img src="https://avatars.githubusercontent.com/u/2977353?v=4&s=48" width="48" height="48" alt="connorshea" title="connorshea"/></a> <a href="https://github.com/kyleok"><img src="https://avatars.githubusercontent.com/u/58307870?v=4&s=48" width="48" height="48" alt="kyleok" title="kyleok"/></a> <a href="https://github.com/mcinteerj"><img src="https://avatars.githubusercontent.com/u/3613653?v=4&s=48" width="48" height="48" alt="mcinteerj" title="mcinteerj"/></a> <a href="https://github.com/apps/dependabot"><img src="https://avatars.githubusercontent.com/in/29110?v=4&s=48" width="48" height="48" alt="dependabot[bot]" title="dependabot[bot]"/></a> <a href="https://github.com/amitbiswal007"><img src="https://avatars.githubusercontent.com/u/108086198?v=4&s=48" width="48" height="48" alt="amitbiswal007" title="amitbiswal007"/></a> <a href="https://github.com/John-Rood"><img src="https://avatars.githubusercontent.com/u/62669593?v=4&s=48" width="48" height="48" alt="John-Rood" title="John-Rood"/></a> <a href="https://github.com/timkrase"><img src="https://avatars.githubusercontent.com/u/38947626?v=4&s=48" width="48" height="48" alt="timkrase" title="timkrase"/></a> <a href="https://github.com/uos-status"><img src="https://avatars.githubusercontent.com/u/255712580?v=4&s=48" width="48" height="48" alt="uos-status" title="uos-status"/></a> <a href="https://github.com/gerardward2007"><img src="https://avatars.githubusercontent.com/u/3002155?v=4&s=48" width="48" height="48" alt="gerardward2007" title="gerardward2007"/></a>
</p>

---

## 📚 Documentation / ドキュメント

- [Start with the docs index / ドキュメントインデックスから開始](https://docs.openclaw.ai)
- [Architecture overview / アーキテクチャ概要](https://docs.openclaw.ai/concepts/architecture)
- [Full configuration reference / 完全な設定リファレンス](https://docs.openclaw.ai/gateway/configuration)
- [Gateway runbook / Gateway実行手順](https://docs.openclaw.ai/gateway)
- [LINE Setup Guide / LINE設定ガイド](https://docs.openclaw.ai/channels/line)
- [Security guide / セキュリティガイド](https://docs.openclaw.ai/gateway/security)
- [Troubleshooting / トラブルシューティング](https://docs.openclaw.ai/channels/troubleshooting)

---

<p align="center">
  <strong>Made with 🦞 by the OpenClaw Team and Contributors</strong><br>
  <strong>OpenClawチームとコントリビューターによる🦞を込めて作成</strong>
</p>
