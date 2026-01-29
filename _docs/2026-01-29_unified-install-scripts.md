# 統合インストールスクリプト実装 (2026-01-29)

## 概要

プロジェクト全体を一括でインストール・ビルドできる統合スクリプトを作成しました。

## 作成されたファイル

### Windows (PowerShell)

- `scripts/install.ps1`

### Unix/macOS/Linux (Bash)

- `scripts/install.sh`

## 使用方法

### Windows

```powershell
# 通常インストール
.\scripts\install.ps1

# クリーンビルド (node_modules, dist を削除)
.\scripts\install.ps1 -Clean

# ビルドをスキップ
.\scripts\install.ps1 -SkipBuild

# 本番用ビルド
.\scripts\install.ps1 -Production
```

### Unix/macOS/Linux

```bash
# 通常インストール
./scripts/install.sh

# クリーンビルド
./scripts/install.sh --clean

# 型チェックをスキップ
./scripts/install.sh --skip-check

# 本番用ビルド
./scripts/install.sh --prod
```

### npm scripts

```bash
# Windows
pnpm install:all
pnpm install:clean
```

## 処理内容

1. **前提条件チェック**
   - Node.js v22.12.0以上が必要
   - pnpm がなければ自動インストール

2. **クリーンアップ** (オプション)
   - `dist/` ディレクトリを削除
   - `node_modules/` ディレクトリを削除

3. **依存関係インストール**
   - `pnpm install` を実行

4. **型チェック**
   - `tsc --noEmit` を実行
   - エラーがあっても続行可能

5. **ビルド**
   - TypeScriptコンパイル (`tsc -p tsconfig.json`)
   - ポストビルドスクリプト実行

## インストール後のコマンド

| コマンド             | 説明                              |
| -------------------- | --------------------------------- |
| `pnpm start`         | 開発モードで起動                  |
| `pnpm gateway:dev`   | Gateway開発サーバー起動           |
| `pnpm tui`           | TUIモード起動                     |
| `pnpm test`          | テスト実行                        |
| `pnpm link --global` | グローバルにmoltbotコマンドを登録 |

## 注意事項

- Windows環境では一部のbashスクリプト(canvas:a2ui:bundle等)が動作しないため、直接tscを使用したビルドを行います
- WSLを使用する場合は、`install.sh`を使用することも可能です
