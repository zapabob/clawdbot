# 実装ログ: VOICEVOX CLI / ポータル統合 / Python 起動確認

- **日付**: 2026-03-28
- **ワークツリー**: clawdbot-main
- **SOUL 整合**: `identity/SOUL.md` の **Neural Voice: Auditory Resonance**（VOICEVOX 基盤維持・高忠実度音声）および **Metaverse Voice**（チャットボックス顕現）と一致。ENGINE `:50021` はローカル音声パイプラインの前提。

## 変更概要

1. **`scripts/launchers/Sovereign-Portal.ps1`**
   - `Full` / `Ghost` / `Harness` 起動時に `start-voicevox-engine.ps1` を子 PowerShell で起動（最小化）。
   - `SKIP_VOICEVOX_START=1` でスキップ可能。

2. **`scripts/launchers/ASI-Manifest-Sovereign.ps1`**
   - デスクトップショートカット `ASI-VOICEVOX` を追加（`start-voicevox-engine.ps1`）。

3. **`scripts/launchers/README.md`**
   - `start-voicevox-engine.ps1` の行を追加。

## 既存（参照）

- **`scripts/launchers/start-voicevox-engine.ps1`**: `run.exe --host/--port`、検証は `scripts/tools/verify_voicevox.py`（`.venv\python` 優先、なければ `py -3`）。
- **`scripts/tools/verify_voicevox.py`**: `--probe-only`（`/version`）、フル検証は synthesis + RIFF 確認。`tqdm` 任意。

## 起動確認（手元）

```powershell
py -3 scripts\tools\verify_voicevox.py --probe-only --quiet
# ENGINE 起動後は exit 0
```

ENGINE 未起動時は `exit=1`（正常な否定結果）。

## CoT（要約）

- **仮説**: Hypura / local-voice が `:50021` を前提にするなら、ポータルで先に ENGINE を立てるのが最短。
- **検証**: `verify_voicevox.py` で HTTP と合成を機械確認。
- **リスク**: VOICEVOX 未インストール時は子プロセスが失敗する → `SKIP_VOICEVOX_START` で回避。
