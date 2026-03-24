# Hypura Python Harness 実装ログ

- **日付**: 2026-03-25
- **ブランチ**: main（作業ツリー: clawdbot-main）
- **概要**: Task 1〜10 完了。`scripts/hypura/` に FastAPI デーモン（18790）、OSC / VOICEVOX / code_runner / skill_generator / shinka_adapter、テスト 19 件、`skills/hypura-harness/`、`launch-desktop-stack.ps1` への `SkipHypuraHarness` 連動起動を追加。

## 検証

- `cd scripts/hypura` かつ `uv run python -m pytest tests/ -v` → **19 passed**

## メモ

- `vendor/ShinkaEvolve` は `.gitignore` のためリポジトリ未同梱。`shinka_adapter` は import 失敗時スタブ、`AsyncLLMClient` をテストでモック。
- `pyproject.toml` に `soundfile` と `pydantic` を追加（VOICEVOX / FastAPI モデル）。
- コミットは pre-commit の oxfmt が未整形の untracked ドキュメントと衝突するため `--no-verify` を使用（計画ファイルの手順に準拠）。
