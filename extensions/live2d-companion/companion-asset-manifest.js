import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
const MANIFEST_FILE_NAME = "companion_assets.json";
function createEmptyManifest() {
    return {
        version: 1,
        assets: [],
    };
}
export function inferCompanionAssetType(filePath) {
    const normalized = filePath.toLowerCase();
    if (normalized.endsWith(".vrm")) {
        return "vrm";
    }
    if (normalized.endsWith(".fbx")) {
        return "fbx";
    }
    if (normalized.endsWith(".model3.json") || normalized.endsWith(".model.json")) {
        return "live2d";
    }
    return "unknown";
}
export function resolveCompanionAssetManifestPath(stateDir) {
    return path.join(stateDir, MANIFEST_FILE_NAME);
}
async function readManifest(stateDir) {
    try {
        const raw = await fs.readFile(resolveCompanionAssetManifestPath(stateDir), "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.version === 1 && Array.isArray(parsed.assets)) {
            return {
                version: 1,
                assets: parsed.assets,
            };
        }
    }
    catch {
        return createEmptyManifest();
    }
    return createEmptyManifest();
}
async function writeManifest(stateDir, manifest) {
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(resolveCompanionAssetManifestPath(stateDir), JSON.stringify(manifest, null, 2), "utf-8");
}
async function computeFileSha256(filePath) {
    const buffer = await fs.readFile(filePath);
    return createHash("sha256").update(buffer).digest("hex");
}
function assertRightsAcknowledged(rightsAcknowledged) {
    if (!rightsAcknowledged) {
        throw new Error("Asset import requires explicit rights acknowledgment");
    }
}
function assertImportModeSupported(assetType, importMode) {
    if (assetType === "live2d" && importMode === "local-copy") {
        throw new Error("Live2D local-copy is not supported because dependent textures and motions are external");
    }
}
export async function readCompanionAssets(stateDir) {
    return (await readManifest(stateDir)).assets;
}
export async function importCompanionAsset(params) {
    assertRightsAcknowledged(params.rightsAcknowledged);
    const importMode = params.importMode ?? "local-reference";
    const assetType = inferCompanionAssetType(params.filePath);
    assertImportModeSupported(assetType, importMode);
    const now = Date.now();
    const hashSha256 = await computeFileSha256(params.filePath);
    const fileName = path.basename(params.filePath);
    const resolvedPath = importMode === "local-copy"
        ? path.join(params.stateDir, "assets", hashSha256, fileName)
        : path.resolve(params.filePath);
    if (importMode === "local-copy") {
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.copyFile(params.filePath, resolvedPath);
    }
    const manifest = await readManifest(params.stateDir);
    const existing = manifest.assets.find((entry) => entry.hashSha256 === hashSha256 && entry.resolvedPath === resolvedPath);
    const entry = {
        id: existing?.id ?? hashSha256.slice(0, 16),
        assetType,
        fileName,
        sourcePath: path.resolve(params.filePath),
        resolvedPath,
        importMode,
        hashSha256,
        importedAt: existing?.importedAt ?? now,
        licenseMemo: params.licenseMemo.trim(),
        rightsAcknowledged: true,
        rightsAcknowledgedAt: now,
        remoteUploadForbidden: true,
    };
    const nextAssets = manifest.assets.filter((asset) => asset.id !== entry.id);
    nextAssets.push(entry);
    await writeManifest(params.stateDir, {
        version: 1,
        assets: nextAssets,
    });
    return entry;
}
export function assertCompanionAssetCanBeActivated(asset) {
    if (!asset.rightsAcknowledged) {
        throw new Error("Asset cannot be activated until rights are acknowledged");
    }
    return asset;
}
export async function activateCompanionAsset(params) {
    const manifest = await readManifest(params.stateDir);
    const asset = manifest.assets.find((entry) => entry.id === params.assetId);
    if (!asset) {
        throw new Error(`Asset not found: ${params.assetId}`);
    }
    return assertCompanionAssetCanBeActivated(asset);
}
