# 実装ログ: OpenClaw 起動エラー修復および Python Exec 機能実装

**作成日**: 2026-03-28
**実装AI**: Antigravity
**対象リポジトリ**: `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main`

---

## 1. 概要

前セッション (Claude Sonnet 4.6) からの引き継ぎ実装計画に基づき、OpenClaw が起動しない致命的な設定エラーの解決、Ngrok 起動スクリプトの改修、および新規エクステンション `python-exec` の実装・型エラー修正・動作検証を完了しました。

## 2. 完了した作業詳細

### 2-1. OpenClaw 起動不能エラーの解消 (最優先課題)

事象:
`node dist/index.js gateway` コマンドが `Exit code 1` で異常終了する問題が発生していました。

調査・対応内容:

- エラーログを解析した結果、グローバル設定ファイル (`C:\Users\downl\.openclaw\openclaw.json`) の `channels.line` ブロック内に非推奨キー `"webhookServerUrl"` が存在し、設定スキーマのバリデーションエラーを引き起こしていることが判明しました。
- 該当キー (`webhookServerUrl`) を削除することで解消を試みましたが、続いて `"plugins.entries.python-exec: Unrecognized key: 'path'"` のスキーマエラーが発生。
- 公式のOpenClaw Plugin機構に合わせるため、`openclaw.json` 内のプラグイン記述を以下の通り正しい形式に修正しました：
  - `load.paths` に `"./extensions/python-exec"` を追加。
  - `allow` に `"python-exec"` を追加。
  - `entries` 内を `"python-exec": { "enabled": true, "config": { ... } }` の形式に変更。
- 上記修正後、Gatewayがスキーマエラーを起こさず正常にバックグラウンドで起動状態を維持することを確認しました。

_補足情報_: 懸念されていた `src/hooks/bundled/sovereign-pulse/` の `metadata.json` 欠如については、`boot-md` 等の他の内部フックと同様に `HOOK.md` と `handler.ts` さえ存在すれば正常にフックとして認識されており、システムにエラーを発生させない安全な仕様であることを確認しました。

### 2-2. `start_ngrok.ps1` の動的URL注入化

事象:
ngrokをただ起動するだけだったため、LINEやTelegramのエンドポイントURLが自動更新されず、手動で `.env` を書き換える必要がありました。

対応内容:

- `scripts/launchers/start_ngrok.ps1` を大幅に書き換え、`Start-Job` を用いてngrokをバックグラウンドジョブとして立ち上げる設計に変更。
- ngrok のローカルAPIエンドポイント (`http://localhost:4040/api/tunnels`) を最大30回（1秒間隔）ポーリングし、生成された `https` のパブリックURLを取得する処理を実装。
- `env-tools.ps1` 内の関数 `Set-EnvValues` に引き渡し、`.env` ファイルの `OPENCLAW_PUBLIC_URL`, `TELEGRAM_WEBHOOK_URL`, `LINE_WEBHOOK_URL` を自動で上書きする構造を完成させました。

### 2-3. `python-exec` エクステンションの新規実装

事象:
軽量・高速なPythonサンドボックス実行・スクリプト実行基盤を提供するため、`uv` を用いた Python 3.14 実行プラグインが求められていました。

対応内容:

- `extensions/python-exec/` ディレクトリを新規作成。
- 以下のファイルを配置:
  - `openclaw.plugin.json` （プラグインのマニフェスト・Configスキーマ定義）
  - `package.json`
  - `index.ts`
- **index.ts 実装**:
  - `python_exec` ツールを定義し、提供されたコード文字列を一時ファイルに保存した上で、`uv run --python <version> <temp_file>` コマンドで起動。
  - プロセスからの終了コード、`stdout`、`stderr` をキャプチャして返す処理を実装。
- **型エラー (TypeScript) 修復**:
  - `execute` 関数が返す戻り値の型において、新たに `AgentToolResult<unknown>` で要求されるようになった `details` プロパティが不足しているというTypeScriptエラーに遭遇しました。
  - 返却オブジェクトの構造をラップし、`content: [...]` と並列して `details: { exit_code, stdout, stderr }` を含めるよう修正し、型検査 (`pnpm check`) の安全性を確保しました。

### 2-4. 実行基盤 (uv) の環境構築

対応内容:

- Antigravity側にて、ターミナルから `uv --version` (0.6.6) を確認後、`uv python install 3.14` を実行し、ローカル環境への `Python 3.14.0a5` のインストールプロセスを自動完了させました。

## 3. 次のステップ・運用上の注意点

- **Python外部パッケージ利用**:
  `python-exec` にて標準ライブラリ以外のパッケージを利用したい場合は、PEP 723に従い、実行するPythonスクリプトコード内にインラインで `# requires-python = ">=3.14"` と `# dependencies = ["requests"]` のように記述させることで、`uv` が動的に仮想環境を構築し依存関係を解決して実行可能です。
- **NGROKのプロセス停止**:
  Gatewayと共に立ち上がっているngrokプロセスはジョブ化されていますが、停止時はプロンプト等で適切に `Ctrl+C` 発行を指示・またはプロセスを落としてください。

以上の改修により、前セッションから指定された技術的ブロックは全て排除され、Gatewayの正常起動および `python-exec` を介した高度なエージェントワークフロー基盤の提供が可能となりました。
