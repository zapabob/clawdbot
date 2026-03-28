import crypto from "node:crypto";
import fs from "node:fs";
import fs$1 from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import {
  Gb as resolveListedDefaultAccountId,
  Wb as listCombinedAccountIds,
  t as listConfiguredAccountIds,
} from "./account-resolution-YAil9v6G.js";
import { t as createBackupArchive } from "./backup-create-BbqmvNAm.js";
import { i as openBoundaryFileSync } from "./boundary-file-read-DZTg2Wyt.js";
import { Tn as resolveNormalizedAccountEntry } from "./io-BeL7sW7Y.js";
import { t as formatDocsLink } from "./links-CZOLMG0R.js";
import { n as loadPluginManifestRegistry } from "./manifest-registry-CMy5XLiN.js";
import { u as writeJsonFileAtomically } from "./pairing-store-C5UkJF1E.js";
import { S as resolveRequiredHomeDir, _ as resolveStateDir } from "./paths-Chd_ukvM.js";
import { O as shouldPreferNativeJiti } from "./runtime-whatsapp-boundary-Di5xVA5u.js";
import {
  _ as normalizeOptionalAccountId,
  g as normalizeAccountId,
  h as DEFAULT_ACCOUNT_ID,
} from "./session-key-0JD9qg4o.js";
//#region src/infra/plugin-install-path-warnings.ts
function resolvePluginInstallCandidatePaths(install) {
  if (!install || install.source !== "path") return [];
  return [install.sourcePath, install.installPath]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}
