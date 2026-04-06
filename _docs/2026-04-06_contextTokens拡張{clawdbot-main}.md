# contextTokens 拡張ログ

- 日時 (JST): 2026-04-06T17:06:05+09:00
- 目的: `ollama/qwen-Hakua-core2:latest` の実効コンテキスト上限が `16k` 表示になる状態を緩和

## 変更内容

1. `/.openclaw-desktop/openclaw.json`
   - `models.providers.ollama.models[qwen-Hakua-core2:latest]` に `contextTokens: 128000` を追加
   - `agents.defaults.contextTokens` に `128000` を追加
2. `/.openclaw-desktop/agents/main/agent/models.json`
   - `providers.ollama.models[qwen-Hakua-core2:latest]` に `contextTokens: 128000` を追加

## 検証

- `py -3` で JSON パース検証を実施し、`json-ok` を確認。

## MCP 時刻取得について

- 本環境の `CallMcpTool` 仕様では引数付き呼び出しができず、`hex_to_datetime` は `hex_str` 必須のため直接の現在時刻取得に失敗。
- 実施ログ:
  - サーバー: `plugin-meta-quest-agentic-tools-hzdb`
  - ツール: `hex_to_datetime`
  - 応答: `missing field "hex_str"`
- 代替として本ログの日時はローカル時刻を記録。

## 運用メモ

- 既存セッションが `16k` を保持している場合は、セッション再作成または Gateway/TUI 再起動で新しい `contextTokens` が反映される。

## 追加対応: Ollamaモデル実体の再生成

- 日時 (JST): 2026-04-06T17:20:43+09:00
- 背景:
  - `ollama show qwen-Hakua-core2:latest` で `num_ctx 32768` を確認。
  - `scripts/modelfiles/Modelfile_HakuaCore2` は `FROM` GGUFパスが欠落しており、そのまま `ollama create` できなかった。
- 対応:
  1. `scripts/modelfiles/Modelfile_qwen-hakua-core2-ctx128k` を追加。
     - `FROM qwen-Hakua-core2:latest`
     - `PARAMETER num_ctx 128000`
  2. `ollama create qwen-hakua-core2-ctx128k -f scripts/modelfiles/Modelfile_qwen-hakua-core2-ctx128k` を実行。
  3. `ollama show qwen-hakua-core2-ctx128k` で `num_ctx 128000` を確認。
  4. 既定モデルを新タグへ切り替え:
     - `.openclaw-desktop/openclaw.json`
     - `.openclaw-desktop/agents/main/agent/models.json`
- 結果:
  - 新しい実体タグ `qwen-hakua-core2-ctx128k:latest` で 128k コンテキスト運用が可能。
