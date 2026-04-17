/**
 * Model discovery helper — invokes the main-process IPC handler to scan
 * the `models/` directory and return the first `.model3.json` found.
 *
 * Usage in renderer:
 *   import { discoverModel } from "./model-discovery.js";
 *   const modelPath = await discoverModel();
 */
export async function discoverModel() {
    if (!window.companionBridge?.discoverModel)
        return null;
    return window.companionBridge.discoverModel();
}
