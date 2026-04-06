# 実装ログ: bootstrap stack overflow fix

- 実施日: 2026-04-06
- MCP取得時刻 (UTC): 2026-04-06T15:51:53+00:00
- 対象ワークツリー: `clawdbot-main`
- 症状: `Maximum call stack size exceeded` が `config load -> bootstrap plugin merge` 経路で発生

## 原因仮説

`src/channels/plugins/bootstrap-registry.ts` の `mergeBootstrapPlugin()` が、
runtime/setup 両方に同一参照の plugin オブジェクトが来たケースでも
オブジェクトスプレッドを実行していた。

一部プラグイン (Mattermost) は lazy `Proxy` を返すため、スプレッド時の
`ownKeys` で module load が再入し、再帰的ロードが増幅してスタックオーバーフローに到達。

## 変更内容

- ファイル: `src/channels/plugins/bootstrap-registry.ts`
- 変更: `runtimePlugin === setupPlugin` のときはマージせず即 return
- 意図: `Proxy ownKeys` トラップの不要発火を回避し、再帰ロードを遮断

## 検証

- `pnpm test -- src/channels/plugins/bundled.shape-guard.test.ts` ✅
- `pnpm openclaw status` 実行時、当該 `Maximum call stack size exceeded` は再現せず
  - 現在は別件 (`~/.openclaw/openclaw.json` の legacy config invalid) で停止する状態

## 備考

- 本修正は bootstrap merge の同一参照ケースに限定した最小差分対応。
- 既存の runtime/setup 別オブジェクト統合挙動は維持。
