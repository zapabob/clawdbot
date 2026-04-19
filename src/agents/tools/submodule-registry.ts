import fs from "node:fs/promises";
import path from "node:path";

type JsonObject = Record<string, unknown>;

export type SubmodulePreset = {
  command: string[];
};

export type SubmoduleRepoRuntime = "node" | "python";

export type SubmoduleRepo = {
  id: string;
  path: string;
  source: {
    url: string;
    ref: string;
  };
  runtime: SubmoduleRepoRuntime;
  presets: Record<string, SubmodulePreset>;
};

export type SubmoduleRegistry = {
  version: number;
  repos: SubmoduleRepo[];
};

export const SUBMODULE_REGISTRY_RELATIVE_PATH = path.join("vendor", "submodules", "registry.json");
const SUBMODULES_ROOT_RELATIVE_PATH = path.join("vendor", "submodules");

function assertPlainObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as JsonObject;
}

function readRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function isPlainCommandBinary(command: string): boolean {
  return !/[\\/]/u.test(command) && !/^[A-Za-z]:/u.test(command);
}

function parsePresetMap(value: unknown, label: string): Record<string, SubmodulePreset> {
  const rawPresets = assertPlainObject(value, label);
  const presets: Record<string, SubmodulePreset> = {};
  for (const [presetName, presetValue] of Object.entries(rawPresets)) {
    const normalizedPresetName = presetName.trim();
    if (!normalizedPresetName) {
      throw new Error(`${label} cannot contain an empty preset name.`);
    }
    const presetObject = assertPlainObject(presetValue, `${label}.${normalizedPresetName}`);
    const rawCommand = presetObject.command;
    if (
      !Array.isArray(rawCommand) ||
      rawCommand.length === 0 ||
      rawCommand.some((entry) => typeof entry !== "string" || entry.trim().length === 0)
    ) {
      throw new Error(`${label}.${normalizedPresetName}.command must be a non-empty string array.`);
    }
    const command = rawCommand.map((entry) => String(entry).trim());
    if (!isPlainCommandBinary(command[0])) {
      throw new Error(
        `${label}.${normalizedPresetName}.command[0] must be a plain executable name, not a path.`,
      );
    }
    presets[normalizedPresetName] = { command };
  }
  if (Object.keys(presets).length === 0) {
    throw new Error(`${label} must define at least one preset.`);
  }
  return presets;
}

export function parseSubmoduleRegistry(raw: unknown): SubmoduleRegistry {
  const root = assertPlainObject(raw, "Submodule registry");
  const version = root.version;
  if (!Number.isInteger(version) || Number(version) < 1) {
    throw new Error("Submodule registry version must be a positive integer.");
  }
  if (!Array.isArray(root.repos)) {
    throw new Error("Submodule registry repos must be an array.");
  }
  const repos: SubmoduleRepo[] = [];
  const seenIds = new Set<string>();
  for (const repoValue of root.repos) {
    const repoObject = assertPlainObject(repoValue, "Submodule repo");
    const id = readRequiredString(repoObject.id, "Submodule repo id");
    if (seenIds.has(id)) {
      throw new Error(`Duplicate submodule repo id: ${id}`);
    }
    const repoPath = readRequiredString(repoObject.path, `Submodule repo ${id} path`);
    if (path.isAbsolute(repoPath)) {
      throw new Error(`Submodule repo ${id} path must be relative.`);
    }
    const source = assertPlainObject(repoObject.source, `Submodule repo ${id} source`);
    const runtime = readRequiredString(repoObject.runtime, `Submodule repo ${id} runtime`);
    if (runtime !== "node" && runtime !== "python") {
      throw new Error(`Submodule repo ${id} runtime must be "node" or "python".`);
    }
    const presets = parsePresetMap(repoObject.presets, `Submodule repo ${id} presets`);
    repos.push({
      id,
      path: repoPath,
      source: {
        url: readRequiredString(source.url, `Submodule repo ${id} source.url`),
        ref: readRequiredString(source.ref, `Submodule repo ${id} source.ref`),
      },
      runtime,
      presets,
    });
    seenIds.add(id);
  }
  return {
    version,
    repos,
  };
}

export async function loadSubmoduleRegistry(workspaceDir: string): Promise<SubmoduleRegistry> {
  const registryPath = path.join(workspaceDir, SUBMODULE_REGISTRY_RELATIVE_PATH);
  const rawText = await fs.readFile(registryPath, "utf8");
  const parsed = JSON.parse(rawText) as unknown;
  return parseSubmoduleRegistry(parsed);
}

export function findSubmoduleRepo(registry: SubmoduleRegistry, repoId: string): SubmoduleRepo {
  const normalizedRepoId = repoId.trim();
  const repo = registry.repos.find((entry) => entry.id === normalizedRepoId);
  if (!repo) {
    throw new Error(`Unknown submodule repo: ${normalizedRepoId}`);
  }
  return repo;
}

export function findSubmodulePreset(repo: SubmoduleRepo, presetName: string): SubmodulePreset {
  const normalizedPresetName = presetName.trim();
  const preset = repo.presets[normalizedPresetName];
  if (!preset) {
    throw new Error(`Unknown preset "${normalizedPresetName}" for submodule repo ${repo.id}.`);
  }
  return preset;
}

export function resolveSubmoduleRepoPath(workspaceDir: string, repo: SubmoduleRepo): string {
  const workspaceRoot = path.resolve(workspaceDir);
  const submodulesRoot = path.resolve(workspaceRoot, SUBMODULES_ROOT_RELATIVE_PATH);
  const resolvedRepoPath = path.resolve(workspaceRoot, repo.path);
  const normalizedRepoPath = path.normalize(resolvedRepoPath);
  const normalizedSubmodulesRoot = path.normalize(submodulesRoot + path.sep);
  if (
    normalizedRepoPath !== submodulesRoot &&
    !normalizedRepoPath.startsWith(normalizedSubmodulesRoot)
  ) {
    throw new Error(
      `Submodule repo ${repo.id} resolves outside vendor/submodules: ${resolvedRepoPath}`,
    );
  }
  return resolvedRepoPath;
}
