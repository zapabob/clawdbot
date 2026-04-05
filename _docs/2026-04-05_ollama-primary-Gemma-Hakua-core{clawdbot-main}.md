# 実装ログ: primary を Ollama Gemma-Hakua-core に切替（worktree: clawdbot-main）

**日付**: 2026-04-05

## 変更

- `.openclaw-desktop/openclaw.json` の `agents.defaults.model.primary` を `ollama/Gemma-Hakua-core:latest` に変更。
- `fallbacks` の先頭を `hypura/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q4_K_M` にし、Hypura `serve` 復旧後は primary と入れ替えればよい。

## なんJ風一行

- 8080 が死んでるときは **11434 の Hakua 核**に逃げろ、それが筋。

## 運用メモ

- Gateway 再起動後、TUI で `/model` またはフッター表示で `ollama/Gemma-Hakua-core:latest` になっているか確認。
- 人格寄せはリポ直下の `AGENTS.md` / `MEMORY.md` / `USER.md` と `identity/SOUL.md`（方針に従うこと）。

## 追記（404 / フォールバック）

- Ollama が `model 'Gemma-Hakua-core:latest' not found` と言うときは、ローカルにタグが無い。リポの `scripts/modelfiles/Modelfile_Gemma-Hakua-core` から  
  `ollama create Gemma-Hakua-core -f scripts/modelfiles/Modelfile_Gemma-Hakua-core`（先にベースの HF プルが必要なら Modelfile の `FROM` に従う）。
- `hypura/...` を **フォールバックに入れたまま Hypura が死んでいる**と、フェイルオーバー経路で **Ollama に Hypura 用 GGUF 名が流れる**ことがあり、`Gemma-4-E4B-... not found` になる。**8080 が安定するまで** `agents.defaults.model.fallbacks` から `hypura/...` を外し、**Ollama 同士だけ**にすると安全。
- **既定 primary** は動作確認済みの `ollama/qwen-Hakua-core2:latest` に戻した（2026-04-05）。Hakua 核に寄せたくなったら Gemma タグ作成後に `primary` を `ollama/Gemma-Hakua-core:latest` に変更。
- Bootstrap truncation は `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` で緩められる（巨大 `AGENTS.md` 時）。
