# scripts/

ビルド・検証・運用スクリプト。公式リポジトリと同様、ルートの `package.json` から呼ばれる処理と補助ツールを置きます。

| サブディレクトリ | 内容                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `launchers/`     | Windows 用: Gateway / TUI / ngrok / Hypura ハーネス / ポータル。`env-tools.ps1` で `.env` + `.env.local` をプロセスへマージ。 |
| その他           | `generate-*.mjs`、テスト補助など（既存構成に従う）。                                                                          |

エージェント workspace はリポジトリルート。設定の正は `_docs/2026-03-28_OpenClaw_Config_Source_of_Truth_clawdbot-main.md` を参照。

ルートに散らばっていた作業用ファイルは `_artifacts/root-captured/` へ退避（`logs/` は gitignore 対象）。
