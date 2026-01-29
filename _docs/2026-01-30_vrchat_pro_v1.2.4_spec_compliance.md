# 2026-01-30 VRChat Pro v1.2.4 Spec Compliance

## 概要

VRChat 2025.3.3 Open Beta にて定義されている Official OSC Specification に完全に準拠するための厳格な修正を行いました。これにより、「動かない」「期待と違う」といったOSC制御の不整合を排除し、他社製ツール（VRCFaceTracking等）と同等の信頼性を確保しました。

## 修正内容

### 1. Smoothing の分離と仕様化

以前は `Smoothing` という単一パラメータでしたが、公式仕様に合わせて分離しました。

- **`SmoothMovement` (Toggle)**: スムージング機能自体の ON/OFF。
- **`SmoothingStrength` (0.1 - 10.0)**: スムージングの強度。

ラッパー関数 `setSmoothing(val)` は、親切設計として「Strengthを設定しつつ、自動的に Movement を ON にする」挙動に変更しました。

### 2. トグル化 (Boolean Conversion)

数値制御されていた以下のパラメータを、公式定義通りの Boolean Toggle に変更しました。

- **`LookAtMe`**: Head Tracking への追従 (ON/OFF)
- **`GreenScreen`**: 背景合成モードの有効化 (ON/OFF)

### 3. レンジの厳格化

スライダー範囲を Open Beta の最新値に更新しました。

- **`FlySpeed`**: 0.05-10.0 → **0.1 - 15.0**
- **`TurnSpeed`**: 0.05-10.0 → **0.1 - 5.0**

これにより、ドローン操作時のスピード感がVRChatのメニュー操作と完全に一致するようになります。

---

_Moltbot VRChat Integration Team (BoB-Nyan v1.2.4 Compliance)_
