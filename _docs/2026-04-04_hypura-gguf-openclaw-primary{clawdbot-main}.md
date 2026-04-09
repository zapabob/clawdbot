# 実装ログ: Hypura 0.4.x GGUF を OpenClaw の主推論に（worktree: clawdbot-main）

**日付**: 2026-04-04（セッション `user_info` 準拠）

## なんJ風サマリ

- 公式は **`hypura serve <ぱす.gguf>`** だぞ。`--model` は古い脳内キャッシュだ、捨てろ。
- OpenClaw 側は **`hypura/<api/tags の name>`** と **JSON の id** がズレたら即死する。だから **`show-hypura-model-name.ps1`** で確定しろって話。
- 「Hypna」って言ってるやつ、だいたい **Hypura** のこと。バイナリ名 `hypura` で合わせろ。

## CoT（仮説→検証）

| 仮説                                                    | 検証                                                        | 結果                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| Primary を `hypura/...` にすれば Gateway が 8080 に向く | `models.providers.hypura` + `plugins.entries.hypura` を足す | 設定上は OK（実ランはユーザー環境で `serve` 必須）        |
| モデル名はファイル名由来                                | Hypura は `/api/tags` で name を返す                        | **実測文字列**を `primary` / `models[].id` にコピペが安全 |

## 変更したもの

1. **`.openclaw-desktop/openclaw.json`** — `plugins.hypura` 有効化、`models.providers.hypura` 追加、`agents.defaults.model.primary` を `hypura/gemma-4-e4b-uncensored-hauhaucs-aggressive-q4_k_m`（**GGUF 名と一致させること**）、Ollama をフォールバックに。
2. **`.openclaw-desktop/agents/main/agent/models.json`** — 同上の hypura モデルメタを同期。
3. **`scripts/tools/show-hypura-model-name.ps1`** — 起動後の正しい model 名を表示。
4. **`.env.example`** — `HAKUA_HYPURA_GGUF` / `HYPURA_GGUF` / ポート・コンテキストの説明。
5. **`extensions/hypura-provider/index.ts`** / **`skills/hypura/SKILL.md`**（+ desktop コピー）— CLI 表記を位置引数に修正。

## downl 環境で自動設定済み（2026-04-04）

- **GGUF**: `C:\Users\downl\Desktop\SO8T\gguf_models\stronman\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q4_K_M.gguf`
- **`.env`** / **`.openclaw-desktop/.env`**: `HAKUA_HYPURA_GGUF` + `HYPURA_PORT=8080` + `HYPURA_CONTEXT=32768` + **`HAKUA_HYPURA_EXE`** = `C:\Users\downl\Desktop\hypura-main\hypura-main\target\release\hypura.exe`（PATH 無しでもスタック起動できる）
- **OpenClaw**: `primary` = `hypura/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q4_K_M`（ファイル名ステムに合わせた）

## 手順（運用）

1. `launch-desktop-stack.ps1` で Hypura 自動起動（`.env` 済みならそのまま）。
2. 初回だけ `powershell -File scripts\tools\show-hypura-model-name.ps1` で `/api/tags` の **実名**を確認。Hypura が小文字化して返すなら `openclaw.json` の `primary` / `id` をその文字列に合わせる。

## 注意

- 実効 config は `OPENCLAW_CONFIG_PATH` 次第で `.openclaw-desktop` 以外の可能性あり。
