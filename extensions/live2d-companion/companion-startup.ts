import path from "node:path";
import type { CompanionAssetManifestEntry } from "./companion-asset-manifest.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSupportedCompanionModelPath(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return (
    normalized.endsWith(".fbx") ||
    normalized.endsWith(".vrm") ||
    normalized.endsWith(".model3.json") ||
    normalized.endsWith(".model.json")
  );
}

function resolveOptionalPath(repoRoot: string, rawPath: unknown): string | null {
  if (!isNonEmptyString(rawPath)) {
    return null;
  }
  if (rawPath === "auto") {
    return null;
  }
  return path.resolve(repoRoot, rawPath);
}

export function buildCompanionDiscoveryEntries(params: {
  repoRoot: string;
  configuredModelPath?: unknown;
  configuredAvatarPath?: unknown;
}): string[] {
  const entries = [
    resolveOptionalPath(params.repoRoot, params.configuredAvatarPath),
    resolveOptionalPath(params.repoRoot, params.configuredModelPath),
    path.join(params.repoRoot, "assets"),
    path.join(params.repoRoot, "models"),
  ].filter((entry): entry is string => entry !== null);

  return Array.from(new Set(entries.map((entry) => path.resolve(entry))));
}

function rankCompanionModelCandidate(filePath: string): number {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const inAssets = normalized.includes("/assets/");
  const inModels = normalized.includes("/models/");
  const baseRank = inAssets ? 0 : inModels ? 20 : 40;
  const fileName = path.basename(normalized);
  const variantPenalty = /(?:head|face|kisekae|marubody|body_only|accessory)/.test(fileName)
    ? 4
    : 0;

  if (normalized.endsWith(".fbx")) {
    return baseRank + variantPenalty;
  }
  if (normalized.endsWith(".vrm")) {
    return baseRank + 5 + variantPenalty;
  }
  if (normalized.endsWith(".model3.json") || normalized.endsWith(".model.json")) {
    return baseRank + 10 + variantPenalty;
  }
  return baseRank + 50 + variantPenalty;
}

export function sortCompanionModelCandidates(filePaths: string[]): string[] {
  return Array.from(new Set(filePaths.map((filePath) => path.resolve(filePath)))).sort((left, right) => {
    const rankDifference = rankCompanionModelCandidate(left) - rankCompanionModelCandidate(right);
    if (rankDifference !== 0) {
      return rankDifference;
    }
    return left.localeCompare(right);
  });
}

export function selectStartupCompanionAssetId(params: {
  assets: CompanionAssetManifestEntry[];
  cachedActiveAssetId?: string | null;
}): string | null {
  if (params.cachedActiveAssetId) {
    const cachedAsset = params.assets.find((asset) => asset.id === params.cachedActiveAssetId);
    if (cachedAsset?.rightsAcknowledged) {
      return cachedAsset.id;
    }
  }

  return params.assets.find((asset) => asset.rightsAcknowledged)?.id ?? null;
}

export function shouldAutoExpandCompanionPanel(params: {
  onboardingSeen: boolean;
  activeAssetId: string | null;
  assetCount: number;
}): boolean {
  if (!params.onboardingSeen) {
    return true;
  }

  return params.activeAssetId === null || params.assetCount === 0;
}
