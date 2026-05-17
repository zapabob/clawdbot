import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildMemoryDryRunReport } from "./memory-report.js";

const workspaces: string[] = [];

async function createWorkspace(): Promise<string> {
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "memory-report-"));
  workspaces.push(workspaceDir);
  return workspaceDir;
}

afterEach(async () => {
  await Promise.all(
    workspaces.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("buildMemoryDryRunReport", () => {
  it("reports memory hygiene recommendations without writing", async () => {
    const workspaceDir = await createWorkspace();
    await fs.mkdir(path.join(workspaceDir, "memory"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceDir, "MEMORY.md"),
      [
        "# Long-Term Memory",
        "",
        "- Favorite editor: VS Code",
        "- Favorite editor: Zed",
        "- Project uses OpenClaw for local automation.",
        "- Project uses OpenClaw for local automation.",
        "- Prefer dry-run reports before automatic cleanup.",
        "- Remember release evidence in docs.",
        "- Keep source citations for imported research.",
      ].join("\n"),
      "utf-8",
    );
    await fs.writeFile(path.join(workspaceDir, "USER.md"), "User prefers concise reports.\n");
    await fs.writeFile(
      path.join(workspaceDir, "memory", "2025-01-01.md"),
      "- Old daily observation.\n",
      "utf-8",
    );

    const before = await fs.readFile(path.join(workspaceDir, "MEMORY.md"), "utf-8");
    const report = await buildMemoryDryRunReport({
      workspaceDir,
      nowMs: Date.parse("2026-05-18T00:00:00.000Z"),
      staleDailyMemoryDays: 30,
      maxRootMemoryChars: 120,
    });
    const after = await fs.readFile(path.join(workspaceDir, "MEMORY.md"), "utf-8");

    expect(after).toBe(before);
    expect(report.dryRun).toBe(true);
    expect(report.summary.rootMemoryFiles).toBe(1);
    expect(report.summary.userProfileFiles).toBe(1);
    expect(report.summary.dailyMemoryFiles).toBe(1);
    expect(report.recommendations.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining([
        "compact_root_memory",
        "review_duplicate_memory_entry",
        "review_possible_memory_conflict",
        "review_old_daily_memory",
      ]),
    );
  });
});
