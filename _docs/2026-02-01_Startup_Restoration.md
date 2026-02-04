# 2026-02-01 起動機能の復旧

## 概要

同期作業およびその後のクリーンアップ中に失われていた実行用エントリーポイント（`openclaw.mjs`）および起動スクリプト類を復旧し、アプリケーションが正常に起動できる状態にしました。

## 復旧内容

- **エントリーポイント**: `openclaw.mjs` を上流より復旧。
- **実行スクリプト**:
  - `scripts/run-node.mjs`
  - `scripts/setup-git-hooks.js`
  - `scripts/format-staged.js`
  - `scripts/postinstall.js`
- **エンコーディング修正**: 復旧したファイルが適切に UTF-8 で保存されるよう修正。

## 検証内容

- **起動確認**: `pnpm dev --help` を実行し、ヘルプ画面が表示（起動成功）することを確認。
- **ビルド整合性**: `pnpm tsc` により `dist/entry.js` が生成され、起動スクリプトから参照可能であることを確認。

## 備考

- `node_modules` は削除されていたため、作業中に `pnpm install` を再実行して環境を構築しました。
- アプリケーションは `pnpm dev` で起動可能です。
