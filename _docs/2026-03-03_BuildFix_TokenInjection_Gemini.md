# 実装ログ: ビルド修正 / トークン動的注入 / ランチャーCRLF修正

- **日付**: 2026-03-03
- **実装AI**: Gemini (Antigravity)
- **対象リポジトリ**: `clawdbot-main`

---

## 1. 概要

Windows環境で `pnpm build` が失敗していた2つの既存問題を修正し、OpenClawのゲートウェイ認証トークンを `process.env` に動的注入する機能を追加した。また、バッチランチャーの改行コード問題を `.gitattributes` レベルで根本解決した。

---

## 2. 修正内容

### 2.1 `canvas:a2ui:bundle` WSL依存の排除

**問題**: `package.json` の `canvas:a2ui:bundle` スクリプトが `bash scripts/bundle-a2ui.sh` を呼んでおり、WSL未インストール環境で失敗していた。

**対応**:

- `scripts/bundle-a2ui.mjs` を新規作成（Node.js版の同等スクリプト）
- `package.json` の `canvas:a2ui:bundle` を `node scripts/bundle-a2ui.mjs` に変更

| ファイル                  | 変更種別                   |
| ------------------------- | -------------------------- |
| `scripts/bundle-a2ui.mjs` | 新規作成                   |
| `package.json`            | 修正（スクリプト参照変更） |

### 2.2 `CommandLane` const enum ビルドエラー

**問題**: `src/process/lanes.ts` で定義された `const enum CommandLane` が、`tsdown`/`rolldown` バンドラでファイル間解決できず `MISSING_EXPORT` エラーになっていた。

**対応**: `CommandLane.Main` → `"main"` 等の文字列リテラルに置換。

| ファイル                                | 変更内容                                   |
| --------------------------------------- | ------------------------------------------ |
| `src/gateway/server-lanes.ts`           | `CommandLane` import削除、文字列リテラル化 |
| `src/gateway/server-reload-handlers.ts` | 同上                                       |

### 2.3 ゲートウェイトークンの動的環境変数注入

**問題**: OpenClawが起動時に生成/解決する認証トークンが `process.env` に反映されず、子プロセスや外部スクリプトがトークンを参照できなかった。

**対応**: `src/gateway/server.impl.ts` の `ensureGatewayStartupAuth()` 直後に `process.env.OPENCLAW_GATEWAY_TOKEN` へ注入するコードを追加。

```diff
  cfgAtStart = authBootstrap.cfg;
+ if (authBootstrap.auth.mode === "token" && authBootstrap.auth.token) {
+   process.env.OPENCLAW_GATEWAY_TOKEN = authBootstrap.auth.token;
+ }
```

### 2.4 バッチランチャーのCRLF改行コード修正

**問題**: `.gitattributes` の `* text=auto eol=lf` により `.bat` ファイルもLFでチェックアウトされ、`cmd.exe` がパース不能になっていた。

**対応**: `.gitattributes` にCRLF強制ルールを追加。

```diff
  * text=auto eol=lf
+ *.bat text eol=crlf
+ *.cmd text eol=crlf
```

### 2.5 `vrchat-relay/index.ts` 余分な `});` 削除

**問題**: 以前の編集で余分な閉じブレースが残存し、構文エラーの可能性があった。

**対応**: line 524の余分な `});` を削除。

---

## 3. 検証結果

| 項目                 | 結果                            |
| -------------------- | ------------------------------- |
| `pnpm build`         | ✅ 正常終了（exit code 0）      |
| `dist/entry.js` 生成 | ✅ 確認済み                     |
| バッチファイルCRLF   | ✅ CRLF 108行 / LF-only 0行     |
| git push             | ✅ `origin/main` へプッシュ完了 |

---

## 4. コミット履歴

| コミット     | 内容                                            |
| ------------ | ----------------------------------------------- |
| `3257a1cd5`  | `vrchat-relay/index.ts` 余分な `});` 削除       |
| `4785a7d400` | `CommandLane` enum解決 + `bundle-a2ui.mjs` 作成 |
| `aad888f104` | `.gitattributes` CRLF強制ルール追加             |
