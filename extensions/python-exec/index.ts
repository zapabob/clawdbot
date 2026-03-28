/**
 * python-exec — OpenClaw extension for executing Python 3.14 via uv.
 *
 * Tool: python_exec
 *   code: string           Python ソースコード
 *   timeout_sec?: number   タイムアウト秒数（デフォルト 30）
 *   python_version?: string Python バージョン（デフォルト "3.14"）
 *
 * 実行方法:
 *   uv run --python <version> - < code  (stdin 経由)
 *
 * 環境変数:
 *   UV_PATH  カスタム uv バイナリパス（デフォルト "uv"）
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/core";

type PythonExecPluginConfig = {
  uvPath?: string;
  defaultPythonVersion?: string;
};

function getUvPath(api: OpenClawPluginApi): string {
  const cfg = (api.pluginConfig ?? {}) as PythonExecPluginConfig;
  return process.env.UV_PATH || (typeof cfg.uvPath === "string" ? cfg.uvPath.trim() : "") || "uv";
}

function getDefaultPythonVersion(api: OpenClawPluginApi): string {
  const cfg = (api.pluginConfig ?? {}) as PythonExecPluginConfig;
  return (
    (typeof cfg.defaultPythonVersion === "string" ? cfg.defaultPythonVersion.trim() : "") || "3.14"
  );
}

async function runPython(opts: {
  uv: string;
  pythonVersion: string;
  code: string;
  timeoutMs: number;
}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // 一時ファイル経由で実行（stdin が uv で機能しない場合のフォールバック）
  const tmpFile = join(tmpdir(), `openclaw-pyexec-${randomBytes(8).toString("hex")}.py`);
  await writeFile(tmpFile, opts.code, "utf-8");

  return new Promise((resolve) => {
    const proc = spawn(opts.uv, ["run", "--python", opts.pythonVersion, tmpFile], {
      timeout: opts.timeoutMs,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.once("close", (code) => {
      void unlink(tmpFile).catch(() => {});
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    proc.once("error", (err) => {
      void unlink(tmpFile).catch(() => {});
      resolve({ stdout: "", stderr: String(err), exitCode: 1 });
    });
  });
}

export default definePluginEntry({
  id: "python-exec",
  name: "Python Exec",
  description: "Execute Python code via uv (Python 3.14 by default).",
  register(api: OpenClawPluginApi) {
    api.registerTool({
      name: "python_exec",
      label: "Python Exec",
      description:
        "Run Python code using `uv run --python <version>`. " +
        "Returns stdout, stderr, and exit_code. " +
        "uv が未インストールの場合はエラーになります（uv をインストール: https://github.com/astral-sh/uv）。",
      parameters: Type.Object({
        code: Type.String({ description: "実行する Python コード" }),
        timeout_sec: Type.Optional(
          Type.Number({ description: "タイムアウト秒数（デフォルト 30）" }),
        ),
        python_version: Type.Optional(
          Type.String({ description: "Python バージョン（デフォルト 3.14）" }),
        ),
      }),
      async execute(
        _toolCallId: string,
        params: Record<string, unknown>,
        _signal?: AbortSignal,
        _onUpdate?: unknown,
      ): Promise<AgentToolResult<unknown>> {
        const code = typeof params.code === "string" ? params.code : "";
        const timeoutSec =
          typeof params.timeout_sec === "number" && params.timeout_sec > 0
            ? params.timeout_sec
            : 30;
        const pythonVersion =
          typeof params.python_version === "string" && params.python_version.trim()
            ? params.python_version.trim()
            : getDefaultPythonVersion(api);

        if (!code.trim()) {
          return {
            content: [{ type: "text" as const, text: "Error: code is empty" }],
            details: { error: "empty_code" },
          };
        }

        const uv = getUvPath(api);
        const result = await runPython({
          uv,
          pythonVersion,
          code,
          timeoutMs: timeoutSec * 1000,
        });

        const summary = [
          `exit_code: ${result.exitCode}`,
          result.stdout ? `stdout:\n${result.stdout.trimEnd()}` : "stdout: (empty)",
          result.stderr ? `stderr:\n${result.stderr.trimEnd()}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text: summary }],
          details: {
            exit_code: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
          },
        };
      },
    });

    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## Python Exec (python-exec plugin)",
        "",
        "- **`python_exec`**: uv 経由で Python コードを実行する。",
        `- デフォルト Python バージョン: ${getDefaultPythonVersion(api)}`,
        "- uv が未インストールの場合は事前に `winget install astral-sh.uv` または `pip install uv` を実行する。",
        "- 標準ライブラリのみ使用可能（追加パッケージは PEP 723 インラインメタデータで指定）。",
        "",
        "### PEP 723 インラインパッケージ例",
        "```python",
        "# /// script",
        '# requires-python = ">=3.14"',
        '# dependencies = ["requests"]',
        "# ///",
        "import requests",
        "print(requests.get('https://example.com').status_code)",
        "```",
      ].join("\n"),
    }));
  },
});
