# 2026-02-02 LINEプラグイン重複対策

## 概要
- `openclaw.disabled` / `openclaw.disabledReason` をパッケージメタデータで扱えるように追加。
- プラグイン探索時に disabled 指定のパッケージを読み込まないように変更し、公式LINEプラグインを優先。
- disabled パッケージが探索対象から除外されることのテストを追加。

## 変更点
- `OpenClawPackageManifest` に `disabled` フラグを追加。
- discovery に `resolvePackageDisableInfo()` を追加し、無効化時は診断ログを出すように変更。
- discovery テストで disabled パッケージ除外を検証。

## 変更ファイル
- `src/plugins/manifest.ts`
- `src/plugins/discovery.ts`
- `src/plugins/discovery.test.ts`

## テスト
- 未実行（手動確認のみ）。

## 備考
- 起動時に表示される「plugin package disabled...」の警告は、ローカル拡張を無視して公式プラグインを使っていることを示す想定挙動です。
