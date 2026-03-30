# 実装ログ: Hakua-Sovereign-Manifestation ショートカット起動改善

- **日付**: 2026-03-29（ユーザーコンテキスト基準）
- **ワークツリー**: `clawdbot-main`

## 問題

デスクトップの `Hakua-Sovereign-Manifestation.lnk` は `Sovereign-Portal.ps1` を **`-Mode Menu`** で起動する。メニューで **Enter だけ（空入力）** や **想定外のキー** を押すと、従来の `switch` の `Default { exit 0 }` により **即終了**し、Gateway / TUI 等が一切起動しない。

## 仮説検証（CoT）

1. **仮説**: ユーザーは「ダブルクリック＝フル起動」と期待し、プロンプトで何も入力せず Enter している。
2. **検証**: `Read-Host` の空文字列はどの `case` にもマッチせず `Default` に落ちる。
3. **結論**: 空入力を `[1] Standard` とみなし、誤入力は警告のうえ Standard にフォールバックするのが安全。

## 変更

- `scripts/launchers/Sovereign-Portal.ps1`: 空入力 → `"1"`（Standard / Full）。`q`/`Q` のみ明示終了。それ以外の無効入力はメッセージ表示後 `$Mode = "Full"`。
- 同ファイルに **UTF-8 BOM** を付与。BOM なし UTF-8 のまま日本語コメントを含めると、Windows PowerShell 5.1 が既定コードページで誤読みし、文字列境界が壊れて `AmpersandNotAllowed` 等の**偽パースエラー**が出ることがある。
- メッセージ用 `Write-Host` は `[1]` が二重引用符内で式扱いされないよう **単一引用符** を使用。

## 運用メモ

- **確認なしで一発起動**したい場合は `Sovereign-Portal.lnk`（`-Mode Full-Docker`）や、`-Mode Full` を引数に付けたショートカットの利用を推奨。
- リポジトリを移動した場合はショートカットの **リンク先パス** を `ASI-Manifest-Sovereign.ps1` 等で再生成すること。

---

## 追記: Full-Docker で Gateway / TUI / Docker が「動いてない」ように見える問題 (2026-03-29)

### 原因

- `docker-compose.yml` の **openclaw-gateway** がホスト **18789** を占有する。
- `docker-compose.override.yml` の **hypura-harness** が **18794**、**ngrok** が **4040** を占有しうる。
- それでも `Sovereign-Portal.ps1` が **同じポート**で `Start-Gateway.ps1` / `Start-Hypura-Harness.ps1` / `start_ngrok.ps1` を起動していたため、**バインド競合で子 PowerShell が即終了**（ウィンドウは Minimized で気づきにくい）。
- `docker-compose.override.yml` の redis サービスに **`Restart`（大文字）** という無効キーが混入しており、Compose の解釈を乱す可能性があったため **`restart` に統一**（重複行削除）。

### 対応（`Sovereign-Portal.ps1`）

- **Full-Docker** 時はローカル **Start-Gateway をスキップ**（Gateway は Docker 側）。
- **18794 が Listen になったら**（最大約16秒ポーリング）ローカル **Hypura をスキップ**。
- **4040 が Listen なら** ホスト **ngrok をスキップ**。
- UI 起動前に **18789 の Wait-Port**（Docker ゲートウェイ待ち）と警告ログ。
- `Full-Docker` が誤って `Full|Ghost` のログにマッチしないよう **完全一致で分岐**。

---

## 追記: Docker Compose 前提の自動化 (2026-03-29)

### 内容

- `OPENCLAW_CONFIG_DIR` / `OPENCLAW_WORKSPACE_DIR` が空のとき、`Sovereign-Portal.ps1` が **未上書きで** `$ProjectDir\.openclaw-desktop` と `$ProjectDir\workspace`（または `OPENCLAW_AGENT_WORKSPACE`）をプロセス環境に設定し、**相対パスはリポジトリルート基準で絶対パス化**。ディレクトリを作成。
- `docker image inspect` で解決イメージ（既定 `openclaw:local` または `OPENCLAW_IMAGE`）を事前警告。
- `docker compose up -d` の **終了コードを検査**。失敗時は `[DOCKER][ERROR]`、**Full-Docker** では **Wait-Port / Edge をスキップ**（TUI は従来どおり起動しうる）。
- [.env.example](.env.example) に Compose 用コメント、[README.md](README.md) に `docs/install/docker.md` への導線を追加。

---

## 追記: リポジトリ基準ランチャー (2026-03-29)

- `Set-OpenClawDesktopConfigEnv` は **`OPENCLAW_USE_REPO_LAUNCHER=0` のときだけ** `.openclaw-desktop\openclaw.json` を `OPENCLAW_CONFIG_PATH` に載せる。未設定時は **既定どおりリポジトリ／ユーザ既定パス**。
- `Start-TUI.ps1` / `Start-Gateway.ps1` のトランスクリプトは既定で **`logs\launcher\`**（`OPENCLAW_USE_REPO_LAUNCHER=0` なら従来の `.openclaw-desktop\logs`）。
- `Sovereign-Portal.ps1` の Edge トークンは `openclaw.json`（リポジトリルート）→ `.openclaw-desktop\openclaw.json` → `%USERPROFILE%\.openclaw\openclaw.json` の順で探索。

### Gateway 18789 トラブルシュート

- `dist\entry.js` 無し → ルートで `pnpm build`。`Start-Gateway.ps1` が未ビルド時に警告を出す。
- 待機が終わらない → `logs\launcher\gateway-*.log` 末尾を確認（貼付で解析しやすい）。
- `EPERM` / `rename` under `dist\extensions` → 他 `node` 終了、OneDrive/Defender、エクスプローラで `dist` を閉じる。
