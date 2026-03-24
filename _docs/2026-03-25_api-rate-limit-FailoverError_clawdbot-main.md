# API rate limit / FailoverError 診断メモ

- **取得日時**: 2026-03-25 03:11:26 +09:00（ローカル）
- **観測ログ**: `lane=nested` / `lane=session:agent:main:cron:...` が `durationMs≈915000` で `FailoverError: ⚠️ API rate limit reached`
- **結論**: プロバイダ側のレート制限（またはそれと同等に分類される応答）を検知し、ユーザー向け文言に正規化されたうえで `FailoverError`（reason: `rate_limit` 想定）として扱われている。`[model-fallback/decision]` は別モデルへのフォールバック判断ログ（行が切れて `candidat` までしか見えていない可能性あり）。

## コード上の根拠

- 文言 `⚠️ API rate limit reached. Please try again later.` は `src/agents/pi-embedded-helpers/errors.ts` の `RATE_LIMIT_ERROR_USER_MESSAGE`。
- `FailoverError` と `rate_limit` → HTTP 429 相当の整理は `src/agents/failover-error.ts`。

## 対処の方向性（運用）

- 同一キー・同一モデルへの同時多発（cron + メイン + nested）を減らす（間隔・並列度）。
- `models.json` / フォールバックチェーンで別プロバイダ・別モデルを用意する。
- プロバイダのダッシュボードで TPM/RPD 上限・課金ティアを確認する。
- ピークを避けて再実行する（ウィンドウリセット待ち）。

## CoT メモ（仮説→検証）

1. **仮説**: 429 または rate limit 文字列が返り、リトライ／長時間待ちで `durationMs` が ~15 分に伸びた。
2. **検証**: 同一時刻帯に `nested` と `cron` の両方が落ちている → 共有クォータ枯渇が妥当。
3. **次アクション**: ログのプロバイダ名・モデル名行があれば特定し、cron 間隔またはフォールバックを調整。
