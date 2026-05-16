import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import electronPath from "electron";

const companionDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
delete env.NODE_OPTIONS;

const child = spawn(electronPath, ["electron/main.js"], {
  cwd: companionDir,
  env,
  stdio: "inherit",
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
