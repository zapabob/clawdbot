import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { activateCompanionAsset, importCompanionAsset, inferCompanionAssetType, readCompanionAssets, } from "./companion-asset-manifest.js";
const tempPaths = [];
afterEach(async () => {
    await Promise.all(tempPaths.splice(0).map(async (targetPath) => {
        await fs.rm(targetPath, { recursive: true, force: true });
    }));
});
async function createTempWorkspace() {
    const targetPath = await fs.mkdtemp(path.join(os.tmpdir(), "companion-assets-"));
    tempPaths.push(targetPath);
    return targetPath;
}
describe("companion asset manifest", () => {
    it("requires explicit rights acknowledgment", async () => {
        const workspace = await createTempWorkspace();
        const filePath = path.join(workspace, "avatar.vrm");
        await fs.writeFile(filePath, "avatar-data", "utf-8");
        await expect(importCompanionAsset({
            stateDir: path.join(workspace, ".openclaw-desktop"),
            filePath,
            licenseMemo: "Owned by the local user",
            rightsAcknowledged: false,
        })).rejects.toThrow("requires explicit rights acknowledgment");
    });
    it("stores copied assets in the local manifest when requested", async () => {
        const workspace = await createTempWorkspace();
        const stateDir = path.join(workspace, ".openclaw-desktop");
        const filePath = path.join(workspace, "avatar.fbx");
        await fs.writeFile(filePath, "fbx-data", "utf-8");
        const asset = await importCompanionAsset({
            stateDir,
            filePath,
            licenseMemo: "Commercial license held locally",
            rightsAcknowledged: true,
            importMode: "local-copy",
        });
        expect(asset.importMode).toBe("local-copy");
        expect(await fs.readFile(asset.resolvedPath, "utf-8")).toBe("fbx-data");
        const manifestAssets = await readCompanionAssets(stateDir);
        expect(manifestAssets).toHaveLength(1);
        expect(manifestAssets[0]?.remoteUploadForbidden).toBe(true);
        const activated = await activateCompanionAsset({
            stateDir,
            assetId: asset.id,
        });
        expect(activated.id).toBe(asset.id);
    });
    it("infers the supported asset types", () => {
        expect(inferCompanionAssetType("model.model3.json")).toBe("live2d");
        expect(inferCompanionAssetType("avatar.vrm")).toBe("vrm");
        expect(inferCompanionAssetType("avatar.fbx")).toBe("fbx");
    });
});
