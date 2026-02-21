# Canvas Web UI Build Fix (Windows)

**Date:** 2026-02-21

## 概要

OpenClawのWeb UI（Canvas）(`http://0.0.0.0:3000/__openclaw__/canvas/`) にアクセスした際に404エラーとなり、画面が表示されない問題に対応しました。原因は、フロントエンドのアセットをビルドするスクリプトがWindows環境で正しく実行されていなかったためでした。

## 実装内容

1. **原因**: `package.json` 内のビルドコマンドである `canvas:a2ui:bundle` にて、bashスクリプト (`bash scripts/bundle-a2ui.sh`) が呼び出されており、WSLがセットアップされていないWindows環境ではエラーとなってJSバンドル (`a2ui.bundle.js`) が生成されていませんでした。
2. **修正内容**: `package.json` を修正し、bashスクリプトを経由せず、直接ネイティブのNode.jsビルドツール (`tsc` および `rolldown`) を使ってビルドを行うように変更しました。
   ```json
   "canvas:a2ui:bundle": "pnpm exec tsc -p vendor/a2ui/renderers/lit/tsconfig.json && pnpm exec rolldown -c apps/shared/OpenClawKit/Tools/CanvasA2UI/rolldown.config.mjs"
   ```
3. **確認**: 修正後に再度 `pnpm build` を実行することで正常にビルドが完走し、GatewayからCanvas UIが正しいレスポンス（HTTP 200）で返されることを確認しました。
