# OpenClaw + LINE 全自動化ガイド

## 起動方法

### ① 完全自動化（一括起動）
```bash
start-line-full.bat
```
- Gateway + Tailscale + ngrok + 監視を全て起動
- ペアリングを自動監視・承認

### ② AGI含めた完全自動化
```bash
start-agi-full.bat
```
- Auto-Improve Engine + Health Monitor + Gateway

### ③ 手動個別起動
```bash
# Gatewayのみ
start-tailscale.bat

# LINE含め全て
auto-start-tailscale-ngrok.bat
```

## 自動化スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `start-line-full.bat` | LINE完全自動化（①推奨） |
| `start-agi-full.bat` | AGI含めた完全自動化（②） |
| `line-auto-system.bat` | バックグラウンド監視ループ |
| `auto-pairing-monitor.bat` | ペアリング自動承認監視 |
| `line-dashboard.bat` | 対話型ダッシュボード |
| `check-agi-health.bat` | 健全性チェック |

## LINE設定（手動）

### Webhook URL（Tailscale）
```
https://100.91.183.75:18789/line/webhook
```

### LINE Developer Console
1. https://developers.line.biz/console/ にアクセス
2. Messaging API設定 → Webhook URLに上記を設定
3. "Use webhook"を有効化
4. "Verify"をクリック

## 使い方

1. **完全自動化:**
   ```
   start-line-full.bat
   ```

2. **LINEでボットにメッセージを送信**

3. **ペアリング承認:**
   - 自動承認: `auto-pairing-monitor.bat`
   - 手動: `node openclaw.mjs pairing approve line <コード>`

4. **テスト:**
   LINEでボットに「こんにちは」と送信

## トラブルシューティング

| 問題 | 解決法 |
|-----|--------|
| Gateway応答なし | `controller.bat repair` |
| Tailscale未接続 | `tailscale up` |
| ngrok URL取得失敗 | `get-line-webhook.bat` |
| ペアリング承認失敗 | 手動で再試行 |
