# 2026-01-30 Z.AI Integration (GLM-4.7-Flash)

## 概要

- Z.AI プロバイダーを `moltbot.json` に手動設定し、GLM-4.7-Flash を利用可能にしました。
- ベースURLを `https://api.z.ai/api/paas/v4/` に設定しました。

## 変更内容

### 1. `moltbot.json` の更新

- **Providers**: `models.providers.zai` セクションを追加しました。
- **Primary Model**: `agents.defaults.model.primary` を `zai/glm-4.7-flash` に設定しました。

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
          "reasoning": false, // Based on flash usually being lighter
          // ... cost/token limits
        }
      ]
    }
  }
}
```

## 注意点

- APIキーは環境変数 (`ZAI_API_KEY` 等) または Auth Profiles で設定する必要があります。
