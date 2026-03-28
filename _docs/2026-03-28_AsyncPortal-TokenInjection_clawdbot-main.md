# 2026-03-28 Sovereign-Portal 完全非同期起動 + ブラウザトークン動的注入

**Branch**: main
**Commits**: `c109b33105`, `85327692c9`
**Author**: Claude Sonnet 4.6

---

## 概要

Sovereign-Portal の Gateway Wait-Port 300s ブロック問題を解消し、
Gateway / TUI / ブラウザをすべて非同期起動に変更した。
あわせてブラウザ起動 URL に `openclaw.json` から読んだ認証トークンを動的注入する機能を追加。

---

## 問題 1: Gateway Wait-Port 300s タイムアウト

### 症状

```
[WAIT] Gateway port 18789 (max ~300s, first build can be slow)...
...... [WAIT] ... 15s
...... [WAIT] ... 30s
...（90s 以上ループ）
```

### 根本原因

`scripts/run-node.mjs` が初回（またはビルドスタンプ陳腐化時）に
TypeScript コンパイラ `tsdown` を実行する。ビルドが完了するまで
Gateway は Listen 状態にならない（1〜3 分かかる場合あり）。
`Wait-Port` は 1 秒ごとに TCP 接続を試み最大 300 秒ブロックしていた。

### 修正内容

**`scripts/launchers/Sovereign-Portal.ps1`** — Wait-Port ブロック削除

```powershell
# Before (300s blocking loop)
if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    $skipWait = ($env:OPENCLAW_SKIP_GATEWAY_WAIT -eq "1")
    if ($skipWait) { ... }
    else {
        $gwMaxSec = 300
        ...
        $gwReady = Wait-Port -Port $GatewayPort -Label "Gateway" -MaxSeconds $gwMaxSec ...
    }
    if (-not $gwReady -and -not $skipWait) {
        Write-Host "  [WARN] Gateway not listening ..."
        if ($StrictGatewayWait) { exit 1 }
    }
}

# After (instant async, no wait)
# Gateway started async above; no blocking wait. Test-TcpPortOpen / Wait-Port kept for future use.
if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    Write-Host "  [GW]  Gateway starting async (first build may take ~1-3 min)..." -ForegroundColor Gray
    Write-Host "  [HINT] To diagnose: check the minimized Gateway PowerShell window for node/ts errors." -ForegroundColor DarkGray
}
```

`Test-TcpPortOpen` 関数・`Wait-Port` 関数は将来利用のため残存。

---

## 問題 2: TUI がブロッキング起動

### 症状

Portal の PowerShell ウィンドウが TUI 終了まで占有される。

### 根本原因

`& $tuiPs1` はカレントプロセスで同期実行するため、
TUI プロセスが終了するまで Portal スクリプトが先に進まない。

### 修正内容

**`scripts/launchers/Sovereign-Portal.ps1`** — TUI を非同期化

```powershell
# Before
$tuiPs1 = Join-Path $ProjectDir "scripts\launchers\Start-TUI.ps1"
& $tuiPs1    # blocking

# After
# TUI launched async in its own console window (non-blocking).
$tuiPs1 = Join-Path $ProjectDir "scripts\launchers\Start-TUI.ps1"
Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $tuiPs1
) -WorkingDirectory $ProjectDir
Write-Host "  [TUI] TUI launched async (new window)." -ForegroundColor Gray
```

TUI は独立コンソールウィンドウで起動し、Portal ウィンドウはすぐに終了する。

---

## 問題 3: Ghost/Harness モードで無限 while ループ

### 症状

`Full` 以外のモードで Portal が `while ($true) { Start-Sleep 60 }` で永久ブロック。

### 修正内容

`else` ブランチの `while ($true)` ループを削除し、
すべてのモードで共通のサマリ出力 → 即時終了に統一。

```powershell
# Before
} else {
    Write-Host '  [ASI_ACCEL] Manifestation Sustained...'
    if ($Mode -ne "Full") {
        while ($true) { Start-Sleep -Seconds 60 }  # hung forever
    }
}

# After (all modes fall through to summary + exit)
Write-Host ''
Write-Host '  [ASI_ACCEL] Manifestation Sustained. Sync Complete.' -ForegroundColor Green
Write-Host "  [SUMMARY] Gateway: async (port $GatewayPort)  Browser: async  TUI: async" -ForegroundColor DarkCyan
Write-Host '  [EXIT]  Portal manifest complete. All components running in background.' -ForegroundColor Cyan
```

