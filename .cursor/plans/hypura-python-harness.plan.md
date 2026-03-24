---
name: Hypura Python Harness
overview: "FastAPI daemon (port 18790) を構築し、OpenClaw が汎用自律エージェントとして動作できるようにする。VRChat アバターを OSC で操作、VOICEVOX で発話、AI 生成 Python スクリプトを実行、新スキルを生成。ShinkaEvolve 自己進化ループ付き。"
todos: []
isProject: true
---

# Hypura Python Harness Implementation Plan

> **フル計画ファイル:** `docs/superpowers/plans/2026-03-25-hypura-python-harness.md`
> **仕様書:** `docs/superpowers/specs/2026-03-25-hypura-python-harness-design.md`
>
> **実装ルール:** TDD（テスト先書き → 失敗確認 → 実装 → パス確認 → コミット）を必ず守ること。

## Goal

FastAPI daemon (`harness_daemon.py`, port 18790) をハブとして、OSC・VOICEVOX・コード実行・スキル生成・ShinkaEvolve を統合する。

## Tech Stack

Python 3.11+, FastAPI, uvicorn, python-osc, sounddevice, httpx, pytest, pytest-asyncio, uv, ShinkaEvolve, Ollama (port 11434), OpenClaw CLI

## File Map

| File                                            | Responsibility              |
| ----------------------------------------------- | --------------------------- |
| `scripts/hypura/pyproject.toml`                 | UV project, deps            |
| `scripts/hypura/harness.config.json`            | Ports, models, devices      |
| `scripts/hypura/osc_param_map.json`             | Emotion → OSC param mapping |
| `scripts/hypura/harness_daemon.py`              | FastAPI app, route wiring   |
| `scripts/hypura/osc_controller.py`              | VRChat OSC control          |
| `scripts/hypura/voicevox_sequencer.py`          | VOICEVOX TTS + VB-Cable     |
| `scripts/hypura/code_runner.py`                 | PEP723 uv run + retry       |
| `scripts/hypura/skill_generator.py`             | Skill design → deploy       |
| `scripts/hypura/shinka_adapter.py`              | ShinkaEvolve + Ollama       |
| `skills/hypura-harness/SKILL.md`                | OpenClaw skill definition   |
| `skills/hypura-harness/scripts/start_daemon.py` | Daemon launcher             |

---

## Task 1: Foundation — pyproject.toml + config files

**Status:** `- [ ]` 未着手

- `scripts/hypura/pyproject.toml` 作成
- `scripts/hypura/harness.config.json` 作成
- `scripts/hypura/osc_param_map.json` 作成
- `scripts/hypura/generated/.gitkeep` / `evolved/.gitkeep` / `tests/__init__.py` 作成
- `generated/` を `.gitignore` に追加
- コミット

> 詳細コード: フル計画ファイル L42–166

---

## Task 2: Daemon Skeleton — FastAPI app + /status

**Status:** `- [ ]` 未着手 | TDD

1. 失敗テスト作成 (`tests/test_harness_daemon.py`)
2. テスト失敗確認
3. `harness_daemon.py` 最小実装
4. テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L168–281

---

## Task 3: OSC Controller

**Status:** `- [ ]` 未着手 | TDD

1. 失敗テスト作成 (`tests/test_osc_controller.py`)
2. テスト失敗確認
3. `osc_controller.py` 実装
4. テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L283–419

---

## Task 4: VOICEVOX Sequencer

**Status:** `- [ ]` 未着手 | TDD

1. 失敗テスト作成 (`tests/test_voicevox_sequencer.py`)
2. テスト失敗確認
3. `voicevox_sequencer.py` 実装
4. テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L421–608

---

## Task 5: Code Runner — OpenClaw CLI + UV/PEP723

**Status:** `- [ ]` 未着手 | TDD

1. 失敗テスト作成 (`tests/test_code_runner.py`)
2. テスト失敗確認
3. `code_runner.py` 実装
4. テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L610–809

---

## Task 6: Skill Generator

**Status:** `- [ ]` 未着手 | TDD

1. 失敗テスト作成 (`tests/test_skill_generator.py`)
2. テスト失敗確認
3. `skill_generator.py` 実装
4. テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L811–944

---

## Task 7: ShinkaEvolve Adapter

**Status:** `- [ ]` 未着手 | TDD

1. 失敗テスト作成 (`tests/test_shinka_adapter.py`)
2. テスト失敗確認
3. `shinka_adapter.py` 実装
4. テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L946–1091

---

## Task 8: Wire All Endpoints into Daemon

**Status:** `- [ ]` 未着手 | TDD

1. エンドポイントテスト追加
2. テスト失敗確認
3. `harness_daemon.py` に全エンドポイント統合
4. 全テスト通過確認
5. コミット

> 詳細コード: フル計画ファイル L1093–1308

---

## Task 9: OpenClaw Skill + start_daemon.py

**Status:** `- [ ]` 未着手

- `skills/hypura-harness/SKILL.md` 作成
- `skills/hypura-harness/scripts/start_daemon.py` 作成
- コミット

> 詳細コード: フル計画ファイル L1310–1453

---

## Task 10: Integration — Smoke Test + Desktop Stack

**Status:** `- [ ]` 未着手

1. デーモン手動スモークテスト
2. `/osc` エンドポイントテスト
3. `/run` エンドポイントテスト
4. `launch-desktop-stack.ps1` に追加
5. 全テストスイート実行
6. 最終コミット

> 詳細コード: フル計画ファイル L1455–1533

---

## Cursor への引き継ぎメモ

- **Python コマンド:** `py -3` を使うこと（`python` / `python3` は不可）
- **パッケージマネージャ:** `pnpm`（`npm` / `yarn` 不可）
- **各タスクは TDD サイクル**（失敗 → 実装 → 通過）を厳守
- 外部サービス（VRChat, VOICEVOX, Ollama）は未起動でもテストが通るようにモックを使う
- `generated/` ディレクトリは `.gitignore` に追加済みにすること
