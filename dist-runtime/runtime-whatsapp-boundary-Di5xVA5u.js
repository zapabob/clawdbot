import fs from "node:fs";
import fs$1 from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { d as resolveAgentWorkspaceDir } from "./agent-scope-BIySJgkJ.js";
import { r as formatErrorMessage } from "./errors-CHvVoeNX.js";
import {
  n as withStrictGuardedFetchMode,
  t as fetchWithSsrFGuard,
} from "./fetch-guard-Bwkm96YC.js";
import { c as readLocalFileSafely, t as SafeOpenError } from "./fs-safe-D6gPP2TP.js";
import {
  T as resolvePreferredOpenClawTmpDir,
  a as logVerbose,
  c as shouldLogVerbose,
} from "./globals-BKVgh_pY.js";
import {
  a as hasAlphaChannel,
  o as optimizeImageToPng,
  r as convertHeicToJpeg,
  s as resizeToJpeg,
} from "./image-ops-BehpV8Fl.js";
import { s as loadConfig } from "./io-BeL7sW7Y.js";
import {
  r as safeFileURLToPath,
  t as assertNoWindowsNetworkPath,
} from "./local-file-access-DIuv3D_I.js";
import { n as loadPluginManifestRegistry } from "./manifest-registry-CMy5XLiN.js";
import {
  n as extensionForMime,
  s as kindFromMime,
  t as detectMime,
  u as maxBytesForKind,
} from "./mime-lb_Ykmqj.js";
import { n as resolveOpenClawPackageRootSync } from "./openclaw-root-CclKHnQj.js";
import { _ as resolveStateDir } from "./paths-Chd_ukvM.js";
import { n as redactSensitiveText } from "./redact-CPjO5IzK.js";
import { y as resolveUserPath } from "./utils-DGUUVa38.js";
//#region src/plugins/sdk-alias.ts
function resolveLoaderModulePath(params = {}) {
  return params.modulePath ?? fileURLToPath(params.moduleUrl ?? import.meta.url);
}
function readPluginSdkPackageJson(packageRoot) {
  try {
    const pkgRaw = fs.readFileSync(path.join(packageRoot, "package.json"), "utf-8");
    return JSON.parse(pkgRaw);
  } catch {
    return null;
  }
}
function listPluginSdkSubpathsFromPackageJson(pkg) {
  return Object.keys(pkg.exports ?? {})
    .filter((key) => key.startsWith("./plugin-sdk/"))
    .map((key) => key.slice(13))
    .filter((subpath) => Boolean(subpath) && !subpath.includes("/"))
    .toSorted();
}
function hasTrustedOpenClawRootIndicator(params) {
  const packageExports = params.packageJson.exports ?? {};
  if (!Object.prototype.hasOwnProperty.call(packageExports, "./plugin-sdk")) return false;
  const hasCliEntryExport = Object.prototype.hasOwnProperty.call(packageExports, "./cli-entry");
  const hasOpenClawBin =
    (typeof params.packageJson.bin === "string" &&
      params.packageJson.bin.toLowerCase().includes("openclaw")) ||
    (typeof params.packageJson.bin === "object" &&
      params.packageJson.bin !== null &&
      typeof params.packageJson.bin.openclaw === "string");
  const hasOpenClawEntrypoint = fs.existsSync(path.join(params.packageRoot, "openclaw.mjs"));
  return hasCliEntryExport || hasOpenClawBin || hasOpenClawEntrypoint;
}
function readPluginSdkSubpathsFromPackageRoot(packageRoot) {
  const pkg = readPluginSdkPackageJson(packageRoot);
  if (!pkg) return null;
  if (
    !hasTrustedOpenClawRootIndicator({
      packageRoot,
      packageJson: pkg,
    })
  )
    return null;
  const subpaths = listPluginSdkSubpathsFromPackageJson(pkg);
  return subpaths.length > 0 ? subpaths : null;
}
function findNearestPluginSdkPackageRoot(startDir, maxDepth = 12) {
  let cursor = path.resolve(startDir);
  for (let i = 0; i < maxDepth; i += 1) {
    if (readPluginSdkSubpathsFromPackageRoot(cursor)) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return null;
}
function resolveLoaderPackageRoot(params) {
  const cwd = params.cwd ?? path.dirname(params.modulePath);
  const fromModulePath = resolveOpenClawPackageRootSync({ cwd });
  if (fromModulePath) return fromModulePath;
  const argv1 = params.argv1 ?? process.argv[1];
  const moduleUrl = params.moduleUrl ?? (params.modulePath ? void 0 : import.meta.url);
  return resolveOpenClawPackageRootSync({
    cwd,
    ...(argv1 ? { argv1 } : {}),
    ...(moduleUrl ? { moduleUrl } : {}),
  });
}
function resolveLoaderPluginSdkPackageRoot(params) {
  const cwd = params.cwd ?? path.dirname(params.modulePath);
  const fromCwd = resolveOpenClawPackageRootSync({ cwd });
  const fromExplicitHints =
    params.argv1 || params.moduleUrl
      ? resolveOpenClawPackageRootSync({
          cwd,
          ...(params.argv1 ? { argv1: params.argv1 } : {}),
          ...(params.moduleUrl ? { moduleUrl: params.moduleUrl } : {}),
        })
      : null;
  return (
    fromCwd ??
    fromExplicitHints ??
    findNearestPluginSdkPackageRoot(path.dirname(params.modulePath)) ??
    (params.cwd ? findNearestPluginSdkPackageRoot(params.cwd) : null) ??
    findNearestPluginSdkPackageRoot(process.cwd())
  );
}
function resolvePluginSdkAliasCandidateOrder(params) {
  return params.modulePath.replace(/\\/g, "/").includes("/dist/") || params.isProduction
    ? ["dist", "src"]
    : ["src", "dist"];
}
function listPluginSdkAliasCandidates(params) {
  const orderedKinds = resolvePluginSdkAliasCandidateOrder({
    modulePath: params.modulePath,
    isProduction: true,
  });
  const packageRoot = resolveLoaderPluginSdkPackageRoot(params);
  if (packageRoot) {
    const candidateMap = {
      src: path.join(packageRoot, "src", "plugin-sdk", params.srcFile),
      dist: path.join(packageRoot, "dist", "plugin-sdk", params.distFile),
    };
    return orderedKinds.map((kind) => candidateMap[kind]);
  }
  let cursor = path.dirname(params.modulePath);
  const candidates = [];
  for (let i = 0; i < 6; i += 1) {
    const candidateMap = {
      src: path.join(cursor, "src", "plugin-sdk", params.srcFile),
      dist: path.join(cursor, "dist", "plugin-sdk", params.distFile),
    };
    for (const kind of orderedKinds) candidates.push(candidateMap[kind]);
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return candidates;
}
function resolvePluginSdkAliasFile(params) {
  try {
    const modulePath = resolveLoaderModulePath(params);
    for (const candidate of listPluginSdkAliasCandidates({
      srcFile: params.srcFile,
      distFile: params.distFile,
      modulePath,
      argv1: params.argv1,
      cwd: params.cwd,
      moduleUrl: params.moduleUrl,
    }))
      if (fs.existsSync(candidate)) return candidate;
  } catch {}
  return null;
}
const cachedPluginSdkExportedSubpaths = /* @__PURE__ */ new Map();
const cachedPluginSdkScopedAliasMaps = /* @__PURE__ */ new Map();
function listPluginSdkExportedSubpaths(params = {}) {
  const packageRoot = resolveLoaderPluginSdkPackageRoot({
    modulePath: params.modulePath ?? fileURLToPath(import.meta.url),
  });
  if (!packageRoot) return [];
  const cached = cachedPluginSdkExportedSubpaths.get(packageRoot);
  if (cached) return cached;
  const subpaths = readPluginSdkSubpathsFromPackageRoot(packageRoot) ?? [];
  cachedPluginSdkExportedSubpaths.set(packageRoot, subpaths);
  return subpaths;
}
function resolvePluginSdkScopedAliasMap(params = {}) {
  const modulePath = params.modulePath ?? fileURLToPath(import.meta.url);
  const packageRoot = resolveLoaderPluginSdkPackageRoot({ modulePath });
  if (!packageRoot) return {};
  const orderedKinds = resolvePluginSdkAliasCandidateOrder({
    modulePath,
    isProduction: true,
  });
  const cacheKey = `${packageRoot}::${orderedKinds.join(",")}`;
  const cached = cachedPluginSdkScopedAliasMaps.get(cacheKey);
  if (cached) return cached;
  const aliasMap = {};
  for (const subpath of listPluginSdkExportedSubpaths({ modulePath })) {
    const candidateMap = {
      src: path.join(packageRoot, "src", "plugin-sdk", `${subpath}.ts`),
      dist: path.join(packageRoot, "dist", "plugin-sdk", `${subpath}.js`),
    };
    for (const kind of orderedKinds) {
      const candidate = candidateMap[kind];
      if (fs.existsSync(candidate)) {
        aliasMap[`openclaw/plugin-sdk/${subpath}`] = candidate;
        break;
      }
    }
  }
  cachedPluginSdkScopedAliasMaps.set(cacheKey, aliasMap);
  return aliasMap;
}
function resolveExtensionApiAlias(params = {}) {
  try {
    const modulePath = resolveLoaderModulePath(params);
    const packageRoot = resolveLoaderPackageRoot({
      ...params,
      modulePath,
    });
    if (!packageRoot) return null;
    const orderedKinds = resolvePluginSdkAliasCandidateOrder({
      modulePath,
      isProduction: true,
    });
    const candidateMap = {
      src: path.join(packageRoot, "src", "extensionAPI.ts"),
      dist: path.join(packageRoot, "dist", "extensionAPI.js"),
    };
    for (const kind of orderedKinds) {
      const candidate = candidateMap[kind];
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {}
  return null;
}
function buildPluginLoaderAliasMap(modulePath) {
  const pluginSdkAlias = resolvePluginSdkAliasFile({
    srcFile: "root-alias.cjs",
    distFile: "root-alias.cjs",
    modulePath,
  });
  const extensionApiAlias = resolveExtensionApiAlias({ modulePath });
  return {
    ...(extensionApiAlias ? { "openclaw/extension-api": extensionApiAlias } : {}),
    ...(pluginSdkAlias ? { "openclaw/plugin-sdk": pluginSdkAlias } : {}),
    ...resolvePluginSdkScopedAliasMap({ modulePath }),
  };
}
function resolvePluginRuntimeModulePath(params = {}) {
  try {
    const modulePath = resolveLoaderModulePath(params);
    const orderedKinds = resolvePluginSdkAliasCandidateOrder({
      modulePath,
      isProduction: true,
    });
    const packageRoot = resolveLoaderPackageRoot({
      ...params,
      modulePath,
    });
    const candidates = packageRoot
      ? orderedKinds.map((kind) =>
          kind === "src"
            ? path.join(packageRoot, "src", "plugins", "runtime", "index.ts")
            : path.join(packageRoot, "dist", "plugins", "runtime", "index.js"),
        )
      : [
          path.join(path.dirname(modulePath), "runtime", "index.ts"),
          path.join(path.dirname(modulePath), "runtime", "index.js"),
        ];
    for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  } catch {}
  return null;
}
function buildPluginLoaderJitiOptions(aliasMap) {
  return {
    interopDefault: true,
    tryNative: true,
    extensions: [".ts", ".tsx", ".mts", ".cts", ".mtsx", ".ctsx", ".js", ".mjs", ".cjs", ".json"],
    ...(Object.keys(aliasMap).length > 0 ? { alias: aliasMap } : {}),
  };
}
function shouldPreferNativeJiti(modulePath) {
  switch (path.extname(modulePath).toLowerCase()) {
    case ".js":
    case ".mjs":
    case ".cjs":
    case ".json":
      return true;
    default:
      return false;
  }
}
//#endregion
//#region src/media/read-response-with-limit.ts
async function readChunkWithIdleTimeout(reader, chunkTimeoutMs) {
  let timeoutId;
  let timedOut = false;
  return await new Promise((resolve, reject) => {
    const clear = () => {
      if (timeoutId !== void 0) {
        clearTimeout(timeoutId);
        timeoutId = void 0;
      }
    };
    timeoutId = setTimeout(() => {
      timedOut = true;
      clear();
      reader.cancel().catch(() => void 0);
      reject(
        /* @__PURE__ */ new Error(
          `Media download stalled: no data received for ${chunkTimeoutMs}ms`,
        ),
      );
    }, chunkTimeoutMs);
    reader.read().then(
      (result) => {
        clear();
        if (!timedOut) resolve(result);
      },
      (err) => {
        clear();
        if (!timedOut) reject(err);
      },
    );
  });
}
async function readResponsePrefix(res, maxBytes, opts) {
  const chunkTimeoutMs = opts?.chunkTimeoutMs;
  const body = res.body;
  if (!body || typeof body.getReader !== "function") {
    const fallback = Buffer.from(await res.arrayBuffer());
    if (fallback.length > maxBytes)
      return {
        buffer: fallback.subarray(0, maxBytes),
        size: fallback.length,
        truncated: true,
      };
    return {
      buffer: fallback,
      size: fallback.length,
      truncated: false,
    };
  }
  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  let size = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = chunkTimeoutMs
        ? await readChunkWithIdleTimeout(reader, chunkTimeoutMs)
        : await reader.read();
      if (done) {
        size = total;
        break;
      }
      if (!value?.length) continue;
      const nextTotal = total + value.length;
      if (nextTotal > maxBytes) {
        const remaining = maxBytes - total;
        if (remaining > 0) {
          chunks.push(value.subarray(0, remaining));
          total += remaining;
        }
        size = nextTotal;
        truncated = true;
        try {
          await reader.cancel();
        } catch {}
        break;
      }
      chunks.push(value);
      total = nextTotal;
      size = total;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
  return {
    buffer: Buffer.concat(
      chunks.map((chunk) => Buffer.from(chunk)),
      total,
    ),
    size,
    truncated,
  };
}
async function readResponseWithLimit(res, maxBytes, opts) {
  const onOverflow =
    opts?.onOverflow ??
    ((params) =>
      /* @__PURE__ */ new Error(
        `Content too large: ${params.size} bytes (limit: ${params.maxBytes} bytes)`,
      ));
  const prefix = await readResponsePrefix(res, maxBytes, { chunkTimeoutMs: opts?.chunkTimeoutMs });
  if (prefix.truncated)
    throw onOverflow({
      size: prefix.size,
      maxBytes,
      res,
    });
  return prefix.buffer;
}
async function readResponseTextSnippet(res, opts) {
  const maxBytes = opts?.maxBytes ?? 8 * 1024;
  const maxChars = opts?.maxChars ?? 200;
  const prefix = await readResponsePrefix(res, maxBytes, { chunkTimeoutMs: opts?.chunkTimeoutMs });
  if (prefix.buffer.length === 0) return;
  const text = new TextDecoder().decode(prefix.buffer);
  if (!text) return;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) return;
  if (collapsed.length > maxChars) return `${collapsed.slice(0, maxChars)}…`;
  return prefix.truncated ? `${collapsed}…` : collapsed;
}
//#endregion
//#region src/media/fetch.ts
var MediaFetchError = class extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.code = code;
    this.name = "MediaFetchError";
  }
};
function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, "");
}
function parseContentDispositionFileName(header) {
  if (!header) return;
  const starMatch = /filename\*\s*=\s*([^;]+)/i.exec(header);
  if (starMatch?.[1]) {
    const cleaned = stripQuotes(starMatch[1].trim());
    const encoded = cleaned.split("''").slice(1).join("''") || cleaned;
    try {
      return path.basename(decodeURIComponent(encoded));
    } catch {
      return path.basename(encoded);
    }
  }
  const match = /filename\s*=\s*([^;]+)/i.exec(header);
  if (match?.[1]) return path.basename(stripQuotes(match[1].trim()));
}
async function readErrorBodySnippet(res, opts) {
  try {
    return await readResponseTextSnippet(res, {
      maxBytes: 8 * 1024,
      maxChars: opts?.maxChars,
      chunkTimeoutMs: opts?.chunkTimeoutMs,
    });
  } catch {
    return;
  }
}
function redactMediaUrl(url) {
  return redactSensitiveText(url);
}
async function fetchRemoteMedia(options) {
  const {
    url,
    fetchImpl,
    requestInit,
    filePathHint,
    maxBytes,
    maxRedirects,
    readIdleTimeoutMs,
    ssrfPolicy,
    lookupFn,
    dispatcherAttempts,
    shouldRetryFetchError,
  } = options;
  const sourceUrl = redactMediaUrl(url);
  let res;
  let finalUrl = url;
  let release = null;
  const attempts =
    dispatcherAttempts && dispatcherAttempts.length > 0
      ? dispatcherAttempts
      : [
          {
            dispatcherPolicy: void 0,
            lookupFn,
          },
        ];
  const runGuardedFetch = async (attempt) =>
    await fetchWithSsrFGuard(
      withStrictGuardedFetchMode({
        url,
        fetchImpl,
        init: requestInit,
        maxRedirects,
        policy: ssrfPolicy,
        lookupFn: attempt.lookupFn ?? lookupFn,
        dispatcherPolicy: attempt.dispatcherPolicy,
      }),
    );
  try {
    let result;
    const attemptErrors = [];
    for (let i = 0; i < attempts.length; i += 1)
      try {
        result = await runGuardedFetch(attempts[i]);
        break;
      } catch (err) {
        if (
          typeof shouldRetryFetchError !== "function" ||
          !shouldRetryFetchError(err) ||
          i === attempts.length - 1
        ) {
          if (attemptErrors.length > 0) {
            const combined = new Error(
              `Primary fetch failed and fallback fetch also failed for ${sourceUrl}`,
              { cause: err },
            );
            combined.primaryError = attemptErrors[0];
            combined.attemptErrors = [...attemptErrors, err];
            throw combined;
          }
          throw err;
        }
        attemptErrors.push(err);
      }
    res = result.response;
    finalUrl = result.finalUrl;
    release = result.release;
  } catch (err) {
    throw new MediaFetchError(
      "fetch_failed",
      `Failed to fetch media from ${sourceUrl}: ${formatErrorMessage(err)}`,
      { cause: err },
    );
  }
  try {
    if (!res.ok) {
      const statusText = res.statusText ? ` ${res.statusText}` : "";
      const redirected = finalUrl !== url ? ` (redirected to ${redactMediaUrl(finalUrl)})` : "";
      let detail = `HTTP ${res.status}${statusText}`;
      if (!res.body) detail = `HTTP ${res.status}${statusText}; empty response body`;
      else {
        const snippet = await readErrorBodySnippet(res, { chunkTimeoutMs: readIdleTimeoutMs });
        if (snippet) detail += `; body: ${snippet}`;
      }
      throw new MediaFetchError(
        "http_error",
        `Failed to fetch media from ${sourceUrl}${redirected}: ${redactSensitiveText(detail)}`,
      );
    }
    const contentLength = res.headers.get("content-length");
    if (maxBytes && contentLength) {
      const length = Number(contentLength);
      if (Number.isFinite(length) && length > maxBytes)
        throw new MediaFetchError(
          "max_bytes",
          `Failed to fetch media from ${sourceUrl}: content length ${length} exceeds maxBytes ${maxBytes}`,
        );
    }
    let buffer;
    try {
      buffer = maxBytes
        ? await readResponseWithLimit(res, maxBytes, {
            onOverflow: ({ maxBytes, res }) =>
              new MediaFetchError(
                "max_bytes",
                `Failed to fetch media from ${redactMediaUrl(res.url || url)}: payload exceeds maxBytes ${maxBytes}`,
              ),
            chunkTimeoutMs: readIdleTimeoutMs,
          })
        : Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (err instanceof MediaFetchError) throw err;
      throw new MediaFetchError(
        "fetch_failed",
        `Failed to fetch media from ${redactMediaUrl(res.url || url)}: ${formatErrorMessage(err)}`,
        { cause: err },
      );
    }
    let fileNameFromUrl;
    try {
      const parsed = new URL(finalUrl);
      fileNameFromUrl = path.basename(parsed.pathname) || void 0;
    } catch {}
    const headerFileName = parseContentDispositionFileName(res.headers.get("content-disposition"));
    let fileName =
      headerFileName || fileNameFromUrl || (filePathHint ? path.basename(filePathHint) : void 0);
    const filePathForMime =
      headerFileName && path.extname(headerFileName) ? headerFileName : (filePathHint ?? finalUrl);
    const contentType = await detectMime({
      buffer,
      headerMime: res.headers.get("content-type"),
      filePath: filePathForMime,
    });
    if (fileName && !path.extname(fileName) && contentType) {
      const ext = extensionForMime(contentType);
      if (ext) fileName = `${fileName}${ext}`;
    }
    return {
      buffer,
      contentType: contentType ?? void 0,
      fileName,
    };
  } finally {
    if (release) await release();
  }
}
//#endregion
//#region src/media/local-roots.ts
let cachedPreferredTmpDir;
function resolveCachedPreferredTmpDir() {
  if (!cachedPreferredTmpDir) cachedPreferredTmpDir = resolvePreferredOpenClawTmpDir();
  return cachedPreferredTmpDir;
}
function buildMediaLocalRoots(stateDir, options = {}) {
  const resolvedStateDir = path.resolve(stateDir);
  return [
    options.preferredTmpDir ?? resolveCachedPreferredTmpDir(),
    path.join(resolvedStateDir, "media"),
    path.join(resolvedStateDir, "workspace"),
    path.join(resolvedStateDir, "sandboxes"),
  ];
}
function getDefaultMediaLocalRoots() {
  return buildMediaLocalRoots(resolveStateDir());
}
function getAgentScopedMediaLocalRoots(cfg, agentId) {
  const roots = buildMediaLocalRoots(resolveStateDir());
  if (!agentId?.trim()) return roots;
  const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
  if (!workspaceDir) return roots;
  const normalizedWorkspaceDir = path.resolve(workspaceDir);
  if (!roots.includes(normalizedWorkspaceDir)) roots.push(normalizedWorkspaceDir);
  return roots;
}
//#endregion
//#region src/media/local-media-access.ts
var LocalMediaAccessError = class extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.code = code;
    this.name = "LocalMediaAccessError";
  }
};
function getDefaultLocalRoots() {
  return getDefaultMediaLocalRoots();
}
async function assertLocalMediaAllowed(mediaPath, localRoots) {
  if (localRoots === "any") return;
  try {
    assertNoWindowsNetworkPath(mediaPath, "Local media path");
  } catch (err) {
    throw new LocalMediaAccessError("network-path-not-allowed", err.message, { cause: err });
  }
  const roots = localRoots ?? getDefaultLocalRoots();
  let resolved;
  try {
    resolved = await fs$1.realpath(mediaPath);
  } catch {
    resolved = path.resolve(mediaPath);
  }
  if (localRoots === void 0) {
    const workspaceRoot = roots.find((root) => path.basename(root) === "workspace");
    if (workspaceRoot) {
      const stateDir = path.dirname(workspaceRoot);
      const rel = path.relative(stateDir, resolved);
      if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
        if ((rel.split(path.sep)[0] ?? "").startsWith("workspace-"))
          throw new LocalMediaAccessError(
            "path-not-allowed",
            `Local media path is not under an allowed directory: ${mediaPath}`,
          );
      }
    }
  }
  for (const root of roots) {
    let resolvedRoot;
    try {
      resolvedRoot = await fs$1.realpath(root);
    } catch {
      resolvedRoot = path.resolve(root);
    }
    if (resolvedRoot === path.parse(resolvedRoot).root)
      throw new LocalMediaAccessError(
        "invalid-root",
        `Invalid localRoots entry (refuses filesystem root): ${root}. Pass a narrower directory.`,
      );
    if (resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep)) return;
  }
  throw new LocalMediaAccessError(
    "path-not-allowed",
    `Local media path is not under an allowed directory: ${mediaPath}`,
  );
}
//#endregion
//#region src/media/web-media.ts
function resolveWebMediaOptions(params) {
  if (typeof params.maxBytesOrOptions === "number" || params.maxBytesOrOptions === void 0)
    return {
      maxBytes: params.maxBytesOrOptions,
      optimizeImages: params.optimizeImages,
      ssrfPolicy: params.options?.ssrfPolicy,
      localRoots: params.options?.localRoots,
    };
  return {
    ...params.maxBytesOrOptions,
    optimizeImages: params.optimizeImages
      ? (params.maxBytesOrOptions.optimizeImages ?? true)
      : false,
  };
}
const HEIC_MIME_RE = /^image\/hei[cf]$/i;
const HEIC_EXT_RE = /\.(heic|heif)$/i;
const MB = 1024 * 1024;
function formatMb(bytes, digits = 2) {
  return (bytes / MB).toFixed(digits);
}
function formatCapLimit(label, cap, size) {
  return `${label} exceeds ${formatMb(cap, 0)}MB limit (got ${formatMb(size)}MB)`;
}
function formatCapReduce(label, cap, size) {
  return `${label} could not be reduced below ${formatMb(cap, 0)}MB (got ${formatMb(size)}MB)`;
}
function isHeicSource(opts) {
  if (opts.contentType && HEIC_MIME_RE.test(opts.contentType.trim())) return true;
  if (opts.fileName && HEIC_EXT_RE.test(opts.fileName.trim())) return true;
  return false;
}
function toJpegFileName(fileName) {
  if (!fileName) return;
  const trimmed = fileName.trim();
  if (!trimmed) return fileName;
  const parsed = path.parse(trimmed);
  if (!parsed.ext || HEIC_EXT_RE.test(parsed.ext))
    return path.format({
      dir: parsed.dir,
      name: parsed.name || trimmed,
      ext: ".jpg",
    });
  return path.format({
    dir: parsed.dir,
    name: parsed.name,
    ext: ".jpg",
  });
}
function logOptimizedImage(params) {
  if (!shouldLogVerbose()) return;
  if (params.optimized.optimizedSize >= params.originalSize) return;
  if (params.optimized.format === "png") {
    logVerbose(
      `Optimized PNG (preserving alpha) from ${formatMb(params.originalSize)}MB to ${formatMb(params.optimized.optimizedSize)}MB (side<=${params.optimized.resizeSide}px)`,
    );
    return;
  }
  logVerbose(
    `Optimized media from ${formatMb(params.originalSize)}MB to ${formatMb(params.optimized.optimizedSize)}MB (side<=${params.optimized.resizeSide}px, q=${params.optimized.quality})`,
  );
}
async function optimizeImageWithFallback(params) {
  const { buffer, cap, meta } = params;
  if (
    (meta?.contentType === "image/png" || meta?.fileName?.toLowerCase().endsWith(".png")) &&
    (await hasAlphaChannel(buffer))
  ) {
    const optimized = await optimizeImageToPng(buffer, cap);
    if (optimized.buffer.length <= cap)
      return {
        ...optimized,
        format: "png",
      };
    if (shouldLogVerbose())
      logVerbose(
        `PNG with alpha still exceeds ${formatMb(cap, 0)}MB after optimization; falling back to JPEG`,
      );
  }
  return {
    ...(await optimizeImageToJpeg(buffer, cap, meta)),
    format: "jpeg",
  };
}
async function loadWebMediaInternal(mediaUrl, options = {}) {
  const {
    maxBytes,
    optimizeImages = true,
    ssrfPolicy,
    localRoots,
    sandboxValidated = false,
    readFile: readFileOverride,
  } = options;
  mediaUrl = mediaUrl.replace(/^\s*MEDIA\s*:\s*/i, "");
  if (mediaUrl.startsWith("file://"))
    try {
      mediaUrl = safeFileURLToPath(mediaUrl);
    } catch (err) {
      throw new LocalMediaAccessError("invalid-file-url", err.message, { cause: err });
    }
  const optimizeAndClampImage = async (buffer, cap, meta) => {
    const originalSize = buffer.length;
    const optimized = await optimizeImageWithFallback({
      buffer,
      cap,
      meta,
    });
    logOptimizedImage({
      originalSize,
      optimized,
    });
    if (optimized.buffer.length > cap)
      throw new Error(formatCapReduce("Media", cap, optimized.buffer.length));
    const contentType = optimized.format === "png" ? "image/png" : "image/jpeg";
    const fileName =
      optimized.format === "jpeg" && meta && isHeicSource(meta)
        ? toJpegFileName(meta.fileName)
        : meta?.fileName;
    return {
      buffer: optimized.buffer,
      contentType,
      kind: "image",
      fileName,
    };
  };
  const clampAndFinalize = async (params) => {
    const cap = maxBytes !== void 0 ? maxBytes : maxBytesForKind(params.kind ?? "document");
    if (params.kind === "image") {
      const isGif = params.contentType === "image/gif";
      if (isGif || !optimizeImages) {
        if (params.buffer.length > cap)
          throw new Error(formatCapLimit(isGif ? "GIF" : "Media", cap, params.buffer.length));
        return {
          buffer: params.buffer,
          contentType: params.contentType,
          kind: params.kind,
          fileName: params.fileName,
        };
      }
      return {
        ...(await optimizeAndClampImage(params.buffer, cap, {
          contentType: params.contentType,
          fileName: params.fileName,
        })),
      };
    }
    if (params.buffer.length > cap)
      throw new Error(formatCapLimit("Media", cap, params.buffer.length));
    return {
      buffer: params.buffer,
      contentType: params.contentType ?? void 0,
      kind: params.kind,
      fileName: params.fileName,
    };
  };
  if (/^https?:\/\//i.test(mediaUrl)) {
    const defaultFetchCap = maxBytesForKind("document");
    const { buffer, contentType, fileName } = await fetchRemoteMedia({
      url: mediaUrl,
      maxBytes:
        maxBytes === void 0
          ? defaultFetchCap
          : optimizeImages
            ? Math.max(maxBytes, defaultFetchCap)
            : maxBytes,
      ssrfPolicy,
    });
    return await clampAndFinalize({
      buffer,
      contentType,
      kind: kindFromMime(contentType),
      fileName,
    });
  }
  if (mediaUrl.startsWith("~")) mediaUrl = resolveUserPath(mediaUrl);
  try {
    assertNoWindowsNetworkPath(mediaUrl, "Local media path");
  } catch (err) {
    throw new LocalMediaAccessError("network-path-not-allowed", err.message, { cause: err });
  }
  if ((sandboxValidated || localRoots === "any") && !readFileOverride)
    throw new LocalMediaAccessError(
      "unsafe-bypass",
      "Refusing localRoots bypass without readFile override. Use sandboxValidated with readFile, or pass explicit localRoots.",
    );
  if (!(sandboxValidated || localRoots === "any"))
    await assertLocalMediaAllowed(mediaUrl, localRoots);
  let data;
  if (readFileOverride) data = await readFileOverride(mediaUrl);
  else
    try {
      data = (await readLocalFileSafely({ filePath: mediaUrl })).buffer;
    } catch (err) {
      if (err instanceof SafeOpenError) {
        if (err.code === "not-found")
          throw new LocalMediaAccessError("not-found", `Local media file not found: ${mediaUrl}`, {
            cause: err,
          });
        if (err.code === "not-file")
          throw new LocalMediaAccessError(
            "not-file",
            `Local media path is not a file: ${mediaUrl}`,
            { cause: err },
          );
        throw new LocalMediaAccessError(
          "invalid-path",
          `Local media path is not safe to read: ${mediaUrl}`,
          { cause: err },
        );
      }
      throw err;
    }
  const mime = await detectMime({
    buffer: data,
    filePath: mediaUrl,
  });
  const kind = kindFromMime(mime);
  let fileName = path.basename(mediaUrl) || void 0;
  if (fileName && !path.extname(fileName) && mime) {
    const ext = extensionForMime(mime);
    if (ext) fileName = `${fileName}${ext}`;
  }
  return await clampAndFinalize({
    buffer: data,
    contentType: mime,
    kind,
    fileName,
  });
}
async function loadWebMedia(mediaUrl, maxBytesOrOptions, options) {
  return await loadWebMediaInternal(
    mediaUrl,
    resolveWebMediaOptions({
      maxBytesOrOptions,
      options,
      optimizeImages: true,
    }),
  );
}
async function loadWebMediaRaw(mediaUrl, maxBytesOrOptions, options) {
  return await loadWebMediaInternal(
    mediaUrl,
    resolveWebMediaOptions({
      maxBytesOrOptions,
      options,
      optimizeImages: false,
    }),
  );
}
async function optimizeImageToJpeg(buffer, maxBytes, opts = {}) {
  let source = buffer;
  if (isHeicSource(opts))
    try {
      source = await convertHeicToJpeg(buffer);
    } catch (err) {
      throw new Error(`HEIC image conversion failed: ${String(err)}`, { cause: err });
    }
  const sides = [2048, 1536, 1280, 1024, 800];
  const qualities = [80, 70, 60, 50, 40];
  let smallest = null;
  for (const side of sides)
    for (const quality of qualities)
      try {
        const out = await resizeToJpeg({
          buffer: source,
          maxSide: side,
          quality,
          withoutEnlargement: true,
        });
        const size = out.length;
        if (!smallest || size < smallest.size)
          smallest = {
            buffer: out,
            size,
            resizeSide: side,
            quality,
          };
        if (size <= maxBytes)
          return {
            buffer: out,
            optimizedSize: size,
            resizeSide: side,
            quality,
          };
      } catch {}
  if (smallest)
    return {
      buffer: smallest.buffer,
      optimizedSize: smallest.size,
      resizeSide: smallest.resizeSide,
      quality: smallest.quality,
    };
  throw new Error("Failed to optimize image");
}
//#endregion
//#region src/plugins/runtime/runtime-whatsapp-boundary.ts
const WHATSAPP_PLUGIN_ID = "whatsapp";
let cachedHeavyModulePath = null;
let cachedHeavyModule = null;
let cachedLightModulePath = null;
let cachedLightModule = null;
const jitiLoaders = /* @__PURE__ */ new Map();
function readConfigSafely() {
  try {
    return loadConfig();
  } catch {
    return {};
  }
}
function resolveWhatsAppPluginRecord() {
  const record = loadPluginManifestRegistry({
    config: readConfigSafely(),
    cache: true,
  }).plugins.find((plugin) => plugin.id === WHATSAPP_PLUGIN_ID);
  if (!record?.source)
    throw new Error(
      `WhatsApp plugin runtime is unavailable: missing plugin '${WHATSAPP_PLUGIN_ID}'`,
    );
  return {
    origin: record.origin,
    rootDir: record.rootDir,
    source: record.source,
  };
}
function resolveWhatsAppRuntimeModulePath(record, entryBaseName) {
  const candidates = [
    path.join(path.dirname(record.source), `${entryBaseName}.js`),
    path.join(path.dirname(record.source), `${entryBaseName}.ts`),
    ...(record.rootDir
      ? [
          path.join(record.rootDir, `${entryBaseName}.js`),
          path.join(record.rootDir, `${entryBaseName}.ts`),
        ]
      : []),
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  throw new Error(
    `WhatsApp plugin runtime is unavailable: missing ${entryBaseName} for plugin '${WHATSAPP_PLUGIN_ID}'`,
  );
}
function getJiti(modulePath) {
  const tryNative = shouldPreferNativeJiti(modulePath);
  const cached = jitiLoaders.get(tryNative);
  if (cached) return cached;
  const pluginSdkAlias = resolvePluginSdkAliasFile({
    srcFile: "root-alias.cjs",
    distFile: "root-alias.cjs",
    modulePath,
  });
  const aliasMap = {
    ...(pluginSdkAlias ? { "openclaw/plugin-sdk": pluginSdkAlias } : {}),
    ...resolvePluginSdkScopedAliasMap({ modulePath }),
  };
  const loader = createJiti(import.meta.url, {
    ...buildPluginLoaderJitiOptions(aliasMap),
    tryNative,
  });
  jitiLoaders.set(tryNative, loader);
  return loader;
}
function loadWithJiti(modulePath) {
  return getJiti(modulePath)(modulePath);
}
function loadWhatsAppLightModule() {
  const modulePath = resolveWhatsAppRuntimeModulePath(
    resolveWhatsAppPluginRecord(),
    "light-runtime-api",
  );
  if (cachedLightModule && cachedLightModulePath === modulePath) return cachedLightModule;
  const loaded = loadWithJiti(modulePath);
  cachedLightModulePath = modulePath;
  cachedLightModule = loaded;
  return loaded;
}
async function loadWhatsAppHeavyModule() {
  const modulePath = resolveWhatsAppRuntimeModulePath(resolveWhatsAppPluginRecord(), "runtime-api");
  if (cachedHeavyModule && cachedHeavyModulePath === modulePath) return cachedHeavyModule;
  const loaded = loadWithJiti(modulePath);
  cachedHeavyModulePath = modulePath;
  cachedHeavyModule = loaded;
  return loaded;
}
function getLightExport(exportName) {
  const value = loadWhatsAppLightModule()[exportName];
  if (value == null)
    throw new Error(`WhatsApp plugin runtime is missing export '${String(exportName)}'`);
  return value;
}
async function getHeavyExport(exportName) {
  const value = (await loadWhatsAppHeavyModule())[exportName];
  if (value == null)
    throw new Error(`WhatsApp plugin runtime is missing export '${String(exportName)}'`);
  return value;
}
function getActiveWebListener(...args) {
  return getLightExport("getActiveWebListener")(...args);
}
function getWebAuthAgeMs(...args) {
  return getLightExport("getWebAuthAgeMs")(...args);
}
function logWebSelfId(...args) {
  return getLightExport("logWebSelfId")(...args);
}
function loginWeb(...args) {
  return loadWhatsAppHeavyModule().then((loaded) => loaded.loginWeb(...args));
}
function logoutWeb(...args) {
  return getLightExport("logoutWeb")(...args);
}
function readWebSelfId(...args) {
  return getLightExport("readWebSelfId")(...args);
}
function webAuthExists(...args) {
  return getLightExport("webAuthExists")(...args);
}
function sendMessageWhatsApp(...args) {
  return loadWhatsAppHeavyModule().then((loaded) => loaded.sendMessageWhatsApp(...args));
}
function sendPollWhatsApp(...args) {
  return loadWhatsAppHeavyModule().then((loaded) => loaded.sendPollWhatsApp(...args));
}
function createRuntimeWhatsAppLoginTool(...args) {
  return getLightExport("createWhatsAppLoginTool")(...args);
}
async function handleWhatsAppAction(...args) {
  return (await getHeavyExport("handleWhatsAppAction"))(...args);
}
function monitorWebChannel(...args) {
  return loadWhatsAppHeavyModule().then((loaded) => loaded.monitorWebChannel(...args));
}
async function startWebLoginWithQr(...args) {
  return (await getHeavyExport("startWebLoginWithQr"))(...args);
}
async function waitForWebLogin(...args) {
  return (await getHeavyExport("waitForWebLogin"))(...args);
}
//#endregion
export {
  buildPluginLoaderAliasMap as C,
  resolvePluginSdkScopedAliasMap as D,
  resolvePluginSdkAliasFile as E,
  shouldPreferNativeJiti as O,
  readResponseWithLimit as S,
  resolvePluginRuntimeModulePath as T,
  getDefaultLocalRoots as _,
  logWebSelfId as a,
  MediaFetchError as b,
  monitorWebChannel as c,
  sendPollWhatsApp as d,
  startWebLoginWithQr as f,
  loadWebMediaRaw as g,
  loadWebMedia as h,
  handleWhatsAppAction as i,
  readWebSelfId as l,
  webAuthExists as m,
  getActiveWebListener as n,
  loginWeb as o,
  waitForWebLogin as p,
  getWebAuthAgeMs as r,
  logoutWeb as s,
  createRuntimeWhatsAppLoginTool as t,
  sendMessageWhatsApp as u,
  getAgentScopedMediaLocalRoots as v,
  buildPluginLoaderJitiOptions as w,
  fetchRemoteMedia as x,
  getDefaultMediaLocalRoots as y,
};
