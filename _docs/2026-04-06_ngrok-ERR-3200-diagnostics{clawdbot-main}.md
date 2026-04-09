# ngrok ERR_NGROK_3200 フォロー（自動診断ログ）

- **UTC 時刻**: 2026-04-05T15:54:32Z（`py -3` で取得）
- **対象ホスト**: `remedial-joline-unrash.ngrok-free.dev`
- **設定**: `.openclaw-desktop/openclaw.json` の `gateway.port` = **18789**

## 実施した確認（このマシン上）

| 項目                                  | 結果                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| TCP LISTEN `18789`                    | あり（Gateway）                                                                               |
| TCP LISTEN `4040`                     | あり（ngrok ローカル API）                                                                    |
| `http://127.0.0.1:4040/api/tunnels`   | トンネル **1** 本、`https://remedial-joline-unrash.ngrok-free.dev` → `http://127.0.0.1:18789` |
| `ngrok`                               | `PATH` 上（WindowsApps の `ngrok.exe`）                                                       |
| 外向き `GET https://…ngrok-free.dev/` | **HTTP 503**（本文: Control UI 未ビルドメッセージ）                                           |
| 直 `GET http://127.0.0.1:18789/`      | 同様 **503**                                                                                  |

## 結論（仮説 → 検証）

1. **仮説 A**: ERR_NGROK_3200 = トンネル完全オフライン  
   **検証**: ローカル API ではトンネルが掲載されており、**A は現時点では却下**（別端末・別セッションの URL を見ていた／一時切断の可能性は残る）。

2. **仮説 B**: 外向きが「死んでる」ように見えるのは上流が 503  
   **検証**: ルート `/` は Control UI 未同梱時に **503** を返す実装（`server-http.ts` / `control-ui-assets` 系）。**B を採用** — Webhook 用パスは別扱いのため、**ルート 503 だけではチャネル死活は断定できない**。

## お前（エージェント）がここまでやったこと

- ポート・ngrok API・外向き HTTP の実測（PowerShell / curl）。
- 上流 503 が Gateway 仕様に一致することのコードgrep。

## まだ「全部」やれない部分（人間 or 常駐プロセス領域）

- **トンネル強制再起動**（`ngrok` kill → 再実行）は、無料枠だと **URL が変わる**可能性があり、Telegram BotFather 等の webhook 更新が必要。**勝手に kill はしていない**。
- **Control UI**: ルートを 200 系にしたい場合はリポジトリで `pnpm ui:build`（または開発中 `pnpm ui:dev`）。これはビルド作業で時間がかかる。

## 次の一手（3200 が再発する場合）

1. [ngrok Endpoints ダッシュボード](https://dashboard.ngrok.com/endpoints) で当該エンドポイントが **Active** か確認。
2. この PC で `Get-Process ngrok` が無ければ、`scripts\launchers\start_ngrok.ps1 -Port 18789`（`.env` に `NGROK_EXE` が必要な場合あり — リポジトリに `ngrok.exe` は無し）で再開。
3. Webhook 先 URLを **ダッシュボードまたは `4040/api/tunnels` の最新 `public_url`** に合わせて更新。
