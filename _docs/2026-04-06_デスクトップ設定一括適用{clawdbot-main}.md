# 実装ログ: デスクトップ設定一括（bootstrap / Telegram / TUI deliver）{clawdbot-main}

## なんJ風

ワイが `.openclaw-desktop/openclaw.json` と `.env` と `Start-TUI.ps1` まで触ったで。あとは **Gateway 再起動** して webhook 登録が走るの待てばええんちゃう。あとルートの `.env` に生トークンが転がってたから **漏れてたら BotFather でローテ** な。

## やったこと

1. **Bootstrap 上限**（AGENTS.md 24k 超え対策）
   - `agents.defaults.bootstrapMaxChars`: **32000**
   - `agents.defaults.bootstrapTotalMaxChars`: **250000**
   - `agents.defaults.compaction.notifyUser`: **true**（コンパクト開始が見える）

2. **Telegram**
   - `channels.telegram.dmPolicy`: **allowlist**
   - `channels.telegram.allowFrom`: **`TELEGRAM_CHAT_ID` と同じ数値**（DM 通す）
   - `webhookUrl`: **`${TELEGRAM_WEBHOOK_URL}`**
   - `webhookSecret`: **`${TELEGRAM_WEBHOOK_SECRET}`**（`.openclaw-desktop/.env` に新規追加したランダム hex）
   - 以前は JSON に webhook が無く **polling** だけ。`.env` の `NGROK_UPSTREAM_URL=http://127.0.0.1:8787` と `TELEGRAM_WEBHOOK_URL` が活きる形に寄せた。

3. **TUI → Telegram ミラー**
   - `Start-TUI.ps1` がデフォで **`tui --deliver`**（無効化は `OPENCLAW_TUI_DELIVER=0`）。

4. **検証**
   - `Merge-OpenClawEnvToProcess` 済みで `openclaw doctor` → **Telegram: ok (@hakuawhite_bot)**、bootstrap 警告は解消方向。

## ワイが追加でやったこと（2026-04-06 追記）

- **`openclaw doctor --fix`**（`Merge-OpenClawEnvToProcess` + `OPENCLAW_CONFIG_PATH` 指定）を実行済み。孤児 transcript **3 件**を  
  `.openclaw-desktop/agents/main/sessions/*.jsonl.deleted.2026-04-06T04-10-17.213Z` にリネームアーカイブした。
- **ngrok `4040/api/tunnels`**: この Cursor エージェントのシェルからは **接続不可**（ローカルに ngrok 常駐なし）。別ウィンドウで `scripts\launchers\start_ngrok.ps1` を起動しても **プロセスが残らず** → 手元 PC では **`ngrok config add-authtoken`** 未設定・認証エラー・既に別セッションが 4040 占有のどれかを疑え。  
  立ち上がったら必ず `Invoke-RestMethod http://127.0.0.1:4040/api/tunnels` で **`config.addr` が `127.0.0.1:8787`**（webhook モード時）になってるか見ろ。18789 だけだと Telegram webhook は届かん。

## お前がまだやること

- **Gateway 再起動**（webhook の `setWebhook` を取り直す）。
- **ngrok** が死んでるなら上の認証／手動起動を直してからもう一回 4040 を見る。

## FAQ: ngrok で「ページが見つかりません」HTTP 404 / `?token=${OPENCLAW_GATEWAY_TOKEN}`

1. **`${OPENCLAW_GATEWAY_TOKEN}` をそのまま URL に入れてない？**  
   それは **JSON / ドキュメント用のプレースホルダ**や。ブラウザのアドレスバーには **展開後の実トークン**（`.env` の `OPENCLAW_GATEWAY_TOKEN=` の右の長い文字列）を入れる。  
   `${...}` のままだとサーバは **リテラル文字列**として解釈して認証失敗 or 想定外ルートになりがち。

2. **ルート `https://…ngrok-free.dev/` が 404**  
   Gateway は **`/` に必ず UI を出すわけじゃない**（Control UI 無効・未ビルド・該当ルートなしだと **404 Not Found** になり得る。実装は `server-http.ts` のフォールバック）。  
   **トンネル生きてるか**はまず  
   `https://<あなたのngrokホスト>/healthz`  
   または `/health` を開く（プローブ用）。  
   ここも 404 なら **ngrok の公開 URL が古い**（無料枠でトンネル再起動するとホストが変わる）か、**上流の Gateway が止まってる**。

3. **WebSocket は `ws://127.0.0.1:18789`**（このマシンの `openclaw.json` の `gateway.port`）。  
   **`18749` は多くの場合 `18789` の誤記**（89↔49）。TUI / CLI は **`18789`** に合わせろ。

4. **ngrok 無料ドメインのブラウザ注意**  
   初回は ngrok の警告ページが挟まることがある。**API / Webhook は通常問題なし**、ブラウザだけ手動で通す必要あり。

## Caption (English)

**Figure:** Desktop-stack config patches applied for bootstrap budgets, Telegram webhook + allowlist, and TUI deliver-by-default launcher behavior.
