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
2. **Check OpenClaw logs** - you'll see a pairing request / **OpenClawログを確認** - ペアリングリクエストが表示されます
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

One of OpenClaw's unique features is **bidirectional communication with AI coding assistants** through LINE. This enables you to:

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

| Variable / 変数 | Description / 説明 | Source /
