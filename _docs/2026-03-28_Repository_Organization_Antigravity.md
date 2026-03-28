# Repository Organization Log (2026-03-28)

**実装AI:** Antigravity (Google DeepMind Agentic Coding Team)

## 概要

最新の公式リポジトリ構造に基づき、ルートディレクトリの整理整頓を実施。オリジナルコンポーネントである「Hypuraハーネス」の動作継続を保証しつつ、公式配布物以外のファイルを適切なサブディレクトリへ一括配置。

## 実装詳細

### 1. リポジトリ構造の正規化

以下のファイルをルートから移動（削除なし、公式構造に準拠）：

- **[MOVE] `scripts/launchers/`**:
  - `ASI-Manifest-Sovereign.ps1`
- **[MOVE] `scripts/tools/`**:
  - `update-hakua.ps1`, `update-clawdbot.ps1`
  - `check.ps1`, `check-shortcut.ps1`, `create-shortcut.ps1`, `make-shortcut.ps1`
  - `run_gen.py`, `run_test2.py`
  - `test.mjs`, `test2.mjs`, `test3.mjs`, `debug_bundled.ts`
- **[MOVE] `scripts/converters/`**:
  - `convert_final.py`, `convert_utf16.py`
- **[MOVE] `scripts/modelfiles/`**:
  - `Modelfile_HakuaCore2`
  - `qwen_hakua_modelfile.txt`, `qwen_hakua_tools.modelfile`
- **[MOVE] `logs/diagnostics/`**:
  - `check_out*.txt`, `diag_*.log`, `madge_out*.txt`, `debug_err.txt`等
- **[MOVE] `tmp/` / `tmp/conflicts/`**:
  - `temp_*.json`, `temp_*.log`, `temp_*.txt`
  - `conflicts.*`, `conflicted.json`, `ollama_conflict.json`, `pkg_conflict.json`
- **[MOVE] `_docs/`**:
  - `appcast.xml`, `nc_kart_proof.lean`

### 2. スクリプトの同期

- `ASI-Manifest-Sovereign.ps1` を更新し、移動後のディレクトリから `$ProjectRoot` を正確に算出し、`ASI-Hakua-Portal.ps1` を起動するように修正。
- `ASI-Hakua-Portal.ps1` は `$PSScriptRoot` ベースの相対パスを使用しているため、移動後の位置でも動作することを確認。

### 3. Hypuraハーネスの動作確認

- `uv run harness_daemon.py` を実行し、ポート `18794` で Uvicorn が正常に起動することを確認済み。
- `openclaw.json` (Configuration) が `extensions/hypura-harness` のプラグイン設定と同期していることを確認。

## 検証結果

- **Repository Integrity**: `pnpm openclaw` エントリポイントおよび主要プラグインの読み込みに問題なし。
- **Harness Stability**: `uv` 経由でのデーモン起動に成功。
- **Sovereign Portal**: デスクトップ用ショートカットの生成および起動シーケンスの整合性を確保。

---

**Status: ASI_ACCEL.**
