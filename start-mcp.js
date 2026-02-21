#!/usr/bin/env node
/**
 * start-mcp.js — Gateway + MCP launcher
 * Called by Desktop\OpenClaw.lnk → OpenClaw-Launcher.ps1 → Button 1
 *
 * Starts the OpenClaw gateway with --force so it kills any stale process
 * already bound to the gateway port before starting fresh.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("===================================================");
console.log(" 🦞 OpenClaw Gateway + MCP Starting...");
console.log("===================================================");

const runNode = path.join(__dirname, "scripts", "run-node.mjs");

const child = spawn(process.execPath, [runNode, "gateway", "--force"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.log(`\n[OpenClaw] Terminated by signal: ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error("[OpenClaw] Failed to start:", err.message);
  process.exit(1);
});
