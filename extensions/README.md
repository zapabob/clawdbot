# extensions/

OpenClaw プラグイン（公式同様 `extensions/<id>/`）。Sovereign 構成で特に重要なもの:

| ディレクトリ                                  | 役割                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`hypura-harness/`](hypura-harness/README.md) | VRChat OSC・VOICEVOX・`harness_daemon.py`（既定ポート 18794）。`governance_policy.json` で進化境界を定義。索引は README。 |
| `python-exec/`                                | Gateway 上の `python_exec`（`uv run`）。                                                                                  |
| `browser/`                                    | ブラウザ CDP ツール。`openclaw.json` の `browser` ブロックと整合。                                                        |
| `local-voice/`                                | カメラ・STT・TTS・VRChat。マルチモーダル時は設定の `cameraMinIntervalMs` 等でスロットル。                                 |
| `talk-voice/`                                 | 音声会話チャネル連携。                                                                                                    |
| `x-poster/`                                   | X（Twitter）ブラウザ自動化。機密は `.env` / `.env.local` のみ。                                                           |

起動: `scripts/launchers/Start-Hypura-Harness.ps1`、または `Sovereign-Portal.ps1` 経由。
