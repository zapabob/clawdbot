# OpenClaw 側 引き継ぎ書（Hypura連携）

## 現在の状態（Dual Model）

- Hypura サーバーは指定GGUFでの運用を想定:
  - `H:\HauhauCS_9B_Restoration\Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-BF16.gguf`
  - `Endpoint: http://127.0.0.1:8080`
  - `Ollama-compatible API: /api/generate, /api/chat, /api/tags`
- OpenClaw 側は `~/.openclaw/openclaw.json`（Windows: `%USERPROFILE%\\.openclaw\\openclaw.json`）が有効な設定ファイル。

## OpenClaw 側で必ず確認する項目

1. `models.providers.hypura.baseUrl` が `http://127.0.0.1:8080`
2. `agents.defaults.model.primary` が `ollama/Hakua-core-lite`
3. `agents.defaults.model.fallbacks[0]` が `hypura/<api-tags-name>`
4. `plugins.entries.hypura.enabled` が `true`
5. `plugins.allow` に `hypura` を含む

## 一致条件（最重要）

- `(Invoke-RestMethod http://127.0.0.1:8080/api/tags).models[0].name`
- `agents.defaults.model.fallbacks[0]` の `hypura/` 後ろ

この2つが **完全一致**していないと、Hypura サブ系フォールバックでモデル不一致になる。

## 動作確認コマンド（PowerShell）

```powershell
# 1) Hypura 疎通
Invoke-WebRequest http://127.0.0.1:8080/ -UseBasicParsing

# 2) tags 名称確認
(Invoke-RestMethod http://127.0.0.1:8080/api/tags).models

# 3) OpenClaw 連携整合チェック
cd C:\Users\downl\Desktop\hypura-main\hypura-main
.\scripts\debug-verify-hypura-openclaw.ps1
```

## 既知の注意点

- `dist\\...\\hypura.exe` が存在しても、**プロセスが起動していなければ** OpenClaw は接続できない。
- `primary` は `ollama/Hakua-core-lite`、Hypura は `fallback[0]` として扱う。
- `/api/tags` が旧モデル名を返している間は、指定GGUFへの切替が未完了。
- `openclaw.json` にはトークン等の秘匿情報が含まれるため、**Git へコミット禁止**。

## 参考ドキュメント

- `_docs/2026-03-24_openclaw-hypura-connect{clawdbot-main}.md`
- `scripts/show-openclaw-config-env.ps1`
- `scripts/debug-verify-hypura-openclaw.ps1`
