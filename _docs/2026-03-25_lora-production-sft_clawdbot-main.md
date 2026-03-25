# 実装ログ: LoRA 本番 SFT（Hypura）

- **UTC**: 2026-03-24T21:18:14Z
- **worktree**: clawdbot-main

## なんｊ風サマリ

- 仮説: dry_run だけだと本番学習できん → 検証: `transformers` + `peft` + `Trainer` で実際に回す。
- 結論: `train_sft_lora(..., dry_run=false)` で CUDA 時は LoRA 学習、アダプタは `train_runs/<job_id>/adapter/`。
- GRPO は相変わらずプレースホルダ（報酬関数が要る）。

## 変更ファイル

- `scripts/hypura/lora_trainer.py` — `_run_sft_lora_training` 実装
- `scripts/hypura/lora_service.py` — `lora.sft` を `train_options` に渡す
- `scripts/hypura/harness.config.json` — `lora.sft` 既定
- `scripts/hypura/LORA_PIPELINE.md`, `skills/hypura-harness/SKILL.md` — 運用メモ

## 検証

- `uv run pytest tests/test_lora_api.py`（scripts/hypura） — 4 passed
