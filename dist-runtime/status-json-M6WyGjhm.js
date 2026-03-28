import "./redact-CPjO5IzK.js";
import "./errors-CHvVoeNX.js";
import "./io-BeL7sW7Y.js";
import { existsSync } from "node:fs";
import os from "node:os";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import path from "node:path";
import "./ansi-D3lUajt1.js";
import "./agent-scope-BIySJgkJ.js";
import "./file-identity-DgWfjfnD.js";
import "./boundary-file-read-DZTg2Wyt.js";
import "./logger-BsvC8P6f.js";
import { n as hasPotentialConfiguredChannels } from "./config-presence-D04hcCoX.js";
import "./registry-B5KsIQB2.js";
import "./message-channel-BTVKzHsu.js";
import "./boolean-CsNbQKvJ.js";
import "./env-C-KVzFmc.js";
import "./shell-env-BOjFl6MZ.js";
import "./config-state-CGV1IKLE.js";
import "./version-yfoo3YbF.js";
import "./min-host-version-DM6er2ZX.js";
import "./manifest-registry-CMy5XLiN.js";
import "./runtime-guard-WQAOpX6v.js";
import "./safe-text-CpFY0TZg.js";
import "./model-selection-CNzhkJya.js";
import "./env-substitution-X9lTyhgh.js";
import "./network-mode-JwypQ_rG.js";
import "./ip-CWtG939A.js";
import "./config-Cfud9qZm.js";
import { n as runExec } from "./exec-CbOKTdtq.js";
import "./audit-fs-BVqUNCSg.js";
import "./resolve-BNoFF8j-.js";
import "./paths-0NHK4yJk.js";
import "./heartbeat-Dh_uq3ba.js";
import "./system-events-CGA-tC6k.js";
import "./tailnet-BgVZoAmn.js";
import "./net-B1gQyBKw.js";
import "./credentials-ISiLam_U.js";
import "./ports-Xu1Y4c5L.js";
import "./ports-lsof-B2ue3p1o.js";
import "./method-scopes-Le0rX1x3.js";
import "./call-C8P8TkMb.js";
import "./restart-stale-pids-BP2oA1F2.js";
import "./control-ui-shared-B8bHLW2B.js";
import "./runtime-parse-DjytnpAr.js";
import "./launchd-Cn3XWWJL.js";
import "./service-Md1RXiZv.js";
import "./systemd-DdlU2Iy6.js";
import "./probe-DqwGbaLM.js";
import "./probe-auth-DWXofOya.js";
import { y as loggingState } from "./globals-BKVgh_pY.js";
import "./heartbeat-summary-C-bWon8v.js";
import { _ as resolveStateDir, o as resolveConfigPath } from "./paths-Chd_ukvM.js";
import "./node-service-CXfEtm9s.js";
import {
  a as resolveSharedMemoryStatusSnapshot,
  c as getNodeDaemonStatusSummary,
  h as pickGatewaySelfPresence,
  i as resolveMemoryPluginStatus,
  m as resolveOsSummary,
  n as buildTailscaleHttpsUrl,
  o as getAgentLocalStatuses,
  r as resolveGatewayProbeSnapshot,
  s as getDaemonStatusSummary,
  t as getStatusSummary,
} from "./status.summary-Di91Moom.js";
import { r as getUpdateCheckResult } from "./status.update-CaD3GuNt.js";
import { u as writeRuntimeJson } from "./subsystem-BZRyMoTO.js";
import {
  h as resolveUpdateChannelDisplay,
  p as normalizeUpdateChannel,
} from "./update-check-QzfM82Re.js";
//#region src/commands/status.scan.fast-json.ts
let pluginRegistryModulePromise;
let configIoModulePromise;
let commandSecretTargetsModulePromise;
let commandSecretGatewayModulePromise;
let memorySearchModulePromise;
let statusScanDepsRuntimeModulePromise;
function loadPluginRegistryModule() {
  pluginRegistryModulePromise ??= import("./plugin-registry-_3_5rEUK.js");
  return pluginRegistryModulePromise;
}
function loadConfigIoModule() {
  configIoModulePromise ??= import("./io-CRDQ1KCv.js");
  return configIoModulePromise;
}
function loadCommandSecretTargetsModule() {
  commandSecretTargetsModulePromise ??= import("./command-secret-targets-BPau9dUQ.js");
  return commandSecretTargetsModulePromise;
}
function loadCommandSecretGatewayModule() {
  commandSecretGatewayModulePromise ??= import("./command-secret-gateway-Dyr0Dw0e.js");
  return commandSecretGatewayModulePromise;
}
function loadMemorySearchModule() {
  memorySearchModulePromise ??= import("./memory-search-B5z_zsPK.js");
  return memorySearchModulePromise;
}
function loadStatusScanDepsRuntimeModule() {
  statusScanDepsRuntimeModulePromise ??= import("./status.scan.deps.runtime-BosqaFaK.js");
  return statusScanDepsRuntimeModulePromise;
}
function shouldSkipMissingConfigFastPath() {
  return process.env.VITEST === "true" || process.env.VITEST_POOL_ID !== void 0 || false;
}
function isMissingConfigColdStart() {
  return !shouldSkipMissingConfigFastPath() && !existsSync(resolveConfigPath(process.env));
}
function buildColdStartUpdateResult() {
  return {
    root: null,
    installKind: "unknown",
    packageManager: "unknown",
  };
}
function resolveDefaultMemoryStorePath(agentId) {
  return path.join(resolveStateDir(process.env, os.homedir), "memory", `${agentId}.sqlite`);
}
async function resolveMemoryStatusSnapshot(params) {
  const { resolveMemorySearchConfig } = await loadMemorySearchModule();
  const { getMemorySearchManager } = await loadStatusScanDepsRuntimeModule();
  return await resolveSharedMemoryStatusSnapshot({
    cfg: params.cfg,
    agentStatus: params.agentStatus,
    memoryPlugin: params.memoryPlugin,
    resolveMemoryConfig: resolveMemorySearchConfig,
    getMemorySearchManager,
    requireDefaultStore: resolveDefaultMemoryStorePath,
  });
}
async function readStatusSourceConfig() {
  if (!shouldSkipMissingConfigFastPath() && !existsSync(resolveConfigPath(process.env))) return {};
  const { readBestEffortConfig } = await loadConfigIoModule();
  return await readBestEffortConfig();
}
async function resolveStatusConfig(params) {
  if (!shouldSkipMissingConfigFastPath() && !existsSync(resolveConfigPath(process.env)))
    return {
      resolvedConfig: params.sourceConfig,
      diagnostics: [],
    };
  const [{ resolveCommandSecretRefsViaGateway }, { getStatusCommandSecretTargetIds }] =
    await Promise.all([loadCommandSecretGatewayModule(), loadCommandSecretTargetsModule()]);
  return await resolveCommandSecretRefsViaGateway({
    config: params.sourceConfig,
    commandName: params.commandName,
    targetIds: getStatusCommandSecretTargetIds(),
    mode: "read_only_status",
  });
}
async function scanStatusJsonFast(opts, _runtime) {
  const coldStart = isMissingConfigColdStart();
  const loadedRaw = await readStatusSourceConfig();
  const { resolvedConfig: cfg, diagnostics: secretDiagnostics } = await resolveStatusConfig({
    sourceConfig: loadedRaw,
    commandName: "status --json",
  });
  const hasConfiguredChannels = hasPotentialConfiguredChannels(cfg);
  if (hasConfiguredChannels) {
    const { ensurePluginRegistryLoaded } = await loadPluginRegistryModule();
    const prev = loggingState.forceConsoleToStderr;
    loggingState.forceConsoleToStderr = true;
    try {
      ensurePluginRegistryLoaded({ scope: "configured-channels" });
    } finally {
      loggingState.forceConsoleToStderr = prev;
    }
  }
  const osSummary = resolveOsSummary();
  const tailscaleMode = cfg.gateway?.tailscale?.mode ?? "off";
  const updateTimeoutMs = opts.all ? 6500 : 2500;
  const skipColdStartNetworkChecks = coldStart && !hasConfiguredChannels && opts.all !== true;
  const updatePromise = skipColdStartNetworkChecks
    ? Promise.resolve(buildColdStartUpdateResult())
    : getUpdateCheckResult({
        timeoutMs: updateTimeoutMs,
        fetchGit: true,
        includeRegistry: true,
      });
  const agentStatusPromise = getAgentLocalStatuses(cfg);
  const summaryPromise = getStatusSummary({
    config: cfg,
    sourceConfig: loadedRaw,
  });
  const tailscaleDnsPromise =
    tailscaleMode === "off"
      ? Promise.resolve(null)
      : loadStatusScanDepsRuntimeModule()
          .then(({ getTailnetHostname }) =>
            getTailnetHostname((cmd, args) =>
              runExec(cmd, args, {
                timeoutMs: 1200,
                maxBuffer: 2e5,
              }),
            ),
          )
          .catch(() => null);
  const gatewayProbePromise = resolveGatewayProbeSnapshot({
    cfg,
    opts: {
      ...opts,
      ...(skipColdStartNetworkChecks ? { skipProbe: true } : {}),
    },
  });
  const [tailscaleDns, update, agentStatus, gatewaySnapshot, summary] = await Promise.all([
    tailscaleDnsPromise,
    updatePromise,
    agentStatusPromise,
    gatewayProbePromise,
    summaryPromise,
  ]);
  const tailscaleHttpsUrl = buildTailscaleHttpsUrl({
    tailscaleMode,
    tailscaleDns,
    controlUiBasePath: cfg.gateway?.controlUi?.basePath,
  });
  const {
    gatewayConnection,
    remoteUrlMissing,
    gatewayMode,
    gatewayProbeAuth,
    gatewayProbeAuthWarning,
    gatewayProbe,
  } = gatewaySnapshot;
  const gatewayReachable = gatewayProbe?.ok === true;
  const gatewaySelf = gatewayProbe?.presence
    ? pickGatewaySelfPresence(gatewayProbe.presence)
    : null;
  const memoryPlugin = resolveMemoryPluginStatus(cfg);
  return {
    cfg,
    sourceConfig: loadedRaw,
    secretDiagnostics,
    osSummary,
    tailscaleMode,
    tailscaleDns,
    tailscaleHttpsUrl,
    update,
    gatewayConnection,
    remoteUrlMissing,
    gatewayMode,
    gatewayProbeAuth,
    gatewayProbeAuthWarning,
    gatewayProbe,
    gatewayReachable,
    gatewaySelf,
    channelIssues: [],
    agentStatus,
    channels: {
      rows: [],
      details: [],
    },
    summary,
    memory: opts.all
      ? await resolveMemoryStatusSnapshot({
          cfg,
          agentStatus,
          memoryPlugin,
        })
      : null,
    memoryPlugin,
    pluginCompatibility: [],
  };
}
//#endregion
//#region src/commands/status-json.ts
let providerUsagePromise;
let securityAuditModulePromise;
let gatewayCallModulePromise;
function loadProviderUsage() {
  providerUsagePromise ??= import("./provider-usage-Dd7roCt-.js");
  return providerUsagePromise;
}
function loadSecurityAuditModule() {
  securityAuditModulePromise ??= import("./audit.runtime-lKuugS9V.js");
  return securityAuditModulePromise;
}
function loadGatewayCallModule() {
  gatewayCallModulePromise ??= import("./call-BrroQmBr.js");
  return gatewayCallModulePromise;
}
async function statusJsonCommand(opts, runtime) {
  const scan = await scanStatusJsonFast(
    {
      timeoutMs: opts.timeoutMs,
      all: opts.all,
    },
    runtime,
  );
  const securityAudit = opts.all
    ? await loadSecurityAuditModule().then(({ runSecurityAudit }) =>
        runSecurityAudit({
          config: scan.cfg,
          sourceConfig: scan.sourceConfig,
          deep: false,
          includeFilesystem: true,
          includeChannelSecurity: true,
        }),
      )
    : void 0;
  const usage = opts.usage
    ? await loadProviderUsage().then(({ loadProviderUsageSummary }) =>
        loadProviderUsageSummary({ timeoutMs: opts.timeoutMs }),
      )
    : void 0;
  const gatewayCall = opts.deep
    ? await loadGatewayCallModule().then((mod) => mod.callGateway)
    : null;
  const health =
    gatewayCall != null
      ? await gatewayCall({
          method: "health",
          params: { probe: true },
          timeoutMs: opts.timeoutMs,
          config: scan.cfg,
        }).catch(() => void 0)
      : void 0;
  const lastHeartbeat =
    gatewayCall != null && scan.gatewayReachable
      ? await gatewayCall({
          method: "last-heartbeat",
          params: {},
          timeoutMs: opts.timeoutMs,
          config: scan.cfg,
        }).catch(() => null)
      : null;
  const [daemon, nodeDaemon] = await Promise.all([
    getDaemonStatusSummary(),
    getNodeDaemonStatusSummary(),
  ]);
  const channelInfo = resolveUpdateChannelDisplay({
    configChannel: normalizeUpdateChannel(scan.cfg.update?.channel),
    installKind: scan.update.installKind,
    gitTag: scan.update.git?.tag ?? null,
    gitBranch: scan.update.git?.branch ?? null,
  });
  writeRuntimeJson(runtime, {
    ...scan.summary,
    os: scan.osSummary,
    update: scan.update,
    updateChannel: channelInfo.channel,
    updateChannelSource: channelInfo.source,
    memory: scan.memory,
    memoryPlugin: scan.memoryPlugin,
    gateway: {
      mode: scan.gatewayMode,
      url: scan.gatewayConnection.url,
      urlSource: scan.gatewayConnection.urlSource,
      misconfigured: scan.remoteUrlMissing,
      reachable: scan.gatewayReachable,
      connectLatencyMs: scan.gatewayProbe?.connectLatencyMs ?? null,
      self: scan.gatewaySelf,
      error: scan.gatewayProbe?.error ?? null,
      authWarning: scan.gatewayProbeAuthWarning ?? null,
    },
    gatewayService: daemon,
    nodeService: nodeDaemon,
    agents: scan.agentStatus,
    secretDiagnostics: scan.secretDiagnostics,
    ...(securityAudit ? { securityAudit } : {}),
    ...(health || usage || lastHeartbeat
      ? {
          health,
          usage,
          lastHeartbeat,
        }
      : {}),
  });
}
//#endregion
export { statusJsonCommand };
