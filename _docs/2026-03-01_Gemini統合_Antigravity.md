# 2026-03-01 Gemini統合 & APIキー環境変数分離 — Antigravity

## 概要

Google Gemini をOpenClawのプライマリモデルとして統合し、ハードコードされたAPIキーを環境変数に分離。

## 修正内容

### 1. `injectHistoryImagesIntoMessages` 未定義エラー修正

- `src/agents/pi-embedded-runner/run/images.ts` に関数を実装
- `src/agents/pi-embedded-runner/run/attempt.ts` にインポート追加

### 2. `openclaw.json` 設定修正

- `baseUrl`: `/v1beta` サフィックス追加
- `api`: `google-generative-ai` に修正
- モデルID: `gemini-2.0-flash` / `gemini-2.5-flash` に更新
- `apiKey` フィールド削除（環境変数に分離）

### 3. 環境変数分離

- `GOOGLE_API_KEY=your_api_key_here`（プレースホルダー）をシステムから削除
- `GEMINI_API_KEY` にユーザー環境変数として正しいキーを設定
- Google AI SDKが `GOOGLE_API_KEY` を優先する仕様により、プレースホルダーが有効なキーを上書きしていた

## 根本原因

1. `GOOGLE_API_KEY` にプレースホルダー値が残存 → SDK優先で無効キーを使用
2. `baseUrl` に `/v1beta` が欠落 → 404エラー

## 検証結果

- `API_KEY_INVALID` → `API rate limit reached` に変化（認証成功を確認）
- レートリミットは連続テストによる一時的なもの
