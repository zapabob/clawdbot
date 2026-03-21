/**
 * Avatar factory — selects the correct controller implementation based on
 * the model file extension or an explicit avatarType config key.
 *
 * Supported types:
 *   "live2d"  → Live2DController (pixi-live2d-display)
 *   "vrm"     → VrmController    (Three.js + @pixiv/three-vrm)
 *   "fbx"     → FbxController    (Three.js FBXLoader)
 *   "auto"    → infer from file extension (default)
 */

import type { IAvatarController } from "./avatar-controller.js";

export type AvatarType = "live2d" | "vrm" | "fbx" | "auto";

/** Determine avatar type from a file path / URL extension. */
export function inferAvatarType(path: string): AvatarType {
  const lower = path.toLowerCase();
  if (lower.endsWith(".vrm")) return "vrm";
  if (lower.endsWith(".fbx")) return "fbx";
  if (lower.endsWith(".model3.json") || lower.endsWith(".model.json")) return "live2d";
  return "live2d"; // fallback
}

/** Asynchronously import and instantiate the correct controller. */
export async function createAvatarController(type: AvatarType): Promise<IAvatarController> {
  switch (type) {
    case "vrm": {
      const { VrmController } = await import("./vrm-controller.js");
      return new VrmController();
    }
    case "fbx": {
      const { FbxController } = await import("./fbx-controller.js");
      return new FbxController();
    }
    case "live2d":
    default: {
      const { Live2DController } = await import("./live2d-controller.js");
      return new Live2DController();
    }
  }
}
