# 実装ログ: デスクトップショートカット改良

- 実施日: `2026-04-07`
- worktree: `clawdbot-main`
- MCP現在日時(UTC): `2026-04-07T00:20:43+00:00`
- 実施ブランチ: `main`

## 変更内容

1. `scripts/launchers/openclaw-desktop/Install-OpenClawDesktopShortcuts.ps1`
   - 既存ショートカットを単純スキップせず、内容比較して差分があれば自動更新する処理を追加
   - `-AlsoStartMenu` スイッチを追加し、デスクトップに加えてスタートメニュー `Programs` にも `OpenClaw.lnk` を作成可能に変更
   - `-Force` 時は差分有無に関係なく再生成
   - 出力ログを「更新済み」「作成済み」で判別しやすく整理

2. `pnpm check`
   - 実行して最終ゲートの通過を確認（PASS）

## 期待効果

- 既存環境でショートカット定義が古くても、再実行時に安全に追従更新できる
- 必要に応じてスタートメニュー配置も同時に行える
