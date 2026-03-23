# Ghost Bridge 実装ログ

- 日付: 2026-03-24
- 対象: `extensions/vrchat-relay` の Ghost Bridge（自律移動/表情）
- ワークツリー: `main`

## MCP日時取得について

`mcps/` 配下を確認したところ、現在有効なMCPサーバー定義には「現在日時取得」用ツールのスキーマ記述が見つからなかったため、実装ログの日付は環境日付（2026-03-24）を使用。

## 実装内容

1. 入力リセット保証つき移動プリミティブを追加
   - 変更: `extensions/vrchat-relay/src/tools/input.ts`
   - 追加:
     - `MovementDirection`
     - `performMovementWithReset({ direction, durationMs })`
   - 仕様:
     - 入力を送信
     - `durationMs` 待機
     - `finally` 相当で必ず同じ入力を `0` に戻す
     - 監査ログへ実行/失敗/リセット記録

2. Ghost Bridge 自律ループを新規追加
   - 追加: `extensions/vrchat-relay/src/ghost-bridge.ts`
   - 追加API:
     - `startGhostBridge`
     - `stopGhostBridge`
     - `getGhostBridgeStatus`
   - 仕様:
     - `idle / move / jump / emote` を重み付きで選択
     - 移動は `performMovementWithReset` で実行
     - 表情は `VRCEmote` を設定し、遅延で `0` リセット
     - 多重起動を防止する単一タイマー構成

3. ツール登録を拡張
   - 変更: `extensions/vrchat-relay/index.ts`
   - 追加ツール:
     - `vrchat_manual_move` (PRO)
     - `vrchat_autonomy_start` (PRO)
     - `vrchat_autonomy_stop`
     - `vrchat_autonomy_status`
   - 追加:
     - `before_prompt_build` へ Ghost Bridge の運用ガイダンス追記

## 検証結果

- `pnpm tsgo`: 成功
- `ReadLints` 対象ファイル: エラーなし
- `pnpm test -- extensions/vrchat-relay/src/test/extension.test.ts`:
  - 実行開始は確認
  - 本環境では完了まで進まず停止（ハング）

## 実機確認手順（VRChat）

1. VRChatで `Options -> OSC -> Enable` をON
2. `vrchat_status` 実行
3. `vrchat_autonomy_start` 実行（例: intervalMs=2500）
4. 移動と表情が周期的に発火することを確認
5. `vrchat_autonomy_stop` 実行
6. 入力が残らず停止することを確認
