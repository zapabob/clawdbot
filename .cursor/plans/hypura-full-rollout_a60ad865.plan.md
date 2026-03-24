---
name: hypura-full-rollout
overview: Hypura Python HarnessをTask 1〜10までTDDで実装し、各タスク完了ごとに検証してコミットする。外部サービス未起動でもテスト可能なモック設計を維持し、最後にデスクトップ起動統合まで完了する。
todos:
  - id: t1-foundation
    content: "Task 1: hypura基盤ファイル・設定・gitignoreを作成してコミット"
    status: completed
  - id: t2-daemon-status
    content: "Task 2: harness_daemon /status をTDD実装してコミット"
    status: completed
  - id: t3-osc
    content: "Task 3: osc_controller をTDD実装してコミット"
    status: completed
  - id: t4-voicevox
    content: "Task 4: voicevox_sequencer をTDD実装してコミット"
    status: completed
  - id: t5-code-runner
    content: "Task 5: code_runner をTDD実装してコミット"
    status: completed
  - id: t6-skill-generator
    content: "Task 6: skill_generator をTDD実装してコミット"
    status: completed
  - id: t7-shinka
    content: "Task 7: shinka_adapter をTDD実装してコミット"
    status: completed
  - id: t8-wire-endpoints
    content: "Task 8: daemonへ全endpoint統合 + テスト + コミット"
    status: completed
  - id: t9-openclaw-skill
    content: "Task 9: hypura-harnessスキル定義とstart_daemon実装 + コミット"
    status: completed
  - id: t10-integration
    content: "Task 10: desktop stack統合・スモーク・全体テスト・最終コミット"
    status: completed
isProject: false
---

# Hypura Python Harness 実装計画（Task 1〜10）

## 実装方針

- 既存仕様に準拠し、各タスクを **TDD（失敗テスト→実装→成功確認）** で進行。
- 外部依存（VRChat / VOICEVOX / Ollama）はテストでモック化し、ローカル未起動でもCI可能にする。
- 各タスク完了時にスコープを固定してコミット（ユーザー指定どおり）。

## 対象ファイル（主要）

- [scripts/hypura/pyproject.toml](scripts/hypura/pyproject.toml)
- [scripts/hypura/harness.config.json](scripts/hypura/harness.config.json)
- [scripts/hypura/osc_param_map.json](scripts/hypura/osc_param_map.json)
- [scripts/hypura/harness_daemon.py](scripts/hypura/harness_daemon.py)
- [scripts/hypura/osc_controller.py](scripts/hypura/osc_controller.py)
- [scripts/hypura/voicevox_sequencer.py](scripts/hypura/voicevox_sequencer.py)
- [scripts/hypura/code_runner.py](scripts/hypura/code_runner.py)
- [scripts/hypura/skill_generator.py](scripts/hypura/skill_generator.py)
- [scripts/hypura/shinka_adapter.py](scripts/hypura/shinka_adapter.py)
- [scripts/hypura/tests/test_harness_daemon.py](scripts/hypura/tests/test_harness_daemon.py)
- [scripts/hypura/tests/test_osc_controller.py](scripts/hypura/tests/test_osc_controller.py)
- [scripts/hypura/tests/test_voicevox_sequencer.py](scripts/hypura/tests/test_voicevox_sequencer.py)
- [scripts/hypura/tests/test_code_runner.py](scripts/hypura/tests/test_code_runner.py)
- [scripts/hypura/tests/test_skill_generator.py](scripts/hypura/tests/test_skill_generator.py)
- [scripts/hypura/tests/test_shinka_adapter.py](scripts/hypura/tests/test_shinka_adapter.py)
- [skills/hypura-harness/SKILL.md](skills/hypura-harness/SKILL.md)
- [skills/hypura-harness/scripts/start_daemon.py](skills/hypura-harness/scripts/start_daemon.py)
- [scripts/launchers/launch-desktop-stack.ps1](scripts/launchers/launch-desktop-stack.ps1)
- [.gitignore](.gitignore)

## 実行フェーズ

### Phase 1: 基盤整備（Task 1）

- Pythonプロジェクト定義、設定JSON、ディレクトリ雛形、gitignore整備。
- 検証: 依存解決と最小構成の整合確認。
- コミット: foundation一式。

### Phase 2: コア機能を個別実装（Task 2〜7）

- `harness_daemon` の `/status` から開始し、`osc_controller`、`voicevox_sequencer`、`code_runner`、`skill_generator`、`shinka_adapter` を順次実装。
- 各モジュールでテストを先に作成し、モジュール単位でパスさせる。
- コミット: 1モジュール1コミット。

### Phase 3: 統合配線（Task 8）

- `harness_daemon.py` に `/osc` `/speak` `/run` `/skill` `/evolve` を統合。
- エンドポイント単位のテスト追加と統合テスト実施。
- コミット: endpoint wiring。

### Phase 4: スキル公開面（Task 9）

- OpenClaw向け `skills/hypura-harness/SKILL.md` と `start_daemon.py` を実装。
- 起動・ヘルスチェック契約の確認。
- コミット: skill package。

### Phase 5: 起動スタック統合と最終検証（Task 10）

- `launch-desktop-stack.ps1` へ harness 起動を追加。
- 手動スモーク（`/status` `/osc` `/run`）と全テストを実施。
- コミット: integration final。

## 検証ゲート

- モジュール実装時: 対応する `scripts/hypura/tests/test_*.py` を個別実行。
- 統合時: `scripts/hypura/tests/` 全体実行。
- 失敗時: 失敗内容を次の修正プロンプトに反映し、同タスク内で再実行。

## リスク管理

- 外部サービス未起動で落ちるケースは、通信層を例外吸収し `success:false` または健全なフォールバックに統一。
- 生成コード実行はタイムアウトと保持件数制御を必須化。
- 依存するCLI（openclaw/claude/codex）が未導入でもエラー理由を構造化して返す。
