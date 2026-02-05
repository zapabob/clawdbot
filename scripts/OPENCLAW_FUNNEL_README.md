# OpenClaw + LINE Funnel 自動起動設定

## 概要

PC起動時に以下を自動起動：

- OpenClaw Gateway（ポート18789）
- LINE Webhookサーバー（ポート3000）
- Tailscale Funnel（外部アクセス用）

## セットアップ

### 管理者権限でPowerShellを実行

```powershell
cd C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts
.\install-openclaw-service.ps1
```

## サービス管理

### サービス確認

```powershell
Get-ScheduledTask -TaskName OpenClawFunnel
```

### 手動起動

```powershell
Start-ScheduledTask -TaskName OpenClawFunnel
```

### 停止

```powershell
Stop-ScheduledTask -TaskName OpenClawFunnel
```

### 削除

```powershell
Unregister-ScheduledTask -TaskName OpenClawFunnel -Confirm:$false
```

## 起動タイミング

- **システム起動時**: 60秒遅延
- **ユーザー 로그인時**: 30秒遅延

## ステータス確認

### Tailscale確認

```bash
tailscale status
tailscale funnel status
```

### ポート確認

```bash
netstat -ano | findstr :3000
netstat -ano | findstr :18789
```

## LINE設定

LINE Developers ConsoleでWebhook URLを設定：

**LAN内テスト:**

```
http://<PCのIP>:3000/webhook/line
```

**外部（LINEサーバー）から:**

```
https://<your-tailnet>.ts.net/webhook/line
```

例: `https://downl.taile4f666.ts.net/webhook/line`

## トラブルシューティング

### Funnelが起動しない

```powershell
# Funnel再設定
tailscale funnel reset
tailscale funnel http://localhost:3000/webhook
```

### サービスが動かない

```powershell
# タスク手動実行
Start-ScheduledTask -TaskName OpenClawFunnel

# ログ確認
type C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\openclaw-funnel.log
```

### ポートが使用中

```bash
# プロセス確認
netstat -ano | findstr :3000
netstat -ano | findstr :18789
```
