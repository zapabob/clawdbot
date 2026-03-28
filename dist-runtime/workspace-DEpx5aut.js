import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { i as openBoundaryFileSync } from "./boundary-file-read-DZTg2Wyt.js";
import {
  a as normalizePluginsConfig,
  o as resolveEffectiveEnableState,
  s as resolveMemorySlotDecision,
} from "./config-state-CGV1IKLE.js";
import {
  d as evaluateRuntimeEligibility,
  f as hasBinary,
  p as isConfigPathTruthyWithDefaults,
} from "./frontmatter-CtATI79x.js";
import {
  i as resolveOpenClawMetadata,
  n as resolveHookInvocationPolicy,
  r as resolveHookKey,
  t as parseFrontmatter,
} from "./frontmatter-DAvs7wZo.js";
import { n as MANIFEST_KEY } from "./legacy-names-DXq9Oi_B.js";
import { n as loadPluginManifestRegistry } from "./manifest-registry-CMy5XLiN.js";
import { r as isPathInsideWithRealpath } from "./scan-paths-B4rpj8y5.js";
import { t as createSubsystemLogger } from "./subsystem-BZRyMoTO.js";
import { t as CONFIG_DIR, y as resolveUserPath } from "./utils-DGUUVa38.js";
//#region src/hooks/policy.ts
const HOOK_SOURCE_POLICIES = {
  "openclaw-bundled": {
    precedence: 10,
    trustedLocalCode: true,
    defaultEnableMode: "default-on",
    canOverride: ["openclaw-bundled"],
    canBeOverriddenBy: ["openclaw-managed", "openclaw-plugin"],
  },
  "openclaw-plugin": {
    precedence: 20,
    trustedLocalCode: true,
    defaultEnableMode: "default-on",
    canOverride: ["openclaw-bundled", "openclaw-plugin"],
    canBeOverriddenBy: ["openclaw-managed"],
  },
  "openclaw-managed": {
    precedence: 30,
    trustedLocalCode: true,
    defaultEnableMode: "default-on",
    canOverride: ["openclaw-bundled", "openclaw-managed", "openclaw-plugin"],
    canBeOverriddenBy: ["openclaw-managed"],
  },
  "openclaw-workspace": {
    precedence: 40,
    trustedLocalCode: true,
    defaultEnableMode: "explicit-opt-in",
    canOverride: ["openclaw-workspace"],
    canBeOverriddenBy: ["openclaw-workspace"],
  },
};
function getHookSourcePolicy(source) {
  return HOOK_SOURCE_POLICIES[source];
}
function resolveHookConfig(config, hookKey) {
  const hooks = config?.hooks?.internal?.entries;
  if (!hooks || typeof hooks !== "object") return;
  const entry = hooks[hookKey];
  if (!entry || typeof entry !== "object") return;
  return entry;
}
function resolveHookEnableState(params) {
  const { entry, config } = params;
  const hookKey = resolveHookKey(entry.hook.name, entry);
  const hookConfig = params.hookConfig ?? resolveHookConfig(config, hookKey);
  if (entry.hook.source === "openclaw-plugin") return { enabled: true };
  if (hookConfig?.enabled === false)
    return {
      enabled: false,
      reason: "disabled in config",
    };
  if (
    getHookSourcePolicy(entry.hook.source).defaultEnableMode === "explicit-opt-in" &&
    hookConfig?.enabled !== true
  )
    return {
      enabled: false,
      reason: "workspace hook (disabled by default)",
    };
  return { enabled: true };
}
function canOverrideHook(candidate, existing) {
  const candidatePolicy = getHookSourcePolicy(candidate.hook.source);
  const existingPolicy = getHookSourcePolicy(existing.hook.source);
  return (
    candidatePolicy.canOverride.includes(existing.hook.source) &&
    existingPolicy.canBeOverriddenBy.includes(candidate.hook.source)
  );
}
function resolveHookEntries(entries, opts) {
  const ordered = entries
    .map((entry, index) => ({
      entry,
      index,
    }))
    .toSorted((a, b) => {
      const precedenceDelta =
        getHookSourcePolicy(a.entry.hook.source).precedence -
        getHookSourcePolicy(b.entry.hook.source).precedence;
      return precedenceDelta !== 0 ? precedenceDelta : a.index - b.index;
    });
  const merged = /* @__PURE__ */ new Map();
  for (const { entry } of ordered) {
    const existing = merged.get(entry.hook.name);
    if (!existing) {
      merged.set(entry.hook.name, entry);
      continue;
    }
    if (canOverrideHook(entry, existing)) {
      merged.set(entry.hook.name, entry);
      continue;
    }
    opts?.onCollisionIgnored?.({
      name: entry.hook.name,
      kept: existing,
      ignored: entry,
    });
  }
  return Array.from(merged.values());
}
//#endregion
//#region src/hooks/config.ts
const DEFAULT_CONFIG_VALUES = {
  "browser.enabled": true,
  "browser.evaluateEnabled": true,
  "workspace.dir": true,
};
function isConfigPathTruthy(config, pathStr) {
  return isConfigPathTruthyWithDefaults(config, pathStr, DEFAULT_CONFIG_VALUES);
}
function evaluateHookRuntimeEligibility(params) {
  const { entry, config, hookConfig, eligibility } = params;
  const remote = eligibility?.remote;
  return evaluateRuntimeEligibility({
    os: entry.metadata?.os,
    remotePlatforms: remote?.platforms,
    always: entry.metadata?.always,
    requires: entry.metadata?.requires,
    hasRemoteBin: remote?.hasBin,
    hasAnyRemoteBin: remote?.hasAnyBin,
    hasBin: hasBinary,
    hasEnv: (envName) => Boolean(process.env[envName] || hookConfig?.env?.[envName]),
    isConfigPathTruthy: (configPath) => isConfigPathTruthy(config, configPath),
  });
}
function shouldIncludeHook(params) {
  const { entry, config, eligibility } = params;
  const hookConfig = resolveHookConfig(
    config,
    params.entry.metadata?.hookKey ?? params.entry.hook.name,
  );
  if (
    !resolveHookEnableState({
      entry,
      config,
      hookConfig,
    }).enabled
  )
    return false;
  return evaluateHookRuntimeEligibility({
    entry,
    config,
    hookConfig,
    eligibility,
  });
}
//#endregion
//#region src/hooks/bundled-dir.ts
function resolveBundledHooksDir() {
  const override = process.env.OPENCLAW_BUNDLED_HOOKS_DIR?.trim();
  if (override) return override;
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "hooks", "bundled");
    if (fs.existsSync(sibling)) return sibling;
  } catch {}
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const distBundled = path.join(moduleDir, "bundled");
    if (fs.existsSync(distBundled)) return distBundled;
  } catch {}
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(moduleDir, "..", "..");
    const srcBundled = path.join(root, "src", "hooks", "bundled");
    if (fs.existsSync(srcBundled)) return srcBundled;
  } catch {}
}
//#endregion
//#region src/hooks/plugin-hooks.ts
const log$1 = createSubsystemLogger("hooks");
function resolvePluginHookDirs(params) {
  const workspaceDir = (params.workspaceDir ?? "").trim();
  if (!workspaceDir) return [];
  const registry = loadPluginManifestRegistry({
    workspaceDir,
    config: params.config,
    cache: false,
  });
  if (registry.plugins.length === 0) return [];
  const normalizedPlugins = normalizePluginsConfig(params.config?.plugins);
  const memorySlot = normalizedPlugins.slots.memory;
  let selectedMemoryPluginId = null;
  const seen = /* @__PURE__ */ new Set();
  const resolved = [];
  for (const record of registry.plugins) {
    if (!record.hooks || record.hooks.length === 0) continue;
    if (
      !resolveEffectiveEnableState({
        id: record.id,
        origin: record.origin,
        config: normalizedPlugins,
        rootConfig: params.config,
      }).enabled
    )
      continue;
    const memoryDecision = resolveMemorySlotDecision({
      id: record.id,
      kind: record.kind,
      slot: memorySlot,
      selectedId: selectedMemoryPluginId,
    });
    if (!memoryDecision.enabled) continue;
    if (memoryDecision.selected && record.kind === "memory") selectedMemoryPluginId = record.id;
    for (const raw of record.hooks) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const candidate = path.resolve(record.rootDir, trimmed);
      if (!fs.existsSync(candidate)) {
        log$1.warn(`plugin hook path not found (${record.id}): ${candidate}`);
        continue;
      }
      if (!isPathInsideWithRealpath(record.rootDir, candidate, { requireRealpath: true })) {
        log$1.warn(`plugin hook path escapes plugin root (${record.id}): ${candidate}`);
        continue;
      }
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      resolved.push({
        dir: candidate,
        pluginId: record.id,
      });
    }
  }
  return resolved;
}
//#endregion
//#region src/hooks/workspace.ts
const log = createSubsystemLogger("hooks/workspace");
function readHookPackageManifest(dir) {
  const raw = readBoundaryFileUtf8({
    absolutePath: path.join(dir, "package.json"),
    rootPath: dir,
    boundaryLabel: "hook package directory",
  });
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function resolvePackageHooks(manifest) {
  const raw = manifest[MANIFEST_KEY]?.hooks;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean);
}
function resolveContainedDir(baseDir, targetDir) {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(baseDir, targetDir);
  if (!isPathInsideWithRealpath(base, resolved, { requireRealpath: true })) return null;
  return resolved;
}
function loadHookFromDir(params) {
  const hookMdPath = path.join(params.hookDir, "HOOK.md");
  const content = readBoundaryFileUtf8({
    absolutePath: hookMdPath,
    rootPath: params.hookDir,
    boundaryLabel: "hook directory",
  });
  if (content === null) return null;
  try {
    const frontmatter = parseFrontmatter(content);
    const name = frontmatter.name || params.nameHint || path.basename(params.hookDir);
    const description = frontmatter.description || "";
    const handlerCandidates = ["handler.ts", "handler.js", "index.ts", "index.js"];
    let handlerPath;
    for (const candidate of handlerCandidates) {
      const safeCandidatePath = resolveBoundaryFilePath({
        absolutePath: path.join(params.hookDir, candidate),
        rootPath: params.hookDir,
        boundaryLabel: "hook directory",
      });
      if (safeCandidatePath) {
        handlerPath = safeCandidatePath;
        break;
      }
    }
    if (!handlerPath) {
      log.warn(`Hook "${name}" has HOOK.md but no handler file in ${params.hookDir}`);
      return null;
    }
    let baseDir = params.hookDir;
    try {
      baseDir = fs.realpathSync.native(params.hookDir);
    } catch {}
    return {
      hook: {
        name,
        description,
        source: params.source,
        pluginId: params.pluginId,
        filePath: hookMdPath,
        baseDir,
        handlerPath,
      },
      frontmatter,
    };
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    log.warn(`Failed to load hook from ${params.hookDir}: ${message}`);
    return null;
  }
}
/**
 * Scan a directory for hooks (subdirectories containing HOOK.md)
 */
