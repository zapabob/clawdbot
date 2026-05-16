# 2026-05-16 実装まとめログ

## 対象範囲

このログは、2026-05-16 JST に `main` 上へ記録された OpenClaw 実装作業を
まとめたもの。根拠は当日の git commit、同日付の `_docs` 個別ログ、作業後の
状態確認である。

- 記録時ブランチ: `main`
- 記録時 HEAD: `27018543eaf`
- 対象期間: `2026-05-16 00:00 +0900` から `2026-05-16 21:25 +0900`
- 関連個別ログ:
  - `_docs/2026-05-16_desktop-companion-mic-input_Codex.md`
  - `_docs/2026-05-16_hypura-harness-voice-io-agent-docs_Codex.md`
  - `_docs/openclaw-voice-bridge-20260516T092000Z.md`

## コミット一覧

- `6d93000e521` - `2026-05-16 15:14 +0900` - `fix: restore telegram and avatar runtime`
- `df09ddd9537` - `2026-05-16 18:13 +0900` - `fix: unblock line gateway startup`
- `eb465fdacc4` - `2026-05-16 21:24 +0900` - `docs: condense agent guidance`
- `27018543eaf` - `2026-05-16 21:25 +0900` - `feat: add companion voice bridge tooling`

## 概要

今日の実装は、OpenClaw のローカル運用面を中心に、チャンネル起動、
返信配送、VRChat 自アバター制御、Desktop Companion のマイク入力、
Hypura Harness の音声ブリッジを前進させた。

最大の実装面は `extensions/vrchat-relay` の VRChat 自アバター OSC
コントローラーである。`OC_*` パラメーター、手動ロック、緊急停止、
レート制限、未登録パラメーター拒否、localhost 既定などを備えた
OSC-only の制御経路を追加し、README と `docs/tools/vrchat-relay.md` に
運用者向け手順を残した。VRChat の認証情報、クライアント改変、実行時の
アバターアセット読み込みは範囲外のままにしている。

チャンネル信頼性では、Telegram の最終返信取得、preview/final 配送、
送信タイムアウト、shared reply pipeline 周辺を調整した。LINE Gateway は
webhook 登録後に provider lifecycle が起動待ち状態へ進み、abort 時に
monitor を停止する形へ修正した。

Desktop Companion と Local Voice では、Windows 上の実マイクを
`naudiodon.getDevices()` から選び、WASAPI マイクを優先し、選択デバイスの
既定 sample rate で stream を開いてから STT 用に 8 kHz へ downsample
する経路を追加した。起動中の Companion については、広い production build
を待たずに使えるよう runtime bundle も直接パッチしている。

音声ブリッジでは、Whisper.cpp による speech-to-text と VOICEVOX による
text-to-speech を使うローカル helper を追加した。スタンドアロン CLI、
Hypura Harness REST endpoint、OpenClaw tool、voice I/O skill、launcher を
そろえ、`devices`、`test-say`、`transcribe`、`once`、`loop` の基本導線を
置いた。

Hypura Harness では、既存の voice endpoint を OpenClaw agent が扱えるよう
tool 登録、before-prompt context、`hypura-voice-io` skill、README と plugin
metadata も整備した。live hardware smoke は別途必要だが、tool 登録と daemon
endpoint のテストは記録されている。

あわせて `AGENTS.md` を圧縮し、routing、validation、GitHub/PR、docs、
security、ops のルールを短く参照しやすい形に整理した。

## 実装面

### Telegram と shared reply delivery

- `extensions/telegram/src/bot-message-dispatch.ts` と runtime path を調整し、
  turn transcript から最終 assistant text をより安定して復元できるようにした。
- `extensions/telegram/src/lane-delivery-text-deliverer.ts` の preview/final
  配送を整理し、最終応答を落としにくくした。
- `extensions/telegram/src/request-timeouts.ts` で outbound text API の
  timeout を広げ、返信中の短すぎる打ち切りを避けた。
- `src/plugin-sdk/channel-reply-pipeline.ts` など shared reply pipeline 周辺も
  Telegram の最終応答保持に合わせて整理した。

### VRChat 自アバター OSC 制御

- `extensions/vrchat-relay/src/own-avatar/` に controller、config、registry、
  OSC sender、parameter mapper、behavior planner、safety gate を追加した。
- 既定の制御面として `OC_AutoEnabled`、`OC_State`、`OC_Emotion`、
  `OC_Action`、`OC_ActionPulse`、`OC_LookX`、`OC_LookY`、`OC_Reset`、
  `OC_ManualLock` を扱う。
- 既定では OSC を `127.0.0.1` に限定し、remote OSC は opt-in とした。
- manual lock 優先、未登録 parameter 拒否、command rate 上限、emergency
  stop を安全既定として組み込んだ。
- `extensions/vrchat-relay/README.md` と `docs/tools/vrchat-relay.md` に
  operator-facing の設定・ツール手順を追加した。

### LINE Gateway startup

- `extensions/line/src/monitor.ts` を修正し、webhook 登録後に provider 全体を
  塞がず monitor handle を返すようにした。
- `extensions/line/src/gateway.ts` で `startAccount` 側が abort まで待ち、
  `finally` で monitor を停止する責務を持つようにした。
- `extensions/line/src/monitor.lifecycle.test.ts` と
  `extensions/line/src/gateway.lifecycle.test.ts` で、登録直後の返却、
  abort 後 stop、gateway の pending lifecycle を固定した。

### Desktop Companion mic と Local Voice

- `extensions/local-voice/src/audio-input.ts` に `naudiodon.getDevices()` による
  input device 探索を追加した。
