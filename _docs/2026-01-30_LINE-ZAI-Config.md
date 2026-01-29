# 2026-01-30 - LINE Channel & Z.AI Provider Configuration

## 概要

LINE チャンネルの設定 UI 表示問題の修正、および Z.AI (GLM-4.7 Flash) プロバイダーの統合。

## 変更内容

### 1. LINE チャンネル修正

以下のファイルを修正し、LINE が Settings > Channels に正しく表示されるようにしました：

- `src/channels/registry.ts`: `CHAT_CHANNEL_ORDER` に "line" を追加
- `src/channels/dock.ts`: LINE 用の dock 定義を追加
- `ui/src/ui/views/channels.ts`: UI フォールバックリストに "line" を追加

### 2. Z.AI Provider 設定

`~/.clawdbot/moltbot.json` に Z.AI プロバイダーを追加：

```json
"models": {
  "providers": {
    "zai": {
      "baseUrl": "https://api.z.ai/api/paas/v4/",
      "api": "openai-completions",
      "models": [
        {
          "id": "glm-4.7-flash",
          "name": "GLM-4.7 Flash",
          ...
        }
      ]
    }
  }
}
```

プライマリモデルを `zai/glm-4.7-flash` に設定。

### 3. TLS 起動エラー修正

- `src/infra/tls/gateway.ts`: `openssl` が見つからない場合の ENOENT エラーをハンドリング
- `moltbot.json`: `gateway.tls.enabled: false` に設定

### 4. Schema 柔軟化

`commands`, `skills`, `hooks` スキーマの `.strict()` を `.passthrough()` に変更し、UI での設定編集時の警告を軽減。

## 使用方法

### サーバー起動

```bash
cd clawdbot-main
npm run moltbot -- gateway
```

### Z.AI API キー設定

`.env` ファイルに以下を追加：

```
ZAI_API_KEY=your_api_key_here
```

## 関連ファイル

- `~/.clawdbot/moltbot.json`
- `src/channels/registry.ts`
- `src/channels/dock.ts`
- `ui/src/ui/views/channels.ts`
- `src/infra/tls/gateway.ts`
- `src/config/zod-schema.ts`
- `src/config/zod-schema.session.ts`
