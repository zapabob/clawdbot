#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HASH_FILE = path.join(ROOT_DIR, "src", "canvas-host", "a2ui", ".bundle.hash");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "canvas-host", "a2ui", "a2ui.bundle.js");
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, "vendor", "a2ui", "renderers", "lit");
const A2UI_RENDERER_TSCONFIG = path.join(A2UI_RENDERER_DIR, "tsconfig.json");
const A2UI_APP_DIR = path.join(ROOT_DIR, "apps", "shared", "OpenClawKit", "Tools", "CanvasA2UI");
const A2UI_ROLLDOWN_CONFIG = path.join(A2UI_APP_DIR, "rolldown.config.mjs");

const INPUT_PATHS = [
  path.join(ROOT_DIR, "package.json"),
  path.join(ROOT_DIR, "pnpm-lock.yaml"),
  A2UI_RENDERER_TSCONFIG,
  A2UI_APP_DIR,
];

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function resolveCommand(command) {
  if (process.platform !== "win32") {
    return command;
  }
  if (command === "pnpm") {
    return "pnpm.cmd";
  }
  return command;
}

function shouldSkipForMissingSources() {
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log("A2UI sources missing; keeping prebuilt bundle.");
    return true;
  }
  if (process.env.OPENCLAW_SPARSE_PROFILE || process.env.OPENCLAW_A2UI_SKIP_MISSING === "1") {
    console.error(
      "A2UI sources missing; skipping bundle because OPENCLAW_A2UI_SKIP_MISSING=1 or OPENCLAW_SPARSE_PROFILE is set.",
    );
    return true;
  }
  return false;
}

function walk(entryPath, files) {
  const stat = fs.statSync(entryPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(entryPath)) {
      walk(path.join(entryPath, entry), files);
    }
    return;
  }
  files.push(entryPath);
}

function computeHash() {
  const files = [];
  for (const input of INPUT_PATHS) {
    walk(input, files);
  }
  files.sort((a, b) =>
    a.split(path.sep).join("/").localeCompare(b.split(path.sep).join("/")),
  );

  const hash = createHash("sha256");
  for (const filePath of files) {
    hash.update(path.relative(ROOT_DIR, filePath).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function run(command, args) {
  const resolvedCommand = resolveCommand(command);
  const result = spawnSync(resolvedCommand, args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: process.platform === "win32" && path.extname(resolvedCommand).toLowerCase() === ".cmd",
  });
  if (result.error) {
    fail(
      `A2UI bundling failed while launching ${resolvedCommand}: ${result.error.message}`,
    );
  }
  if ((result.status ?? 1) !== 0) {
    fail(
      `A2UI bundling failed while running ${resolvedCommand} ${args.join(" ")}. Re-run with: pnpm canvas:a2ui:bundle`,
    );
  }
}

function resolveRolldownBin() {
  const candidates = [
    path.join(ROOT_DIR, "node_modules", ".pnpm", "node_modules", "rolldown", "bin", "cli.mjs"),
    path.join(
      ROOT_DIR,
      "node_modules",
      ".pnpm",
      "rolldown@1.0.0-rc.9",
      "node_modules",
      "rolldown",
      "bin",
      "cli.mjs",
    ),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

if (
  !fs.existsSync(A2UI_RENDERER_DIR) ||
  !fs.existsSync(A2UI_APP_DIR) ||
  !fs.existsSync(A2UI_RENDERER_TSCONFIG) ||
  !fs.existsSync(A2UI_ROLLDOWN_CONFIG)
) {
  if (shouldSkipForMissingSources()) {
    process.exit(0);
  }
  fail(`A2UI sources missing and no prebuilt bundle found at: ${OUTPUT_FILE}`);
}

const currentHash = computeHash();
if (fs.existsSync(HASH_FILE) && fs.existsSync(OUTPUT_FILE)) {
  const previousHash = fs.readFileSync(HASH_FILE, "utf8").trim();
  if (previousHash === currentHash) {
    console.log("A2UI bundle up to date; skipping.");
    process.exit(0);
  }
}

run("pnpm", ["-s", "exec", "tsc", "-p", A2UI_RENDERER_TSCONFIG]);

const rolldownBin = resolveRolldownBin();
if (rolldownBin) {
  run(process.execPath, [rolldownBin, "-c", A2UI_ROLLDOWN_CONFIG]);
} else {
  run("pnpm", ["-s", "dlx", "rolldown", "-c", A2UI_ROLLDOWN_CONFIG]);
}

fs.writeFileSync(HASH_FILE, `${currentHash}\n`, "utf8");
