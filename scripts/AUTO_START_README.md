# 🦞 OpenClaw 完全自動起動設定ガイド

このスクリプト群を使用すると、PC起動時にOpenClawとLINE双方向通信が自動的に開始されます。

## 📁 ファイル構成

| ファイル | 説明 |
|---------|------|
| `openclaw-auto-start.ps1` | メイン自動起動スクリプト |
| `openclaw-install-startup.ps1` | スタートアップ登録スクリプト |
| `openclaw-install-startup.bat` | バッチ版スタートアップ登録 |
| `openclaw-start.bat` | 手動起動用スクリプト |
| `openclaw-auto-pairing.bat` | 自動ペアリング承認スクリプト |
| `openclaw-config-example.json` | 設定ファイルサンプル |

## 🚀 初回セットアップ

### 1. 前提条件確認

```powershell
# PowerShellを管理者として実行
# 以下のコマンドが実行可能か確認

tailscale --version   # Tailscale
pnpm --version        # pnpm (または npm)
node --version        # Node.js 22+
```

### 2. スタートアップ登録

```powershell
cd C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts

# PowerShellで実行
.\openclaw-install-startup.ps1
```

または、バッチファイルを使用:

```batch
.\openclaw-install-startup.bat
```

### 3. LINE Developers Console設定

1. https://developers.line.biz/console/ にアクセス
2. Messaging API設定を開く
3. **Webhook URL**を設定:
   ```
   https://あなたのTailscaleURL/line/webhook
   ```
4. **Use webhook**を有効化
5. **Auto-reply messages**を無効化

### 4. 初回のみ: ペアリング承認

```batch
.\openclaw-auto-pairing.bat
```

または、LINEからボットにメッセージを送信し、手動で:

```batch
openclaw pairing approve line コード
```

## 🔄 電源投入時の動作

1. **Windows起動**
2. **スタートアップスクリプト実行**
3. **Tailscale Funnel有効化** (ポート18789)
4. **OpenClaw Gateway起動**
5. **LINEペアリング自動承認**
6. **双方向通信開始**

## 📡 動作確認

```powershell
# ログ確認
Get-Content "$env:USERPROFILE\.openclaw\logs\openclaw-auto.log" -Tail 20

# Tailscale Funnel状態
tailscale funnel status

# ゲートウェイ状態
openclaw channels status --all
```

## 💬 LINEから使用可能なコマンド

| コマンド例 | 説明 |
|-----------|------|
| `PCの状態を確認して` | システム情報取得 |
| `ファイルを検索して` | ファイル検索 |
| `コードレビューして` | Codex連携 |
| `Geminiで分析して` | Gemini CLI連携 |
| `OpenCodeでタスク実行` | OpenCode連携 |

## 🛠️ トラブルシューティング

### Tailscale Funnelが起動しない

```powershell
# 管理者として実行
tailscale funnel --bg 18789

# Funnelが許可されているか確認
https://login.tailscale.com/admin/funnel
```

### LINE Webhookが届かない

```powershell
# ファイヤーウォール確認
netsh advfirewall firewall show rule name="OpenClaw"
```

### ペアリング承認失敗

```batch
# 手動承認
openclaw pairing list line
openclaw pairing approve line コード
```

## 📁 ログファイル

| パス | 説明 |
|------|------|
| `%USERPROFILE%\.openclaw\logs\openclaw-auto.log` | 自動起動スクリプトログ |
| `%USERPROFILE%\.openclaw\logs\openclaw-YYYYMMDD.log` | OpenClaw Gatewayログ |

## ⚙️ 設定カスタマイズ

`openclaw-auto-start.ps1` を編集:

```powershell
$Config = @{
    Port = 18789                    # ゲートウェイポート
    LogDir = "$env:USERPROFILE\.openclaw\logs"
    RetryCount = 3                  # リトライ回数
    RetryDelay = 5                  # リトライ間隔(秒)
    PairingTimeout = 60             # ペアリング承認タイムアウト(秒)
}
```

## 🔒 セキュリティ

- LINE認証情報は環境変数から自動読み込み
- `.env` ファイルはgitignore推奨
- ペアリング承認はログファイルから自動取得
