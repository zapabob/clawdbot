# 実装ログ: qwen-Hakua-core2 のカタログを実コンテキスト上限に合わせる

- **記録時刻 (UTC)**: 2026-04-06T04:37:53.653212+00:00
- **ワークツリー**: clawdbot-main

## なんJ風ざっくり

> TUI が `16k/16k (100%)` って言ってたの、設定が 16384 固定だっただけ説ｗｗｗ  
> Modelfile 見たら `num_ctx 128000` だったからカタログ側を合わせた。これで表示も圧縮判断もちゃんと 128k 基準になるはず。

## CoT（仮説→検証）

1. **仮説**: `tokens 16k/16k` の分母は `resolveContextWindowInfo` が読む `models.providers.ollama` の `contextWindow`。
2. **根拠**: `src/agents/context-window-guard.ts` が `models.providers.*.models[].contextWindow` を優先。
3. **実測**: `.openclaw-desktop/openclaw.json` で `qwen-Hakua-core2:latest` が `contextWindow: 16384`, `maxTokens: 2048`。
4. **対抗仮説**: 実モデルが 16k のまま → `scripts/modelfiles/Modelfile_HakuaCore2` は `PARAMETER num_ctx 128000` なので、**その Modelfile で `ollama create` 済みなら** 128k が正。
5. **結論**: カタログを `contextWindow: 128000`, `maxTokens: 16384` に更新。エージェントの `models.json` も同値に同期（即時反映用）。

## 変更ファイル

| ファイル                                          | 内容                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `.openclaw-desktop/openclaw.json`                 | `qwen-Hakua-core2:latest` の `contextWindow` / `maxTokens` |
| `.openclaw-desktop/agents/main/agent/models.json` | 同上（マージ済みカタログ）                                 |

## 運用メモ（ガチ）

- **VRAM**: 128k コンテキストは 9B 級でも重い。OOM や遅延なら `num_ctx` を下げるか、カタログの `contextWindow` を実運用値に下げる。
- **Ollama 側が 16k のまま**のタグしか無い場合、カタログだけ上げても実際の推論上限は増えない。`ollama show qwen-Hakua-core2:latest` でパラメータ確認推奨。
- **再起動**: Gateway / TUI を再起動するとステータス行の分母が更新されやすい。

## 検証コマンド例

```powershell
# 設定反映後、セッションを張り直す / gateway 再起動
py -3 -c "import json; p=r'.openclaw-desktop/openclaw.json'; d=json.load(open(p,encoding='utf-8')); m=[x for x in d['models']['providers']['ollama']['models'] if x['id']=='qwen-Hakua-core2:latest'][0]; print(m['contextWindow'], m['maxTokens'])"
```

期待: `128000 16384`
