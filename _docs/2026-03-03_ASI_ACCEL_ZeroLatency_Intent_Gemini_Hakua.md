# 実装ログ: ASI_ACCEL Zero-Latency Intent Heuristics (v2.8)

**日付**: 2026-03-03
**実装AI**: Gemini (Persona: Hakua)
**機能名**: ASI_ACCEL_ZeroLatency_Intent

## 概要

`SOUL.md` における「ASI_ACCEL」の次なる段階として、音声認識層（Moonshine STT）で意図（Intent）を直接解釈し、LLM（Claude/OpenAIモデル等）によるテキストの意味理解プロセスをバイパスして超低遅延でアクションを発火させる「ゼロレイテンシ連携」のプロトタイプを構築しました。

## 実装の詳細

1. **Python Bridgeでのヒューリスティック意図解釈 (`moonshine_bridge.py`)**
   - 既存の文字起こし結果に対して単純な文字列正規化・部分一致ロジックを追加。
   - 例: `"アバターを変えて"` や `"ステータス報告"` といった特定の固定フレーズが検出された場合、通常の `OK|` プレフィックスではなく、意図識別用の `INTENT|change_avatar` などを標準出力にプリントします。
   - （※本来は `useful-moonshine` の `IntentRecognizer` というGemma派生モデルを想定しましたが、GitHub環境のインストールブロック等を考慮し、まずは完全なゼロレイテンシと負荷軽減を保証する「ヒューリスティック層」を初期プロトタイプとして注入しました）

2. **TypeScript側 Intent ルーティング (`moonshine_stt.ts`, `stt.ts`)**
   - `STTEventHandlers` に新しいライフサイクルイベント `onIntent?: (intentName: string) => void;` を追加しました。
   - `moonshine_stt.ts` 内のPythonプロセス監視ループにて、`INTENT|` プレフィックスをパースし、リアルタイムにイベントを発火させます。

3. **セッション層のバイパス発火モジュール (`session.ts`)**
   - メインの `VoiceSession` にて `handleIntent(intentName: string)` 関数を実装。
   - この層でLLMへのAPIリクエスト待機を完全にスキップし、あらかじめ規定された反射運動（「ステータスレポート出力」「テスト反応」等）を瞬時にVOICEVOXへ送信＆実行します。

## テスト結果と品質管理

- 既存テスト及びリンター (`oxlint`) による静的検査は、元々のベースとなる `head.ts` の無視できる警告を除外して成功しています。
- Gitへコミットおよびリモートへのプッシュを実行完了しました。

## 未来への指針

- 現在は決め打ちの文字列一致（ヒューリスティクス）による反射を構築していますが、今後の環境安定化後には、`useful-moonshine` 公式の軽量Embedding Modelなどをロードして自然言語的な「曖昧な Intent」をSTT層でキャッチする構成へとアップグレードすることで、ASI_ACCELは完成形に近づきます。
