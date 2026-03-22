import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { definePluginEntry } from "openclaw/plugin-sdk/core";

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
      schema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The Python code to execute.",
          },
          filename: {
            type: "string",
            description: "Optional filename to save the code as (default: temp_script.py)",
            default: "temp_script.py",
          },
        },
        required: ["code"],
      },
      async execute({ code, filename }) {
        const scriptPath = path.join(process.cwd(), "tmp", filename || "temp_script.py");
        // Ensure tmp dir exists
        if (!fs.existsSync(path.join(process.cwd(), "tmp"))) {
          fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
        }

        await fs.promises.writeFile(scriptPath, code);

        const pythonCmd = ctx.config.pythonPath || "py -3";
        try {
          const { stdout, stderr } = await execAsync(`${pythonCmd} "${scriptPath}"`);
          return {
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
          };
        } catch (error: any) {
          return {
            success: false,
            stdout: error.stdout?.trim() || "",
            stderr: error.stderr?.trim() || error.message,
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
