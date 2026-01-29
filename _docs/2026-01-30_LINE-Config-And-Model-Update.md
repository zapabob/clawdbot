# 2026-01-30 LINE Channel Fix and Model Update

## 概要

- メインモデルを `google-antigravity/gemini-3-flash` から `zai/glm-4.7` (GLM-4.7-Flash) に変更しました。
- Control UI の SNS 設定画面において、LINE の設定項目が表示されない ("Channel config schema unavailable") 問題を修正しました。

## 変更内容

### 1. モデル設定の変更

- **ファイル**: `moltbot.json`
- **変更**: `agents.defaults.model.primary` を `zai/glm-4.7` に変更しました。

### 2. LINE チャンネルの登録修正

- **ファイル**: `src/channels/registry.ts`
- **変更**:
  - `CHAT_CHANNEL_ORDER` に `"line"` を追加しました。
  - `CHAT_CHANNEL_META` に LINE 用のメタデータ定義を追加しました。

## 結果

- デフォルトモデルとして GLM-4.7-Flash が使用されるようになります。
- Control UI の設定画面に LINE タブが正しく表示され、設定が可能になります。
