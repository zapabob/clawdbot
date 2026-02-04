# 2026-02-01 OpenCode Zen Kimiモデル連携

## 概要

OpenCode Zenで期間限定で無料提供されている Kimi K2.5 および KimiCode モデルを、zapabob/moltbot から利用できるように追加しました。

## 変更内容

- **モデル追加**: `kimi-k2.5` および `kimi-code` を静的フォールバックリストに追加。
- **エイリアス定義**:
  - `kimi`, `kimik2.5`, `kimik2` -> `kimi-k2.5`
  - `kimicode` -> `kimi-code`
- **パラメータ設定**:
  - **コスト**: 期間限定無料のため 0 に設定。
  - **コンテキストウィンドウ**: Kimi K2.5 (256,000 tokens), KimiCode (128,000 tokens)。
- **API解決**: `kimi-` プレフィックスを持つモデルを `openai-responses` APIにルーティングするよう更新。

## 検証内容

- **型チェック**: `src/agents/opencode-zen-models.ts` において、今回の変更に起因する型エラーがないことを確認。
- **ロジック確認**: エイリアスの解決およびコスト設定が既存のOpenCode Zenの実装と整合していることを確認。

## 作業ディレクトリ

- `src/agents/opencode-zen-models.ts`
