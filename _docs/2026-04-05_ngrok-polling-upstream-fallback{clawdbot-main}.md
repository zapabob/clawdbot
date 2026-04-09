# 実装ログ: ngrok 上流を Telegram ポーリング時に Gateway へ自動寄せ（worktree: clawdbot-main）

- **MCP/検証時刻（Python UTC）**: `2026-04-05T14:01:42.272476+00:00`（`tqdm` で1ステップ進捗表示のみ — _Caption: UTC timestamp capture_）
- **CoT 仮説**: `.env` が `http://127.0.0.1:8787` 固定なのに `openclaw.json` に `channels.telegram.webhookUrl` が無い＝**ポーリング** → 8787 に HTTP リスナーが立たない → ngrok 8012 確定や。
- **検証**: 型どころの話ちゃう、**実行時の Listen の有無**が真実。設定の「意図」（webhook かどうか）を JSON から読んで、8787 指しの env は **Gateway にフォールバック**すればええやろ。
- **変更ファイル**:
  - `scripts/launchers/env-tools.ps1` — `Test-OpenClawTelegramWebhookListenerExpected` / `Get-OpenClawNgrokUpstreamResolution`；`Get-NgrokUpstreamTunnelMatchPort` に `-ProjectDir`；`Test-NgrokSyncTelegramWebhookOnly` から同ポート解決を通す。
  - `scripts/launchers/start_ngrok.ps1` — 上記 Resolution を1回だけ使い、ポーリング時は警告ログ。
  - `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1` / `launch-desktop-stack.ps1` — `Get-NgrokUpstreamTunnelMatchPort -ProjectDir $ProjectDir`。
  - `scripts/launchers/README.md` / `CHANGELOG.md` — 挙動の一文。

## なんｊ風まとめ

テンプレ `:8787` 貼っといて webhook 設定せん奴、トンネル先に幽霊しかおらんのは当然やろがい。こっちで **json 見て Gateway に脳筋修正**しといたわボケが。Rust の tqdm ビルドは今回ゼロや。
