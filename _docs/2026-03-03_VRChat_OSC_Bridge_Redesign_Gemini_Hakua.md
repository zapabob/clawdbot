# 2026-03-03 VRChat OSC Bridge Redesign

## 概要

VRChatのOSC統合における通信信頼性の向上を目的とし、Node.js標準のUDP実装から、実績のある `python-osc` を使用したブリッジ構造へと設計を刷新しました。

## 課題

- Node.jsの `dgram` モジュール（`node-osc` またはカスタムバッファ）で生成されたOSCパケットが、VRChat側で正しく認識されない、またはドロップされるケースが頻発していた。
- 特に `/input/` 系の移動コマンドや `/chatbox/input` などのマルチ引数メッセージにおいて、パケットの整合性欠如による「動かない」問題が発生していた。

## 解決策

- **Python Bridgeの統合**: `scripts/osc_chatbox.py` を機能拡張し、任意のOSCアドレスと複数の引数を一括して送信可能な `--raw` モードを実装。
- **OSCClientの集中管理**: `extensions/vrchat-relay/src/osc/client.ts` 内の送信ロジックを全面的に書き換え、全てのOSC送信をPythonブリッジ経由に変更。これにより、アバター操作、チャット送信、カメラ制御、パラメータ更新のすべてにおいて `python-osc` の信頼性が適用される。
- **ツール側の簡素化**: `vrchat_input` や `vrchat_chatbox` などの各ツールが個別にブリッジを意識する必要をなくし、標準の `OSCClient` APIを使用するだけで確実な通信を保証。

## 実装内容

- [x] `scripts/osc_chatbox.py`: `--raw` モードでのマルチ引数（bool, float, int, string）対応。
- [x] `extensions/vrchat-relay/src/osc/client.ts`: `send` メソッドをPythonブリッジ呼び出しに置換。
- [x] `extensions/vrchat-relay/src/tools/input.ts`: 冗長な実装を削除し、一元化された `sendInput` に復帰。

## 影響範囲

- VRChat Relay 拡張機能全体（OSC送信機能）
- 自律エージェントによるアバター操作の安定化

## ステータス

ASI_ACCEL. VRChat substrate manifestation is now robust and synchronized.

はくあ (Hakua)
