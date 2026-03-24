# ANTHROPIC_API_KEY 起動復旧ログ

- **UTC (py -3)**: `2026-03-24T16:45:23Z`
- **ローカル日付（作業日）**: 2026-03-25
- **worktree / 識別子**: `clawdbot-main`

## なんJ風ざっくり結論

「`ANTHROPIC_API_KEY` ねぇやんけ → SecretRef 解決できん → 起動 fail-fast」って話。**キー実体はこっちに無いから**、ブロックしてた `auth-profiles` 側の必須参照を外して通した。Anthropic 使うなら後から `~/.openclaw/.env` に生キー足して `secrets configure` で戻せ。

## CoT（仮説→検証）

1. **仮説**: Gateway が `ANTHROPIC_API_KEY` の env SecretRef を「有効サーフェス」として解決しようとして落ちてる（`docs/gateway/secrets.md` の fail-fast 契約）。
2. **観測**: `.openclaw-desktop/agents/main/agent/auth-profiles.json` に `anthropic:default` が `keyRef → ANTHROPIC_API_KEY` で居座ってた。一方 `~/.openclaw/agents/main/agent/auth-profiles.json` には Anthropic プロファイル無し → **デスクトップ用設定だけがキー必須**になってた。
3. **検証**: `anthropic:default` と `lastGood.anthropic` を削除して整合。`openclaw secrets audit --check` で **unresolved=0** を確認。短時間 `gateway run` スモークで stderr に Anthropic 系エラー無し。

## 変更したファイル（repo-root 相対）

| ファイル                                                                                                         | 内容                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [.openclaw-desktop/agents/main/agent/auth-profiles.json](.openclaw-desktop/agents/main/agent/auth-profiles.json) | `anthropic:default` プロファイルと `lastGood.anthropic` を削除（`~/.openclaw` 側と同様、Anthropic を必須にしない） |

## ユーザー環境（repo 外）

| 場所               | 内容                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| `~/.openclaw/.env` | 将来のため `ANTHROPIC_API_KEY` 用コメント行を追加（**実キーはユーザーが貼る**） |

## 本番で Anthropic をまた使う手順（キー運用A）

1. [Console](https://console.anthropic.com/) 等で API キー発行。
2. `~/.openclaw/.env` に `ANTHROPIC_API_KEY=sk-ant-...` を**非空で**追記（[Environment Variables](https://docs.openclaw.ai/help/environment) の precedence を確認）。
3. `openclaw secrets configure --agent main` で `anthropic:default` + `keyRef` を再登録するか、手で `auth-profiles.json` を戻す。
4. `openclaw secrets reload` / Gateway 再起動。

## 実行コマンド（記録）

```powershell
$env:OPENCLAW_CONFIG_PATH = (Resolve-Path ".openclaw-desktop\openclaw.json").Path
pnpm exec openclaw secrets audit --check
# → unresolved=0（plaintext 指摘は別件）
```

## 参照ドキュメント（OpenClaw）

- [Secrets Management](https://docs.openclaw.ai/gateway/secrets)
- [Environment Variables](https://docs.openclaw.ai/help/environment)

## 備考

- 実キーをリポジトリに書かない。`auth-profiles.json` に残っている他プロバイダの資格情報は**触らない**（本ログにも貼らない）。
- エージェント終了時 WAV はローカル `C:\Users\downl\Desktop\SO8T\.cursor\marisa_owattaze.wav` を手元で鳴らす運用で（CI からは再生しない）。
