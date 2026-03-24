---
name: Hypura Phase 2 - Bridge / UI / Reload
overview: "Live2D Companion (18791) ↔ Hypura Daemon (18790) 双方向ブリッジ、Web UI Companion Panel への Hypura ステータス + クイックアクション追加、設定ホットリロード (/reload) の3機能を追加する。"
todos: []
isProject: false
---

# Hypura Phase 2: Live2D連携 / Companion UI拡張 / 設定ホットリロード

> **前提:** Hypura Python Harness (Task 1〜10、19テスト) 完成済み
> **実装ルール:** TDD（テスト先書き → 失敗確認 → 実装 → 通過確認 → コミット）必須
> **Python コマンド:** `py -3` を使うこと（`python` / `python3` は不可）

## 変更ファイル一覧

| 操作 | ファイル                                        |
| ---- | ----------------------------------------------- |
| 新規 | `scripts/hypura/companion_bridge.py`            |
| 新規 | `scripts/hypura/tests/test_companion_bridge.py` |
| 修正 | `scripts/hypura/harness_daemon.py`              |
| 修正 | `scripts/hypura/harness.config.json`            |
| 修正 | `scripts/hypura/tests/test_harness_daemon.py`   |
| 修正 | `ui/src/ui/components/companion-panel.ts`       |

---

## Task A: Live2D ↔ Hypura 双方向ブリッジ

**Status:** `- [ ]` 未着手

### companion_bridge.py 設計

```python
class CompanionBridge:
    def __init__(self, companion_url: str): ...
    async def forward_speak(self, text: str, emotion: str) -> None:
        # POST {companion_url}/control
        # payload: {"speakText": text, "avatarCommand": {"type": "emotion", "emotion": emotion}}
        # Connect/ReadTimeout → logger.warning のみ（silent fail）
    async def forward_emotion(self, emotion: str) -> None:
        # POST {companion_url}/control
        # payload: {"avatarCommand": {"type": "emotion", "emotion": emotion}}
```

### harness.config.json 追加

```json
"companion_url": "http://127.0.0.1:18791"
```

### harness_daemon.py 修正箇所

- 起動時: `CompanionBridge(cfg["companion_url"])` を初期化
- `POST /speak` 末尾: `await bridge.forward_speak(text, emotion)`
- `POST /osc` emotion アクション末尾: `await bridge.forward_emotion(emotion)`

### TDD ステップ

1. `tests/test_companion_bridge.py` 作成（httpx をモック）
   - `test_forward_speak_posts_to_companion()`
   - `test_forward_emotion_posts_correct_payload()`
   - `test_forward_speak_silently_fails_when_companion_down()`
2. 失敗確認: `py -3 -m pytest tests/test_companion_bridge.py -v`
3. `companion_bridge.py` 実装
4. 通過確認
5. `test_harness_daemon.py` に bridge 転送テスト追加
6. `harness_daemon.py` 修正 → 通過確認
7. コミット

---

## Task C: 設定ホットリロード (`POST /reload`)

**Status:** `- [ ]` 未着手

### harness_daemon.py 追加エンドポイント

```python
@app.post("/reload")
async def reload_config():
    cfg = load_config()   # 既存の load_config() 関数を再呼び出し
    return {"reloaded": True, "config": cfg}
```

`load_config()` が未分離なら先に抽出してリファクタ。

### TDD ステップ

1. `test_harness_daemon.py` に追加:
   - `test_reload_returns_reloaded_true()`
   - `test_reload_reflects_updated_config()` （一時ファイル書き換えで確認）
2. 失敗確認
3. `/reload` エンドポイント実装
4. 通過確認
5. コミット

---

## Task B: Companion Panel — Hypura ステータス + クイックアクション

**Status:** `- [ ]` 未着手

### companion-panel.ts 変更

```typescript
// 既存ポーリング (3秒) に追加
private async fetchHypuraStatus(): Promise<void> {
    const res = await fetch('http://127.0.0.1:18790/status').catch(() => null);
    this.hypuraStatus = res?.ok ? await res.json() : null;
}
```

### 追加 UI（アイドルマスター風デザイン踏襲）

```
── Hypura Harness ──────────────────────
[●] OSC  [●] VoiceVox  [●] Ollama
[OSC: こんにちは]  [Speak: 起動完了]  [Run ▶]
```

- ステータスドット: `osc_connected` / `voicevox_alive` / `ollama_alive` → 緑/赤
- `[OSC: こんにちは]` → `POST :18790/osc {"action":"chatbox","payload":{"text":"こんにちは！"}}`
- `[Speak: 起動完了]` → `POST :18790/speak {"text":"起動完了しました","emotion":"happy"}`
- `[Run ▶]` → `prompt()` でタスク入力 → `POST :18790/run {"task": input}`
- Hypura offline → セクション全体をグレーアウト（エラーなし）

### 実装手順

1. `fetchHypuraStatus()` 追加 + ポーリングに組み込む
2. `render()` に Hypura セクション追加（既存 CSS 変数流用）
3. 手動確認（Hypura daemon 起動済み / 未起動 両方）
4. コミット

---

## 実装順序

`Task A → Task C → Task B`

---

## 検証手順

1. `cd scripts/hypura && py -3 -m pytest tests/ -v` → 全テスト通過
2. `uv run harness_daemon.py` 起動 (port 18790)
3. `curl -X POST :18790/speak -d '{"text":"テスト","emotion":"happy"}'` → VOICEVOX発話 + Companion転送確認
4. `curl -X POST :18790/osc -d '{"action":"emotion","payload":{"emotion":"happy"}}'` → OSC + Companion emotion確認
5. harness.config.json 書き換え → `curl -X POST :18790/reload` → 反映確認
6. `pnpm ui:dev` → Companion Panel の Hypura セクション表示確認
7. Companion 未起動でも daemon / UI がエラーにならないことを確認
