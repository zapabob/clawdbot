# 2026-03-29 Gateway/TUI/Harness 起動失敗 + エラーログ不可視バグ修正

**Branch**: main
**Author**: Claude Sonnet 4.6

---

## 概要

`Sovereign-Portal.ps1` の起動出力は正常に表示されるにもかかわらず、
Gateway・TUI・Hypura ハーネスが実際には起動しないバグを修正した。

---

## 症状

- `Sovereign-Portal.ps1` の ASCII バナーと起動メッセージは正常に出る
- Gateway ポート 18789 が Listen 状態にならない
- Edge ブラウザが接続できないページを表示
- TUI ウィンドウが出現しない
- Hypura ハーネス（port 18794）も起動しない
- `.openclaw-desktop/logs/` に最新のゲートウェイログが存在しない（最終: 2026-03-26）

---

## 根本原因 1: PowerShell `Set-Location` が Win32 cwd を更新しない（主因）

### 診断

Gateway ログに出力が一切なかったため、`Start-Job` + 同一環境変数で再現テストを実施。

```
[openclaw] Missing required runtime dependencies (@anthropic-ai/vertex-sdk);
run `pnpm install` in the project root to restore them.
```

`@anthropic-ai/vertex-sdk` は確かに `node_modules/` に存在するが、
`run-node.mjs` が `process.cwd()` を使って `node_modules` を解決するため、
cwd がプロジェクトルートでないと "not found" になる。

### 原因

PowerShell 5.1 の既知問題: `Set-Location` は PowerShell 内部のパス状態を更新するが、
Win32 / .NET レベルの実際のカレントディレクトリ (`GetCurrentDirectory()`) を
更新しない場合がある。

`Start-Gateway.ps1` / `Start-TUI.ps1` / `Start-Hypura-Harness.ps1` はいずれも
`Set-Location $TargetDir` した後に外部プロセス（node.exe / python）を起動するが、
子プロセスは更新されていない古い cwd を継承してしまう。

```powershell
# 問題のパターン（修正前）
Set-Location $ProjectDir          # PS内部だけ更新、Win32 cwd は不変の場合がある
& $node $runNode gateway run ...  # node の process.cwd() が ProjectDir でない可能性
```

```javascript
// run-node.mjs
deps.cwd = params.cwd ?? process.cwd(); // ← ここで間違った cwd を取得
// node_modules/@anthropic-ai/vertex-sdk の解決が失敗 → exit 1
```

### 修正

**`scripts/launchers/Start-Gateway.ps1`** / **`Start-TUI.ps1`** / **`Start-Hypura-Harness.ps1`**

```powershell
# 修正後: .NET レベルで cwd を強制設定してから Set-Location
[System.IO.Directory]::SetCurrentDirectory($ProjectDir)   # Win32/dotnet cwd を確実に更新
Set-Location $ProjectDir
```

---

## 根本原因 2: エラーログが皆無（診断困難の原因）

2026-03-28 の非同期化リファクタリング（commit `c109b33105`）で
新しい `run-node.mjs` ベースの実装に切り替わり、旧実装にあった `Start-Transcript` が消えた。

さらに、PowerShell 5.1 の `Start-Transcript` は `stdio: "inherit"` で
起動された孫プロセスの出力をキャプチャできない（ホスト出力ストリームを経由しないため）。

```
# 旧アプローチ（動作していた）
powershell.exe -Command "
  Start-Transcript -Path 'logs/gateway-YYYYMMDD.log' -Append;
  pnpm openclaw gateway run --allow-unconfigured --force ..."

# 新アプローチ（エラーが不可視）
Start-Transcript ...               # 孫プロセスの stderr はキャプチャされない
& $node $runNode gateway run ...   # node が子プロセスを stdio: inherit で起動
Stop-Transcript                    # ログに node 出力が一切ない
```

### 修正

`Start-Transcript` を追加して最低限のログを確保（node の直接 stderr は入らないが、
PS レベルのエラーは記録される）。また `--allow-unconfigured` フラグも追加。

---

## 根本原因 3: `--allow-unconfigured` フラグ欠落

旧の動作していたコマンドには `--allow-unconfigured` が付いていたが新実装には欠落。
未設定チャンネルがあると Gateway が起動を拒否する可能性がある。

---

## 修正ファイル一覧

| ファイル                                     | 修正内容                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `scripts/launchers/Start-Gateway.ps1`        | `SetCurrentDirectory` 追加、`Start-Transcript` 追加、`--allow-unconfigured` 追加 |
| `scripts/launchers/Start-TUI.ps1`            | `SetCurrentDirectory` 追加、`Start-Transcript` 追加                              |
| `scripts/launchers/Start-Hypura-Harness.ps1` | `SetCurrentDirectory` 追加                                                       |

---

## ngrok について（コードバグではない）

ngrok バイナリは `bin/ngrok.exe` に存在し、`start_ngrok.ps1` は正しく検出する。
ただし ngrok は無料アカウントでも認証トークンが必要。

設定ファイル（`~/.config/ngrok/ngrok.yml` 等）が存在しないため認証エラーで即終了。

**対処法:**

1. https://ngrok.com でアカウント登録
2. `ngrok config add-authtoken <YOUR_TOKEN>` を実行
3. または `.env` に `NGROK_AUTHTOKEN=<TOKEN>` を追加

---

## 修正後の確認方法

```bash
# ポートが Listen 状態か確認
powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 18789 -State Listen"

# Gateway ログ確認
tail -50 .openclaw-desktop/logs/gateway-*.log
```

---

## 教訓

- **PS5.1 の `Set-Location` は Win32 cwd を更新しない**: 外部プロセス（node/python）を起動する前は
  `[System.IO.Directory]::SetCurrentDirectory($dir)` で明示的に設定する。
- **`Start-Transcript` は孫プロセスをキャプチャしない**: `stdio: "inherit"` 経由の孫プロセス出力は
  PS ホストストリームを経由しないため転写されない。ログには `$LASTEXITCODE` の確認で対応。
- **旧動作コマンドのフラグを引き継ぐ**: `--allow-unconfigured` のような重要フラグをリファクタリング時に落とさない。
