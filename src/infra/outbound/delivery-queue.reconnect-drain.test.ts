import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import {
  type DeliverFn,
  drainReconnectQueue,
  enqueueDelivery,
  failDelivery,
  MAX_RETRIES,
  type RecoveryLogger,
  recoverPendingDeliveries,
} from "./delivery-queue.js";

type MockLogger = RecoveryLogger & {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

function createMockLogger() {
  const info = vi.fn<(msg: string) => void>();
  const warn = vi.fn<(msg: string) => void>();
  const error = vi.fn<(msg: string) => void>();
  const logger: MockLogger = {
    info,
    warn,
    error,
  };
  return { logger, info, warn, error };
}

const stubCfg = {} as OpenClawConfig;

describe("drainReconnectQueue", () => {
  let fixtureRoot = "";
  let tmpDir: string;
  let fixtureCount = 0;

  beforeAll(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-drain-"));
  });

  beforeEach(() => {
    tmpDir = path.join(fixtureRoot, `case-${fixtureCount++}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    if (!fixtureRoot) {
      return;
    }
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    fixtureRoot = "";
  });

  it("drains entries that failed with 'no listener' error", async () => {
    const { logger } = createMockLogger();
    const deliver = vi.fn<DeliverFn>(async () => {});

    const id = await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "acct1" },
      tmpDir,
    );
    await failDelivery(id, "No active WhatsApp Web listener", tmpDir);

    await drainReconnectQueue({
      accountId: "acct1",
      cfg: stubCfg,
      log: logger,
      stateDir: tmpDir,
      deliver,
    });

    expect(deliver).toHaveBeenCalledTimes(1);
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "whatsapp", to: "+1555", skipQueue: true }),
    );
  });

  it("skips entries from other accounts", async () => {
    const { logger } = createMockLogger();
    const deliver = vi.fn<DeliverFn>(async () => {});

    const id = await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "other" },
      tmpDir,
    );
    await failDelivery(id, "No active WhatsApp Web listener", tmpDir);

    await drainReconnectQueue({
      accountId: "acct1",
      cfg: stubCfg,
      log: logger,
      stateDir: tmpDir,
      deliver,
    });

    expect(deliver).not.toHaveBeenCalled();
  });

  it("retries immediately without resetting retry history", async () => {
    const { logger } = createMockLogger();
    const deliver = vi.fn<DeliverFn>(async () => {
      throw new Error("transient failure");
    });

    const id = await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "acct1" },
      tmpDir,
    );
    await failDelivery(id, "No active WhatsApp Web listener", tmpDir);
    const queueDir = path.join(tmpDir, "delivery-queue");
    const filePath = path.join(queueDir, `${id}.json`);
    const before = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      retryCount: number;
      lastAttemptAt?: number;
      lastError?: string;
    };

    await drainReconnectQueue({
      accountId: "acct1",
      cfg: stubCfg,
      log: logger,
      stateDir: tmpDir,
      deliver,
    });

    expect(deliver).toHaveBeenCalledTimes(1);

    const after = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      retryCount: number;
      lastAttemptAt?: number;
      lastError?: string;
    };
    expect(after.retryCount).toBe(before.retryCount + 1);
    expect(after.lastAttemptAt).toBeTypeOf("number");
    expect(after.lastAttemptAt).toBeGreaterThanOrEqual(before.lastAttemptAt ?? 0);
    expect(after.lastError).toBe("transient failure");
  });

  it("does not throw if delivery fails during drain", async () => {
    const { logger } = createMockLogger();
    const deliver = vi.fn<DeliverFn>(async () => {
      throw new Error("transient failure");
    });

    const id = await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "acct1" },
      tmpDir,
    );
    await failDelivery(id, "No active WhatsApp Web listener", tmpDir);

    await expect(
      drainReconnectQueue({
        accountId: "acct1",
        cfg: stubCfg,
        log: logger,
        stateDir: tmpDir,
        deliver,
      }),
    ).resolves.toBeUndefined();
  });

  it("skips entries where retryCount >= MAX_RETRIES", async () => {
    const { logger } = createMockLogger();
    const deliver = vi.fn<DeliverFn>(async () => {});

    const id = await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "acct1" },
      tmpDir,
    );

    for (let i = 0; i < MAX_RETRIES; i++) {
      await failDelivery(id, "No active WhatsApp Web listener", tmpDir);
    }

    await drainReconnectQueue({
      accountId: "acct1",
      cfg: stubCfg,
      log: logger,
      stateDir: tmpDir,
      deliver,
    });

    expect(deliver).not.toHaveBeenCalled();
    const failedDir = path.join(tmpDir, "delivery-queue", "failed");
    const failedFiles = fs.readdirSync(failedDir).filter((f) => f.endsWith(".json"));
    expect(failedFiles).toHaveLength(1);
  });

  it("second concurrent call is skipped (concurrency guard)", async () => {
    const { logger, info } = createMockLogger();
    let resolveDeliver: () => void;
    const deliverPromise = new Promise<void>((resolve) => {
      resolveDeliver = resolve;
    });
    const deliver = vi.fn<DeliverFn>(async () => {
      await deliverPromise;
    });

    await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "acct1" },
      tmpDir,
    );
    const pending = fs
      .readdirSync(path.join(tmpDir, "delivery-queue"))
      .filter((f) => f.endsWith(".json"));
    const entryPath = path.join(tmpDir, "delivery-queue", pending[0]);
    const entry = JSON.parse(fs.readFileSync(entryPath, "utf-8")) as {
      lastError?: string;
      retryCount: number;
    };
    entry.lastError = "No active WhatsApp Web listener";
    entry.retryCount = 1;
    fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2));

    const opts = { accountId: "acct1", cfg: stubCfg, log: logger, stateDir: tmpDir, deliver };

    const first = drainReconnectQueue(opts);
    const second = drainReconnectQueue(opts);
    await second;

    expect(info).toHaveBeenCalledWith(expect.stringContaining("already in progress"));

    resolveDeliver!();
    await first;
  });

  it("does not re-deliver an entry already being recovered at startup", async () => {
    const { logger, info } = createMockLogger();
    const { logger: startupLogger } = createMockLogger();
    let resolveDeliver: () => void;
    const deliverPromise = new Promise<void>((resolve) => {
      resolveDeliver = resolve;
    });
    const deliver = vi.fn<DeliverFn>(async () => {
      await deliverPromise;
    });

    const id = await enqueueDelivery(
      { channel: "whatsapp", to: "+1555", payloads: [{ text: "hi" }], accountId: "acct1" },
      tmpDir,
    );
    const queuePath = path.join(tmpDir, "delivery-queue", `${id}.json`);
    const entry = JSON.parse(fs.readFileSync(queuePath, "utf-8")) as {
      lastError?: string;
    };
    entry.lastError = "No active WhatsApp Web listener";
    fs.writeFileSync(queuePath, JSON.stringify(entry, null, 2));

    const startupRecovery = recoverPendingDeliveries({
      cfg: stubCfg,
      deliver,
      log: startupLogger,
      stateDir: tmpDir,
    });

    await vi.waitFor(() => {
      expect(deliver).toHaveBeenCalledTimes(1);
    });

    await drainReconnectQueue({
      accountId: "acct1",
      cfg: stubCfg,
      log: logger,
      stateDir: tmpDir,
      deliver,
    });

    expect(deliver).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining(`entry ${id} is already being recovered`),
    );

    resolveDeliver!();
    await startupRecovery;
  });
});
