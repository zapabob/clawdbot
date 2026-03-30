#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { BUNDLED_PLUGIN_PATH_PREFIX } from "./lib/bundled-plugin-paths.mjs";

const logLevel = process.env.OPENCLAW_BUILD_VERBOSE ? "info" : "warn";
const extraArgs = process.argv.slice(2);
const INEFFECTIVE_DYNAMIC_IMPORT_RE = /\[INEFFECTIVE_DYNAMIC_IMPORT\]/;
const UNRESOLVED_IMPORT_RE = /\[UNRESOLVED_IMPORT\]/;
const ANSI_ESCAPE_RE = new RegExp(String.raw`\u001B\[[0-9;]*m`, "g");

function removeDistPluginNodeModulesSymlinks(rootDir) {
  const extensionsDir = path.join(rootDir, "extensions");
  if (!fs.existsSync(extensionsDir)) {
    return;
  }

  for (const dirent of fs.readdirSync(extensionsDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const nodeModulesPath = path.join(extensionsDir, dirent.name, "node_modules");
    try {
      if (fs.lstatSync(nodeModulesPath).isSymbolicLink()) {
        fs.rmSync(nodeModulesPath, { force: true, recursive: true });
      }
    } catch {
      // Skip missing or unreadable paths so the build can proceed.
    }
  }
}

function pruneStaleRuntimeSymlinks() {
  const cwd = process.cwd();
  // runtime-postbuild stages plugin-owned node_modules into dist/ and links the
  // dist-runtime overlay back to that tree. Remove only those symlinks up front
  // so tsdown's clean step cannot traverse stale runtime overlays on rebuilds.
  removeDistPluginNodeModulesSymlinks(path.join(cwd, "dist"));
  removeDistPluginNodeModulesSymlinks(path.join(cwd, "dist-runtime"));
}

pruneStaleRuntimeSymlinks();

/** Maps abnormal spawn status (e.g. -1 on Windows) to 1 so pnpm does not report 4294967295. */
function normalizeSpawnExitCode(status) {
  if (status === 0) {
    return 0;
  }
  if (typeof status !== "number" || Number.isNaN(status)) {
    return 1;
  }
  if (status < 0 || status > 255) {
    return 1;
  }
  return status;
}

function findFatalUnresolvedImport(lines) {
  for (const line of lines) {
    if (!UNRESOLVED_IMPORT_RE.test(line)) {
      continue;
    }

    const normalizedLine = line.replace(ANSI_ESCAPE_RE, "");
    if (
      !normalizedLine.includes(BUNDLED_PLUGIN_PATH_PREFIX) &&
      !normalizedLine.includes("node_modules/")
    ) {
      return normalizedLine;
    }
  }

  return null;
}

// #region agent log
try {
  fs.appendFileSync(
    path.join(process.cwd(), "debug-2f4832.log"),
    `${JSON.stringify({
      sessionId: "2f4832",
      runId: "gateway-hang",
      hypothesisId: "H10",
      location: "scripts/tsdown-build.mjs:before-spawnSync",
      message: "about to spawnSync pnpm exec tsdown",
      data: { logLevel, extraArgCount: extraArgs.length, platform: process.platform },
      timestamp: Date.now(),
    })}\n`,
  );
} catch {
  /* ignore */
}
// #endregion
const require = createRequire(import.meta.url);
const tsdownPackagePath = require.resolve("tsdown/package.json");
const tsdownRunPath = path.join(path.dirname(tsdownPackagePath), "dist", "run.mjs");
const result = spawnSync(
  process.execPath,
  [tsdownRunPath, "--config-loader", "unrun", "--logLevel", logLevel, ...extraArgs],
  {
    encoding: "utf8",
    stdio: "pipe",
    shell: false,
    timeout: 300000,
  },
);

// #region agent log
try {
  fs.appendFileSync(
    path.join(process.cwd(), "debug-2f4832.log"),
    `${JSON.stringify({
      sessionId: "2f4832",
      runId: "gateway-hang",
      hypothesisId: "H13",
      location: "scripts/tsdown-build.mjs:spawnSync-returned",
      message: "tsdown spawnSync returned",
      data: { status: result.status, signal: result.signal, error: result.error?.message ?? null },
      timestamp: Date.now(),
    })}\n`,
  );
} catch {}
// #endregion

const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
if (stdout) {
  process.stdout.write(stdout);
}
if (stderr) {
  process.stderr.write(stderr);
}

// #region agent log
try {
  fs.appendFileSync(
    path.join(process.cwd(), "debug-2f4832.log"),
    `${JSON.stringify({
      sessionId: "2f4832",
      hypothesisId: "H1",
      location: "scripts/tsdown-build.mjs:post-spawnSync",
      message: "tsdown spawn result",
      data: {
        status: result.status,
        normalizedExit: normalizeSpawnExitCode(result.status),
        signal: result.signal,
        spawnError: result.error?.message,
        stdoutLen: stdout.length,
        stderrLen: stderr.length,
        platform: process.platform,
        runId: "post-fix",
      },
      timestamp: Date.now(),
    })}\n`,
  );
} catch {
  /* ignore */
}
// #endregion

if (result.status === 0 && INEFFECTIVE_DYNAMIC_IMPORT_RE.test(`${stdout}\n${stderr}`)) {
  console.error(
    "Build emitted [INEFFECTIVE_DYNAMIC_IMPORT]. Replace transparent runtime re-export facades with real runtime boundaries.",
  );
  process.exit(1);
}

const fatalUnresolvedImport =
  result.status === 0 ? findFatalUnresolvedImport(`${stdout}\n${stderr}`.split("\n")) : null;

if (fatalUnresolvedImport) {
  console.error(`Build emitted [UNRESOLVED_IMPORT] outside extensions: ${fatalUnresolvedImport}`);
  process.exit(1);
}

process.exit(normalizeSpawnExitCode(result.status));
