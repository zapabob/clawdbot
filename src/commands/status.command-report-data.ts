import type { OpenClawConfig } from "../config/types.js";
import type { UpdateCheckResult } from "../infra/update-check.js";
import type { Tone } from "../memory-host-sdk/status.js";
import type { PluginCompatibilityNotice } from "../plugins/status.js";
import type { RenderTableOptions, TableColumn } from "../terminal/table.js";
import type { HealthSummary } from "./health.js";
import {
  buildStatusChannelsTableRows,
  statusChannelsTableColumns,
} from "./status-all/channels-table.js";
import { buildStatusOverviewSurfaceRows } from "./status-all/format.js";
import {
  buildStatusEventsValue,
  buildStatusPluginCompatibilityValue,
  buildStatusProbesValue,
  buildStatusSessionsOverviewValue,
} from "./status-overview-values.ts";
import type { AgentLocalStatus } from "./status.agent-local.js";
import {
  buildStatusAgentsValue,
  buildStatusFooterLines,
  buildStatusHealthRows,
  buildStatusHeartbeatValue,
  buildStatusLastHeartbeatValue,
  buildStatusMemoryValue,
  buildStatusPairingRecoveryLines,
  buildStatusPluginCompatibilityLines,
  buildStatusSecurityAuditLines,
  buildStatusSessionsRows,
  buildStatusSystemEventsRows,
  buildStatusSystemEventsTrailer,
  buildStatusTasksValue,
  statusHealthColumns,
} from "./status.command-sections.js";
import type { MemoryStatusSnapshot, MemoryPluginStatus } from "./status.scan.shared.js";
import type { SessionStatus, StatusSummary } from "./status.types.js";

