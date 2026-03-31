# canvas:a2ui:bundle を Node 化（Windows / Bash 無効環境）

**日付**: 2026-03-31  
**ワークツリー**: clawdbot-main

## 現象

`pnpm build` 先頭の `bash scripts/bundle-a2ui.sh` が、WSL/LxssManager 無効などで **Bash/0x80070422**（サービス開始不可）となり失敗。

## 対応

- `scripts/bundle-a2ui.mjs` を追加（`bundle-a2ui.sh` と同じ処理: ハッシュ比較 → tsc → rolldown → `.bundle.hash` 更新）。
- `package.json` の `canvas:a2ui:bundle` を **`node scripts/bundle-a2ui.mjs`** に変更。
- `scripts/bundle-a2ui.sh` はリポジトリに残し、Linux/mac で手動実行する場合は従来どおり利用可能。

## 確認

`node scripts/bundle-a2ui.mjs` を実行し、ベンダ無し＋プレビルド bundle ありの環境では `A2UI sources missing; keeping prebuilt bundle.` で exit 0 となることを確認。
