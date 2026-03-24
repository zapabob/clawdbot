# OpenClaw × Hypura 連接（2026-03-24）

## 実施内容

`C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop\openclaw.json` を更新:

1. **`models.providers.hypura`** — `http://127.0.0.1:8080`（`hypura serve` の Ollama 互換 API）
2. **`plugins.entries.hypura`** — `enabled: true`（`extensions/hypura-provider` を読み込む）
3. **`agents.defaults.model.primary`** — `hypura/<モデルID>` を既定に（フォールバックに既存 ollama / codex を残す）

### モデル ID について

Hypura は GGUF の `general.name` があればそれを、なければ **ファイル名（拡張子なし）** を `/api/tags` の `name` として返す。

本設定では F: の GGUF 想定で **`Qwen3.5-27B-Uncensored-HauhauCS-Aggressive-Q6_K`** を登録している。  
**実際の名前は必ず確認すること:**

```powershell
# hypura 起動後
(Invoke-RestMethod 'http://127.0.0.1:8080/api/tags').models | ConvertTo-Json
```

`primary` と `models.providers.hypura.models[].id` が **`/api/tags` の `name` と完全一致** する必要がある。

## 起動順

1. Hypura（例: hypura-main の `.\scripts\hypura-central-smart.ps1`）
2. OpenClaw / Gateway を再起動（設定再読込）

## CLI で上書きする場合

```text
openclaw config set models.providers.hypura.baseUrl "http://127.0.0.1:8080"
openclaw config set agents.defaults.model.primary "hypura/<タグで確認した名前>"
```

## セキュリティ注意

`openclaw.json` にチャネル用トークン等が含まれる。**リポジトリにコミットしない**（`.gitignore` 推奨）。本ドキュメントにシークレットは書かない。

JSON の構文チェック: `py -3 -c "import json; json.load(open(r'path\to\openclaw.json',encoding='utf-8'))"`

---

## どの `openclaw.json` が効くか（ソース準拠）

実装は `src/config/paths.ts`。**優先度のイメージ**:

1. **`OPENCLAW_CONFIG_PATH`** がセットされていれば → **そのファイル**（最優先）
2. そうでなく **`OPENCLAW_STATE_DIR`** があれば → **`$OPENCLAW_STATE_DIR/openclaw.json`**
3. 既定は **`%USERPROFILE%\.openclaw\openclaw.json`**（レガシー名や「既に存在する候補」を選ぶロジックあり）

**実機確認例（2026-03-24）**: `OPENCLAW_CONFIG_PATH` が **`%USERPROFILE%\.openclaw\openclaw.json`** を指している場合、**リポジトリの `.openclaw-desktop\openclaw.json` だけ編集しても Gateway は変わらない**。このときは **同じ Hypura ブロックを `~\.openclaw\openclaw.json` にも反映**する（または `OPENCLAW_CONFIG_PATH` を意図どおりに張り替える）。

**`.openclaw-desktop\openclaw.json`（リポジトリ内）**は、**自動では読まれない**。開発用に **`OPENCLAW_STATE_DIR`** を `...\clawdbot-main\.openclaw-desktop` に向けているときだけ、そのディレクトリの `openclaw.json` が使われる（`heartbeat-runner` 等も同様の発想）。

→ **迷ったら**: 環境変数を確認するか、次を実行:

```powershell
.\scripts\show-openclaw-config-env.ps1
```

CLI とデーモンで別ファイルを見ていると地獄なので、可能なら `openclaw daemon status` で **cli / daemon の config パス**を確認する。

---

## 連接失敗の仮説検証（先に潰す順）

| 順  | 疑い                                       | 確認                                                                  |
| --- | ------------------------------------------ | --------------------------------------------------------------------- |
| 1   | Hypura 未起動                              | `Invoke-WebRequest http://127.0.0.1:8080/`                            |
| 2   | `primary` と `/api/tags` の名前不一致      | `(irm http://127.0.0.1:8080/api/tags).models[0].name`                 |
| 3   | ポートが 8080 以外                         | `hypura serve ... --port` と `models.providers.hypura.baseUrl` を一致 |
| 4   | **編集した JSON が実行時に読まれていない** | 上記「どのファイルが効くか」＋環境変数                                |

## 参照

- `extensions/hypura-provider/index.ts` — プロバイダー実装（`api: "ollama"`）
- `skills/hypura/SKILL.md` — Hypura CLI 概要
