# 実装ログ: 2026-04-09 latest upstream follow-up と main 整備

- 日付: 2026-04-09
- 記録対象 repo: `clawdbot-main`
- 記録時点ブランチ: `main`
- 記録目的:
  - 今日 `main` に入った変更と、その後に別ブランチで進めた latest upstream follow-up 実装を後から追える形で残す
  - どの変更が `main` で確定済みか、どの変更が integration branch にのみ存在するかを切り分ける

## 1. 今日 `main` に入った確定変更

### コミット

- `c58c40a5e9` `Integrate upstream sync tooling and Hypura harness routing`
- `cb25c32be0` `Merge branch 'integrate/upstream-main-2026-04-09'`
- `268bc4c634` `Align repo-backed desktop env and verification gates`

### 実装内容

- upstream 同期用 Python ツール一式を導入・拡張
  - `scripts/tools/upstream_merge_policy.py`
  - `scripts/tools/merge-conflict-strategies.custom-first.json`
  - `scripts/tools/tests/test_upstream_merge_tooling.py`
- Hypura harness 導線を OpenClaw 側へ接続
  - `extensions/hypura-harness/*`
  - `skills/hypura-harness/scripts/start_daemon.py` 系の導線調整
- OpenClaw desktop launcher / repo-backed env 固定化
  - repo 基準の `OPENCLAW_*` 環境変数
  - desktop shortcut / launcher の repo 優先化
- 型・lint・build gate を通すための整合修正
  - `src/utils/perf.ts`
  - `src/agents/*`
  - `src/commands/*`
  - `src/config/*`
  - `src/models/*`
  - `src/utils/*`

### `main` で通した確認

- `pnpm check`
- `pnpm build`
- `py -3 scripts/sovereign_check.py`

## 2. 今日の latest upstream follow-up 実装

### 作業ブランチ

- ブランチ: `integrate/upstream-main-2026-04-09-latest-1801702`
- push 済みコミット: `6500281486`
- push 先: `origin/integrate/upstream-main-2026-04-09-latest-1801702`

### 目的

- `upstream/main` の新しい基点 `1801702ed9592ceeb1d73d1775a210d8e427cbf4` を pinned upstream SHA として扱う
- 以前の pin `9b8eb10196a3ce599ba3239b63ed343ef1618a47` 以降の追加差分だけを追従する
- 公式を土台にしつつ、custom overlay が本当に必要な面だけを残す

### 実装内容

#### 2-1. merge tooling / policy の latest pin 更新

- `scripts/tools/upstream_merge_policy.py`
  - `DEFAULT_PINNED_UPSTREAM_SHA` を `1801702ed9592ceeb1d73d1775a210d8e427cbf4` に更新
- `scripts/tools/merge-conflict-strategies.custom-first.json`
  - `pinned_upstream_sha` を最新 pin に更新
  - latest delta 用の明示分類を追加
    - `extensions/matrix/*` -> `official_with_overlay`
    - `extensions/whatsapp/src/auto-reply/monitor.ts` -> `official_with_overlay`
    - `src/infra/outbound/*` -> `official_with_overlay`
    - `src/plugin-sdk/infra-runtime.ts` -> `manual_api_followup`
- `scripts/tools/tests/test_upstream_merge_tooling.py`
  - 最新 pin と新規 touched path の分類期待値を追加

#### 2-2. Matrix 追従

- official latest をベースに legacy crypto / migration snapshot を更新
  - `extensions/matrix/src/legacy-crypto.ts`
  - `extensions/matrix/src/migration-snapshot.ts`
  - `extensions/matrix/src/matrix-migration.runtime.ts`
  - `extensions/matrix/runtime-heavy-api.ts`
- 追加ファイル
  - `extensions/matrix/src/legacy-crypto-inspector-availability.ts`
  - `extensions/matrix/src/migration-snapshot-backup.ts`
- stale alias / wrapper の削除または整理
  - `extensions/matrix/src/runtime-heavy-api.ts` を削除
  - `extensions/matrix/src/approval-native.ts`
  - `extensions/matrix/src/exec-approval-resolver.ts`
  - `extensions/matrix/src/matrix/monitor/allowlist.ts`
- monitor / approval 導線を公式 API へ合わせて更新
  - `extensions/matrix/src/matrix/monitor/reaction-events.ts`
  - `extensions/matrix/src/exec-approvals-handler.ts`
- Matrix auth / config 契約への追従
  - `extensions/matrix/src/matrix/client/config.ts`
  - `extensions/matrix/src/matrix/client.test.ts`

#### 2-3. WhatsApp / outbound reconnect-drain 追従

