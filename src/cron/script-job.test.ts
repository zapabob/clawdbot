import process from "node:process";
import { describe, expect, it } from "vitest";
import { runCronScriptJob } from "./script-job.js";
import type { CronJob } from "./types.js";

function createScriptJob(payload?: CronJob["payload"]): CronJob {
  return {
    id: "script-job",
    name: "script job",
    enabled: true,
    createdAtMs: 0,
    updatedAtMs: 0,
    schedule: { kind: "at", at: new Date(0).toISOString() },
    sessionTarget: "isolated",
    wakeMode: "now",
    payload: payload ?? { kind: "script", command: process.execPath },
    state: {},
  };
}

describe("runCronScriptJob", () => {
  it("returns stdout as the run summary", async () => {
    const result = await runCronScriptJob({
      job: createScriptJob(),
      command: process.execPath,
      args: ["-e", "process.stdout.write('ok')"],
      timeoutMs: 5000,
    });

    expect(result.status).toBe("ok");
    expect(result.summary).toBe("ok");
    expect(result.error).toBeUndefined();
  });

  it("keeps empty stdout silent", async () => {
    const result = await runCronScriptJob({
      job: createScriptJob(),
      command: process.execPath,
      args: ["-e", ""],
      timeoutMs: 5000,
    });

    expect(result.status).toBe("ok");
    expect(result.summary).toBeUndefined();
  });

  it("reports non-zero exits as errors with exec diagnostics", async () => {
    const result = await runCronScriptJob({
      job: createScriptJob({ kind: "script", command: process.execPath, maxOutputChars: 8 }),
      command: process.execPath,
      args: ["-e", "process.stderr.write('failure detail'); process.exit(7)"],
      timeoutMs: 5000,
    });

    expect(result.status).toBe("error");
    expect(result.error).toContain("script exited with code 7");
    expect(result.error).toContain("[truncated");
    expect(result.diagnostics?.entries[0]?.source).toBe("exec");
  });
});
