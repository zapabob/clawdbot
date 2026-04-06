#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { resolveGitHead, writeBuildStamp as writeDistBuildStamp } from "./build-stamp.mjs";
import {
  BUNDLED_PLUGIN_PATH_PREFIX,
  BUNDLED_PLUGIN_ROOT_DIR,
} from "./lib/bundled-plugin-paths.mjs";
import { runRuntimePostBuild } from "./runtime-postbuild.mjs";

const buildScript = "scripts/tsdown-build.mjs";
const compilerArgs = [buildScript, "--no-clean"];

const runNodeSourceRoots = ["src", BUNDLED_PLUGIN_ROOT_DIR];
const runNodeConfigFiles = ["tsconfig.json", "package.json", "tsdown.config.ts"];
export const runNodeWatchedPaths = [...runNodeSourceRoots, ...runNodeConfigFiles];
const extensionSourceFilePattern = /\.(?:[cm]?[jt]sx?)$/;
const extensionRestartMetadataFiles = new Set(["openclaw.plugin.json", "package.json"]);

const normalizePath = (filePath) => String(filePath ?? "").replaceAll("\\", "/");

const isIgnoredSourcePath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  return (
    normalizedPath.endsWith(".test.ts") ||
    normalizedPath.endsWith(".test.tsx") ||
    normalizedPath.endsWith("test-helpers.ts")
  );
};

const isBuildRelevantSourcePath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  return extensionSourceFilePattern.test(normalizedPath) && !isIgnoredSourcePath(normalizedPath);
};

export const isBuildRelevantRunNodePath = (repoPath) => {
  const normalizedPath = normalizePath(repoPath).replace(/^\.\/+/, "");
  if (runNodeConfigFiles.includes(normalizedPath)) {
    return true;
  }
  if (normalizedPath.startsWith("src/")) {
    return !isIgnoredSourcePath(normalizedPath.slice("src/".length));
  }
  if (normalizedPath.startsWith(BUNDLED_PLUGIN_PATH_PREFIX)) {
    return isBuildRelevantSourcePath(normalizedPath.slice(BUNDLED_PLUGIN_PATH_PREFIX.length));
  }
  return false;
};

const isRestartRelevantExtensionPath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  if (extensionRestartMetadataFiles.has(path.posix.basename(normalizedPath))) {
    return true;
  }
  return isBuildRelevantSourcePath(normalizedPath);
};

export const isRestartRelevantRunNodePath = (repoPath) => {
  const normalizedPath = normalizePath(repoPath).replace(/^\.\/+/, "");
  if (runNodeConfigFiles.includes(normalizedPath)) {
    return true;
  }
  if (normalizedPath.startsWith("src/")) {
    return !isIgnoredSourcePath(normalizedPath.slice("src/".length));
  }
  if (normalizedPath.startsWith(BUNDLED_PLUGIN_PATH_PREFIX)) {
    return isRestartRelevantExtensionPath(normalizedPath.slice(BUNDLED_PLUGIN_PATH_PREFIX.length));
  }
  return false;
};

const statMtime = (filePath, fsImpl = fs) => {
  try {
    return fsImpl.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
};

const isExcludedSource = (filePath, sourceRoot, sourceRootName) => {
  const relativePath = normalizePath(path.relative(sourceRoot, filePath));
  if (relativePath.startsWith("..")) {
    return false;
  }
  return !isBuildRelevantRunNodePath(path.posix.join(sourceRootName, relativePath));
};

const findLatestMtime = (dirPath, shouldSkip, deps) => {
  let latest = null;
  const queue = [dirPath];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }
    let entries = [];
    try {
      entries = deps.fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (shouldSkip?.(fullPath)) {
        continue;
      }
      const mtime = statMtime(fullPath, deps.fs);
      if (mtime == null) {
        continue;
      }
      if (latest == null || mtime > latest) {
        latest = mtime;
      }
    }
  }
  return latest;
};