- outbound delivery queue recovery を official latest ベースへ更新
  - `src/infra/outbound/delivery-queue-recovery.ts`
  - `src/infra/outbound/delivery-queue.ts`
  - `src/infra/outbound/delivery-queue-storage.ts`
  - `src/plugin-sdk/infra-runtime.ts`
- WhatsApp monitor が listener 復帰後に reconnect-drain を走らせるよう更新
  - `extensions/whatsapp/src/auto-reply/monitor.ts`
- 新規テスト
  - `src/infra/outbound/delivery-queue.reconnect-drain.test.ts`

#### 2-4. file SecretRef の Windows 整合

- Matrix auth の file-backed SecretRef テストを通す過程で、file provider だけ `allowInsecurePath` 契約が schema / runtime / CLI で揃っていないことを確認
- 整合修正
  - `src/config/types.secrets.ts`
  - `src/config/zod-schema.core.ts`
  - `src/secrets/resolve.ts`
  - `src/cli/config-cli.ts`
  - `src/secrets/configure.ts`
  - `src/config/config.secrets-schema.test.ts`
- Matrix 側テストも Windows host 互換の config を使うよう更新
  - `extensions/matrix/src/matrix/client.test.ts`

## 3. latest upstream follow-up の検証

### targeted tests

以下をまとめて再実行し、pass を確認:

- `scripts/tools/tests/test_upstream_merge_tooling.py`
- `extensions/matrix/src/legacy-crypto.test.ts`
- `extensions/matrix/src/migration-snapshot.test.ts`
- `extensions/matrix/src/matrix/client.test.ts`
- `extensions/matrix/src/matrix/monitor/reaction-events.test.ts`
- `src/infra/outbound/delivery-queue.reconnect-drain.test.ts`
- `src/infra/outbound/delivery-queue.recovery.test.ts`
- `extensions/whatsapp/src/reconnect.test.ts`
- `extensions/whatsapp/src/auto-reply/web-auto-reply-monitor.test.ts`

補足:

- `src/config/config.secrets-schema.test.ts` 全体は repo 側の重い schema lane で別件タイムアウトを踏むため、今回の change に直接関係する file SecretRef runtime と Matrix auth を scoped で確認した

### branch gate

- `pnpm check` -> pass
- `pnpm build` -> pass

### sovereign sweep

- `py -3 scripts/sovereign_check.py`
- 最終的に `Summary: 27/27 Passed`
- ログ:
  - `_docs/2026-04-09_19-18-24_Diagnostic-Sweep_Antigravity.log`

## 4. latest upstream dry-run レポート

以下は latest-follow-up branch 側で更新・確認したレポート名:

- `upstream-dry-run-20260409T100307Z.json`
- `upstream-merge-20260409T100308Z.json`
- `merge-conflict-resolution-dry-run-20260409T100307Z.md`

確認結果:

- pinned upstream SHA: `1801702ed9592ceeb1d73d1775a210d8e427cbf4`
- result: `blocked-preflight`
- action counts:
  - `upstream`: `4054`
  - `preserve_custom`: `6081`
  - `official_with_overlay`: `368`
  - `manual_api_followup`: `799`
  - `drop_generated`: `52`
- blocked paths: `1167`

注意:

- これら latest follow-up レポートは integration branch 上で更新したもので、現時点の `main` には入っていない
- `main` 側に残っている `_docs/upstream-main-diff-inventory.*` は、それ以前の同期ラウンド由来

## 5. Git / 運用メモ

- latest upstream follow-up は `main` に直接 rebase / merge せず、別ブランチで閉じた
- その branch は push 済み
- `main` は最後に復帰済み
- `opencode-zen-free-rotation.json` は branch 切り替えを妨げていたため、branch の最新内容に戻してから `main` に復帰した

## 6. 現時点の整理

- `main` で確定済み:
  - upstream sync tooling 初期導入
  - Hypura harness routing
  - repo-backed desktop env 固定化
  - verification gate 整備
- integration branch で実装・push 済み:
  - latest pin `1801702...` への follow-up sync
  - Matrix / WhatsApp / outbound / infra-runtime の追加追従
  - file SecretRef Windows 整合
  - latest dry-run / sweep 記録

## 7. 参照しやすいコミット一覧

- `c58c40a5e9` `Integrate upstream sync tooling and Hypura harness routing`
- `cb25c32be0` `Merge branch 'integrate/upstream-main-2026-04-09'`
- `268bc4c634` `Align repo-backed desktop env and verification gates`
- `6500281486` `chore: checkpoint latest upstream follow-up sync`