---

## 問題 4: Start-Gateway.ps1 の --force 削除による起動失敗

前セッションで `--force` を削除したが、ポート残存時の強制クリアが
効かずに Gateway が起動失敗するケースが残っていた。

### 修正内容

**`scripts/launchers/Start-Gateway.ps1`** — `--force` 復活

```powershell
# Before
& $node $runNode gateway run --port $Port --bind loopback

# After
& $node $runNode gateway run --port $Port --bind loopback --force
```

Portal の Port Sanitization（schtasks /End + Stop-Process）が先に
ポートを解放済みなので、`--force` は安全に使用可能。

---

## 機能追加: ブラウザ起動 URL へのトークン動的注入

### 背景

Gateway は `auth.mode: "token"` で認証が必要。
従来は `http://127.0.0.1:18789` のみで開くためブラウザ側で
認証が求められる（またはサイレントに弾かれる）。

### 実装

**`scripts/launchers/Sovereign-Portal.ps1`** — token 注入ロジック追加

```powershell
# Inject gateway auth token from openclaw.json dynamically.
$gwToken = $null
$ocJsonPath = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
if (Test-Path $ocJsonPath) {
    try {
        $ocCfg = Get-Content $ocJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $gwToken = [string]$ocCfg.gateway.auth.token
    } catch { }
}
if (-not $gwToken) { $gwToken = $env:OPENCLAW_GATEWAY_TOKEN }
$baseUrl = 'http://127.0.0.1:{0}' -f $GatewayPort
$edgeUrl  = if ($gwToken) { '{0}?token={1}' -f $baseUrl, $gwToken } else { $baseUrl }
$edgeApp  = '--app={0}' -f $edgeUrl
```

### 優先順位

1. `openclaw.json` の `gateway.auth.token` フィールド
2. `OPENCLAW_GATEWAY_TOKEN` 環境変数
3. トークンなし（フォールバック）

### 起動 URL 例

```
http://127.0.0.1:18789?token=5f938515fc060d32c3439a93ccf9f86e
```

### 起動ログ出力

```
[EDGE] Browser launched async (token injected: yes).
```

---

## Portal 起動フロー（修正後）

```
[VV]  VOICEVOX engine + verify (child window)...
[HX]  Harness Actuator Pulsing...
[GW]  Gateway Ignition Staged...
[TASK] Notification tasks registered from .env
[NTF] SITREP queued (10s, env-injected)...
[GW]  Gateway starting async (first build may take ~1-3 min)...
[UI]  Deploying Cognitive Interfaces...
[EDGE] Browser launched async (token injected: yes).
[TUI] TUI launched async (new window).

[ASI_ACCEL] Manifestation Sustained. Sync Complete.
[SUMMARY] Gateway: async (port 18789)  Browser: async  TUI: async
[EXIT]  Portal manifest complete. All components running in background.
```

Portal ウィンドウは即座に終了し、各コンポーネントが独立ウィンドウで動作する。

---

## 構文確認結果

| ファイル                                 | 結果 |
| ---------------------------------------- | ---- |
| `scripts/launchers/Sovereign-Portal.ps1` | OK   |
| `scripts/launchers/Start-Gateway.ps1`    | OK   |

---

## コミット履歴

| ハッシュ     | 内容                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| `c109b33105` | feat(portal): async Gateway/TUI/browser launch, remove Wait-Port 300s block |
| `85327692c9` | feat(portal): inject gateway auth token into browser URL from openclaw.json |

---

## 教訓

- TypeScript ビルドを含む Node.js プロセスは初回起動に数分かかることがある。
  ポーリングで待つより非同期起動してユーザーに診断方法を示す方が UX が良い。
- `& script.ps1`（ドット呼び出しでない直接実行）はカレントプロセスでブロッキング実行される。
  独立ウィンドウで起動したい場合は `Start-Process powershell.exe -File` を使う。
- 認証トークンは設定ファイルから動的に読み取り、ハードコードしない。
  `openclaw.json` が gitignore 対象のため外部漏洩リスクも低い。
