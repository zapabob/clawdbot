# Hypura Phase 2 実装ログ（Live2D / Companion UI / 設定ホットリロード）

- **実装完了時刻（ローカル）:** 2026-03-25 03:20:33 +0900
- **ワークツリー:** clawdbot-main

## 概要

- **Task A:** `CompanionBridge` が `companion_url` の `/control` に speak + emotion を POST。`harness_daemon` の `/speak` 成功後と `/osc` の `emotion` 後に転送。接続失敗は `warning` のみ。
- **Task C:** `POST /reload` で `load_config()` 再読込、`companion_bridge` を新 URL で再生成。レスポンス `{"reloaded": true, "config": cfg}`。
- **Task B:** `companion-panel` が 3 秒ポーリングに `http://127.0.0.1:18790/status` を追加。Hypura セクションに OSC / VoiceVox / Ollama のドットとクイックアクション 3 つ。オフライン時はグレーアウト。

## 変更ファイル

- `scripts/hypura/companion_bridge.py`（新規）
- `scripts/hypura/tests/test_companion_bridge.py`（新規）
- `scripts/hypura/harness_daemon.py`
- `scripts/hypura/harness.config.json`（`companion_url`）
- `scripts/hypura/tests/test_harness_daemon.py`
- `ui/src/ui/components/companion-panel.ts`

## 検証

- `cd scripts/hypura && uv run pytest tests/ -v` → 26 passed
- `pnpm ui:build` → 成功

## なんJ風メモ

正直ここまで通ったならもう勝ち確だろ（テスト全部緑は気持ちいいぞ）
