# 2026-03-28 Gateway起動競合・Browser Config修正

**Branch**: main
**Commits**: `4d19f6fbb9`, `75cad89710`
**Author**: Claude Sonnet 4.6

---

## 概要

Sovereign-Portal 起動時に Gateway が Wait-Port タイムアウト（300s）に陥る問題、
および `openclaw.json` の `browser.profiles` に `cdpPort` が未設定で Config invalid
エラーが発生していた問題を修正した。

---

## 問題 1: Gateway Wait-Port タイムアウト

### 症状

```
[WAIT] Gateway port 18789 (max ~300s, first build can be slow)...
..............  [WAIT] ... 15s
..............  [WAIT] ... 30s
...（90s以上タイムアウト）
```

### 根本原因

1. Gateway が Windows Task Scheduler サービス (`\OpenClaw Gateway (desktop-stack)`) として
   登録・稼働済みの状態で Sovereign-Portal が起動される
2. `Sovereign-Portal.ps1` の Port Sanitization セクション（76-80行目）が
   `Get-NetTCPConnection` → `Stop-Process` で Gateway プロセスを強制終了
3. `Start-Gateway.ps1` が `--force` フラグ付きで新 Gateway を起動しようとするが、
   schtasks サービスのロックファイルが残存 → `lock timeout after 5000ms` で起動失敗
4. port 18789 が空になり、Wait-Port が延々ポーリングしてタイムアウト

### 確認コマンド

```powershell
# Gateway は実際には動いていた（別プロセスから健全性確認）
Invoke-WebRequest 'http://127.0.0.1:18789/health'
# => {"ok":true,"status":"live"}

# サービスロック競合のエラー出力
node scripts/run-node.mjs gateway run --port 18789 --verbose
# => Gateway failed to start: gateway already running (pid 19620); lock timeout after 5000ms
# => schtasks /End /TN "OpenClaw Gateway (desktop-stack)"
```

### 修正内容

**`scripts/launchers/Sovereign-Portal.ps1`**

```powershell
# Before
$criticalPorts = @(18789, 18794, 18800)
foreach ($port in $criticalPorts) {
    $procId = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
}

# After
# Stop gateway service first (schtasks), then kill any remaining listeners.
schtasks /End /TN "OpenClaw Gateway (desktop-stack)" 2>$null | Out-Null
Start-Sleep -Milliseconds 600
$criticalPorts = @(18789, 18794, 18800)
foreach ($port in $criticalPorts) {
    $procId = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Milliseconds 400
```

**`scripts/launchers/Start-Gateway.ps1`**

```powershell
# Before
& $node $runNode gateway run --port $Port --bind loopback --force

# After
& $node $runNode gateway run --port $Port --bind loopback
```

**理由**: Portal が Port Sanitization でポートを解放済みなので `--force` は不要かつ
サービスロック競合を引き起こす。

---

## 問題 2: browser.profiles に cdpPort 未設定

### 症状

```
Config invalid
File: ~/.../openclaw.json
Problem:
  - browser.profiles.openclaw: Profile must set cdpPort or cdpUrl
  - browser.profiles.automation: Profile must set cdpPort or cdpUrl
```

### 根本原因

`openclaw.json` の `browser.profiles` に `cdpPort` フィールドが存在しなかった。

```json
// Before
"openclaw":    {"color": "#FF4500", "driver": "openclaw"},
"automation":  {"color": "#00BFFF", "driver": "openclaw", "attachOnly": false}
```

### 修正内容

`openclaw.json`（gitignore 対象のためローカル変更のみ）に `cdpPort` を追加:

```json
// After
"openclaw":   {"color": "#FF4500", "driver": "openclaw", "cdpPort": 9222},
"automation": {"color": "#00BFFF", "driver": "openclaw", "attachOnly": false, "cdpPort": 9223}
```

- `openclaw` profile: CDP port 9222（デフォルト Chrome リモートデバッグポート）
- `automation` profile: CDP port 9223（競合回避用）

---

## 問題 3: harness.config.json UTF-8 BOM

### 症状

Python の `json.load()` が `Unexpected UTF-8 BOM` エラーで失敗。

### 修正

```python
# BOM 付き UTF-8 で読み込み → BOM なし UTF-8 で書き直し
data = open(f, encoding='utf-8-sig').read()
open(f, 'w', encoding='utf-8').write(data)
```

---

## 並列構文チェック結果（6並列）

| ファイル                                               | 結果        | 備考     |
| ------------------------------------------------------ | ----------- | -------- |
| `scripts/launchers/Start-TUI.ps1`                      | OK          |          |
| `scripts/launchers/_parse_all_errors.ps1`              | OK          | 新規     |
| `scripts/launchers/_snippet_test.ps1`                  | OK          | 新規     |
| `scripts/launchers/_brace_check.py`                    | OK          | 新規     |
| `extensions/hypura-harness/config/harness.config.json` | OK (修正後) | BOM 除去 |

---

## コミット履歴

| ハッシュ     | 内容                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| `4d19f6fbb9` | fix(gateway): stop schtasks service before port sanitization, remove redundant --force |
| `75cad89710` | fix(config): remove UTF-8 BOM from harness.config.json; add parse/debug helper scripts |

---

## 教訓

- Gateway を schtasks サービスとして登録している場合、`Stop-Process` だけではロックが残る。
  `schtasks /End` を先に実行してサービスを正常終了させること。
- `--force` フラグはサービス管理外の単独起動時のみ有効。Portal 経由では使わない。
- JSON ファイルは UTF-8 BOM なしで保存すること（Python/Node.js 双方で安全）。
- `browser.profiles` は必ず `cdpPort` または `cdpUrl` を設定すること。