async function detectPluginInstallPathIssue(params) {
  const candidatePaths = resolvePluginInstallCandidatePaths(params.install);
  if (candidatePaths.length === 0) return null;
  for (const candidatePath of candidatePaths)
    try {
      await fs$1.access(path.resolve(candidatePath));
      return {
        kind: "custom-path",
        pluginId: params.pluginId,
        path: candidatePath,
      };
    } catch {}
  return {
    kind: "missing-path",
    pluginId: params.pluginId,
    path: candidatePaths[0] ?? "(unknown)",
  };
}
function formatPluginInstallPathIssue(params) {
  const formatCommand = params.formatCommand ?? ((command) => command);
  if (params.issue.kind === "custom-path")
    return [
      `${params.pluginLabel} is installed from a custom path: ${params.issue.path}`,
      `Main updates will not automatically replace that plugin with the repo's default ${params.pluginLabel} package.`,
      `Reinstall with "${formatCommand(params.defaultInstallCommand)}" when you want to return to the standard ${params.pluginLabel} plugin.`,
      `If you are intentionally running from a repo checkout, reinstall that checkout explicitly with "${formatCommand(params.repoInstallCommand)}" after updates.`,
    ];
  return [
    `${params.pluginLabel} is installed from a custom path that no longer exists: ${params.issue.path}`,
    `Reinstall with "${formatCommand(params.defaultInstallCommand)}".`,
    `If you are running from a repo checkout, you can also use "${formatCommand(params.repoInstallCommand)}".`,
  ];
}
//#endregion
//#region extensions/matrix/src/auth-precedence.ts
const MATRIX_DEFAULT_ACCOUNT_AUTH_ONLY_FIELDS = new Set([
  "userId",
  "accessToken",
  "password",
  "deviceId",
]);
function resolveMatrixStringSourceValue(value) {
  return typeof value === "string" ? value : "";
}
function shouldAllowBaseAuthFallback(accountId, field) {
  return (
    normalizeAccountId(accountId) === "default" ||
    !MATRIX_DEFAULT_ACCOUNT_AUTH_ONLY_FIELDS.has(field)
  );
}
function resolveMatrixAccountStringValues(params) {
  const fields = ["homeserver", "userId", "accessToken", "password", "deviceId", "deviceName"];
  const resolved = {};
  for (const field of fields)
    resolved[field] =
      resolveMatrixStringSourceValue(params.account?.[field]) ||
      resolveMatrixStringSourceValue(params.scopedEnv?.[field]) ||
      (shouldAllowBaseAuthFallback(params.accountId, field)
        ? resolveMatrixStringSourceValue(params.channel?.[field]) ||
          resolveMatrixStringSourceValue(params.globalEnv?.[field])
        : "");
  return resolved;
}
//#endregion
//#region extensions/matrix/src/env-vars.ts
const MATRIX_SCOPED_ENV_SUFFIXES = [
  "HOMESERVER",
  "USER_ID",
  "ACCESS_TOKEN",
  "PASSWORD",
  "DEVICE_ID",
  "DEVICE_NAME",
];
const MATRIX_GLOBAL_ENV_KEYS = MATRIX_SCOPED_ENV_SUFFIXES.map((suffix) => `MATRIX_${suffix}`);
const MATRIX_SCOPED_ENV_RE = new RegExp(`^MATRIX_(.+)_(${MATRIX_SCOPED_ENV_SUFFIXES.join("|")})$`);
function resolveMatrixEnvAccountToken(accountId) {
  return Array.from(normalizeAccountId(accountId))
    .map((char) =>
      /[a-z0-9]/.test(char)
        ? char.toUpperCase()
        : `_X${char.codePointAt(0)?.toString(16).toUpperCase() ?? "00"}_`,
    )
    .join("");
}
function getMatrixScopedEnvVarNames(accountId) {
  const token = resolveMatrixEnvAccountToken(accountId);
  return {
    homeserver: `MATRIX_${token}_HOMESERVER`,
    userId: `MATRIX_${token}_USER_ID`,
    accessToken: `MATRIX_${token}_ACCESS_TOKEN`,
    password: `MATRIX_${token}_PASSWORD`,
    deviceId: `MATRIX_${token}_DEVICE_ID`,
    deviceName: `MATRIX_${token}_DEVICE_NAME`,
  };
}
function decodeMatrixEnvAccountToken(token) {
  let decoded = "";
  for (let index = 0; index < token.length; ) {
    const hexEscape = /^_X([0-9A-F]+)_/.exec(token.slice(index));
    if (hexEscape) {
      const hex = hexEscape[1];
      const codePoint = hex ? Number.parseInt(hex, 16) : NaN;
      if (!Number.isFinite(codePoint)) return;
      decoded += String.fromCodePoint(codePoint);
      index += hexEscape[0].length;
      continue;
    }
    const char = token[index];
    if (!char || !/[A-Z0-9]/.test(char)) return;
    decoded += char.toLowerCase();
    index += 1;
  }
  const normalized = normalizeOptionalAccountId(decoded);
  if (!normalized) return;
  return resolveMatrixEnvAccountToken(normalized) === token ? normalized : void 0;
}
function listMatrixEnvAccountIds(env = process.env) {
  const ids = /* @__PURE__ */ new Set();
  for (const key of MATRIX_GLOBAL_ENV_KEYS)
    if (typeof env[key] === "string" && env[key]?.trim()) {
      ids.add(normalizeAccountId("default"));
      break;
    }
  for (const key of Object.keys(env)) {
    const match = MATRIX_SCOPED_ENV_RE.exec(key);
    if (!match) continue;
    const accountId = decodeMatrixEnvAccountToken(match[1]);
    if (accountId) ids.add(accountId);
  }
  return Array.from(ids).toSorted((a, b) => a.localeCompare(b));
}
//#endregion
//#region extensions/matrix/src/account-selection.ts
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function resolveMatrixChannelConfig(cfg) {
  return isRecord(cfg.channels?.matrix) ? cfg.channels.matrix : null;
}
function findMatrixAccountEntry(cfg, accountId) {
  const channel = resolveMatrixChannelConfig(cfg);
  if (!channel) return null;
  const accounts = isRecord(channel.accounts) ? channel.accounts : null;
  if (!accounts) return null;
  const entry = resolveNormalizedAccountEntry(accounts, accountId, normalizeAccountId);
  return isRecord(entry) ? entry : null;
}
function resolveConfiguredMatrixAccountIds(cfg, env = process.env) {
  const channel = resolveMatrixChannelConfig(cfg);
  return listCombinedAccountIds({
    configuredAccountIds: listConfiguredAccountIds({
      accounts: channel && isRecord(channel.accounts) ? channel.accounts : void 0,
      normalizeAccountId,
    }),
    additionalAccountIds: listMatrixEnvAccountIds(env),
    fallbackAccountIdWhenEmpty: channel ? DEFAULT_ACCOUNT_ID : void 0,
  });
}
function resolveMatrixDefaultOrOnlyAccountId(cfg, env = process.env) {
  const channel = resolveMatrixChannelConfig(cfg);
  if (!channel) return DEFAULT_ACCOUNT_ID;
  const configuredDefault = normalizeOptionalAccountId(
    typeof channel.defaultAccount === "string" ? channel.defaultAccount : void 0,
  );
  return resolveListedDefaultAccountId({
    accountIds: resolveConfiguredMatrixAccountIds(cfg, env),
    configuredDefaultAccountId: configuredDefault,
    ambiguousFallbackAccountId: DEFAULT_ACCOUNT_ID,
  });
}
function requiresExplicitMatrixDefaultAccount(cfg, env = process.env) {
  const channel = resolveMatrixChannelConfig(cfg);
  if (!channel) return false;
  const configuredAccountIds = resolveConfiguredMatrixAccountIds(cfg, env);
  if (configuredAccountIds.length <= 1) return false;
  const configuredDefault = normalizeOptionalAccountId(
    typeof channel.defaultAccount === "string" ? channel.defaultAccount : void 0,
  );
  return !(configuredDefault && configuredAccountIds.includes(configuredDefault));
}
//#endregion
//#region extensions/matrix/src/storage-paths.ts
function sanitizeMatrixPathSegment(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "unknown"
  );
}
function resolveMatrixHomeserverKey(homeserver) {
  try {
    const url = new URL(homeserver);
    if (url.host) return sanitizeMatrixPathSegment(url.host);
  } catch {}
  return sanitizeMatrixPathSegment(homeserver);
}
function hashMatrixAccessToken(accessToken) {
  return crypto.createHash("sha256").update(accessToken).digest("hex").slice(0, 16);
}
function resolveMatrixCredentialsFilename(accountId) {
  const normalized = normalizeAccountId(accountId);
  return normalized === "default" ? "credentials.json" : `credentials-${normalized}.json`;
}
function resolveMatrixCredentialsDir(stateDir) {
  return path.join(stateDir, "credentials", "matrix");
}
function resolveMatrixCredentialsPath(params) {
  return path.join(
    resolveMatrixCredentialsDir(params.stateDir),
    resolveMatrixCredentialsFilename(params.accountId),
  );
}
function resolveMatrixLegacyFlatStoreRoot(stateDir) {
  return path.join(stateDir, "matrix");
}
function resolveMatrixLegacyFlatStoragePaths(stateDir) {
  const rootDir = resolveMatrixLegacyFlatStoreRoot(stateDir);
  return {
    rootDir,
    storagePath: path.join(rootDir, "bot-storage.json"),
    cryptoPath: path.join(rootDir, "crypto"),
  };
}
function resolveMatrixAccountStorageRoot(params) {
  const accountKey = sanitizeMatrixPathSegment(params.accountId ?? "default");
  const userKey = sanitizeMatrixPathSegment(params.userId);
  const serverKey = resolveMatrixHomeserverKey(params.homeserver);
  const tokenHash = hashMatrixAccessToken(params.accessToken);
  return {
    rootDir: path.join(
      params.stateDir,
      "matrix",
      "accounts",
      accountKey,
      `${serverKey}__${userKey}`,
      tokenHash,
    ),
    accountKey,
    tokenHash,
  };
}
//#endregion
//#region src/plugin-sdk/optional-channel-setup.ts
function buildOptionalChannelSetupMessage(params) {
  const installTarget = params.npmSpec ?? `the ${params.label} plugin`;
  const message = [`${params.label} setup requires ${installTarget} to be installed.`];
  if (params.docsPath)
    message.push(`Docs: ${formatDocsLink(params.docsPath, params.docsPath.replace(/^\/+/u, ""))}`);
  return message.join(" ");
}
function createOptionalChannelSetupAdapter(params) {
  const message = buildOptionalChannelSetupMessage(params);
  return {
    resolveAccountId: ({ accountId }) => accountId ?? "default",
    applyAccountConfig: () => {
      throw new Error(message);
    },
    validateInput: () => message,
  };
}
function createOptionalChannelSetupWizard(params) {
  const message = buildOptionalChannelSetupMessage(params);
  return {
    channel: params.channel,
    status: {
      configuredLabel: `${params.label} plugin installed`,
      unconfiguredLabel: `install ${params.label} plugin`,
      configuredHint: message,
      unconfiguredHint: message,
      unconfiguredScore: 0,
      resolveConfigured: () => false,
      resolveStatusLines: () => [message],
      resolveSelectionHint: () => message,
    },
    credentials: [],
    finalize: async () => {
      throw new Error(message);
    },
  };
}
//#endregion
//#region src/plugin-sdk/channel-setup.ts
/** Build both optional setup surfaces from one metadata object. */
function createOptionalChannelSetupSurface(params) {
  return {
    setupAdapter: createOptionalChannelSetupAdapter(params),
    setupWizard: createOptionalChannelSetupWizard(params),
  };
}
//#endregion
//#region src/plugin-sdk/matrix.ts
const matrixSetup = createOptionalChannelSetupSurface({
  channel: "matrix",
  label: "Matrix",
  npmSpec: "@openclaw/matrix",
  docsPath: "/channels/matrix",
});
matrixSetup.setupWizard;
matrixSetup.setupAdapter;
//#endregion
//#region src/infra/matrix-migration-config.ts
function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}
function resolveScopedMatrixEnvConfig(accountId, env) {
  const keys = getMatrixScopedEnvVarNames(accountId);
  return {
    homeserver: clean(env[keys.homeserver]),
    userId: clean(env[keys.userId]),
    accessToken: clean(env[keys.accessToken]),
  };
}
function resolveGlobalMatrixEnvConfig(env) {
  return {
    homeserver: clean(env.MATRIX_HOMESERVER),
    userId: clean(env.MATRIX_USER_ID),
    accessToken: clean(env.MATRIX_ACCESS_TOKEN),
  };
}
function resolveMatrixAccountConfigEntry(cfg, accountId) {
  return findMatrixAccountEntry(cfg, accountId);
}
function resolveMatrixFlatStoreSelectionNote(cfg, accountId) {
  if (resolveConfiguredMatrixAccountIds(cfg).length <= 1) return;
  return `Legacy Matrix flat store uses one shared on-disk state, so it will be migrated into account "${accountId}".`;
}
function resolveMatrixMigrationConfigFields(params) {
  const channel = resolveMatrixChannelConfig(params.cfg);
  const account = resolveMatrixAccountConfigEntry(params.cfg, params.accountId);
  const scopedEnv = resolveScopedMatrixEnvConfig(params.accountId, params.env);
  const globalEnv = resolveGlobalMatrixEnvConfig(params.env);
  const resolvedStrings = resolveMatrixAccountStringValues({
    accountId: normalizeAccountId(params.accountId),
    account: {
      homeserver: clean(account?.homeserver),
      userId: clean(account?.userId),
      accessToken: clean(account?.accessToken),
    },
    scopedEnv,
    channel: {
      homeserver: clean(channel?.homeserver),
      userId: clean(channel?.userId),
      accessToken: clean(channel?.accessToken),
    },
    globalEnv,
  });
  return {
    homeserver: resolvedStrings.homeserver,
    userId: resolvedStrings.userId,
    accessToken: resolvedStrings.accessToken,
  };
}
function loadStoredMatrixCredentials(env, accountId) {
  const credentialsPath = resolveMatrixCredentialsPath({
    stateDir: resolveStateDir(env, os.homedir),
    accountId: normalizeAccountId(accountId),
  });
  try {
    if (!fs.existsSync(credentialsPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    if (
      typeof parsed.homeserver !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.accessToken !== "string"
    )
      return null;
    return {
      homeserver: parsed.homeserver,
      userId: parsed.userId,
      accessToken: parsed.accessToken,
      deviceId: typeof parsed.deviceId === "string" ? parsed.deviceId : void 0,
    };
  } catch {
    return null;
  }
}
function credentialsMatchResolvedIdentity(stored, identity) {
  if (!stored || !identity.homeserver) return false;
  if (!identity.userId) {
    if (!identity.accessToken) return false;
    return stored.homeserver === identity.homeserver && stored.accessToken === identity.accessToken;
  }
  return stored.homeserver === identity.homeserver && stored.userId === identity.userId;
}
function resolveMatrixMigrationAccountTarget(params) {
  const stored = loadStoredMatrixCredentials(params.env, params.accountId);
  const resolved = resolveMatrixMigrationConfigFields(params);
  const matchingStored = credentialsMatchResolvedIdentity(stored, {
    homeserver: resolved.homeserver,
    userId: resolved.userId,
    accessToken: resolved.accessToken,
  })
    ? stored
    : null;
  const homeserver = resolved.homeserver;
  const userId = resolved.userId || matchingStored?.userId || "";
  const accessToken = resolved.accessToken || matchingStored?.accessToken || "";
  if (!homeserver || !userId || !accessToken) return null;
  const { rootDir } = resolveMatrixAccountStorageRoot({
    stateDir: resolveStateDir(params.env, os.homedir),
    homeserver,
    userId,
    accessToken,
    accountId: params.accountId,
  });
  return {
    accountId: params.accountId,
    homeserver,
    userId,
    accessToken,
    rootDir,
    storedDeviceId: matchingStored?.deviceId ?? null,
  };
}
function resolveLegacyMatrixFlatStoreTarget(params) {
  if (!resolveMatrixChannelConfig(params.cfg))
    return {
      warning: `Legacy Matrix ${params.detectedKind} detected at ${params.detectedPath}, but channels.matrix is not configured yet. Configure Matrix, then rerun "openclaw doctor --fix" or restart the gateway.`,
    };
  if (requiresExplicitMatrixDefaultAccount(params.cfg))
    return {
      warning: `Legacy Matrix ${params.detectedKind} detected at ${params.detectedPath}, but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set. Set "channels.matrix.defaultAccount" to the intended target account before rerunning "openclaw doctor --fix" or restarting the gateway.`,
    };
  const accountId = resolveMatrixDefaultOrOnlyAccountId(params.cfg);
  const target = resolveMatrixMigrationAccountTarget({
    cfg: params.cfg,
    env: params.env,
    accountId,
  });
  if (!target) {
    const targetDescription =
      params.detectedKind === "state"
        ? "the new account-scoped target"
        : "the account-scoped target";
    return {
      warning: `Legacy Matrix ${params.detectedKind} detected at ${params.detectedPath}, but ${targetDescription} could not be resolved yet (need homeserver, userId, and access token for channels.matrix${accountId === "default" ? "" : `.accounts.${accountId}`}). Start the gateway once with a working Matrix login, or rerun "openclaw doctor --fix" after cached credentials are available.`,
    };
  }
  return {
    ...target,
    selectionNote: resolveMatrixFlatStoreSelectionNote(params.cfg, accountId),
  };
}
//#endregion
//#region src/infra/matrix-plugin-helper.ts
const MATRIX_PLUGIN_ID = "matrix";
const MATRIX_HELPER_CANDIDATES = [
  "legacy-crypto-inspector.ts",
  "legacy-crypto-inspector.js",
  path.join("dist", "legacy-crypto-inspector.js"),
];
const MATRIX_LEGACY_CRYPTO_INSPECTOR_UNAVAILABLE_MESSAGE =
  "Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.";
function resolveMatrixPluginRecord(params) {
  return (
    loadPluginManifestRegistry({
      config: params.cfg,
      workspaceDir: params.workspaceDir,
      env: params.env,
    }).plugins.find((plugin) => plugin.id === MATRIX_PLUGIN_ID) ?? null
  );
}
function resolveMatrixLegacyCryptoInspectorPath(params) {
  const plugin = resolveMatrixPluginRecord(params);
  if (!plugin) return { status: "missing" };
  for (const relativePath of MATRIX_HELPER_CANDIDATES) {
    const candidatePath = path.join(plugin.rootDir, relativePath);
    const opened = openBoundaryFileSync({
      absolutePath: candidatePath,
      rootPath: plugin.rootDir,
      boundaryLabel: "plugin root",
      rejectHardlinks: plugin.origin !== "bundled",
      allowedType: "file",
    });
    if (opened.ok) {
      fs.closeSync(opened.fd);
      return {
        status: "ok",
        helperPath: opened.path,
      };
    }
    if (opened.reason !== "path")
      return {
        status: "unsafe",
        candidatePath,
      };
  }
  return { status: "missing" };
}
function isMatrixLegacyCryptoInspectorAvailable(params) {
  return resolveMatrixLegacyCryptoInspectorPath(params).status === "ok";
}
let jitiLoader = null;
const inspectorCache = /* @__PURE__ */ new Map();
function getJiti() {
  if (jitiLoader) return jitiLoader;
  jitiLoader = createJiti(import.meta.url, {
    interopDefault: false,
    tryNative: false,
    extensions: [".ts", ".tsx", ".mts", ".cts", ".mtsx", ".ctsx", ".js", ".mjs", ".cjs", ".json"],
  });
  return jitiLoader;
}
function canRetryWithJiti(error) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : void 0;
  return code === "ERR_MODULE_NOT_FOUND" || code === "ERR_UNKNOWN_FILE_EXTENSION";
}
function isObjectRecord(value) {
  return typeof value === "object" && value !== null;
}
function resolveInspectorExport(loaded) {
  if (!isObjectRecord(loaded)) return null;
  const directInspector = loaded.inspectLegacyMatrixCryptoStore;
  if (typeof directInspector === "function") return directInspector;
  const directDefault = loaded.default;
  if (typeof directDefault === "function") return directDefault;
  if (!isObjectRecord(directDefault)) return null;
  const nestedInspector = directDefault.inspectLegacyMatrixCryptoStore;
  return typeof nestedInspector === "function" ? nestedInspector : null;
}
async function loadMatrixLegacyCryptoInspector(params) {
  const resolution = resolveMatrixLegacyCryptoInspectorPath(params);
  if (resolution.status === "missing")
    throw new Error(MATRIX_LEGACY_CRYPTO_INSPECTOR_UNAVAILABLE_MESSAGE);
  if (resolution.status === "unsafe")
    throw new Error(
      `Matrix plugin helper path is unsafe: ${resolution.candidatePath}. Reinstall @openclaw/matrix and try again.`,
    );
  const helperPath = resolution.helperPath;
  const cached = inspectorCache.get(helperPath);
  if (cached) return await cached;
  const pending = (async () => {
    let loaded;
    if (shouldPreferNativeJiti(helperPath))
      try {
        loaded = await import(pathToFileURL(helperPath).href);
      } catch (error) {
        if (!canRetryWithJiti(error)) throw error;
        loaded = getJiti()(helperPath);
      }
    else loaded = getJiti()(helperPath);
    const inspectLegacyMatrixCryptoStore = resolveInspectorExport(loaded);
    if (!inspectLegacyMatrixCryptoStore)
      throw new Error(
        `Matrix plugin helper at ${helperPath} does not export inspectLegacyMatrixCryptoStore(). Reinstall @openclaw/matrix and try again.`,
      );
    return inspectLegacyMatrixCryptoStore;
  })();
  inspectorCache.set(helperPath, pending);
  try {
    return await pending;
  } catch (err) {
    inspectorCache.delete(helperPath);
    throw err;
  }
}
//#endregion
//#region src/infra/matrix-legacy-crypto.ts
function detectLegacyBotSdkCryptoStore(cryptoRootDir) {
  try {
    if (!fs.statSync(cryptoRootDir).isDirectory())
      return {
        detected: false,
        warning: `Legacy Matrix encrypted state path exists but is not a directory: ${cryptoRootDir}. OpenClaw skipped automatic crypto migration for that path.`,
      };
  } catch (err) {
    return {
      detected: false,
      warning: `Failed reading legacy Matrix encrypted state path (${cryptoRootDir}): ${String(err)}. OpenClaw skipped automatic crypto migration for that path.`,
    };
  }
  try {
    return {
      detected:
        fs.existsSync(path.join(cryptoRootDir, "bot-sdk.json")) ||
        fs.existsSync(path.join(cryptoRootDir, "matrix-sdk-crypto.sqlite3")) ||
        fs
          .readdirSync(cryptoRootDir, { withFileTypes: true })
          .some(
            (entry) =>
              entry.isDirectory() &&
              fs.existsSync(path.join(cryptoRootDir, entry.name, "matrix-sdk-crypto.sqlite3")),
          ),
    };
  } catch (err) {
    return {
      detected: false,
      warning: `Failed scanning legacy Matrix encrypted state path (${cryptoRootDir}): ${String(err)}. OpenClaw skipped automatic crypto migration for that path.`,
    };
  }
}
function resolveMatrixAccountIds(cfg) {
  return resolveConfiguredMatrixAccountIds(cfg);
}
function resolveLegacyMatrixFlatStorePlan(params) {
  const legacy = resolveMatrixLegacyFlatStoragePaths(resolveStateDir(params.env, os.homedir));
  if (!fs.existsSync(legacy.cryptoPath)) return null;
  const legacyStore = detectLegacyBotSdkCryptoStore(legacy.cryptoPath);
  if (legacyStore.warning) return { warning: legacyStore.warning };
  if (!legacyStore.detected) return null;
  const target = resolveLegacyMatrixFlatStoreTarget({
    cfg: params.cfg,
    env: params.env,
    detectedPath: legacy.cryptoPath,
    detectedKind: "encrypted state",
  });
  if ("warning" in target) return target;
  const metadata = loadLegacyBotSdkMetadata(legacy.cryptoPath);
  return {
    accountId: target.accountId,
    rootDir: target.rootDir,
    recoveryKeyPath: path.join(target.rootDir, "recovery-key.json"),
    statePath: path.join(target.rootDir, "legacy-crypto-migration.json"),
    legacyCryptoPath: legacy.cryptoPath,
    homeserver: target.homeserver,
    userId: target.userId,
    accessToken: target.accessToken,
    deviceId: metadata.deviceId ?? target.storedDeviceId,
  };
}
function loadLegacyBotSdkMetadata(cryptoRootDir) {
  const metadataPath = path.join(cryptoRootDir, "bot-sdk.json");
  const fallback = { deviceId: null };
  try {
    if (!fs.existsSync(metadataPath)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return {
      deviceId:
        typeof parsed.deviceId === "string" && parsed.deviceId.trim() ? parsed.deviceId : null,
    };
  } catch {
    return fallback;
  }
}
function resolveMatrixLegacyCryptoPlans(params) {
  const warnings = [];
  const plans = [];
  const flatPlan = resolveLegacyMatrixFlatStorePlan(params);
  if (flatPlan)
    if ("warning" in flatPlan) warnings.push(flatPlan.warning);
    else plans.push(flatPlan);
  for (const accountId of resolveMatrixAccountIds(params.cfg)) {
    const target = resolveMatrixMigrationAccountTarget({
      cfg: params.cfg,
      env: params.env,
      accountId,
    });
    if (!target) continue;
    const legacyCryptoPath = path.join(target.rootDir, "crypto");
    if (!fs.existsSync(legacyCryptoPath)) continue;
    const detectedStore = detectLegacyBotSdkCryptoStore(legacyCryptoPath);
    if (detectedStore.warning) {
      warnings.push(detectedStore.warning);
      continue;
    }
    if (!detectedStore.detected) continue;
    if (
      plans.some(
        (plan) =>
          plan.accountId === accountId &&
          path.resolve(plan.legacyCryptoPath) === path.resolve(legacyCryptoPath),
      )
    )
      continue;
    const metadata = loadLegacyBotSdkMetadata(legacyCryptoPath);
    plans.push({
      accountId: target.accountId,
      rootDir: target.rootDir,
      recoveryKeyPath: path.join(target.rootDir, "recovery-key.json"),
      statePath: path.join(target.rootDir, "legacy-crypto-migration.json"),
      legacyCryptoPath,
      homeserver: target.homeserver,
      userId: target.userId,
      accessToken: target.accessToken,
      deviceId: metadata.deviceId ?? target.storedDeviceId,
    });
  }
  return {
    plans,
    warnings,
  };
}
function loadStoredRecoveryKey(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
function loadLegacyCryptoMigrationState(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
async function persistLegacyMigrationState(params) {
  await params.writeJsonFileAtomically(params.filePath, params.state);
}
function detectLegacyMatrixCrypto(params) {
  const detection = resolveMatrixLegacyCryptoPlans({
    cfg: params.cfg,
    env: params.env ?? process.env,
  });
  if (
    detection.plans.length > 0 &&
    !isMatrixLegacyCryptoInspectorAvailable({
      cfg: params.cfg,
      env: params.env,
    })
  )
    return {
      plans: detection.plans,
      warnings: [...detection.warnings, MATRIX_LEGACY_CRYPTO_INSPECTOR_UNAVAILABLE_MESSAGE],
    };
  return detection;
}
async function autoPrepareLegacyMatrixCrypto(params) {
  const env = params.env ?? process.env;
  const detection = params.deps?.inspectLegacyStore
    ? resolveMatrixLegacyCryptoPlans({
        cfg: params.cfg,
        env,
      })
    : detectLegacyMatrixCrypto({
        cfg: params.cfg,
        env,
      });
  const warnings = [...detection.warnings];
  const changes = [];
  let inspectLegacyStore = params.deps?.inspectLegacyStore;
  const writeJsonFileAtomically$1 = params.deps?.writeJsonFileAtomically ?? writeJsonFileAtomically;
  if (!inspectLegacyStore)
    try {
      inspectLegacyStore = await loadMatrixLegacyCryptoInspector({
        cfg: params.cfg,
        env,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!warnings.includes(message)) warnings.push(message);
      if (warnings.length > 0)
        params.log?.warn?.(
          `matrix: legacy encrypted-state warnings:\n${warnings.map((entry) => `- ${entry}`).join("\n")}`,
        );
      return {
        migrated: false,
        changes,
        warnings,
      };
    }
  for (const plan of detection.plans) {
    if (loadLegacyCryptoMigrationState(plan.statePath)?.version === 1) continue;
    if (!plan.deviceId) {
      warnings.push(
        `Legacy Matrix encrypted state detected at ${plan.legacyCryptoPath}, but no device ID was found for account "${plan.accountId}". OpenClaw will continue, but old encrypted history cannot be recovered automatically.`,
      );
      continue;
    }
    let summary;
    try {
      summary = await inspectLegacyStore({
        cryptoRootDir: plan.legacyCryptoPath,
        userId: plan.userId,
        deviceId: plan.deviceId,
        log: params.log?.info,
      });
    } catch (err) {
      warnings.push(
        `Failed inspecting legacy Matrix encrypted state for account "${plan.accountId}" (${plan.legacyCryptoPath}): ${String(err)}`,
      );
      continue;
    }
    let decryptionKeyImported = false;
    if (summary.decryptionKeyBase64) {
      const existingRecoveryKey = loadStoredRecoveryKey(plan.recoveryKeyPath);
      if (
        existingRecoveryKey?.privateKeyBase64 &&
        existingRecoveryKey.privateKeyBase64 !== summary.decryptionKeyBase64
      )
        warnings.push(
          `Legacy Matrix backup key was found for account "${plan.accountId}", but ${plan.recoveryKeyPath} already contains a different recovery key. Leaving the existing file unchanged.`,
        );
      else if (!existingRecoveryKey?.privateKeyBase64) {
        const payload = {
          version: 1,
          createdAt: /* @__PURE__ */ new Date().toISOString(),
          keyId: null,
          privateKeyBase64: summary.decryptionKeyBase64,
        };
        try {
          await writeJsonFileAtomically$1(plan.recoveryKeyPath, payload);
          changes.push(
            `Imported Matrix legacy backup key for account "${plan.accountId}": ${plan.recoveryKeyPath}`,
          );
          decryptionKeyImported = true;
        } catch (err) {
          warnings.push(
            `Failed writing Matrix recovery key for account "${plan.accountId}" (${plan.recoveryKeyPath}): ${String(err)}`,
          );
        }
      } else decryptionKeyImported = true;
    }
    const localOnlyKeys =
      summary.roomKeyCounts && summary.roomKeyCounts.total > summary.roomKeyCounts.backedUp
        ? summary.roomKeyCounts.total - summary.roomKeyCounts.backedUp
        : 0;
    if (localOnlyKeys > 0)
      warnings.push(
        `Legacy Matrix encrypted state for account "${plan.accountId}" contains ${localOnlyKeys} room key(s) that were never backed up. Backed-up keys can be restored automatically, but local-only encrypted history may remain unavailable after upgrade.`,
      );
    if (!summary.decryptionKeyBase64 && (summary.roomKeyCounts?.backedUp ?? 0) > 0)
      warnings.push(
        `Legacy Matrix encrypted state for account "${plan.accountId}" has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`,
      );
    if (!summary.decryptionKeyBase64 && (summary.roomKeyCounts?.total ?? 0) > 0)
      warnings.push(
        `Legacy Matrix encrypted state for account "${plan.accountId}" cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`,
      );
    if (
      summary.decryptionKeyBase64 &&
      !decryptionKeyImported &&
      !loadStoredRecoveryKey(plan.recoveryKeyPath)
    )
      continue;
    const state = {
      version: 1,
      source: "matrix-bot-sdk-rust",
      accountId: plan.accountId,
      deviceId: summary.deviceId,
      roomKeyCounts: summary.roomKeyCounts,
      backupVersion: summary.backupVersion,
      decryptionKeyImported,
      restoreStatus: decryptionKeyImported ? "pending" : "manual-action-required",
      detectedAt: /* @__PURE__ */ new Date().toISOString(),
      lastError: null,
    };
    try {
      await persistLegacyMigrationState({
        filePath: plan.statePath,
        state,
        writeJsonFileAtomically: writeJsonFileAtomically$1,
      });
      changes.push(
        `Prepared Matrix legacy encrypted-state migration for account "${plan.accountId}": ${plan.statePath}`,
      );
    } catch (err) {
      warnings.push(
        `Failed writing Matrix legacy encrypted-state migration record for account "${plan.accountId}" (${plan.statePath}): ${String(err)}`,
      );
    }
  }
  if (changes.length > 0)
    params.log?.info?.(
      `matrix: prepared encrypted-state upgrade.\n${changes.map((entry) => `- ${entry}`).join("\n")}`,
    );
  if (warnings.length > 0)
    params.log?.warn?.(
      `matrix: legacy encrypted-state warnings:\n${warnings.map((entry) => `- ${entry}`).join("\n")}`,
    );
  return {
    migrated: changes.length > 0,
    changes,
    warnings,
  };
}
//#endregion
//#region src/infra/matrix-legacy-state.ts
function resolveLegacyMatrixPaths(env) {
  return resolveMatrixLegacyFlatStoragePaths(resolveStateDir(env, os.homedir));
}
function resolveMatrixMigrationPlan(params) {
  const legacy = resolveLegacyMatrixPaths(params.env);
  if (!fs.existsSync(legacy.storagePath) && !fs.existsSync(legacy.cryptoPath)) return null;
  const target = resolveLegacyMatrixFlatStoreTarget({
    cfg: params.cfg,
    env: params.env,
    detectedPath: legacy.rootDir,
    detectedKind: "state",
  });
  if ("warning" in target) return target;
  return {
    accountId: target.accountId,
    legacyStoragePath: legacy.storagePath,
    legacyCryptoPath: legacy.cryptoPath,
    targetRootDir: target.rootDir,
    targetStoragePath: path.join(target.rootDir, "bot-storage.json"),
    targetCryptoPath: path.join(target.rootDir, "crypto"),
    selectionNote: target.selectionNote,
  };
}
function detectLegacyMatrixState(params) {
  return resolveMatrixMigrationPlan({
    cfg: params.cfg,
    env: params.env ?? process.env,
  });
}
function moveLegacyPath(params) {
  if (!fs.existsSync(params.sourcePath)) return;
  if (fs.existsSync(params.targetPath)) {
    params.warnings.push(
      `Matrix legacy ${params.label} not migrated because the target already exists (${params.targetPath}).`,
    );
    return;
  }
  try {
    fs.mkdirSync(path.dirname(params.targetPath), { recursive: true });
    fs.renameSync(params.sourcePath, params.targetPath);
    params.changes.push(
      `Migrated Matrix legacy ${params.label}: ${params.sourcePath} -> ${params.targetPath}`,
    );
  } catch (err) {
    params.warnings.push(
      `Failed migrating Matrix legacy ${params.label} (${params.sourcePath} -> ${params.targetPath}): ${String(err)}`,
    );
  }
}
async function autoMigrateLegacyMatrixState(params) {
  const env = params.env ?? process.env;
  const detection = detectLegacyMatrixState({
    cfg: params.cfg,
    env,
  });
  if (!detection)
    return {
      migrated: false,
      changes: [],
      warnings: [],
    };
  if ("warning" in detection) {
    params.log?.warn?.(`matrix: ${detection.warning}`);
    return {
      migrated: false,
      changes: [],
      warnings: [detection.warning],
    };
  }
  const changes = [];
  const warnings = [];
  moveLegacyPath({
    sourcePath: detection.legacyStoragePath,
    targetPath: detection.targetStoragePath,
    label: "sync store",
    changes,
    warnings,
  });
  moveLegacyPath({
    sourcePath: detection.legacyCryptoPath,
    targetPath: detection.targetCryptoPath,
    label: "crypto store",
    changes,
    warnings,
  });
  if (changes.length > 0) {
    const details = [
      ...changes.map((entry) => `- ${entry}`),
      ...(detection.selectionNote ? [`- ${detection.selectionNote}`] : []),
      "- No user action required.",
    ];
    params.log?.info?.(
      `matrix: plugin upgraded in place for account "${detection.accountId}".\n${details.join("\n")}`,
    );
  }
  if (warnings.length > 0)
    params.log?.warn?.(
      `matrix: legacy state migration warnings:\n${warnings.map((entry) => `- ${entry}`).join("\n")}`,
    );
  return {
    migrated: changes.length > 0,
    changes,
    warnings,
  };
}
//#endregion
//#region src/infra/matrix-migration-snapshot.ts
const MATRIX_MIGRATION_SNAPSHOT_DIRNAME = "openclaw-migrations";
function loadSnapshotMarker(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (
      parsed.version !== 1 ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.archivePath !== "string" ||
      typeof parsed.trigger !== "string"
    )
      return null;
    return {
      version: 1,
      createdAt: parsed.createdAt,
      archivePath: parsed.archivePath,
      trigger: parsed.trigger,
      includeWorkspace: parsed.includeWorkspace === true,
    };
  } catch {
    return null;
  }
}
function resolveMatrixMigrationSnapshotMarkerPath(env = process.env) {
  const stateDir = resolveStateDir(env, os.homedir);
  return path.join(stateDir, "matrix", "migration-snapshot.json");
}
function resolveMatrixMigrationSnapshotOutputDir(env = process.env) {
  const homeDir = resolveRequiredHomeDir(env, os.homedir);
  return path.join(homeDir, "Backups", MATRIX_MIGRATION_SNAPSHOT_DIRNAME);
}
function hasPendingMatrixMigration(params) {
  const env = params.env ?? process.env;
  if (
    detectLegacyMatrixState({
      cfg: params.cfg,
      env,
    })
  )
    return true;
  const legacyCrypto = detectLegacyMatrixCrypto({
    cfg: params.cfg,
    env,
  });
  return legacyCrypto.plans.length > 0 || legacyCrypto.warnings.length > 0;
}
function hasActionableMatrixMigration(params) {
  const env = params.env ?? process.env;
  const legacyState = detectLegacyMatrixState({
    cfg: params.cfg,
    env,
  });
  if (legacyState && !("warning" in legacyState)) return true;
  return (
    detectLegacyMatrixCrypto({
      cfg: params.cfg,
      env,
    }).plans.length > 0 &&
    isMatrixLegacyCryptoInspectorAvailable({
      cfg: params.cfg,
      env,
    })
  );
}
async function maybeCreateMatrixMigrationSnapshot(params) {
  const env = params.env ?? process.env;
  const markerPath = resolveMatrixMigrationSnapshotMarkerPath(env);
  const existingMarker = loadSnapshotMarker(markerPath);
  if (existingMarker?.archivePath && fs.existsSync(existingMarker.archivePath)) {
    params.log?.info?.(
      `matrix: reusing existing pre-migration backup snapshot: ${existingMarker.archivePath}`,
    );
    return {
      created: false,
      archivePath: existingMarker.archivePath,
      markerPath,
    };
  }
  if (existingMarker?.archivePath && !fs.existsSync(existingMarker.archivePath))
    params.log?.warn?.(
      `matrix: previous migration snapshot is missing (${existingMarker.archivePath}); creating a replacement backup before continuing`,
    );
  const snapshot = await createBackupArchive({
    output: (() => {
      const outputDir = params.outputDir ?? resolveMatrixMigrationSnapshotOutputDir(env);
      fs.mkdirSync(outputDir, { recursive: true });
      return outputDir;
    })(),
    includeWorkspace: false,
  });
  await writeJsonFileAtomically(markerPath, {
    version: 1,
    createdAt: snapshot.createdAt,
    archivePath: snapshot.archivePath,
    trigger: params.trigger,
    includeWorkspace: snapshot.includeWorkspace,
  });
  params.log?.info?.(`matrix: created pre-migration backup snapshot: ${snapshot.archivePath}`);
  return {
    created: true,
    archivePath: snapshot.archivePath,
    markerPath,
  };
}
//#endregion
export {
  detectLegacyMatrixState as a,
  detectPluginInstallPathIssue as c,
  autoMigrateLegacyMatrixState as i,
  formatPluginInstallPathIssue as l,
  hasPendingMatrixMigration as n,
  autoPrepareLegacyMatrixCrypto as o,
  maybeCreateMatrixMigrationSnapshot as r,
  detectLegacyMatrixCrypto as s,
  hasActionableMatrixMigration as t,
};