function loadHooksFromDir(params) {
  const { dir, source, pluginId } = params;
  if (!fs.existsSync(dir)) return [];
  if (!fs.statSync(dir).isDirectory()) return [];
  const hooks = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const hookDir = path.join(dir, entry.name);
    const manifest = readHookPackageManifest(hookDir);
    const packageHooks = manifest ? resolvePackageHooks(manifest) : [];
    if (packageHooks.length > 0) {
      for (const hookPath of packageHooks) {
        const resolvedHookDir = resolveContainedDir(hookDir, hookPath);
        if (!resolvedHookDir) {
          log.warn(
            `Ignoring out-of-package hook path "${hookPath}" in ${hookDir} (must be within package directory)`,
          );
          continue;
        }
        const hook = loadHookFromDir({
          hookDir: resolvedHookDir,
          source,
          pluginId,
          nameHint: path.basename(resolvedHookDir),
        });
        if (hook) hooks.push(hook);
      }
      continue;
    }
    const hook = loadHookFromDir({
      hookDir,
      source,
      pluginId,
      nameHint: entry.name,
    });
    if (hook) hooks.push(hook);
  }
  return hooks;
}
function loadHookEntriesFromDir(params) {
  return loadHooksFromDir({
    dir: params.dir,
    source: params.source,
    pluginId: params.pluginId,
  }).map(({ hook, frontmatter }) => {
    return {
      hook: {
        ...hook,
        source: params.source,
        pluginId: params.pluginId,
      },
      frontmatter,
      metadata: resolveOpenClawMetadata(frontmatter),
      invocation: resolveHookInvocationPolicy(frontmatter),
    };
  });
}
function discoverWorkspaceHookEntries(workspaceDir, opts) {
  const managedHooksDir = opts?.managedHooksDir ?? path.join(CONFIG_DIR, "hooks");
  const workspaceHooksDir = path.join(workspaceDir, "hooks");
  const bundledHooksDir = opts?.bundledHooksDir ?? resolveBundledHooksDir();
  const extraDirs = (opts?.config?.hooks?.internal?.load?.extraDirs ?? [])
    .map((d) => (typeof d === "string" ? d.trim() : ""))
    .filter(Boolean);
  const pluginHookDirs = resolvePluginHookDirs({
    workspaceDir,
    config: opts?.config,
  });
  const bundledHooks = bundledHooksDir
    ? loadHookEntriesFromDir({
        dir: bundledHooksDir,
        source: "openclaw-bundled",
      })
    : [];
  const extraHooks = extraDirs.flatMap((dir) => {
    return loadHookEntriesFromDir({
      dir: resolveUserPath(dir),
      source: "openclaw-managed",
    });
  });
  const pluginHooks = pluginHookDirs.flatMap(({ dir, pluginId }) =>
    loadHookEntriesFromDir({
      dir,
      source: "openclaw-plugin",
      pluginId,
    }),
  );
  const managedHooks = loadHookEntriesFromDir({
    dir: managedHooksDir,
    source: "openclaw-managed",
  });
  const workspaceHooks = loadHookEntriesFromDir({
    dir: workspaceHooksDir,
    source: "openclaw-workspace",
  });
  return [...extraHooks, ...bundledHooks, ...pluginHooks, ...managedHooks, ...workspaceHooks];
}
function loadWorkspaceHookEntries(workspaceDir, opts) {
  return resolveHookEntries(opts?.entries ?? discoverWorkspaceHookEntries(workspaceDir, opts), {
    onCollisionIgnored: ({ name, kept, ignored }) => {
      log.warn(
        `Ignoring ${ignored.hook.source} hook "${name}" because it cannot override ${kept.hook.source} hook code`,
      );
    },
  });
}
function readBoundaryFileUtf8(params) {
  return withOpenedBoundaryFileSync(params, (opened) => {
    try {
      return fs.readFileSync(opened.fd, "utf-8");
    } catch {
      return null;
    }
  });
}
function withOpenedBoundaryFileSync(params, read) {
  const opened = openBoundaryFileSync({
    absolutePath: params.absolutePath,
    rootPath: params.rootPath,
    boundaryLabel: params.boundaryLabel,
  });
  if (!opened.ok) return null;
  try {
    return read({
      fd: opened.fd,
      path: opened.path,
    });
  } finally {
    fs.closeSync(opened.fd);
  }
}
function resolveBoundaryFilePath(params) {
  return withOpenedBoundaryFileSync(params, (opened) => opened.path);
}
//#endregion
export {
  resolveHookEnableState as a,
  resolveHookConfig as i,
  isConfigPathTruthy as n,
  resolveHookEntries as o,
  shouldIncludeHook as r,
  loadWorkspaceHookEntries as t,
};
