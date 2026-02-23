# 2026-02-21 All-In-One Launch & Avatar Fix

## 概要

1. **Discord 4014 Gateway Error 回避**  
   OpenClaw起動時にDiscordプラグインが "missing privileged gateway intents"（コード 4014）でクラッシュする問題に対応。`~/.openclaw/config.json` にてDiscordプラグインを休止（`enabled: false`）し、起動失敗（Gateway Fatal Error）を防ぎました。

2. **FBXアバター表示不具合の修正**  
   `scripts/avatar-window.html`（アバターウィンドウ）でローカル環境のFBXファイルを読み込む際、アプリモードのブラウザ（Edge・Chrome）のローカルファイルCORS制限（`file://` 間のアクセス拒否）によりブロックされる問題を解消。  
   アバター起動スクリプト `scripts/start-avatar.bat` のEdgeおよびChrome起動フラグに `--allow-file-access-from-files` を追加し、FBXを正常に読み込めるように修正しました。

3. **一括起動（オールインワン）ショートカットの作成**  
   デスクトップからシステム全体をワンクリックで起動できるバッチファイル `OpenClaw-All-In-One.bat` を新設しました。  
   以下の順序で一定間隔（5秒）ごとに安全に起動処理を行います。
   1. SBV2-TTS Server (`Desktop\SBV2-TTS.lnk`)
   2. OpenClaw Gateway Server (`Desktop\OpenClaw.lnk`)
   3. Hakua Avatar Window (`Desktop\HakuaAvatar.lnk`)

## 変更ファイル

- `~/.openclaw/config.json`
- `scripts/start-avatar.bat`
- `C:\Users\downl\Desktop\OpenClaw-All-In-One.bat` [NEW]
- `_docs/2026-02-21_AllInOneLaunch_AvatarFix.md` [NEW]
