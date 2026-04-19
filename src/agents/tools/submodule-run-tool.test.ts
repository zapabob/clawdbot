import { beforeEach, describe, expect, it, vi } from "vitest";

const execMocks = vi.hoisted(() => ({
  execute: vi.fn(),
  createExecTool: vi.fn(),
}));

vi.mock("../bash-tools.js", () => ({
  createExecTool: execMocks.createExecTool,
}));

describe("createSubmoduleRunTool", () => {
  beforeEach(() => {
    execMocks.execute.mockReset().mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
      details: {
        status: "completed",
        exitCode: 0,
        aggregated: "ok",
        cwd: "C:\\repo\\vendor\\submodules\\vrchat-mcp-osc",
      },
    });
    execMocks.createExecTool.mockReset().mockReturnValue({
      execute: execMocks.execute,
    });
  });

  it("executes a registered preset inside the resolved submodule root", async () => {
    const { mkdtemp, mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const os = await import("node:os");
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-submodule-run-"));
    const repoDir = path.join(workspaceDir, "vendor", "submodules", "vrchat-mcp-osc");
    await mkdir(repoDir, { recursive: true });
    await writeFile(
      path.join(workspaceDir, "vendor", "submodules", "registry.json"),
      JSON.stringify({
        version: 1,
        repos: [
          {
            id: "vrchat-mcp-osc",
            path: "vendor/submodules/vrchat-mcp-osc",
            source: {
              url: "https://github.com/Krekun/vrchat-mcp-osc.git",
              ref: "bd125daa1c3a04feac68f1d9addf615e2e23f90e",
            },
            runtime: "node",
            presets: {
              status: {
                command: ["git", "status", "--short", "--branch"],
              },
            },
          },
        ],
      }),
      "utf8",
    );

    const { createSubmoduleRunTool } = await import("./submodule-run-tool.js");
    const tool = createSubmoduleRunTool({
      workspaceDir,
      execDefaults: {
        host: "gateway",
        security: "allowlist",
        ask: "on-miss",
      },
    });

    await tool.execute("call-1", {
      repoId: "vrchat-mcp-osc",
      preset: "status",
      extraArgs: ["--ignored-extra"],
    });

    expect(execMocks.createExecTool).toHaveBeenCalledWith(
      expect.objectContaining({
        cwd: repoDir,
        allowBackground: false,
        host: "gateway",
      }),
    );
    expect(execMocks.execute).toHaveBeenCalledWith(
      "call-1:submodule",
      expect.objectContaining({
        command: 'git status --short --branch --ignored-extra',
        workdir: repoDir,
        background: false,
      }),
      undefined,
      undefined,
    );
  });

  it("rejects repos that resolve outside vendor/submodules", async () => {
    const { mkdtemp, mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const os = await import("node:os");
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-submodule-run-"));
    await mkdir(path.join(workspaceDir, "vendor", "submodules"), { recursive: true });
    await writeFile(
      path.join(workspaceDir, "vendor", "submodules", "registry.json"),
      JSON.stringify({
        version: 1,
        repos: [
          {
            id: "escape",
            path: "..\\..\\outside",
            source: {
              url: "https://example.invalid/repo.git",
              ref: "deadbeef",
            },
            runtime: "node",
            presets: {
              status: {
                command: ["git", "status"],
              },
            },
          },
        ],
      }),
      "utf8",
    );

    const { createSubmoduleRunTool } = await import("./submodule-run-tool.js");
    const tool = createSubmoduleRunTool({ workspaceDir });

    await expect(
      tool.execute("call-2", {
        repoId: "escape",
        preset: "status",
      }),
    ).rejects.toThrow("resolves outside vendor/submodules");
    expect(execMocks.execute).not.toHaveBeenCalled();
  });
});
