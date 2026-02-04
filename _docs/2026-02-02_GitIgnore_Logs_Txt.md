## 2026-02-02 Git追跡除外設定 (log, txt, Windows予約名)

## 概要

`.log` および `.txt` ファイルに加えて、Windowsの予約名（`nul` 等）をGitの管理対象から外す設定を行いました。
また、Gitエラーの原因となっていた `nul` ファイルおよび不要なキャッシュディレクトリを削除しました。

## 変更内容

### 1. `.gitignore` の更新

ログファイルに加え、Windowsの予約名（`nul`, `CON`, `PRN` 等）を無視するように設定しました。

```diff
 # logs and text files
 *.log
 *.txt
+
+# Windows reserved names
+nul
+CON
+PRN
+AUX
+COM[1-9]
+LPT[1-9]
```

### 2. 既存の不要ファイルの削除

Gitのエラー（`short read while indexing nul`）を解消するため、以下のファイル/ディレクトリを削除しました。

- `nul` (Windows予約名ファイル)
- `Microsoft/` (PowerShell関連のキャッシュディレクトリと思われる)

### 3. 既存ファイルの追跡解除

以下のファイルを `git rm --cached` により追跡対象から外しました。
※ファイル自体は削除されていません。

- `startup_error.log`
- `tsc_check_final.log`
- `tsc_errors.log`
- `tsc_errors.txt`
- `ui/ui_errors.txt`
- `ui/ui_errors2.txt`
- `ui/ui_errors3.txt`
- `ui/ui_errors_final.txt`

## Gitエラーの解決策

`git add` コマンドに `nul` や `Microsoft/...` が含まれているとエラーが発生するため、これらを除外したコマンドを実行してください。

## 補足

- ライセンスファイル（`LICENSE` 等）は、プロジェクトの構成要素として重要である可能性が高いため、今回は明示的な追跡解除は行っていません。
- 今後新規に作成される `.log` および `.txt` ファイルは自動的に無視されます。