const readGitStatus = (deps) => {
  try {
    const result = deps.spawnSync(
      "git",
      ["status", "--porcelain", "--untracked-files=normal", "--", ...runNodeWatchedPaths],
      {
        cwd: deps.cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    if (result.status !== 0) {
      return null;
    }
    return result.stdout ?? "";
  } catch {
    return null;
  }
};

const parseGitStatusPaths = (output) =>
  output
    .split("\n")
    .flatMap((line) => line.slice(3).split(" -> "))
    .map((entry) => normalizePath(entry.trim()))
    .filter(Boolean);

const hasDirtySourceTree = (deps) => {
  const output = readGitStatus(deps);
  if (output === null) {
    return null;
  }
  return parseGitStatusPaths(output).some((repoPath) => isBuildRelevantRunNodePath(repoPath));
};

const readBuildStamp = (deps) => {
  const mtime = statMtime(deps.buildStampPath, deps.fs);
  if (mtime == null) {
    return { mtime: null, head: null };
  }
  try {
    const raw = deps.fs.readFileSync(deps.buildStampPath, "utf8").trim();
    if (!raw.startsWith("{")) {
      return { mtime, head: null };
    }
    const parsed = JSON.parse(raw);
    const head = typeof parsed?.head === "string" && parsed.head.trim() ? parsed.head.trim() : null;
    return { mtime, head };
  } catch {
    return { mtime, head: null };
  }
};

const hasSourceMtimeChanged = (stampMtime, deps) => {
  let latestSourceMtime = null;
  for (const sourceRoot of deps.sourceRoots) {
    const sourceMtime = findLatestMtime(
      sourceRoot.path,
      (candidate) => isExcludedSource(candidate, sourceRoot.path, sourceRoot.name),
      deps,
    );
    if (sourceMtime != null && (latestSourceMtime == null || sourceMtime > latestSourceMtime)) {
      latestSourceMtime = sourceMtime;
    }
  }
  return latestSourceMtime != null && latestSourceMtime > stampMtime;
};

export const resolveBuildRequirement = (deps) => {
  if (deps.env.OPENCLAW_FORCE_BUILD === "1") {
    return { shouldBuild: true, reason: "force_build" };
  }
  if (deps.env.OPENCLAW_RUNNODE_SKIP_BUILD === "1" && statMtime(deps.distEntry, deps.fs) != null) {
    return { shouldBuild: false, reason: "skip_build_env" };
  }
  const stamp = readBuildStamp(deps);
  if (stamp.mtime == null) {
    return { shouldBuild: true, reason: "missing_build_stamp" };
  }
  if (statMtime(deps.distEntry, deps.fs) == null) {
    return { shouldBuild: true, reason: "missing_dist_entry" };
  }

  for (const filePath of deps.configFiles) {
    const mtime = statMtime(filePath, deps.fs);
    if (mtime != null && mtime > stamp.mtime) {
      return { shouldBuild: true, reason: "config_newer" };
    }
  }

  const currentHead = resolveGitHead(deps);
  if (currentHead && !stamp.head) {
    return { shouldBuild: true, reason: "build_stamp_missing_head" };
  }
  if (currentHead && stamp.head && currentHead !== stamp.head) {
    return { shouldBuild: true, reason: "git_head_changed" };
  }
  if (currentHead) {
    const dirty = hasDirtySourceTree(deps);
    if (dirty === true) {
      return { shouldBuild: true, reason: "dirty_watched_tree" };
    }
    if (dirty === false) {
      return { shouldBuild: false, reason: "clean" };
    }
  }

  if (hasSourceMtimeChanged(stamp.mtime, deps)) {
    return { shouldBuild: true, reason: "source_mtime_newer" };
  }
  return { shouldBuild: false, reason: "clean" };
};

const BUILD_REASON_LABELS = {
  force_build: "forced by OPENCLAW_FORCE_BUILD",
  skip_build_env: "skipped via OPENCLAW_RUNNODE_SKIP_BUILD=1 (dist/entry.js present)",
  missing_build_stamp: "build stamp missing",
  missing_dist_entry: "dist entry missing",
  config_newer: "config newer than build stamp",
  build_stamp_missing_head: "build stamp missing git head",
  git_head_changed: "git head changed",
  dirty_watched_tree: "dirty watched source tree",
  source_mtime_newer: "source mtime newer than build stamp",
  clean: "clean",
};

const formatBuildReason = (reason) => BUILD_REASON_LABELS[reason] ?? reason;

const SIGNAL_EXIT_CODES = {
  SIGINT: 130,
  SIGTERM: 143,
};

const isSignalKey = (signal) => Object.hasOwn(SIGNAL_EXIT_CODES, signal);

const getSignalExitCode = (signal) => (isSignalKey(signal) ? SIGNAL_EXIT_CODES[signal] : 1);

const logRunner = (message, deps) => {
  if (deps.env.OPENCLAW_RUNNER_LOG === "0") {
    return;
  }
  deps.stderr.write(`[openclaw] ${message}\n`);
};

const waitForSpawnedProcess = async (childProcess, deps) => {
  let forwardedSignal = null;
  let onSigInt;
  let onSigTerm;

  const cleanupSignals = () => {
    if (onSigInt) {
      deps.process.off("SIGINT", onSigInt);
    }
    if (onSigTerm) {
      deps.process.off("SIGTERM", onSigTerm);
    }
  };

  const forwardSignal = (signal) => {
    if (forwardedSignal) {
      return;
    }
    forwardedSignal = signal;
    try {
      childProcess.kill?.(signal);
    } catch {
      // Best-effort only. Exit handling still happens via the child "exit" event.
    }
  };

  onSigInt = () => {
    forwardSignal("SIGINT");
  };
  onSigTerm = () => {
    forwardSignal("SIGTERM");
  };

  deps.process.on("SIGINT", onSigInt);
  deps.process.on("SIGTERM", onSigTerm);

  try {
    return await new Promise((resolve) => {
      childProcess.on("exit", (exitCode, exitSignal) => {
        resolve({ exitCode, exitSignal, forwardedSignal });
      });
    });
  } finally {
    cleanupSignals();
  }
};

const runOpenClaw = async (deps) => {
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(deps.cwd, "debug-2f4832.log"),
      `${JSON.stringify({
        sessionId: "2f4832",
        runId: "gateway-hang",
        hypothesisId: "H11",
        location: "scripts/run-node.mjs:before-openclaw-spawn",
        message: "about to spawn openclaw.mjs",
        data: { args: deps.args },
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
  const nodeProcess = deps.spawn(deps.execPath, ["openclaw.mjs", ...deps.args], {
    cwd: deps.cwd,
    env: deps.env,
    stdio: "inherit",
  });
  const res = await waitForSpawnedProcess(nodeProcess, deps);
  if (res.exitSignal) {
    return getSignalExitCode(res.exitSignal);
  }
  if (res.forwardedSignal) {
    return getSignalExitCode(res.forwardedSignal);
  }
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(deps.cwd, "debug-2f4832.log"),
      `${JSON.stringify({
        sessionId: "2f4832",
        runId: "gateway-hang",
        hypothesisId: "H11",
        location: "scripts/run-node.mjs:openclaw-exit-code",
        message: "openclaw process exited",
        data: { exitCode: res.exitCode ?? null },
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
  return normalizeCliExitCode(res.exitCode ?? 1);
};

const formatRuntimeArtifactErrorDetails = (error) => {
  const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
  const message = String(error?.message ?? "unknown error");
  const firstStackLine =
    typeof error?.stack === "string"
      ? error.stack.split("\n").find((line) => line.trim().length > 0)
      : "";
  return { code, message, firstStackLine: firstStackLine ?? "" };
};

const syncRuntimeArtifacts = async (deps) => {
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(deps.cwd, "debug-2f4832.log"),
      `${JSON.stringify({
        sessionId: "2f4832",
        runId: "gateway-hang",
        hypothesisId: "H15",
        location: "scripts/run-node.mjs:before-syncRuntimeArtifacts",
        message: "about to run runtime postbuild sync",
        data: {},
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      runRuntimePostBuild({ cwd: deps.cwd });
      break;
    } catch (error) {
      if (!isTransientRuntimeArtifactError(error) || attempt === maxAttempts) {
        const details = formatRuntimeArtifactErrorDetails(error);
        logRunner(
          `Failed to write runtime build artifacts: ${details.message} (code=${details.code})`,
          deps,
        );
        if (details.firstStackLine) {
          logRunner(`Runtime artifact failure stack(head): ${details.firstStackLine}`, deps);
        }
        return false;
      }
      const details = formatRuntimeArtifactErrorDetails(error);
      logRunner(
        `Runtime artifact sync retry ${attempt}/${maxAttempts} after ${details.code}: ${details.message}`,
        deps,
      );
      await delay(150 * attempt);
    }
  }
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(deps.cwd, "debug-2f4832.log"),
      `${JSON.stringify({
        sessionId: "2f4832",
        runId: "gateway-hang",
        hypothesisId: "H15",
        location: "scripts/run-node.mjs:after-syncRuntimeArtifacts",
        message: "runtime postbuild sync finished",
        data: {},
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
  return true;
};

const writeBuildStamp = (deps) => {
  try {
    writeDistBuildStamp({
      cwd: deps.cwd,
      fs: deps.fs,
      spawnSync: deps.spawnSync,
    });
  } catch (error) {
    // Best-effort stamp; still allow the runner to start.
    logRunner(`Failed to write build stamp: ${error?.message ?? "unknown error"}`, deps);
  }
};

const shouldSkipCleanWatchRuntimeSync = (deps) => deps.env.OPENCLAW_WATCH_MODE === "1";

export async function runNodeMain(params = {}) {
  const deps = {
    spawn: params.spawn ?? spawn,
    spawnSync: params.spawnSync ?? spawnSync,
    fs: params.fs ?? fs,
    stderr: params.stderr ?? process.stderr,
    process: params.process ?? process,
    execPath: params.execPath ?? process.execPath,
    cwd: params.cwd ?? process.cwd(),
    args: params.args ?? process.argv.slice(2),
    env: params.env ? { ...params.env } : { ...process.env },
    runRuntimePostBuild: params.runRuntimePostBuild ?? runRuntimePostBuild,
  };

  deps.distRoot = path.join(deps.cwd, "dist");
  deps.distEntry = path.join(deps.distRoot, "/entry.js");
  deps.buildStampPath = path.join(deps.distRoot, ".buildstamp");
  deps.sourceRoots = runNodeSourceRoots.map((sourceRoot) => ({
    name: sourceRoot,
    path: path.join(deps.cwd, sourceRoot),
  }));
  deps.configFiles = runNodeConfigFiles.map((filePath) => path.join(deps.cwd, filePath));

  const buildRequirement = resolveBuildRequirement(deps);
  if (!buildRequirement.shouldBuild) {
    if (!shouldSkipCleanWatchRuntimeSync(deps) && !(await syncRuntimeArtifacts(deps))) {
      return 1;
    }
    // #region agent log
    try {
      fs.appendFileSync(
        path.join(deps.cwd, "debug-2f4832.log"),
        `${JSON.stringify({
          sessionId: "2f4832",
          runId: "gateway-hang",
          hypothesisId: "H11",
          location: "scripts/run-node.mjs:before-runOpenClaw-noBuild",
          message: "about to run openclaw without build",
          data: { args: deps.args },
          timestamp: Date.now(),
        })}\n`,
      );
    } catch {
      /* ignore */
    }
    // #endregion
    return await runOpenClaw(deps);
  }

  logRunner(
    `Building TypeScript (dist is stale: ${buildRequirement.reason} - ${formatBuildReason(buildRequirement.reason)}).`,
    deps,
  );
  const buildCmd = deps.execPath;
  const buildArgs = compilerArgs;
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(deps.cwd, "debug-2f4832.log"),
      `${JSON.stringify({
        sessionId: "2f4832",
        runId: "gateway-hang",
        hypothesisId: "H10",
        location: "scripts/run-node.mjs:before-tsdown-build",
        message: "about to spawn tsdown build",
        data: { buildCmd, buildArgs },
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
  const build = deps.spawn(buildCmd, buildArgs, {
    cwd: deps.cwd,
    env: deps.env,
    stdio: "inherit",
  });

  const buildRes = await waitForSpawnedProcess(build, deps);
  if (buildRes.exitSignal) {
    return getSignalExitCode(buildRes.exitSignal);
  }
  if (buildRes.forwardedSignal) {
    return getSignalExitCode(buildRes.forwardedSignal);
  }
  if (buildRes.exitCode !== 0 && buildRes.exitCode !== null) {
    return normalizeCliExitCode(buildRes.exitCode);
  }
  if (!(await syncRuntimeArtifacts(deps))) {
    return 1;
  }
  writeBuildStamp(deps);
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(deps.cwd, "debug-2f4832.log"),
      `${JSON.stringify({
        sessionId: "2f4832",
        runId: "gateway-hang",
        hypothesisId: "H11",
        location: "scripts/run-node.mjs:before-runOpenClaw-afterBuild",
        message: "about to run openclaw after build",
        data: { args: deps.args },
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
  return await runOpenClaw(deps);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runNodeMain()
    .then((code) => process.exit(normalizeCliExitCode(code)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
