import {
  expectPendingUntilAbort,
  startAccountAndTrackLifecycle,
  waitForStartedMocks,
} from "openclaw/plugin-sdk/channel-test-helpers";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginRuntime, ResolvedLineAccount } from "../api.js";

const hoisted = vi.hoisted(() => ({
  monitorLineProvider: vi.fn(),
  probeLineBot: vi.fn(async () => ({
    ok: false as const,
    error: "probe failed",
  })),
  stopMonitor: vi.fn(),
}));

vi.mock("./probe.runtime.js", () => ({
  probeLineBot: hoisted.probeLineBot,
}));

import { lineGatewayAdapter } from "./gateway.js";
import { clearLineRuntime, setLineRuntime } from "./runtime.js";

type LineGateway = NonNullable<typeof lineGatewayAdapter>;
type LineStartAccount = NonNullable<LineGateway["startAccount"]>;

function requireStartAccount(): LineStartAccount {
  const startAccount = lineGatewayAdapter.startAccount;
  if (!startAccount) {
    throw new Error("Expected LINE gateway startAccount");
  }
  return startAccount;
}

function buildAccount(): ResolvedLineAccount {
  return {
    accountId: "default",
    enabled: true,
    channelAccessToken: "test-token",
    channelSecret: "test-secret",
    tokenSource: "config",
    config: {},
  };
}

function installRuntime() {
  hoisted.monitorLineProvider.mockImplementationOnce(async () => ({
    account: { accountId: "default" },
    handleWebhook: vi.fn(),
    stop: hoisted.stopMonitor,
  }));
  setLineRuntime({
    channel: {
      line: {
        monitorLineProvider: hoisted.monitorLineProvider,
      },
    },
    logging: {
      shouldLogVerbose: () => false,
    },
  } as unknown as PluginRuntime);
}

describe("lineGatewayAdapter.startAccount lifecycle", () => {
  afterEach(() => {
    clearLineRuntime();
    vi.clearAllMocks();
  });

  it("keeps startAccount pending until abort after webhook startup", async () => {
    installRuntime();

    const { abort, task, isSettled } = startAccountAndTrackLifecycle({
      startAccount: requireStartAccount(),
      account: buildAccount(),
    });

    await expectPendingUntilAbort({
      waitForStarted: waitForStartedMocks(hoisted.probeLineBot, hoisted.monitorLineProvider),
      isSettled,
      abort,
      task,
      assertBeforeAbort: () => {
        expect(hoisted.stopMonitor).not.toHaveBeenCalled();
      },
      assertAfterAbort: () => {
        expect(hoisted.stopMonitor).toHaveBeenCalledOnce();
      },
    });

    expect(hoisted.probeLineBot).toHaveBeenCalledWith("test-token", 2500);
    expect(hoisted.monitorLineProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "default",
        channelAccessToken: "test-token",
        channelSecret: "test-secret",
        abortSignal: abort.signal,
      }),
    );
  });
});
