# 実装ログ: Autonomous Avatar Vision

**日付**: 2026-02-21

## 実装の目的

OpenClawのブラウザベースの3Dアバター画面 (`scripts/avatar-window.html`) において、PCカメラから取得した映像フレームを定期的にバックエンドへ送信し、自律エージェント（`auto-agent`）が視覚コンテキストに基づき自発的な発言を行えるようにする。

## 変更内容と詳細

### 1. フロントエンド (`scripts/avatar-window.html`)

- `getUserMedia` を用いて、ユーザーのカメラ映像を取得（解像度 320x240）する機能を追加した。
- 映像を非表示の `<canvas>` に描画し、10秒ごとにBase64形式のJPEG画像 (`image/jpeg`) として抽出するロジックを実装した。
- OpenClawのGateway WebSocket (`gwSocket`) に対し、抽出した画像をペイロードに含めたカスタムリクエスト (`method: "auto-agent.vision"`) を送信する処理を追加した。
- UI上に "Start Cam" / "Stop Cam" のボタンと、Picture-in-Pictureのカメラプレビュー画面を導入した。
- バックエンドからの自律エージェントのテキスト応答において、`NO_RESPONSE`（応答不要と判断された場合）をフックし、アバターが発話しない（無視する）よう `gwSocket.onmessage` 内の処理を修正した。

### 2. バックエンド (`extensions/auto-agent/index.ts`)

- `api.registerGatewayMethod("auto-agent.vision", ...)` を使用し、フロントエンドから送信される画像を受け取るための新規Gatewayメソッドを登録し、グローバル変数 (`latestVisionFrame`) に保存する処理を実装した。
- 自律ループ (`runAutonomousCycle`) を拡張し、最新のカメラフレームが存在する場合は、それを評価する専用のプロンプトタスクを作成するようにした。
- ローカルの `/api/agent` エンドポイントに対し、送信するペイロード (`body`) に `images: [latestVisionFrame]` を追加し、マルチモーダルな文脈で推論を実行させるよう機能強化した。
- 画像に対するエージェントの反応がアバターに「声」として届くよう、推論結果を送信する対象のセッションを `agent:main:subagent:auto-agent` から `voice-call` イベントへルーティング変更した。
- ユーザーのアクションが特に無ければ `NO_RESPONSE` を返すよう、LLMへの指示プロンプトを調整した。これにより、自律的アバターが無言状態を維持しやすくなる。

## ソフトウエア工学的なベストプラクティス

- **リソース管理**: 不要な高画質による高負荷を防ぐため、canvasでのリサイズ（320x240）および画質調整 (`0.7`) を適用。
- **Lint最適化**: TypeScriptおよびUI実装時の重複変数宣言エラーを修正し、警告・エラー0でビルドが通るよう設計・リファクタリング。
- **アーキテクチャの分離**: ブラウザ側は純粋な収集と送信のみを担当し、ロジック（何を話すべきか）はバックエンドエンドポイント側に一任。
