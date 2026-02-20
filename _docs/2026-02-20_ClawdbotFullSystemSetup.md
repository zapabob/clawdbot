# 2026-02-20 Clawdbot Full System Setup 実装ログ

## 実施内容

### Step 1: Git Commit & Push ✅

- `.git/index.lock` クリア（存在しなかったが安全に処理）
- `.gitignore` に Windows/IDE アーティファクトを追加:
  - `nul`, `.cursor/`, `.specstory/`, `agents.db`, `build.log`, `build_output.log` 等
- ESLint pre-commit hook エラーを修正:
  - `src/security/sanitization.ts`: `no-control-regex` → `eslint-disable-next-line` コメント追加
  - `src/memory/temporal-decay.ts`: 未使用パラメータ `filePath` → `_filePath` にリネーム
  - `src/cli/evo-cli.ts`: `restrict-template-expressions` → `${String(error)}` に変更
- `start_openclaw.bat`: `npm start` → `pnpm start` に修正
- 32ファイル変更、728行挿入、68行削除でコミット成功
- `origin` (zapabob/clawdbot) へのプッシュ成功: `2b6f75c3f..55d4bccc6`

### Step 2: Autonomy (Internet Access) 設定 ✅

- `extensions/auto-agent/openclaw.plugin.json` 新規作成:
  - Web 検索サポート（Brave/Perplexity/Grok）設定スキーマ定義
  - selfHealing、autoRollback、gitAutoCommit オプション
- `~/.openclaw/config.json` 更新:
  - `tools.web.search.enabled = true` (provider: brave)
  - `tools.web.fetch.enabled = true`
  - `plugins.allow` に explicit plugin allowlist 設定
