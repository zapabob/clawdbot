# local-voice カメラ・マイク（マルチモーダル）運用メモ

**ワークツリー:** `clawdbot-main`  
**日付:** 2026-03-28

## 設定キー（`plugins.entries["local-voice"].config`）

| キー                           | 役割                                                                |
| ------------------------------ | ------------------------------------------------------------------- |
| `cameraDeviceId`               | Windows **DirectShow** デバイス名（ffmpeg の `video="..."` と一致） |
| `cameraWidth` / `cameraHeight` | `ffmpeg -video_size WxH`（解像度・トークン抑制）                    |
| `cameraMinIntervalMs`          | 連続 `/camera capture` の最短間隔（ms）。0 で無制限                 |

代替: 環境変数 `OPENCLAW_CAMERA_DSHOW_NAME` でデバイス名を上書き可能（config より後段のコードでは deviceId が優先）。

## Windows でカメラ名を確認する

1. **ffmpeg** が入っている場合（PATH 上）:

```powershell
ffmpeg -list_devices true -f dshow -i dummy
```

2. デバイス名は **設定アプリ → プライバシー → カメラ** の表示名と一致することが多いが、上記リストを正とする。

## 既定マイク（STT）

`local-voice` の STT はプロバイダー側の既定入力に依存。OS の **設定 → システム → サウンド → 入力** で既定マイクを選ぶ。

## プライバシー

カメラ・マイクはユーザーの明示的なオプトインを前提にすること。本番では `cameraMinIntervalMs` を 2000–5000ms 程度にし、ビジョン API のコストと GPU/CPU 負荷を抑える。
