# 実装ログ: OpenCode Zen 無料モデル フォールバック順ローテーション

- **記録時刻（参考）**: `2026-04-05T06:02:29.666252+00:00`（`py -3` で UTC ISO 取得）
- **ワークツリー**: `clawdbot-main`

## なんJ風サマry

正直ここまでやると「無料枠を一個に偏らせないで分散させたい」って話やろ。毎回同じ `opencode/...-free` から当たるとレート制限で詰むから、**フォールバック候補の並びを回す**のが筋ってワケ。状態ファイル置いといて次は別の先頭になる、これぞ平等の幻覚。

## CoT（仮説→検証）

1. **仮説**: ローテーションは「429のときだけ」じゃなく、**エージェントがフォールバックチェーンを組む瞬間**に毎回回した方が負荷分散になる。
2. **検証**: `runWithModelFallback` はリクエスト単位で呼ばれる → 候補解決直後に回せば要件どおり。
3. **落とし穴**: `agentDir` が無いと永続化できん → **プロセス内カウンタ**で代用。
4. **落とし穴²**: `opencode` / `opencode-go` 両方、Zen の Free ID だけ対象に限定（有料を勝手に並べ替えない）。

## 変更ファイル

| 種別 | パス                                                                      |
| ---- | ------------------------------------------------------------------------- |
| 新規 | `src/agents/opencode-zen-free-rotation.ts`                                |
| 新規 | `src/agents/opencode-zen-free-rotation.test.ts`                           |
| 修正 | `src/agents/model-fallback.ts`（`applyOpencodeZenFreeRotation` 呼び出し） |
| 修正 | `.env.example`（`OPENCLAW_ROTATE_OPENCODE_ZEN_FREE` 説明）                |

## 挙動

- `agents.defaults.model.fallbacks` に **OpenCode Zen 無料 ID が2つ以上**あるとき、候補配列のうち該当スロットだけ左ローテーション。
- 対象モデル ID は `OPENCODE_ZEN_FREE_MODEL_IDS`（`extensions/auto-agent` の無料リストと整合のコメントあり）。
- 永続: `<agentDir>/opencode-zen-free-rotation.json` の `index`。
- **既定は ON**（未設定 = 回す）。`OPENCLAW_ROTATE_OPENCODE_ZEN_FREE=0` / `false` / `off` / `no` で無効化。

## 検証コマンド

```text
pnpm test -- src/agents/opencode-zen-free-rotation.test.ts
```

（実行済み: 4 tests passed）

## 補足

- 有料 `opencode/...` は並べ替え対象外。
- Free tier の公式 ID が増えたら `OPENCODE_ZEN_FREE_MODEL_IDS` と auto-agent の `FALLBACK_MODELS` を手で同期すること。
