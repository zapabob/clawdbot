# 実装ログ: TUI 自動コンパクト & Telegram 配信フォールバック（worktree: clawdbot-main）

- **観測時刻 (UTC, Python 検証)**: `2026-04-06T03:38:59.304295+00:00`（`py -3` + `tqdm` で3ティック待ってから `datetime.now(timezone.utc)`）
- **なんJ風まとめ**: 16k窓なのにコンパクト床20kは草不可避だった → コード側で窓に合わせてクランプしたわ。あと TUI の `tui-UUID` セッションで `--deliver` してもテレグラムにルート無くて詰むやつ、メインセッションの `lastChannel` にフォールバックするようにしたぞ。ワンチャン inbound 側（webhook/ngrok）死んでるならそれは別枠で `openclaw doctor` 頼む。

## 仮説検証（CoT）

1. **H1**: `agents.defaults.compaction.reserveTokensFloor` 既定 20,000 が Pi の `reserveTokens` 下限に乗り、**コンテキスト 16k より大きい** → 自動コンパクト閾値が壊れる。  
   **検証**: `applyPiCompactionSettingsFromConfig` は `max(current, floor)` で底上げするため、小窓では矛盾。  
   **対応**: 有効コンテキストが分かるときは floor と最終 `targetReserveTokens` を窓サイズにクランプ（`pi-settings.ts`）。

2. **H2**: `chat.send` の `deliver: true` でも、セッションキーが `agent:main:tui-*` のとき **`canInheritDeliverableRoute` が false** で `lastChannel` を拾えない。  
   **検証**: `resolveChatSendOriginatingRoute` は channel-agnostic な `tui-` スコープを外部継承対象にしない。  
   **対応**: TUI/Control UI かつ deliver のとき、同一エージェントの **メインセッション**（`resolveAgentMainSessionKey`）の配送メタをフォールバック（`chat.ts`）。

## 変更ファイル

| ファイル | 内容 |
|---------|------|
| `src/agents/pi-settings.ts` | 小窓向け floor / reserve クランプ、`contextWindowTokens` を `applyPiCompactionSettingsFromConfig` に追加 |
| `src/agents/pi-project-settings.ts` | `createPreparedEmbeddedPiSettingsManager` が `contextWindowTokens` を伝搬 |
| `src/agents/pi-embedded-runner/run/attempt.ts` | `contextTokenBudget` を設定マネージャに渡す |
| `src/agents/pi-embedded-runner/compact.ts` | `ctxInfo.tokens` を設定マネージャに渡す |
| `src/gateway/server-methods/chat.ts` | Operator UI + deliver 時のメインセッション配送フォールバック |
| `src/cli/tui-cli.ts` | `--deliver` のヘルプ文言を具体化 |
| `src/agents/pi-settings.test.ts` | 小窓クランプの回帰テスト |
| `CHANGELOG.md` | Fixes 追記 |

## 利用者向けメモ

- **TUI から Telegram にも送りたい**: `openclaw tui --deliver`（メインセッションに Telegram の `lastChannel` / `lastTo` が載っていること）。
- **Bootstrap truncation**: `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` を上げるか、該当ファイルを直接読む（警告に従う）。
- **Telegram が一切届かない（受信も不可）**: トークン・webhook/ngrok・`channels.telegram.*`・ゲートウェイ起動を別途確認（本変更は主に **TUI からの外向き deliver** と **小窓コンパクト**）。

## Caption (English)

**Figure:** Implementation scope — compaction reserve clamping vs. operator-UI deliver fallback (2026-04-06).
