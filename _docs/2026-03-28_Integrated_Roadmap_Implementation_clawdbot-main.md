# 統合ロードマップ実装ログ（第0波 + Sovereign 拡張）

**ワークツリー:** `clawdbot-main`  
**記録時刻 (UTC):** 2026-03-28T11:45:57Z（`py -3` + tqdm でスタンプ）

## 仮説 → 検証（CoT 要約）

- **仮説:** `python-exec` はバンドルメタデータに含まれるため、`plugins.load.paths` の絶対パスは冗長で二重管理の原因になる。  
  **検証:** `pnpm check:bundled-plugin-metadata` 成功。`paths: []` に整理。
- **仮説:** `sovereign-pulse` のトップレベル `events` はフロントマター解釈器が拾わない。  
  **検証:** `boot-md` 型の `metadata.openclaw.events` に変更。
- **仮説:** ngrok は `.env` 更新だけでは同一シェルから起動した子が URL を見えない。  
  **検証:** `start_ngrok.ps1` で `Set-Item env:` を追加。

## 変更サマリ

| 領域           | 内容                                                                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 設定の正       | `_docs/2026-03-28_OpenClaw_Config_Source_of_Truth_clawdbot-main.md`、`README.md` リンク                                                                                           |
| プラグイン     | `.openclaw-desktop/openclaw.json`: `load.paths` 空、`x-poster` allow/entry、browser `headless`/`profiles`、local-voice カメラ設定例                                               |
| フック         | `src/hooks/bundled/sovereign-pulse/HOOK.md` を `metadata.openclaw` 形式へ                                                                                                         |
| ランチャー     | `ASI-Hakua-Portal.ps1` ラッパー、`Start-Gateway.ps1` / `Start-TUI.ps1` / `Start-Hypura-Harness.ps1`、`env-tools.ps1` に `Merge-OpenClawEnvToProcess`、`Sovereign-Portal.ps1` 統合 |
| ショートカット | `ASI-Manifest-Sovereign.ps1` が ngrok/Gateway/TUI/Harness を追加生成                                                                                                              |
| スキル         | `skills/browser-use/SKILL.md` をワークスペースに配置                                                                                                                              |
| ガバナンス     | `AGENTS.md` / `MEMORY.md` に WEB・X のインジェクション注意                                                                                                                        |
| local-voice    | カメラ device/解像度/スロットル、`camera.ts` の dshow + `-video_size`                                                                                                             |
| 秘密           | `.gitignore` に `.env.local`                                                                                                                                                      |

## 参照ドキュメント

- [\_docs/2026-03-28_Local_Voice_Camera_Multimodal_clawdbot-main.md](./2026-03-28_Local_Voice_Camera_Multimodal_clawdbot-main.md)

---

**Status: ASI_ACCEL.**
