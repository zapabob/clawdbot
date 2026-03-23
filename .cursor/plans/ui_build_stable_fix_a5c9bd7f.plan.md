---
name: UI Build Stable Fix
overview: "`pnpm ui:build` が `ui/node_modules/vite/bin/vite.js` 解決失敗で落ちる問題を、依存構成を変えず `scripts/ui.js` 側の実行解決ロジック修正で恒久対応し、検証・コミットまで完了させる。"
todos: []
isProject: false
---

# UI Build Stable Fix Plan

## Goal

- `pnpm ui:build` を常に成功させる。
- `ui/package.json` の依存構成は維持し、`scripts/ui.js` のランナー解決のみを修正する。

## Scope

- [c:\Users\downl\
