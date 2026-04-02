# 実装ログ: デスクトップショートカット再生成（launch-desktop-stack 復元）

- **日時**: 2026-04-03 02:25:32 +09:00（ローカル取得）
- **worktree**: `clawdbot-main`

## 背景

`scripts/installers/create-desktop-shortcut.ps1` が参照する `scripts/launchers/launch-desktop-stack.ps1` がリポジトリから欠落しており、ショートカット生成が `Launcher script not found` で失敗していた。

## 対応

- `d1b899e861`（削除コミット）の親 `d1b899e861^` から **`launch-desktop-stack.ps1` を `git checkout` で復元**（文字化け回避のため `Set-Content` パイプは使わない）。
- `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\installers\create-desktop-shortcut.ps1` を実行し、デスクトップに 4 件の `.lnk` を再生成。

## 結果

- **成功**: `Clawdbot.lnk`, `Hakua Companion.lnk`, `Hakua Companion Only.lnk`, `Install Shortcuts.lnk` が作成された。

## 備考

- 復元版ランチャーは `openclaw gateway/tui` 等の従来スタック起動ロジックを含む。`Sovereign-Portal.ps1` 系の統合ポータルとは別系統のため、将来どちらを正とするかは運用で選択可能。
