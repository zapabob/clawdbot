# 2026-02-21: Avatar LilToon Shader Integration

## 概要 (Overview)

`scripts/avatar-window.html` に表示されるFBXアバターについて、標準的なPBR（リアル調）マテリアルから**LilToon（トゥーン/セルルック調）マテリアル**への動的置換を行いました。これにより、VRChatなどで使用されるアニメ風キャラクターと同等の鮮やかな表示が可能になりました。

## 変更ファイルおよび設定 (Modified Files & Config)

1. **`scripts/avatar-window.html`**
   - **マテリアル置換**: FBXモデルの全メッシュを走査し、搭載されているマテリアルを強制的に `THREE.MeshToonMaterial` へ置き換えるカスタムロジックを追加しました。
   - **グラデーションマップ生成**: トゥーンマテリアルに適用するため、JavaScriptで動的に4階調の `DataTexture` グラデーションマップを生成しました。
   - **Emissive (自己発光)**: 影領域でテクスチャの色味が潰れるのを防ぐため、Diffuse Color/Map を Emissive（強度 0.35）として付与しています。
   - **ライティング変更**:
     - `AmbientLight` (環境光) を `0.8` から `1.8` へ大幅増強。
     - `DirectionalLight` (主光源) を `1.2` から `1.5` へ増強し、シャドウバイアスを調整して影の境界をシャープにしました。
     - 輪郭にハイライトを当てるための `RimLight` (リムライト) を背面に追加しました。

## トラブルシューティングおよび今後の課題 (Future Considerations)

- アウトライン（輪郭線）の描画が含まれていないため、さらなるアニメ調の再現が必要な場合は Post-Processing（`OutlinePass`）や「背面法線押し出し（Inverted Hull）」によるカスタムアウトラインの実装を検討してください。
- トゥーンマップの階調数やライトの強さは `avatar-window.html` 内の値を直接編集することで調整可能です。