export async function buildStatusCommandReportData(params: {
  opts: {
    deep?: boolean;
    verbose?: boolean;
  };
  cfg: Pick<OpenClawConfig, "update" | "gateway">;
  update: UpdateCheckResult;
  osSummary: { label: string };
  tailscaleMode: string;
  tailscaleDns?: string | null;
  tailscaleHttpsUrl?: string | null;
  gatewayMode: "local" | "remote";
  remoteUrlMissing: boolean;
  gatewayConnection: {
    url: string;
    urlSource?: string;
  };
  gatewayReachable: boolean;
  gatewayProbe: {
    connectLatencyMs?: number | null;
    error?: string | null;
    close?: {
      reason?: string | null;
    } | null;
  } | null;
  gatewayProbeAuth: {
    token?: string;
    password?: string;
  } | null;
  gatewayProbeAuthWarning?: string | null;
  gatewaySelf:
    | {
        host?: string | null;
        ip?: string | null;
        version?: string | null;
        platform?: string | null;
      }
    | null
    | undefined;
  gatewayService: {
    label: string;
    installed: boolean | null;
    managedByOpenClaw?: boolean;
    loadedText: string;
    runtimeShort?: string | null;
    runtime?: {
      status?: string | null;
      pid?: number | null;
    } | null;
  };
  nodeService: {
    label: string;
    installed: boolean | null;
    managedByOpenClaw?: boolean;
    loadedText: string;
    runtimeShort?: string | null;
    runtime?: {
      status?: string | null;
      pid?: number | null;
    } | null;
  };
  nodeOnlyGateway: unknown;
  summary: StatusSummary;
  securityAudit:
    | {
        summary: { critical: number; warn: number; info: number };
        findings: Array<{
          severity: "critical" | "warn" | "info";
          title: string;
          detail: string;
          remediation?: string | null;
        }>;
      }
    | undefined;
  health?: HealthSummary;
  usageLines?: string[];
  lastHeartbeat: unknown;
  agentStatus: {
    defaultId?: string | null;
    bootstrapPendingCount: number;
    totalSessions: number;
    agents: AgentLocalStatus[];
  };
  channels: {
    rows: Array<{
      id: string;
      label: string;
      enabled: boolean;
      state: "ok" | "warn" | "off" | "setup";
      detail: string;
    }>;
  };
  channelIssues: Array<{
    channel: string;
    message: string;
  }>;
  memory: MemoryStatusSnapshot | null;
  memoryPlugin: MemoryPluginStatus;
  pluginCompatibility: PluginCompatibilityNotice[];
  pairingRecovery: { requestId: string | null } | null;
  tableWidth: number;
  ok: (value: string) => string;
  warn: (value: string) => string;
  muted: (value: string) => string;
  shortenText: (value: string, maxLen: number) => string;
  formatCliCommand: (value: string) => string;
  formatTimeAgo: (ageMs: number) => string;
  formatKTokens: (value: number) => string;
  formatTokensCompact: (value: SessionStatus) => string;
  formatPromptCacheCompact: (value: SessionStatus) => string | null;
  formatHealthChannelLines: (summary: HealthSummary, opts: { accountMode: "all" }) => string[];
  formatPluginCompatibilityNotice: (notice: PluginCompatibilityNotice) => string;
  formatUpdateAvailableHint: (update: UpdateCheckResult) => string | null;
  resolveMemoryVectorState: (value: NonNullable<MemoryStatusSnapshot["vector"]>) => {
    state: string;
    tone: Tone;
  };
  resolveMemoryFtsState: (value: NonNullable<MemoryStatusSnapshot["fts"]>) => {
    state: string;
    tone: Tone;
  };
  resolveMemoryCacheSummary: (value: NonNullable<MemoryStatusSnapshot["cache"]>) => {
    text: string;
    tone: Tone;
  };
  accentDim: (value: string) => string;
  updateValue: string;
  theme: {
    heading: (value: string) => string;
    muted: (value: string) => string;
    warn: (value: string) => string;
    error: (value: string) => string;
  };
  renderTable: (input: RenderTableOptions) => string;
}) {
  const agentsValue = buildStatusAgentsValue({
    agentStatus: params.agentStatus,
    formatTimeAgo: params.formatTimeAgo,
  });
  const eventsValue = buildStatusEventsValue({
    queuedSystemEvents: params.summary.queuedSystemEvents,
  });
  const tasksValue = buildStatusTasksValue({
    summary: params.summary,
    warn: params.warn,
    muted: params.muted,
  });
  const probesValue = buildStatusProbesValue({
    health: params.health,
    ok: params.ok,
    muted: params.muted,
  });
  const heartbeatValue = buildStatusHeartbeatValue({ summary: params.summary });
  const lastHeartbeatValue = buildStatusLastHeartbeatValue({
    deep: params.opts.deep,
    gatewayReachable: params.gatewayReachable,
    lastHeartbeat: params.lastHeartbeat as never,
    warn: params.warn,
    muted: params.muted,
    formatTimeAgo: params.formatTimeAgo,
  });
  const memoryValue = buildStatusMemoryValue({
    memory: params.memory,
    memoryPlugin: params.memoryPlugin,
    ok: params.ok,
    warn: params.warn,
    muted: params.muted,
    resolveMemoryVectorState: params.resolveMemoryVectorState,
    resolveMemoryFtsState: params.resolveMemoryFtsState,
    resolveMemoryCacheSummary: params.resolveMemoryCacheSummary,
  });
  const pluginCompatibilityValue = buildStatusPluginCompatibilityValue({
    notices: params.pluginCompatibility,
    ok: params.ok,
    warn: params.warn,
  });

  const overviewRows = buildStatusOverviewSurfaceRows({
    cfg: params.cfg,
    update: params.update as never,
    tailscaleMode: params.tailscaleMode,
    tailscaleDns: params.tailscaleDns,
    tailscaleHttpsUrl: params.tailscaleHttpsUrl,
    gatewayMode: params.gatewayMode,
    remoteUrlMissing: params.remoteUrlMissing,
    gatewayConnection: params.gatewayConnection,
    gatewayReachable: params.gatewayReachable,
    gatewayProbe: params.gatewayProbe,
    gatewayProbeAuth: params.gatewayProbeAuth,
    gatewayProbeAuthWarning: params.gatewayProbeAuthWarning,
    gatewaySelf: params.gatewaySelf,
    gatewayService: params.gatewayService,
    nodeService: params.nodeService,
    nodeOnlyGateway: params.nodeOnlyGateway as never,
    decorateOk: params.ok,
    decorateWarn: params.warn,
    decorateTailscaleOff: params.muted,
    decorateTailscaleWarn: params.warn,
    prefixRows: [
      { Item: "OS", Value: `${params.osSummary.label} · node ${process.versions.node}` },
    ],
    updateValue: params.updateValue,
    agentsValue,
    suffixRows: [
      { Item: "Memory", Value: memoryValue },
      { Item: "Plugin compatibility", Value: pluginCompatibilityValue },
      { Item: "Probes", Value: probesValue },
      { Item: "Events", Value: eventsValue },
      { Item: "Tasks", Value: tasksValue },
      { Item: "Heartbeat", Value: heartbeatValue },
      ...(lastHeartbeatValue ? [{ Item: "Last heartbeat", Value: lastHeartbeatValue }] : []),
      {
        Item: "Sessions",
        Value: buildStatusSessionsOverviewValue({
          sessions: params.summary.sessions,
          formatKTokens: params.formatKTokens,
        }),
      },
    ],
    gatewayAuthWarningValue: params.gatewayProbeAuthWarning
      ? params.warn(params.gatewayProbeAuthWarning)
      : null,
  });

  const sessionsColumns: TableColumn[] = [
    { key: "Key", header: "Key", minWidth: 20, flex: true },
    { key: "Kind", header: "Kind", minWidth: 6 },
    { key: "Age", header: "Age", minWidth: 9 },
    { key: "Model", header: "Model", minWidth: 14 },
    { key: "Tokens", header: "Tokens", minWidth: 16 },
    ...(params.opts.verbose ? [{ key: "Cache", header: "Cache", minWidth: 16, flex: true }] : []),
  ];
  return {
    heading: params.theme.heading,
    muted: params.theme.muted,
    renderTable: params.renderTable,
    width: params.tableWidth,
    overviewRows,
    showTaskMaintenanceHint: params.summary.taskAudit.errors > 0,
    taskMaintenanceHint: `Task maintenance: ${params.formatCliCommand("openclaw tasks maintenance --apply")}`,
    pluginCompatibilityLines: buildStatusPluginCompatibilityLines({
      notices: params.pluginCompatibility,
      formatNotice: params.formatPluginCompatibilityNotice,
      warn: params.theme.warn,
      muted: params.theme.muted,
    }),
    pairingRecoveryLines: buildStatusPairingRecoveryLines({
      pairingRecovery: params.pairingRecovery,
      warn: params.theme.warn,
      muted: params.theme.muted,
      formatCliCommand: params.formatCliCommand,
    }),
    securityAuditLines: buildStatusSecurityAuditLines({
      securityAudit: params.securityAudit ?? {
        summary: { critical: 0, warn: 0, info: 0 },
        findings: [],
      },
      theme: params.theme,
      shortenText: params.shortenText,
      formatCliCommand: params.formatCliCommand,
    }),
    channelsColumns: statusChannelsTableColumns,
    channelsRows: buildStatusChannelsTableRows({
      rows: params.channels.rows,
      channelIssues: params.channelIssues,
      ok: params.ok,
      warn: params.warn,
      muted: params.muted,
      accentDim: params.accentDim,
      formatIssueMessage: (message) => params.shortenText(message, 84),
    }),
    sessionsColumns,
    sessionsRows: buildStatusSessionsRows({
      recent: params.summary.sessions.recent,
      verbose: params.opts.verbose,
      shortenText: params.shortenText,
      formatTimeAgo: params.formatTimeAgo,
      formatTokensCompact: params.formatTokensCompact,
      formatPromptCacheCompact: params.formatPromptCacheCompact,
      muted: params.muted,
    }),
    systemEventsRows: buildStatusSystemEventsRows({
      queuedSystemEvents: params.summary.queuedSystemEvents,
    }),
    systemEventsTrailer: buildStatusSystemEventsTrailer({
      queuedSystemEvents: params.summary.queuedSystemEvents,
      muted: params.muted,
    }),
    healthColumns: params.health ? statusHealthColumns : undefined,
    healthRows: params.health
      ? buildStatusHealthRows({
          health: params.health as never,
          formatHealthChannelLines: params.formatHealthChannelLines as never,
          ok: params.ok,
          warn: params.warn,
          muted: params.muted,
        })
      : undefined,
    usageLines: params.usageLines,
    footerLines: buildStatusFooterLines({
      updateHint: params.formatUpdateAvailableHint(params.update),
      warn: params.theme.warn,
      formatCliCommand: params.formatCliCommand,
      nodeOnlyGateway: params.nodeOnlyGateway as never,
      gatewayReachable: params.gatewayReachable,
    }),
  };
}
