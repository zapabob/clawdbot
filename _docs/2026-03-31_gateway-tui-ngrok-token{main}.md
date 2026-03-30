# Gateway/TUI 起動安定化ログ

- 実装日時: 2026-03-31T02:26:53+09:00
- 対象ブランチ: `main`
- 対象課題:
  - Gateway が正常起動しない
  - TUI が落ちる
  - ブラウザへの動的トークン注入
  - ngrok の環境変数を動的注入して起動

## 変更内容

1. `scripts/launchers/env-tools.ps1`
   - `Ensure-GatewayTokenInProcess` を追加。
     - `OPENCLAW_GATEWAY_TOKEN` が未設定でも `.env` へ自動生成し、現在プロセスへ注入。
   - `Sync-NgrokPublicUrlToEnv` を追加。
     - `http://127.0.0.1:4040/api/tunnels` をポーリングして公開URLを取得。
     - `OPENCLAW_PUBLIC_URL`, `TELEGRAM_WEBHOOK_URL`, `LINE_WEBHOOK_URL` を
       `.env` と現在プロセスへ同期。

2. `scripts/launchers/Start-Gateway.ps1`
   - 起動前にトークン自動補完を実施。
   - 起動前に ngrok 公開URLの短時間同期を実施。

3. `scripts/launchers/Start-TUI.ps1`
   - 起動前にトークン自動補完を実施。
   - 起動前に ngrok 公開URLの短時間同期を実施。

4. `scripts/launchers/Sovereign-Portal.ps1`
   - ポータル起動時にトークンを先行補完。
   - ngrok 起動直後に公開URLを動的同期（side process待ちに依存しない）。
   - ブラウザ起動URLの基底を `OPENCLAW_PUBLIC_URL` 優先に変更。
   - `Sovereign-Portal.lnk` 自動更新時の引数を
     `-Mode Full -UseDesktopLauncher` に変更（安定起動寄り）。

5. `scripts/launchers/ASI-Manifest-Sovereign.ps1`
   - デスクトップショートカット `ASI-Hakua-Sovereign.lnk` の起動引数を
     `-Mode Full -UseDesktopLauncher` に変更。

## 期待効果

- Gateway/TUI 起動時にトークン欠落で失敗する経路を封じる。
- ngrok URL 未反映のタイミングレースを低減する。
- ブラウザ起動時に公開URL + token クエリへ寄せやすくする。
- デスクトップショートカットからの既定起動を Docker 依存から分離し、安定化。

## 備考

- MCP サーバー `user-filesystem` は STATUS 上でエラー状態だったため、日時はローカル時刻を使用。
