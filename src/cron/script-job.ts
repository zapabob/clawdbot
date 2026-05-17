import { runCommandWithTimeout } from "../process/exec.js";
import { createCronRunDiagnosticsFromError } from "./run-diagnostics.js";
import type { CronJob, CronRunOutcome } from "./types.js";

const DEFAULT_MAX_OUTPUT_CHARS = 4000;

function clampMaxOutputChars(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_MAX_OUTPUT_CHARS;
  }
  return Math.max(1, Math.min(20_000, Math.floor(value)));
}

function truncateOutput(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n[truncated ${text.length - maxChars} chars]`;
}

function scriptErrorMessage(params: {
  code: number | null;
  termination: string;
  stderr: string;
}): string {
  const status =
    params.termination === "exit"
      ? `script exited with code ${params.code ?? "unknown"}`
      : `script ended by ${params.termination}`;
  return params.stderr ? `${status}: ${params.stderr}` : status;
}

export async function runCronScriptJob(params: {
  job: CronJob;
  command: string;
  args: string[];
  cwd?: string;
  input?: string;
  timeoutMs: number;
  abortSignal?: AbortSignal;
}): Promise<CronRunOutcome> {
  if (params.abortSignal?.aborted) {
    return { status: "error", error: "cron: script job aborted before start" };
  }

  const result = await runCommandWithTimeout([params.command, ...params.args], {
    timeoutMs: params.timeoutMs,
    cwd: params.cwd,
    input: params.input,
  });
  const payload = params.job.payload.kind === "script" ? params.job.payload : undefined;
  const maxOutputChars = clampMaxOutputChars(payload?.maxOutputChars);
  const stdout = truncateOutput(result.stdout.trim(), maxOutputChars);
  const stderr = truncateOutput(result.stderr.trim(), maxOutputChars);
  const summary = stdout || undefined;

  if (result.code !== 0 || result.termination !== "exit") {
    const error = scriptErrorMessage({
      code: result.code,
      termination: result.termination,
      stderr,
    });
    return {
      status: "error",
      error,
      summary,
      diagnostics: createCronRunDiagnosticsFromError("exec", error, {
        nowMs: () => Date.now(),
      }),
    };
  }

  return {
    status: "ok",
    summary,
    diagnostics: stderr
      ? {
          summary: "script wrote stderr",
          entries: [
            {
              ts: Date.now(),
              source: "exec",
              severity: "warn",
              message: stderr,
            },
          ],
        }
      : undefined,
  };
}
