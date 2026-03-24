# Hypura 9B BF16 サブ運用 実装ログ

- Date (from MCP): 2026-03-24T04:05:15+00:00
- Branch/Worktree: `main`
- Scope: Hypura tag check, OpenClaw model sync, gateway restart validation

## 実施内容

1. `hypura-main` の既存スクリプト `scripts/hypura-central-smart.ps1` で Hypura を起動。
2. `http://127.0.0.1:8080/api/tags` を確認。
3. `.openclaw-desktop/openclaw.json` の以下が一致していることを確認。
   - `models.providers.hypura.models[0].id`
   - `agents.defaults.model.fallbacks[0]` の `hypura/` 以降
4. OpenClaw gateway を再起動し、起動ログの `agent model` を検証。

## 検証結果

- 目標モデルは `Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-BF16`（GGUF: `H:\HauhauCS_9B_Restoration\Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-BF16.gguf`）。
- OpenClaw 設定上は `agent primary: ollama/Hakua-core-lite`、`fallback[0]: hypura/Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-BF16` に更新済み。
- `/api/tags` の先頭モデル名と `fallback[0]` の `hypura/` 後ろを一致させることが必須。
- plugin allowlist 警告（`plugin disabled (not in allowlist)`）は再起動時ログで再発しなかった。

## 補足

- 現在 `/api/tags` が旧27B名を返す場合は、Hypura 側の実行モデルがまだ切替前。指定GGUFで再起動後に再検証する。

## 追記: Hypura Dual Model Rewrite（新規ファイル作成代替）

- Date (from MCP): 2026-03-24T06:04:33+00:00
- Worktree: `main`
- 方針: `primary=ollama/Hakua-core-lite`、`fallback[0]=hypura/Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-BF16`

### 反映済み項目

1. `%USERPROFILE%/.openclaw/openclaw.json` の `primary` と `fallback[0]` を新方針へ更新。
2. `.openclaw-desktop/openclaw.json` も同じ内容へ同期。
3. `models.providers.hypura.models[0].id` を `Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-BF16` に更新。
4. `scripts/launchers/ASI_Manifestation.bat` の表示を Main/Sub 構成へ更新。
5. `scripts/show-openclaw-config-env.ps1` に期待優先順とGGUFパス表示を追加。
6. `_docs/2026-03-24_openclaw-side-handover{clawdbot-main}.md` を Dual Model 運用に更新。

### 検証メモ

- 設定値は repo/user 両方で更新済み。
- 現時点の `/api/tags` は旧 `Qwen3.5-27B-Uncensored-HauhauCS-Aggressive` を返却中。
- つまり Hypura 実行モデルはまだ切替前。指定GGUFで Hypura 再起動後に tags 再確認が必要。
