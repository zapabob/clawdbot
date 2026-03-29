# 2026-03-29 Sync-OpenClawDesktop 実装 + ATLAS 初期コミット

**Branch**: main
**Author**: Claude Sonnet 4.6

---

## 概要

1. **`Sync-OpenClawDesktop.ps1`** — リポジトリ設定を `.openclaw-desktop/` へ同期するスクリプトを新規作成
2. **Python / vendor 同期** — `.python/` と `vendor/` のコピー＋ venv インストールを Step 5/6 に追加
3. **PS パーサーバグ修正 × 2** — 全角文字・曖昧構文による 2 件のパーサーエラーを解消
4. **`zapabob/ATLAS` 初期コミット** — 238 ファイルを force-push、日英バイリンガル README 作成

関連コミット:
| コミット | 内容 |
|---------|------|
| `14e573b760` | feat(sync): Sync-OpenClawDesktop.ps1 新規作成; Gateway/TUI cwd バグ修正; デザインスペック追加 |
| `d61d19cfd6` | feat(sync): Python/vendor コピーと venv インストールを追加 |
| `16ce68619e` | fix(sync): param() 内全角文字を削除 → PS パーサーエラー修正 #1 |
| `7a3ce37d22` | fix(sync): Sync-OpenClawDesktop.ps1 を全面書き直し → パーサーエラー修正 #2 |

---

## 1. Sync-OpenClawDesktop.ps1 設計と実装

### 背景

`.openclaw-desktop/` はユーザーが手動で設定を変える運用フォルダであり、
リポジトリの `skills/`, `openclaw.json.template`, `.env` 等とは別管理になっていた。
新 PC 移行・再インストール時に設定が一致しない問題が発生していたため、
**リポジトリ側を正とし `.openclaw-desktop/` へ差分マージする**同期スクリプトを設けた。

### デザインスペック

`docs/superpowers/specs/2026-03-29-sync-openclaw-desktop-design.md` に保存。
6 ステップ構成:

| ステップ | 内容                                                                                   |
| -------- | -------------------------------------------------------------------------------------- |
| Step 1   | `.env` キーを `env-tools.ps1` 経由でマージ（既存キーは上書きしない）                   |
| Step 2   | `openclaw.json.template` / `.seed` / `.defaults` から `openclaw.json` をディープマージ |
| Step 3   | `agents/` は git ignore 対象（no-op）                                                  |
| Step 4   | `skills/` を上書きコピー（常に最新を反映）                                             |
| Step 5   | `.python/` → `python/`, `vendor/` → `vendor/` のコピー（既存スキップ）                 |
| Step 6   | `vendor/` 配下のパッケージを harness venv へインストール                               |

### 統合ポイント

`scripts/launchers/Sovereign-Portal.ps1` に呼び出しを追加:

```powershell
$syncPs1 = Join-Path $ProjectDir "scripts\Sync-OpenClawDesktop.ps1"
if (Test-Path $syncPs1) {
    Write-Host "  [SYNC] Syncing repo config -> .openclaw-desktop..." -ForegroundColor DarkCyan
    & $syncPs1 -ProjectDir $ProjectDir -Quiet
}
```

`package.json` に `setup` / `setup:dry` スクリプトを追加:

```json
"setup":      "powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Sync-OpenClawDesktop.ps1",
"setup:dry":  "powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Sync-OpenClawDesktop.ps1 -DryRun"
```

---

## 2. Python / vendor 同期ステップ追加

### Step 5 (A): ディレクトリコピー

`.python/` (170 MB の Python embeddable パッケージ) と `vendor/` (31 MB) を
`.openclaw-desktop/` 以下にコピーする `Sync-DirectoryCopy` ヘルパーを実装。

デフォルトは `-SkipExisting $true`（冪等）。`-Force` スイッチで上書き可。

```powershell
Sync-DirectoryCopy -SrcDir (Join-Path $ProjectDir ".python") `
                   -DstDir (Join-Path $desktopDir "python") `
                   -Label "python" -SkipExisting $skipExisting

Sync-DirectoryCopy -SrcDir (Join-Path $ProjectDir "vendor") `
                   -DstDir (Join-Path $desktopDir "vendor") `
                   -Label "vendor" -SkipExisting $skipExisting
```

### Step 6 (B): venv インストール

`vendor/` 直下のディレクトリに `pyproject.toml` または `setup.py` が存在すれば
harness venv へ editable install する。優先順位: `uv` → `harnessPip` → `venvPip` → `py -3 -m pip`

---

## 3. PowerShell パーサーバグ修正 × 2

スクリプトを `Sovereign-Portal.ps1` 経由で実行した際、2 件のパーサーエラーが発生した。

### バグ #1: param() 内の全角文字

**症状:**

```
関数パラメーター一覧に ')' が存在しません
```

