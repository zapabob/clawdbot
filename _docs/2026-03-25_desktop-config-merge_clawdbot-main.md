# デスクトップ設定プラグイン統合・モデル配線 実装ログ

- **日付**: 2026-03-25
- **作業ツリー**: clawdbot-main
- **概要**: [.openclaw-desktop/openclaw.json](.openclaw-desktop/openclaw.json) に `~/.openclaw` 相当の `plugins.allow` / `plugins.entries`（acpx, vrchat-relay, voice, auto-agent 等）を統合。モデルは primary `ollama/qwen-Hakua-core`、subagents `ollama/qwen-Hakua-core-lite`、fallbacks `openai-codex/gpt-5.4-mini` → `openai-codex/gpt-5.4`。`mcp.servers.vrchat-mcp-osc` を削除（relay-primary）。`acp` / `skills.install` / `hypura` provider を追加。

## 検証

- `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` を `.openclaw-desktop` に設定して `pnpm exec openclaw config validate` → **Config valid**
- 同環境で `pnpm exec openclaw plugins list` → `vrchat-relay`, `telegram`, `local-voice`, `talk-voice` 等 **loaded**
- `pnpm exec openclaw doctor --non-interactive` → 警告あり（LINE allowFrom 等）。OSC 9001 は環境により **EADDRINUSE**（別プロセス占有時）

## メモ

- `auto-agent.config.subagentModel` は `ollama/qwen-Hakua-core` に修正（旧 `Ollama-qwen-Hakua-core` はモデルキーとして不整合のため）。
- **OSC `EADDRINUSE` :9001**: ゲートウェイと `openclaw doctor` 等で **vrchat-relay が二重にロード**されると 9001 の UDP 受信が競合する。どちらか一方を止めるか、`plugins.entries.vrchat-relay.config.topology.autoStartOscListener: false` で自動リスナーを切る（VRChat からの受信が不要なとき）。別ポートが必要なら `config.osc.incomingPort` を変え、VRChat 側の送信先ポートも合わせる。拡張は `pluginConfig.osc` を `getOSCClient` に渡すよう修正済み。
