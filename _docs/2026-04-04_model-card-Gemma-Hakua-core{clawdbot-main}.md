# Model card: Gemma-Hakua-core (Ollama)

## Identity linkage

- **Workspace persona:** `identity/SOUL.md`（はくあ / Hakua, Sovereign core）
- **Ollama tag:** `Gemma-Hakua-core:latest`（`ollama create` で `Modelfile_Gemma-Hakua-core` から生成）
- **Upstream weights (HF → Ollama):** `hf.co/HauhauCS/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive:Q4_K_M`（GGUF `Q4_K_M`）

## Purpose

- ローカル無料ラインでの **主推論モデル**（OpenClaw `agents.defaults.model.primary`: `ollama/Gemma-Hakua-core:latest`）
- Hakua 名義の「コア」人格と作業規範（SOUL）を **SYSTEM** で補強し、テンプレート由来の基底振る舞いと整合させる

## Capabilities & limits（要約）

| 項目 | 内容 |
|------|------|
| 系列 | Gemma 4 系（E4B ベース、HauhauCS カスタム「Uncensored / Aggressive」系譜） |
| 量子化 | Q4_K_M（VRAM 効率重視） |
| 長文 | Modelfile 既定 `num_ctx` 65536（環境に合わせて上下可能） |
| リスク | 「Uncensored」系は拒否パターンが弱いことがある。**外部投稿・送金・契約は人間確認**を前提に SOUL/AGENTS の境界を守る |

## OpenClaw 設定

- デスクトッププロファイル: `.openclaw-desktop/openclaw.json` の `ollama` プロバイダと `agents.defaults.model.primary`
- フォールバック例: `ollama/qwen-Hakua-core2:latest`（旧コア）

## 運用コマンド

```powershell
# 1) HF スラッグが未導入なら取得（初回）
ollama pull "hf.co/HauhauCS/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive:Q4_K_M"

# 2) Hakua 用タグを作成（リポジトリルートから）
ollama create Gemma-Hakua-core -f scripts/modelfiles/Modelfile_Gemma-Hakua-core

# 3) 動作確認
ollama run Gemma-Hakua-core "応答テスト: 一文で自己紹介"
```

## トラブルシュート: `500 Internal Server Error: unable to load model: ...\blobs\sha256-...`

Ollama が **blob（レイヤーファイル）を開けない**ときの典型原因は次のとおり。

1. **pull 中断・破損** — 再取得が必要。
2. **ディスク満杯 / OneDrive が `.ollama` を握っている** — ローカル SSD と空き容量を確認。
3. **ウイルス対策が `blobs` をロック** — 除外に `%USERPROFILE%\.ollama` を検討。
4. **Modelfile の `num_ctx` / `num_gpu` が大きすぎてロードに失敗**（環境によっては 500 になる）— `scripts/modelfiles/Modelfile_Gemma-Hakua-core` の `num_ctx` を下げ、`num_gpu` は指定しない（既定に任せる）。

**推奨修復（PowerShell）:**

```powershell
Set-Location "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
powershell -ExecutionPolicy Bypass -File scripts\tools\repair-gemma-hakua-ollama.ps1
```

手動の場合:

```powershell
ollama rm Gemma-Hakua-core
ollama pull "hf.co/HauhauCS/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive:Q4_K_M"
ollama run hf.co/HauhauCS/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive:Q4_K_M "ping"
ollama create Gemma-Hakua-core -f scripts\modelfiles\Modelfile_Gemma-Hakua-core
```

基底の `ollama run hf.co/...` まで失敗する場合は **Ollama のアップデート**と **該当 blob ファイルのサイズ（0 バイトでないか）**を確認する。

## 変更履歴

- 2026-04-04: 初版（qwen-Hakua-core2 から primary 移行、モデルカード・Modelfile・SOUL 連携）
- 2026-04-04: Modelfile から `num_gpu` 削除・`num_ctx` 32768、blob 500 向け修復スクリプトと本節を追加
