import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type CompanionAssetType = "vrm" | "fbx" | "live2d" | "unknown";
export type CompanionAssetImportMode = "local-reference" | "local-copy";

export type CompanionAssetManifestEntry = {
  id: string;
  assetType: CompanionAssetType;
  fileName: string;
  sourcePath: string;
  resolvedPath: string;
  importMode: CompanionAssetImportMode;
  hashSha256: string;
  importedAt: number;
  licenseMemo: string;
  rightsAcknowledged: boolean;
  rightsAcknowledgedAt: number | null;
  remoteUploadForbidden: true;
};

type CompanionAssetManifestFile = {
  version: 1;
  assets: CompanionAssetManifestEntry[];
};

const MANIFEST_FILE_NAME = "companion_assets.json";

function createEmptyManifest(): CompanionAssetManifestFile {
  return {
    version: 1,
    assets: [],
  };
}

export function inferCompanionAssetType(filePath: string): CompanionAssetType {
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

export function resolveCompanionAssetManifestPath(stateDir: string): string {
  return path.join(stateDir, MANIFEST_FILE_NAME);
}

async function readManifest(stateDir: string): Promise<CompanionAssetManifestFile> {
  try {
    const raw = await fs.readFile(resolveCompanionAssetManifestPath(stateDir), "utf-8");
    const parsed = JSON.parse(raw) as Partial<CompanionAssetManifestFile>;
    if (parsed.version === 1 && Array.isArray(parsed.assets)) {
      return {
        version: 1,
        assets: parsed.assets as CompanionAssetManifestEntry[],
      };
    }
  } catch {
    return createEmptyManifest();
  }
  return createEmptyManifest();
}

async function writeManifest(
  stateDir: string,
  manifest: CompanionAssetManifestFile,
): Promise<void> {
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(
    resolveCompanionAssetManifestPath(stateDir),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
}

async function computeFileSha256(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

function assertRightsAcknowledged(
  rightsAcknowledged: boolean,
): asserts rightsAcknowledged is true {
  if (!rightsAcknowledged) {
    throw new Error("Asset import requires explicit rights acknowledgment");
  }
}

function assertImportModeSupported(
  assetType: CompanionAssetType,
  importMode: CompanionAssetImportMode,
): void {
  if (assetType === "live2d" && importMode === "local-copy") {
    throw new Error(
      "Live2D local-copy is not supported because dependent textures and motions are external",
    );
  }
}

export async function readCompanionAssets(
  stateDir: string,
): Promise<CompanionAssetManifestEntry[]> {
  return (await readManifest(stateDir)).assets;
}

export async function importCompanionAsset(params: {
  stateDir: string;
  filePath: string;
  licenseMemo: string;
  rightsAcknowledged: boolean;
  importMode?: CompanionAssetImportMode;
}): Promise<CompanionAssetManifestEntry> {
  assertRightsAcknowledged(params.rightsAcknowledged);
  const importMode = params.importMode ?? "local-reference";
  const assetType = inferCompanionAssetType(params.filePath);
  assertImportModeSupported(assetType, importMode);

  const now = Date.now();
  const hashSha256 = await computeFileSha256(params.filePath);
  const fileName = path.basename(params.filePath);
  const resolvedPath =
    importMode === "local-copy"
      ? path.join(params.stateDir, "assets", hashSha256, fileName)
      : path.resolve(params.filePath);

  if (importMode === "local-copy") {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.copyFile(params.filePath, resolvedPath);
  }

  const manifest = await readManifest(params.stateDir);
  const existing = manifest.assets.find(
    (entry) => entry.hashSha256 === hashSha256 && entry.resolvedPath === resolvedPath,
  );

  const entry: CompanionAssetManifestEntry = {
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

export function assertCompanionAssetCanBeActivated(
  asset: CompanionAssetManifestEntry,
): CompanionAssetManifestEntry {
  if (!asset.rightsAcknowledged) {
    throw new Error("Asset cannot be activated until rights are acknowledged");
  }
  return asset;
}

export async function activateCompanionAsset(params: {
  stateDir: string;
  assetId: string;
}): Promise<CompanionAssetManifestEntry> {
  const manifest = await readManifest(params.stateDir);
  const asset = manifest.assets.find((entry) => entry.id === params.assetId);
  if (!asset) {
    throw new Error(`Asset not found: ${params.assetId}`);
  }
  return assertCompanionAssetCanBeActivated(asset);
}
