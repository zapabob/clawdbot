import { Type } from "@sinclair/typebox";
import { createExecTool, type ExecToolDefaults } from "../bash-tools.js";
import { formatExecCommand } from "../../infra/system-run-command.js";
import {
  findSubmodulePreset,
  findSubmoduleRepo,
  loadSubmoduleRegistry,
  resolveSubmoduleRepoPath,
} from "./submodule-registry.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringArrayParam, readStringParam } from "./common.js";

const SubmoduleRunToolSchema = Type.Object({
  repoId: Type.String({
    description: "Registered submodule id from vendor/submodules/registry.json.",
  }),
  preset: Type.String({
    description: "Registered preset name for the target submodule repo.",
  }),
  extraArgs: Type.Optional(
    Type.Array(
      Type.String({
        description: "Additional arguments appended after the preset command template.",
      }),
    ),
  ),
});

type SubmoduleRunToolOptions = {
  workspaceDir: string;
  execDefaults?: ExecToolDefaults;
};

type ExecLikeDetails =
  | {
      status: "completed" | "failed";
      exitCode: number | null;
      aggregated: string;
      cwd?: string;
      durationMs?: number;
      timedOut?: boolean;
    }
  | {
      status: "approval-pending";
      approvalId: string;
      approvalSlug: string;
      host: string;
      command: string;
      cwd?: string;
    }
  | {
      status: "approval-unavailable";
      reason: string;
      host: string;
      command: string;
      cwd?: string;
    }
  | {
      status: "running";
      sessionId: string;
      pid?: number;
      startedAt: number;
      cwd?: string;
      tail?: string;
    };

function buildSubmoduleRunEnvelope(params: {
  repoId: string;
  preset: string;
  commandText: string;
  cwd: string;
  details: ExecLikeDetails | undefined;
}) {
  const base = {
    repoId: params.repoId,
    preset: params.preset,
    cwd: params.cwd,
    command: params.commandText,
  };
  switch (params.details?.status) {
    case "completed":
      return {
        ...base,
        ok: true,
        status: "completed" as const,
        exitCode: params.details.exitCode,
        stdout: params.details.aggregated,
        stderr: "",
        durationMs: params.details.durationMs ?? null,
      };
    case "failed":
      return {
        ...base,
        ok: false,
        status: "failed" as const,
        exitCode: params.details.exitCode,
        stdout: params.details.aggregated,
        stderr: "",
        durationMs: params.details.durationMs ?? null,
        timedOut: params.details.timedOut ?? false,
      };
    case "approval-pending":
      return {
        ...base,
        ok: false,
        status: "approval-pending" as const,
        approvalId: params.details.approvalId,
        approvalSlug: params.details.approvalSlug,
        host: params.details.host,
      };
    case "approval-unavailable":
      return {
        ...base,
        ok: false,
        status: "approval-unavailable" as const,
        reason: params.details.reason,
        host: params.details.host,
      };
    case "running":
      return {
        ...base,
        ok: false,
        status: "running" as const,
        sessionId: params.details.sessionId,
        pid: params.details.pid ?? null,
        startedAt: params.details.startedAt,
        tail: params.details.tail ?? "",
      };
    default:
      return {
        ...base,
        ok: false,
        status: "unknown" as const,
        stdout: "",
        stderr: "",
      };
  }
}

export function createSubmoduleRunTool(options: SubmoduleRunToolOptions): AnyAgentTool {
  return {
    label: "Submodule Run",
    name: "submodule_run",
    ownerOnly: true,
    description:
      "Run a registry-backed preset inside a sanctioned vendor submodule without exposing raw exec.",
    parameters: SubmoduleRunToolSchema,
    execute: async (toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const repoId = readStringParam(params, "repoId", { required: true, label: "repoId" });
      const presetName = readStringParam(params, "preset", { required: true, label: "preset" });
      const extraArgs = readStringArrayParam(params, "extraArgs") ?? [];
      const registry = await loadSubmoduleRegistry(options.workspaceDir);
      const repo = findSubmoduleRepo(registry, repoId);
      const preset = findSubmodulePreset(repo, presetName);
      const cwd = resolveSubmoduleRepoPath(options.workspaceDir, repo);
      const commandParts = [...preset.command, ...extraArgs];
      const commandText = formatExecCommand(commandParts);
      const execTool = createExecTool({
        ...options.execDefaults,
        cwd,
        allowBackground: false,
      });
      const execResult = await execTool.execute?.(
        `${toolCallId}:submodule`,
        {
          command: commandText,
          workdir: cwd,
          background: false,
        },
        undefined,
        undefined,
      );
      const details =
        execResult && typeof execResult === "object" && "details" in execResult
          ? ((execResult as { details?: ExecLikeDetails }).details ?? undefined)
          : undefined;
      return jsonResult(
        buildSubmoduleRunEnvelope({
          repoId,
          preset: presetName,
          commandText,
          cwd,
          details,
        }),
      );
    },
  };
}
