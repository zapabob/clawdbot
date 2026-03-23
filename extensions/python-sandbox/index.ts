import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const execAsync = promisify(exec);

export default definePluginEntry({
  id: "python-sandbox",
  name: "Python Sandbox",
  description: "Allows the AI to execute Python scripts and capture output.",
  register(api) {
    api.registerTool((ctx) => ({
      name: "execute_python",
      description:
        "Executes a Python script and returns the stdout/stderr. Used for complex calculations or data processing.",
      parameters: Type.Object({
        code: Type.String({
          description: "The Python code to execute.",
        }),
        filename: Type.Optional(
          Type.String({
            description: "Optional filename to save the code as (default: temp_script.py)",
            default: "temp_script.py",
          }),
        ),
      }),
      async execute(_id: string, params: { code: string; filename?: string }) {
        const { code, filename } = params;
        const scriptPath = path.join(process.cwd(), "tmp", filename || "temp_script.py");
        // Ensure tmp dir exists
        if (!fs.existsSync(path.join(process.cwd(), "tmp"))) {
          fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
        }

        await fs.promises.writeFile(scriptPath, code);

        const pythonCmd = (ctx as any)?.config?.pythonPath ?? "py -3";
        try {
          const { stdout, stderr } = await execAsync(`${pythonCmd} "${scriptPath}"`);
          const trimmedStdout = stdout.trim();
          const trimmedStderr = stderr.trim();
          return {
            content: [{ type: "text", text: trimmedStdout || "(no output)" }],
            details: {
              success: true,
              stdout: trimmedStdout,
              stderr: trimmedStderr,
              command: pythonCmd,
              scriptPath,
            },
          };
        } catch (error: any) {
          const trimmedStdout = error.stdout?.trim() || "";
          const trimmedStderr = error.stderr?.trim() || error.message;
          return {
            isError: true,
            content: [{ type: "text", text: trimmedStderr || "Python execution failed." }],
            details: {
              success: false,
              stdout: trimmedStdout,
              stderr: trimmedStderr,
              command: pythonCmd,
              scriptPath,
            },
          };
        } finally {
          // Optional: cleanup script file
        }
      },
    }));

    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## Python実行ツール (python-sandbox)",
        "複雑な計算、データ構造の変換、または論理検証が必要な場合は、`execute_python` を使用して解決してください。",
        "結果は常にJSONなどのAIが読みやすい形式での出力を心がけてください。",
      ].join("\n"),
    }));
  },
});
