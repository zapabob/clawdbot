#!/usr/bin/env node
import { spawnSync } from "node:child_process";
/**
 * Cross-platform A2UI bundle step (same behavior as scripts/bundle-a2ui.sh).
 * Use this on Windows when `bash` / WSL is unavailable or the LxssManager service is disabled.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const HASH_FILE = path.join(ROOT_DIR, "src/canvas-host/a2ui/.bundle.hash");
const OUTPUT_FILE = path.join(ROOT_DIR, "src/canvas-host/a2ui/a2ui.bundle.js");
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, "vendor/a2ui/renderers/lit");
const A2UI_APP_DIR = path.join(ROOT_DIR, "apps/shared/OpenClawKit/Tools/CanvasA2UI");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function onError() {
  console.error("A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle");
  console.error("If this persists, verify pnpm deps and try again.");
}

function walkFilesSync(dir, out) {
  if (!fs.existsSync(dir)) {
    return;
  }
  const st = fs.statSync(dir);
  if (!st.isDirectory()) {
    if (st.isFile()) {
      out.push(dir);
    }
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    walkFilesSync(path.join(dir, name), out);
  }
}

function computeHash(inputPaths) {
  const files = [];
  const normalize = (p) => p.split(path.sep).join("/");
  for (const input of inputPaths) {
    if (!fs.existsSync(input)) {
      continue;
    }
    const st = fs.statSync(input);
    if (st.isDirectory()) {
      walkFilesSync(input, files);
    } else if (st.isFile()) {
      files.push(input);
    }
  }
  files.sort((a, b) => normalize(a).localeCompare(normalize(b)));
  const hash = createHash("sha256");
  for (const filePath of files) {
    const rel = normalize(path.relative(ROOT_DIR, filePath));
    hash.update(rel);
    hash.update("\0");
    hash.update(fs.readFileSync(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function findRolldownCli() {
  const pnpmHoist = path.join(ROOT_DIR, "node_modules/.pnpm/node_modules/rolldown/bin/cli.mjs");
  if (fs.existsSync(pnpmHoist)) {
    return pnpmHoist;
  }
  const pnpmDir = path.join(ROOT_DIR, "node_modules/.pnpm");
  try {
    for (const name of fs.readdirSync(pnpmDir)) {
      if (name.startsWith("rolldown@")) {
        const cli = path.join(pnpmDir, name, "node_modules/rolldown/bin/cli.mjs");
        if (fs.existsSync(cli)) {
          return cli;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function rolldownInPathWorks() {
  const r = spawnSync("rolldown", ["--version"], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    shell: true,
  });
  return r.status === 0;
}

function runRolldown() {
  const config = path.join(A2UI_APP_DIR, "rolldown.config.mjs");
  const args = ["-c", config];

  if (rolldownInPathWorks()) {
    const r = spawnSync("rolldown", args, { cwd: ROOT_DIR, stdio: "inherit", shell: true });
    if (r.status === 0) {
      return;
    }
  }

  const cli = findRolldownCli();
  if (cli) {
    const r = spawnSync(process.execPath, [cli, ...args], { cwd: ROOT_DIR, stdio: "inherit" });
    if (r.status === 0) {
      return;
    }
  }

  const r = spawnSync("pnpm", ["-s", "dlx", "rolldown", ...args], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) {
    onError();
    process.exit(1);
  }
}

// --- main ---
if (
  !fs.existsSync(A2UI_RENDERER_DIR) ||
  !fs.existsSync(A2UI_APP_DIR) ||
  !fs.existsSync(path.join(A2UI_RENDERER_DIR, "tsconfig.json"))
) {
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log("A2UI sources missing; keeping prebuilt bundle.");
    process.exit(0);
  }
  fail(`A2UI sources missing and no prebuilt bundle found at: ${OUTPUT_FILE}`);
}

const INPUT_PATHS = [
  path.join(ROOT_DIR, "package.json"),
  path.join(ROOT_DIR, "pnpm-lock.yaml"),
  A2UI_RENDERER_DIR,
  A2UI_APP_DIR,
];

const currentHash = computeHash(INPUT_PATHS);
if (fs.existsSync(HASH_FILE)) {
  const previousHash = fs.readFileSync(HASH_FILE, "utf8").trim();
  if (previousHash === currentHash && fs.existsSync(OUTPUT_FILE)) {
    console.log("A2UI bundle up to date; skipping.");
    process.exit(0);
  }
}

const tsc = spawnSync(
  "pnpm",
  ["-s", "exec", "tsc", "-p", path.join(A2UI_RENDERER_DIR, "tsconfig.json")],
  {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: true,
  },
);
if (tsc.status !== 0) {
  onError();
  process.exit(1);
}

runRolldown();

fs.writeFileSync(HASH_FILE, `${currentHash}\n`, "utf8");