- Windows では WASAPI マイク、次に microphone-like input、最後に最初の
  input device へ fallback する。
- 選択デバイスの既定 sample rate で stream を開き、STT へ渡す前に PCM16 を
  8 kHz へ downsample する。
- device 選択と no-input-device の test を追加した。
- `extensions/live2d-companion/` と `src/plugin-sdk/live2d-companion.ts` に
  mic/voice turn 向け IPC surface を広げた。

### Hypura Harness voice bridge

- `scripts/openclaw_voice_bridge.py` に `devices`、`test-say`、`transcribe`、
  `once`、`loop` を追加した。
- `extensions/hypura-harness/scripts/voice_bridge.py` と `harness_daemon.py` に
  `/voice/devices`、`/voice/test-say`、`/voice/transcribe`、`/voice/turn` を
  追加した。
- `extensions/hypura-harness/index.ts` で voice bridge tool を OpenClaw tool
  として公開した。
- `extensions/hypura-harness/index.ts` と `index.test.ts` に agent-facing
  voice tool registration と parameter filtering の coverage を追加した。
- `extensions/hypura-harness/skills/voice-io/SKILL.md` を追加し、音声 I/O の
  操作手順を plugin 内に置いた。
- `extensions/hypura-harness/README.md` と plugin metadata に local voice I/O
  の説明を追加した。
- `scripts/launchers/Start-OpenClaw-CompanionVoice.ps1` と
  `scripts/launchers/Start-OpenClaw-VoiceConversation.ps1` を追加した。

### Agent guidance cleanup

- `AGENTS.md` を短縮しつつ、repo routing、architecture、validation、
  GitHub/PR、docs、git、security、release、platform rules を残した。

## 今日記録された検証

### VRChat Relay

- `node scripts/run-tsgo.mjs -p extensions/vrchat-relay/tsconfig.json --incremental false`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts ...vrchat-relay...`
- `pnpm exec oxfmt --check --threads=1 ...`
- `pnpm docs:list`
- `git diff --check`

### LINE Gateway

- monitor lifecycle と gateway startup/abort の test を追加した。
- 修正コミットは `df09ddd9537`。

### Voice bridge と Hypura Harness

- `python scripts\openclaw_voice_bridge.py devices`
- `python scripts\openclaw_voice_bridge.py --output-device 4 test-say --text "<VOICEVOX test text>"`
- `python scripts\openclaw_voice_bridge.py transcribe <whisper.cpp>\test\bridge-test.wav`
- `python -m py_compile extensions\hypura-harness\scripts\voice_bridge.py extensions\hypura-harness\scripts\voicevox_sequencer.py extensions\hypura-harness\scripts\harness_daemon.py`
- `uv run pytest -p no:randomly tests/test_harness_daemon.py tests/test_voicevox_sequencer.py`
- `pnpm exec oxfmt --write --threads=1 extensions/hypura-harness/index.ts extensions/hypura-harness/index.test.ts`
- `git diff --check -- extensions/hypura-harness/index.ts extensions/hypura-harness/index.test.ts extensions/hypura-harness/README.md extensions/hypura-harness/openclaw.plugin.json extensions/hypura-harness/package.json extensions/hypura-harness/skills/voice-io/SKILL.md`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts --maxWorkers=1`
- `uv run pytest tests/test_harness_daemon.py -q -p no:randomly`
- live daemon の `GET /voice/devices` を確認した。
- live daemon の `POST /voice/test-say` が `success=true` を返すことを確認した。

### Desktop Companion mic

- native rebuild 後に `require("naudiodon")` が成功した。
- `naudiodon` が `Microphone (Brio 100)` を列挙し、WASAPI device id `10`、
  `48000 Hz` を確認した。
- `createLocalWhisperMicSession().start()` が `true` を返し、device `10` で
  listening state に入ることを確認した。
- Companion 再起動後の state で `sttAvailable: true` を確認した。
- Companion IPC permission update 後も mic permission granted と
  STT available が維持された。

## 残リスク

- 完全な live OpenClaw voice conversation は、`/voice/turn` 背後の
  Gateway/CLI response path が健全であることに依存する。
- VOICEVOX の実音声出力は Windows の出力デバイス routing に依存する。
  記録上の output device `4` は、意図したスピーカーやヘッドホンではなく
  monitor audio sink の可能性がある。
- synthetic VOICEVOX 音声に対する Whisper.cpp 認識は完全ではなかったため、
  実マイク発話での確認が必要。
- 先行の mic fix session では focused Local Voice Vitest が有用な出力なしで
  timeout している。
- `pnpm tsgo:extensions` は wider worktree の unrelated extension type error
  をまだ報告するため、今日の Local Voice 検証は focused runtime smoke
  evidence によって支えている。
- 起動中 Companion 向けに runtime bundle を直接パッチしたため、今後は
  companion runtime chunk の狭い rebuild path を追加するのが望ましい。

## 推奨 next actions

- `hypura_harness_voice_devices` で実スピーカーまたはヘッドホンの output id を
  選び、`hypura_harness_voice_test_say` を再実行する。
- OpenClaw CLI/Gateway response path を確認したうえで、`/voice/turn` または
  launcher 経由の voice conversation を1回通す。
- live fix が broad root production build に依存しないよう、bundled companion
  runtime chunk の focused build command を追加する。
- non-8 kHz input device を mocked `naudiodon` device list で扱う Local Voice
  integration smoke を追加する。
- VRChat 自アバター制御は OSC-only を維持し、credentials 拡張、VRChat
  client modification、runtime avatar asset loading を入れない。
