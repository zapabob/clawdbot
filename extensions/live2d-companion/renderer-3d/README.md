# Desktop Companion 3D renderer

The 3D companion renderer is implemented through the existing
`extensions/live2d-companion` runtime so it can share the same Electron overlay,
IPC bridge, permissions, local asset manifest, VOICEVOX speech path, and browser
helper as the Live2D companion.

Current 3D runtime entry points:

- `renderer/vrm-controller.ts` loads VRM/GLB/GLTF models with Three.js and
  `@pixiv/three-vrm`, then drives expression, gaze, idle motion, and lip sync.
- `renderer/fbx-controller.ts` loads FBX models with Three.js `FBXLoader` and
  uses available animation clips when present.
- `companion-asset-manifest.ts` keeps imports local, records rights
  acknowledgement, and forbids remote upload.
- `extensions/hypura-harness` exposes the agent-facing `companion3d` tools and
  enforces the stricter `state/companion3d/assets` runtime asset policy.

This renderer is local-only. It does not upload assets and does not inject FBX,
VRM, or other model files into VRChat.