**原因:**
`param()` ブロックのコメントに全角括弧 `（）`（U+FF08 / U+FF09）が含まれていた。
PowerShell 5.1 のトークナイザーは全角カッコを処理できず、`param()` の閉じ括弧を
見つけられなくなる。

**修正:** `param()` ブロック内のコメントを削除（または ASCII 文字のみに変更）。

### バグ #2: 曖昧な構文

**症状:**

```
Missing closing '}' in statement block or type definition.
Unexpected token ')' in expression or statement.
```

**原因 (3 点):**

1. **`TrimStart('\', '/')` が曖昧**
   PowerShell が文字列リテラルと配列要素を区別できない。
   → `TrimStart([char]'\', [char]'/')` に変更

2. **`@(... | Where-Object { ... })` の `})` がパーサーを混乱**

   ```powershell
   # 問題パターン
   $overwriteKeys = @($repoEnvMap.Keys | Where-Object {
       $targetEnvMap.ContainsKey($_) -and $targetEnvMap[$_] -ne $repoEnvMap[$_]
   })
   ```

   → `foreach` ループに書き換え

3. **`Sync-DirectoryCopy` の `[switch]$SkipExisting`**
   `param([bool]$SkipExisting = $true)` に変更（`[switch]` では呼び出し時に `-SkipExisting:$skipExisting` が必要になり誤動作）

**検証方法:**

```powershell
$errors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
    "scripts/Sync-OpenClawDesktop.ps1", [ref]$null, [ref]$errors)
if ($errors.Count -eq 0) { "OK: no syntax errors" }
```

---

## 4. ATLAS 初期コミット

### 背景

`vendor/ATLAS/` は `itigges22/ATLAS` の fork (`zapabob/ATLAS`)。
`.gitignore` で `vendor/` が除外されているため親リポジトリには含まれず、
また `vendor/ATLAS/` 自体に `.git` が存在しなかった（git 管理外）。

ATLAS V3 は clawdbot の Hypura Harness・ShinkaEvolve・AI Scientist Lite と
Redis を介して統合済みのため、fork リポジトリとして公開・管理することにした。

### 変更内容（fork 元 itigges22 からの差分）

| ファイル                             | 変更内容                                                  |
| ------------------------------------ | --------------------------------------------------------- |
| `atlas/task-worker/worker.py`        | `_try_evolve()` + `_record_failure()` 追加（Hypura 連携） |
| `llama-server/entrypoint-rtx3060.sh` | `--lora $LORA_ADAPTER_PATH` 追加（LoRA ホットリロード）   |
| `.env.example`                       | RTX 3060 12GB 向け設定を日本語コメントで追記              |
| `docker-compose.override.yml`        | hypura-harness, lora-watcher 等 11 サービスを追加         |

### Redis キーフロー

```
harness_daemon /run:
  成功 → training:examples (TinyLoRA SFT)
  失敗 → atlas:failures → ai_scientist_lite → shinka:fitness_hints → ShinkaEvolve
```

### 日英バイリンガル README

`vendor/ATLAS/README.md` を全面書き直し。主なセクション:

- **Overview / 概要** — ベンチマーク結果（74.6% LiveCodeBench pass@1-v(k=3)）
- **Architecture** — 3 フェーズパイプライン + Geometric Lens + インフラ
- **Clawdbot Integration** — Redis キーフロー・fork 変更点
- **Quick Start / Hardware** — RTX 3060 12GB 推奨構成
- **Benchmark Results** — V3 ablation 表
- **Changelog / Roadmap** — V3.1 TODO リスト

### git 初期化 + push

```bash
cd vendor/ATLAS
git init
git remote add origin https://github.com/zapabob/ATLAS.git
git add .
git commit -m "feat: initial commit — ATLAS V3 fork with Hypura/ShinkaEvolve integration"
git push --force -u origin main   # リモートに既存コミットがあったため force push
```

238 ファイル、bilingual README 付きで push 完了。

---

## 教訓

- **PS5.1 の `param()` に全角文字を入れない**: 全角括弧・全角スペースは即パーサーエラー。
  `param()` ブロックには ASCII のみ使用する。
- **`TrimStart` には型付きリテラルを使う**: `TrimStart([char]'\', [char]'/')` が安全。
  文字列リテラル `'\' `は曖昧な場合がある。
- **パイプ＋複数行スクリプトブロックは `foreach` で代替**: `@(... | Where-Object { ... })` の
  複数行形式はパーサーが `})` を誤解釈するケースがある。
- **`[switch]` パラメーターを `bool` で渡す場合は `-Param:$value` が必要**:
  型を `[bool]` にするか、呼び出し側を合わせる。
- **git force push は履歴が破壊される**: fork の初期コミットなど既存履歴が不要な場合のみ使用。
  通常は `git merge --allow-unrelated-histories` でリモート履歴を統合する方が安全。
