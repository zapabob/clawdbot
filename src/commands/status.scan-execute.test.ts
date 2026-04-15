import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveStatusSummaryFromOverview, resolveMemoryPluginStatus } = vi.hoisted(() => ({
  resolveStatusSummaryFromOverview: vi.fn(async () => ({ sessions: { count: 1 } })),
  resolveMemoryPluginStatus: vi.fn(() => ({
    enabled: false,
    slot: null,
    reason: "memorySearch not configured",
  })),
}));

describe("executeStatusScanFromOverview", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock("./status.scan-overview.ts", () => ({
      resolveStatusSummaryFromOverview,
    }));
    vi.doMock("./status.scan.shared.js", () => ({
      resolveMemoryPluginStatus,
    }));
  });

  it("resolves memory and summary, then builds the final scan result", async () => {
    const { executeStatusScanFromOverview } = await import("./status.scan-execute.ts");

    const overview = {
      cfg: { channels: {} },
      sourceConfig: { channels: {} },
      secretDiagnostics: ["diag"],
      osSummary: { label: "linux" },
      tailscaleMode: "tailnet",
      tailscaleDns: "box.tail.ts.net",
      tailscaleHttpsUrl: "https://box.tail.ts.net",
      update: { available: false, installKind: "package" },
      gatewaySnapshot: {
        gatewayConnection: { url: "ws://127.0.0.1:18789", urlSource: "local" },
        remoteUrlMissing: false,
        gatewayMode: "local",
        gatewayProbeAuth: {},
        gatewayProbeAuthWarning: undefined,
        gatewayProbe: null,
        gatewayReachable: true,
        gatewaySelf: null,
      },
      agentStatus: { agents: [{ id: "main" }], defaultId: "main" },
      skipColdStartNetworkChecks: false,
    };
    const resolveMemory = vi.fn(
      async () =>
        ({
          agentId: "main",
          backend: "builtin",
          provider: "memory-core",
        }) as never,
    );

    const result = await executeStatusScanFromOverview({
      overview: overview as never,
      runtime: {} as never,
      resolveMemory,
      channelIssues: [],
      channels: { rows: [], details: [] },
      pluginCompatibility: [],
    });

    expect(resolveMemoryPluginStatus).toHaveBeenCalledWith(overview.cfg);
    expect(resolveStatusSummaryFromOverview).toHaveBeenCalledWith({ overview });
    expect(resolveMemory).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        cfg: overview.cfg,
        sourceConfig: overview.sourceConfig,
        secretDiagnostics: ["diag"],
        tailscaleDns: "box.tail.ts.net",
        tailscaleHttpsUrl: "https://box.tail.ts.net",
        gatewayConnection: { url: "ws://127.0.0.1:18789", urlSource: "local" },
        gatewayMode: "local",
        gatewayReachable: true,
        channels: { rows: [], details: [] },
        summary: { sessions: { count: 1 } },
        memory: { agentId: "main", backend: "builtin", provider: "memory-core" },
        pluginCompatibility: [],
      }),
    );
  });
});