- `.env` に Web 検索 API キープレースホルダー追加:
  - `BRAVE_API_KEY` (https://brave.com/search/api/)
  - `PERPLEXITY_API_KEY` (https://www.perplexity.ai/settings/api)
  - `FIRECRAWL_API_KEY` (https://firecrawl.dev)

### Step 3: Voice / Style-Bert-VITS2 統合 ✅

- `extensions/talk-voice/openclaw.plugin.json` 更新:
  - provider: `elevenlabs` | `style-bert-vits2` | `system` 選択肢追加
  - `styleBertVits2` 設定スキーマ（endpoint, modelId, speakerId, style, speed 等）
- `extensions/talk-voice/index.ts` 拡張:
  - SBV2 provider ハンドラー実装
  - `/voice status` - SBV2 接続状態表示
  - `/voice list` - `GET /models/info` でモデル一覧取得
  - `/voice set <modelName>` - モデル/スピーカー/スタイル切り替え
  - `/voice speak <text>` - URL生成
- `scripts/start-sbv2.bat` 新規作成:
  - `venv\Scripts\python server_fastapi.py` で FastAPI サーバー起動
  - エンドポイント: `http://localhost:5000`
- `.env` に SBV2 設定追加:
  - `STYLE_BERT_VITS2_ENDPOINT`, `MODEL`, `SPEAKER_ID`, `STYLE`, `SPEED`
  - `AUDIO_INPUT_DEVICE=default`, `CAMERA_DEVICE=0`
- `~/.openclaw/config.json` に `plugins.entries.talk-voice` 追加:
  - provider: `style-bert-vits2`
  - model: `Hakua`, speaker: 0, style: Neutral

### Step 4: Desktop Resident Avatar ✅

- `assets/NFD/Hakua/FBX/Hakua.fbx` ディレクトリ作成 + FBX コピー:
  - `assets/Hakua.fbx` → `assets/NFD/Hakua/FBX/Hakua.fbx`
- `scripts/avatar-window.html` 新規作成:
  - Three.js + FBXLoader でリアルタイム 3D レンダリング
  - OrbitControls でカメラ操作
  - FBX アニメーション（ミキサー）サポート
  - FBX 読み込み失敗時はプレースホルダーキューブ表示
  - SBV2 サーバー疎通確認 (10秒ごと)
  - R キーでカメラリセット
- `scripts/start-avatar.bat` 新規作成:
  - Microsoft Edge / Chrome アプリモードで起動
  - ウィンドウサイズ: 400x700、位置: 右端
- `create_shortcuts.ps1` 更新:
  - `OpenClaw.lnk` (デスクトップ + スタートアップ) — アイコン付き
  - `HakuaAvatar.lnk` (デスクトップ) — アバターウィンドウ起動
  - `SBV2-TTS.lnk` (デスクトップ) — SBV2 TTS API 起動

### Step 5: System Integrity ✅

- `create_shortcuts.ps1` 実行成功:
  - `Desktop\OpenClaw.lnk` ✓
  - `Startup\OpenClaw.lnk` ✓ (自動起動)
  - `Desktop\HakuaAvatar.lnk` ✓
  - `Desktop\SBV2-TTS.lnk` ✓
- `pnpm run openclaw status` 実行結果:
  - OS: Windows 10.0.26200 (x64), Node 22.14.0
  - Git: main @ 55d4bccc ✓
  - WhatsApp: OK ✓
  - Discord: OK ✓
  - Memory: ready (vector + FTS) ✓
  - Heartbeat: 5m ✓

## Doctor 警告一覧 (要対応)

| 重大度   | 項目                 | 内容                   | 対処法                                          |
| -------- | -------------------- | ---------------------- | ----------------------------------------------- |
| CRITICAL | Discord セキュリティ | `groupPolicy=open`     | `channels.discord.groupPolicy=allowlist` に変更 |
| CRITICAL | LINE DM オープン     | `dmPolicy=open`        | pairing/allowlist に変更                        |
| WARN     | Gateway トークン短い | 19文字                 | `openssl rand -hex 32` で長いトークンに更新     |
| WARN     | LINE DM 設定不整合   | open + no allowFrom    | `allowFrom: ["*"]` を追加                       |
| WARN     | plugins.allow 空     | 全プラグイン自動ロード | allowlist を設定済み ✓                          |

## 今後のTODO

1. **API キー取得・設定**:
   - `BRAVE_API_KEY`: https://brave.com/search/api/
   - `PERPLEXITY_API_KEY`: https://www.perplexity.ai/settings/api
   - `FIRECRAWL_API_KEY`: https://firecrawl.dev
2. **SBV2 起動テスト**: `Desktop\SBV2-TTS.lnk` からサーバー起動
3. **アバター表示テスト**: `Desktop\HakuaAvatar.lnk` から確認
4. **OpenClaw 起動テスト**: `Desktop\OpenClaw.lnk` からサーバー起動
5. **Discord セキュリティ修正**: groupPolicy を allowlist に変更
6. **Gateway トークン更新**: 長いランダムトークンに変更

## ファイル変更サマリー

```
新規作成:
  extensions/auto-agent/openclaw.plugin.json    # auto-agent プラグイン定義
  scripts/avatar-window.html                     # Three.js FBX アバターウィンドウ
  scripts/start-avatar.bat                       # アバター起動スクリプト
  scripts/start-sbv2.bat                         # SBV2 TTS API 起動スクリプト
  assets/NFD/Hakua/FBX/Hakua.fbx                # FBX アセット (コピー)

更新:
  .gitignore                                     # Windows/IDE アーティファクト除外
  .env                                           # SBV2, Web検索 API キー追加
  extensions/talk-voice/openclaw.plugin.json     # SBV2 設定スキーマ追加
  extensions/talk-voice/index.ts                 # SBV2 プロバイダーハンドラー追加
  create_shortcuts.ps1                           # Avatar/SBV2 ショートカット追加
  start_openclaw.bat                             # npm → pnpm 修正
  ~/.openclaw/config.json                        # tools.web, talk-voice, plugins.allow 更新
```
