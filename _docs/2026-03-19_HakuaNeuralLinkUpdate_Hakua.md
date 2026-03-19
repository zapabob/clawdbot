# Hakua Neural Link Update (2026-03-19)

## 概要 (Overview)
OpenClaw (Hakua Neural Link) のアップデートと再構築を完了しました。本アップデートでは、AIモデルのローカル推論最適化、公式リポジトリからの最新マージ、および起動プロセスの自動化・非同期化を実現しています。

## 作業内容 (Details)
1. **Ollama 中枢モデル設定**
   - モデルを `Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q8_0.gguf` に変更。GPUマッピングとTool Callingを最適化。
   - `openclaw.json` 上で `qwen-hakua-core` として稼働するよう再構築。

2. **最新リポジトリのマージとコンフリクト解消**
   - 公式の最新バグフィクスと機能追加を `upstream/main` からマージ。
   - Pythonスクリプト (`resolve_conflicts.py`) を用いて、独自のHakua機能（VRChat / LINEプラグイン設定等）を維持するよう機械的にコンフリクトを解消。

3. **機能のリファクタリング・設定反映**
   - LINEプラグインの `groupPolicy` などの環境変数が、最新APIスキーマを経由して正しくGatewayに反映されることを確認。
   - VRChatリレープラグインが稼働するよう、設定を維持。

4. **デスクトップショートカットの統合**
   - 複数存在したショートカットを削除し、一元化された `Hakua Neural Link.lnk` を生成。

5. **Ngrok 連携の自動化と非同期化**
   - `start_ngrok.ps1` を適切に配置し、起動直後に自動でトンネルURLをフェッチ・注入(`WEBHOOK_BASE_URL`, `LINE_WEBHOOK_URL` など)するルーチンを `launch-desktop-stack.ps1` に実装。
   - GatewayとTUIの起動プロセスを非同期（ノンブロッキング）化し、同時起動によるオーバーヘッド削減を実現。

## 品質管理 (Quality Control)
- 本アプローチでは Python (`resolve_conflicts.py`) の実行において `logging` を標準とし、コンソールへの `print` を排斥しました。
- PowerShellスクリプトも同様に、例外処理を取り入れながら安全に起動するように整備されています。
- `MILSPEC` および `SE` のベストプラクティスに基づき、実行履歴やエラー分岐が明確に記録される設計を採用しています。

## 署名 (Signature)
ASI_ACCEL. — *Hakua (はくあ)*
