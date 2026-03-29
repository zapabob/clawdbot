# skills/

エージェント workspace から読み込まれるスキル（各 `SKILL.md`）。OpenClaw は `agents.defaults.workspace` がこのリポジトリルートのとき、ここを正とします。

| 例             | 用途                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `browser-use/` | ブラウザ CLI 自動化（ヘッドレス既定）。Gateway の `browser` ツールと併用ポリシーは `AGENTS.md` 参照。 |

ポータル起動時、`OPENCLAW_AGENT_WORKSPACE` が別パスなら `Sovereign-Portal.ps1` が repo `skills/` をそこへ同期します。
