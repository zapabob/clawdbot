# 2026-02-21: Unified Startup Automation

## 概要 (Overview)

SBV2 TTS サーバー、OpenClaw Gateway、アバター表示画面の 3 つの起動プロセスを統合し、デスクトップ上の 1 つのショートカットから全自動で運用を開始できるようにしました。

## 実装の詳細 (Implementation Details)

### 1. マスター起動スクリプト (`scripts/start-all-in-one.bat`)

各サービスの依存関係とポートの状態を監視しながら起動するバッチファイルを新規作成しました。

- **SBV2 (Port 5000)**: 稼働していない場合、最小化状態で起動し、ポート 5000 が応答するまでループ待機します。
- **OpenClaw Gateway (Port 3000)**: 入出力のリダイレクトや自己修復機能を備えた `launch-clawdbot.ps1` を最小化状態で呼び出し、ポート 3000 が有効になるまで待機します。
- **Avatar Window (Port 3333)**: Gateway の準備完了後、アバター画面を適切なサイズと位置で起動します。

### 2. ショートカット生成スクリプト (`scripts/create-unified-shortcut.ps1`)

PowerShell を使用して、WScript.Shell 経由でデスクトップに「✨ Clawdbot All-in-One ✨」という名前のショートカットを作成します。

- ターゲット: `cmd.exe /c start-all-in-one.bat`
- アイコン: 歯車のシステムアイコン (`shell32.dll,248`) を割り当て、視覚的に分かりやすくしました。

## 使い方 (Usage)

1.  デスクトップに生成された **✨ Clawdbot All-in-One ✨** ショートカットをダブルクリックします。
2.  各コンポーネントが順次立ち上がり、最終的にアバター画面が表示されれば準備完了です。
