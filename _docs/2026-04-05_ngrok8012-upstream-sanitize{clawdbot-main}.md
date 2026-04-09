# 実装ログ: ngrok 上流 `undefined://undefined` 対策（worktree: clawdbot-main）

- **UTC 時刻（py -3）**: `2026-04-05T13:16:11Z`
- **CoT 仮説**: `ERR_NGROK_8012` + 上流表示 `undefined://undefined` は、**未展開テンプレや壊れた `NGROK_UPSTREAM_URL`** がそのまま ngrok に渡る／子プロセスに残るのが主因。repo の `start_ngrok.ps1` 単体は既にフォールバックがあるが、**マージ後プロセス環境にゴミが残る**と他ツールが誤動作しうる。
- **検証**: `[Uri]` で scheme/host/port を検証し、`undefined://` 形式と `Host=undefined`、port 0 を拒否。PowerShell Parser で `env-tools.ps1` / `start_ngrok.ps1` / `repair-ngrok-upstream-env.ps1` を構文チェック済み。

## 変更

| ファイル                                          | 内容                                                                                                                                                                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/launchers/env-tools.ps1`                 | `Test-OpenClawNgrokUpstreamCandidate` / `Resolve-OpenClawNgrokUpstreamUrl` / `Repair-OpenClawProcessEnvNgrokUpstreamUrl`。`Merge-OpenClawEnvToProcess` 末尾で無効値を **プロセス環境から削除**。`Get-NgrokUpstreamTunnelMatchPort` を同検証に統一。 |
| `scripts/launchers/start_ngrok.ps1`               | `Resolve-OpenClawNgrokUpstreamUrl` 使用。`Get-MergedEnvMap` で **ファイル由来の壊れた値**を検知して警告 + repair スクリプト案内。                                                                                                                   |
| `scripts/launchers/repair-ngrok-upstream-env.ps1` | `.env` / `.env.local` / `.openclaw-desktop\.env` の無効行をコメント + 置換（`-GatewayPort` / `-WhatIf`）。                                                                                                                                          |
| `scripts/launchers/README.md` / `CHANGELOG.md`    | 利用手順・Fix エントリ。                                                                                                                                                                                                                            |

## なんｊ風まとめ

テンプレ腐って `undefined://undefined` みたいなん出てたらアカンやろ。**マージした瞬間に環境からぶっ飛ばして**、ngrok は **127.0.0.1:既定ポート**に逃がす。**`.env` 側も直したい奴は repair 叩け**、って話や。Rust の tqdm とか今回無いわボケが（PowerShell や）。
