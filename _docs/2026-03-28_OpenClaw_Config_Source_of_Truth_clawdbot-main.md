# OpenClaw 設定ファイルの正（Source of Truth）

**ワークツリー:** `clawdbot-main`  
**日付:** 2026-03-28

## どの `openclaw.json` が読まれるか

OpenClaw / Gateway は通常、次の優先順で設定を解決します。

1. **環境変数 `OPENCLAW_CONFIG_PATH`**  
   この変数がセットされていれば、そのパスのファイルが**唯一の正**として読まれます。CI・複数プロファイル・リポ固定構成に最適です。

2. **ユーザーホーム（既定）**  
   未設定の場合、多くの環境で `%USERPROFILE%\.openclaw\openclaw.json`（Windows）が既定です。

3. **本リポジトリの `.openclaw-desktop/openclaw.json`**  
   Sovereign 開発用にリポ内に置いたコピーです。**Gateway を起動するシェルで `OPENCLAW_CONFIG_PATH` をここに向けない限り**、ホーム側のファイルだけが読まれることがあります。混在を避けるには **常に `OPENCLAW_CONFIG_PATH` を明示**してください。

## 推奨運用（一本化）

- **推奨:** リポジトリの  
  `.\.openclaw-desktop\openclaw.json`  
  を正とし、起動前に次を設定する。

```powershell
$env:OPENCLAW_CONFIG_PATH = "C:\path\to\clawdbot-main\.openclaw-desktop\openclaw.json"
```

- **`scripts/launchers/Start-Gateway.ps1`** / **`Sovereign-Portal.ps1`** は、上記を自動でセットする想定です。

## 手動同期（レガシー）

ホームの `%USERPROFILE%\.openclaw\openclaw.json` を使い続ける場合は、リポ内の `.openclaw-desktop\openclaw.json` と内容が食い違わないよう、変更時に**手動コピー**するか、常に `OPENCLAW_CONFIG_PATH` でリポ側を指してください。二重管理は設定ドリフトの原因になります。

## 関連

- エージェント workspace: `agents.defaults.workspace` は本リポジトリのルートを指すこと（`AGENTS.md` / `skills/` と一致させる）。
- プラグイン `python-exec` はバンドルメタデータに含まれるため、`plugins.load.paths` への絶対パス追加は不要です。
