# Telegram 401 & Anthropic認証エラー修正

**日付**: 2026-03-25
**AI**: Antigravity

## 問題

1. **Telegram 401 Unauthorized** — `deleteWebhook`, `setMyCommands` 等すべて失敗
2. **Anthropic APIキー未設定** — `anthropic/claude-opus-4-6` を使おうとするが認証情報なし

## 原因

### Telegram

- `.env` に `TELEGRAM_BOT_TOKEN` が設定されていたが、`openclaw.json` の `channels.telegram` に `botToken` フィールドがなかった
- OpenClawは `openclaw.json` の `channels.telegram.botToken` からトークンを読む（secretref-matrix で定義）
- launch script が `.env` から `TELEGRAM_BOT_TOKEN` を子プロセスに転送していなかった

### Anthropic

- OpenClawのビルトインデフォルトモデルが `anthropic/claude-opus-4-6`
- `auth-profiles.json` には `opencode` と `openai-codex` のみ、`anthropic` プロファイルなし
- ユーザーはAnthropicのAPIキーを持っていない

## 修正内容

### 1. `openclaw.json` — botToken追加 + デフォルトモデル変更

```diff
 "telegram": {
   "enabled": true,
+  "botToken": "8549534063:AAE44b8YZQ_hKsyB4Tr2Va_ohlHTHTXLNH4",
   "dmPolicy": "pairing",
   ...
 }
+,"models": {
+  "default": "ollama/qwen-hakua-core-lite:latest",
+  "fallback": ["opencode/qwen-hakua-core-lite:latest", "ollama/hakua:latest"]
+}
```

### 2. `launch-desktop-stack.ps1` — env転送リストにTelegram追加

```diff
 foreach ($lineKey in @(
-    "OLLAMA_API_KEY","LINE_CHANNEL_ACCESS_TOKEN","LINE_CHANNEL_SECRET",
+    "OLLAMA_API_KEY","TELEGRAM_BOT_TOKEN",
+    "LINE_CHANNEL_ACCESS_TOKEN","LINE_CHANNEL_SECRET",
     ...
```

## 変更ファイル

- `.openclaw-desktop/openclaw.json`
- `scripts/launchers/launch-desktop-stack.ps1`
