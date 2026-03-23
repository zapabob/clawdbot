# 2026-03-23 Hypura Provider Integration

**実装AI:** Claude Sonnet 4.6
**日付:** 2026-03-23
**カテゴリ:** Provider Extension / Skill 追加

---

## 引き継ぎ概要

hypura (storage-tier-aware LLM inference scheduler) を OpenClaw から使えるようにする統合作業を開始した。
本ドキュメントは次のセッションへの引き継ぎ用。

**hypura リポジトリ:** `C:\Users\downl\Desktop\hypura-main\hypura-main`
**hypura GitHub:** `https://github.com/zapabob/hypura` (fork) / upstream: `https://github.com/t8/hypura`

---

## 完了済み作業

### 1. `skills/hypura/SKILL.md` — 新規作成 ✅

hypura のすべての CLI コマンドと OpenClaw 連携手順をまとめた skill ファイル。

**カバー範囲:**

- `hypura serve` — Ollama 互換 HTTP サーバー起動 (デフォルト `http://127.0.0.1:8080`)
- `hypura bench` — A/B ベンチマーク
- `hypura profile` — ハードウェアプロファイル検出
- `hypura optimize` — GGUF エキスパートレイアウト最適化 (MoE)
- `hypura iobench` — NVMe 直接 I/O ベンチマーク
- NVMe ストリーミングモード説明 (expert-streaming / dense-FFN-streaming / keep-resident)
- 環境変数一覧 (`HYPURA_CUDA_ARCHITECTURES`, `LIBCLANG_PATH` 等)

### 2. `extensions/hypura-provider/` — 新規作成 ✅

OpenClaw の Provider Extension として hypura serve に接続するプラグイン。

**ファイル構成:**

```
extensions/hypura-provider/
├── index.ts           — プロバイダー登録 (Ollama互換API使用)
├── package.json       — @openclaw/hypura-provider
└── openclaw.plugin.json
```

**動作仕様:**

- `api: "ollama"` を使用 (hypura serve は Ollama 互換エンドポイントを提供)
- デフォルト接続先: `http://127.0.0.1:8080`
- 自動検出: `GET /` → `GET /api/tags` をプローブして起動中のサーバーを検出
- 設定オーバーライド: `openclaw config set models.providers.hypura.baseUrl=http://...`
- `pnpm-workspace.yaml` の `extensions/*` グロブで自動登録済み

---

## 残作業 / 次のセッションでやること

### 優先度 高

- [ ] **`pnpm build` / `pnpm check` で型エラーがないか確認**
  - `index.ts` の `resolveOllamaApiBase` インポートが `openclaw/plugin-sdk/provider-models` から正しく取れるか
  - `api: "ollama" as const` の型が `ProviderConfig` に合うか確認
  - `ctx.resolveProviderApiKey` の型シグネチャ確認 (ollama extension と同じパターンを使用)

- [ ] **`openclaw.plugin.json` の `configSchema` を他 extension に合わせて拡充**
  - `baseUrl` / `port` フィールドを schema に追加するか検討

- [ ] **hypura serve の実動作テスト**

  ```bash
  # hypura ビルド (現在 Windows でビルド中)
  cargo build --release --manifest-path C:\Users\downl\Desktop\hypura-main\hypura-main\Cargo.toml

  # モデルを用意して起動
  hypura serve --model ./model.gguf --port 8080

  # OpenClaw から接続確認
  openclaw config set models.providers.hypura.baseUrl=http://127.0.0.1:8080
  openclaw chat --provider hypura
  ```

### 優先度 中

- [ ] **docsPath 対応** — `docsPath: "/providers/hypura"` に対応する docs ページを `docs/providers/hypura.mdx` に作成 (Mintlify)
- [ ] **labeler.yml 更新** — `.github/labeler.yml` に `extensions/hypura-provider/**` エントリ追加
- [ ] **hypura provider の設定スキーマ** — `baseUrl`・`port`・`contextLength` を OpenClaw config から設定できるよう `configSchema` 拡充

### 優先度 低

- [ ] OpenAI 互換エンドポイント (`/v1/chat/completions`) を hypura serve に追加 → `api: "openai"` に切り替え可能に
- [ ] `hypura serve` のデーモン化サポート (`openclaw gateway run` と同様の起動管理)

---

## hypura serve の API 仕様 (参考)

hypura serve は Ollama 互換 HTTP API を提供:

| エンドポイント  | メソッド | 説明                                 |
| --------------- | -------- | ------------------------------------ |
| `/`             | GET      | ヘルスチェック                       |
| `/api/version`  | GET      | バージョン情報                       |
| `/api/tags`     | GET      | ロード済みモデル一覧                 |
| `/api/show`     | POST     | モデルメタデータ                     |
| `/api/generate` | POST     | テキスト生成 (ストリーミング NDJSON) |
| `/api/chat`     | POST     | チャット補完 (ストリーミング NDJSON) |

---

## hypura 側の最新状況 (2026-03-23)

- Windows ビルドで `libclang` 未検出エラー → LLVM インストール + `LIBCLANG_PATH` 設定で解決済み
- `build.rs` に pre-generated bindings fallback を追加済み
- `HYPURA_CUDA_ARCHITECTURES=86` (RTX 3060/3080 実機) を `.cargo/config.toml` に設定済み
- PR #2 (`zapabob:windows-cuda-port` → `t8/hypura:main`) オープン中
- ビルド進行中 (cmake + llama.cpp コンパイル中)
