# Telegram Bot 起動失敗 調査ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6

---

## 概要

`/btw テレグラムbotが正常起動しない件` の調査。
ゲートウェイ起動時に Telegram チャンネルが `[default] starting provider` まで進むものの、
即座に `deleteWebhook: 404 Not Found` で落ちてリトライを繰り返す問題を特定した。

---

## 調査手順

### 1. ログ確認

**対象ログ**: `.openclaw-desktop/logs/`

| ログファイル                   | サイズ    | 状況                                         |
| ------------------------------ | --------- | -------------------------------------------- |
| `gateway-20260320-081913.log`  | 107.7 KB  | 起動成功・LINE エラー多数・Telegram 起動なし |
| `gateway-20260321-*.log` (5件) | 各 2.1 KB | PS ヘッダーのみ（ゲートウェイ無出力）        |
| `gateway-startup.log`          | 2.3 MB    | 全セッション蓄積ログ                         |

### 2. `gateway-startup.log` から Telegram エラーを抽出

3/18 から継続して同じエラーが記録されていた:

```
2026-03-18T09:51:49.720+09:00 [telegram] [default] starting provider
2026-03-18T09:51:49.823+09:00 [telegram] autoSelectFamily=true (default-node22)
2026-03-18T09:51:49.826+09:00 [telegram] dnsResultOrder=ipv4first (default-node22)
2026-03-18T09:51:51.191+09:00 [telegram] deleteWebhook failed: Call to 'deleteWebhook' failed! (404: Not Found)
2026-03-18T09:51:51.195+09:00 [telegram] [default] channel exited: Call to 'deleteWebhook' failed! (404: Not Found)
2026-03-18T09:51:51.198+09:00 [telegram] [default] auto-restart attempt 1/10 in 5s
2026-03-18T09:51:51.210+09:00 [telegram] deleteMyCommands failed: Call to 'deleteMyCommands' failed! (404: Not Found)
2026-03-18T09:51:51.452+09:00 [telegram] setMyCommands failed: Call to 'setMyCommands' failed! (404: Not Found)
```

**全 Telegram API 呼び出しが 404** → `deleteWebhook`、`deleteMyCommands`、`setMyCommands` すべて。

### 3. 設定確認

`.openclaw-desktop/openclaw.json`:

```json
"telegram": {
  "enabled": true,
  "botToken": "8549534063:AAHJCcoNWgsFgrH0jWnwfFv0ne12cbBKnvg",
  "dmPolicy": "open",
  "allowFrom": ["*"],
  "groupPolicy": "open",
  ...
}
```

設定は正常（`enabled: true`, botToken 設定済み）。

### 4. ビルド確認

```
pnpm run build → exit code 0 ✅
```

ビルド自体は正常。3/21 のログが空なのはビルドエラーではなく、
ゲートウェイウィンドウが pnpm 出力前に閉じられたか、
または旧ビルドの `context.unsubscribeAllSessionEvents` クラッシュ（`7cc44d8cee` で修正済み）
によりゲートウェイが即時終了していたため。

### 5. コード確認

Telegram の `startAccount` → `monitorTelegramProvider` → `polling-session.ts::#ensureWebhookCleanup`:

```typescript
fn: () => bot.api.deleteWebhook({ drop_pending_updates: false }),
```

エンドポイント: `https://api.telegram.org/bot{TOKEN}/deleteWebhook`
カスタム API サーバーなし（`TELEGRAM_LOCAL` 等の設定なし）。

---

## 根本原因

**Telegram Bot API が `404: Not Found` を返す**

Telegram Bot API の仕様:

- **401**: トークン形式不正（文字列として無効）
- **404**: そのトークンに対応するボットが**存在しない**（削除済み or トークン無効化済み）
- **200**: 正常

複数の異なるメソッドがすべて 404 → ボット自体が BotFather で削除されたか、
`/revoke` でトークンが無効化されたと考えられる。

---

## 影響範囲

- Telegram チャンネルは完全に停止（全セッションでリトライ 1/10〜10/10 を消費して諦める）
- Discord は正常動作（同ゲートウェイで `[discord] [default] starting provider` 確認済み）
- LINE は別エラー（`lineSetupAdapter` redefine、`7cc44d8cee` で修正済み）

---

## 修正手順（ユーザー作業）

1. **Telegram → BotFather を開く**
2. `/mybots` → `@hakuawhite_bot` を選択
3. **ボットが存在する場合**: `API Token` → `/revoke` でトークン再発行
4. **ボットが存在しない場合**: `/newbot` で新規作成
5. 新トークンを `openclaw.json` に反映:
   ```json
   "channels": {
     "telegram": {
       "botToken": "新しいトークン",
       ...
     }
   }
   ```
6. ゲートウェイ再起動

---

## 付記: LINE `lineSetupAdapter` 問題（既修正）

3/20 ログで確認された LINE プラグインの重複ロードエラー:

```
[plugins] line failed to load: TypeError: Cannot redefine property: lineSetupAdapter
```

コミット `7cc44d8cee` にて `extensions/line/index.ts` の re-export を
`export { x } from "..."` → `export { x }` に修正済み。
