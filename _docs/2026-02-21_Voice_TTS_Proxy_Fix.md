# 2026-02-21: Voice UI CORS Proxy Fix

## 概要 (Overview)

ブラウザ上でアバターを表示する `avatar-window.html` において、ポート 5000 で動作する Style-Bert-VITS2 (SBV2) TTS サーバーへのリクエストが `405 Method Not Allowed` で失敗する問題を修正しました。

## 原因 (Root Cause)

ブラウザの CORS 安全策により、異なるポート（3000 から 5000）への `fetch` リクエスト時には `OPTIONS` (Preflight) リクエストが送信されます。SBV2 の FastAPI サーバーが `OPTIONS` メソッドに対して `405 Method Not Allowed` を返していたため、ブラウザ側でリクエストがブロックされていました。

## 対応内容 (Implementation)

1. **Canvas Host へのプロキシ実装**:
   - `src/canvas-host/server.ts` に `/api/tts/` ルートを追加しました。
   - このルートへのリクエストは、OpenClaw サーバー内部で `127.0.0.1:5000` へ転送されます。
   - ブラウザからは同一オリジン（ポート 3000 へのリクエスト）に見えるため、CORS 制限（OPTIONS リクエスト）が発生しなくなります。

2. **フロントエンドの修正**:
   - `scripts/avatar-window.html` の `fetch` 先を、絶対パスの `http://...:5000/voice` から相対パスの `/api/tts/voice` に変更しました。
   - 実装後の HTML を `~/.openclaw/canvas/` ディレクトリに同期しました。

3. **ビルドと適用**:
   - `pnpm build` を実行し、修正を反映したバイナリを生成しました。

## 検証 (Verification)

- `curl` を用いて、`http://127.0.0.1:3000/__openclaw__/canvas/api/tts/voice` が正しくプロキシとして機能し、バックエンドサーバーへリクエストを飛ばそうとすることを確認しました。
- バックエンド（ポート 5000）が停止している場合は `502 Bad Gateway` が返るよう設計されており、プロキシロジックが正常に通過していることを確認済みです。
