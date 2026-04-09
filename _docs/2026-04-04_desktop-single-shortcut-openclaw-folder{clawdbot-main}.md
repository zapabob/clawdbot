# 実装ログ: デスクトップショートカット1本 + PS1 を openclaw-desktop フォルダへ

**日付**: 2026-04-04

## 変更概要

1. **デスクトップ**には **`OpenClaw.lnk` のみ**（`launch-desktop-stack.ps1` 相当・可視 Gateway/TUI 等の既存引数維持）。
2. 実装 PS1 は **`scripts/launchers/openclaw-desktop/`** に移動:  
   `launch-desktop-stack.ps1`, `Sovereign-Portal.ps1`, `ASI-Hakua-Portal.ps1`, `Install-OpenClawDesktopShortcuts.ps1`, `ASI-Manifest-Sovereign.ps1`
3. **`scripts/launchers/` 直下の同名ファイル**は **シム**（`openclaw-desktop\*.ps1` に `@args` 委譲）。  
   `OPENCLAW_DESKTOP_LAUNCHER=scripts/launchers/launch-desktop-stack.ps1` は変更不要。
4. インストール時に旧 `.lnk` 一式を削除（Sovereign / Stack / Refresh / Companion / Clawdbot / Hakua\* 等）。

## 再インストール

`scripts\installers\create-desktop-shortcut.ps1` または `scripts\launchers\ASI-Manifest-Sovereign.ps1`
