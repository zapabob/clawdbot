#!/usr/bin/env node
import { spawn, execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GATEWAY_PORT = 18789;
const MCP_PORT = 3000;

function isPortInUse(port) {
  try {
    if (process.platform === "win32") {
      execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: "pipe" });
      return true;
    } else {
      execSync(`lsof -i :${port}`, { encoding: "utf8", stdio: "pipe" });
      return true;
    }
  } catch {
    return false;
  }
}

async function waitForGateway(port, timeout = 60000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (isPortInUse(port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log("🦞 OpenClaw Gateway + MCP Server Launcher\n");
  console.log("==========================================\n");

  const scriptsDir = join(__dirname, "scripts");

  if (!existsSync(join(scriptsDir, "run-node.mjs"))) {
    console.error("❌ Error: scripts/run-node.mjs not found");
    console.error("   Make sure you're in the correct directory");
    process.exit(1);
  }

  if (isPortInUse(GATEWAY_PORT)) {
    console.log(`⚠️  Port ${GATEWAY_PORT} is already in use.`);
    console.log("   Assuming gateway is already running...\n");
  } else {
    console.log("1️⃣  Starting OpenClaw Gateway...");
    spawn("node", ["scripts/run-node.mjs", "gateway"], {
      cwd: __dirname,
      env: { ...process.env, OPENCLAW_SKIP_CHANNELS: "1", CLAWDBOT_SKIP_CHANNELS: "1" },
      stdio: "inherit",
    });
    console.log("   Waiting for gateway...");
    const ready = await waitForGateway(GATEWAY_PORT);
    if (!ready) {
      console.error(`\n❌ Gateway failed to start within 60 seconds`);
      process.exit(1);
    }
    console.log(`   ✅ Gateway ready on port ${GATEWAY_PORT}\n`);
  }

  if (isPortInUse(MCP_PORT)) {
    console.log(`⚠️  Port ${MCP_PORT} is already in use.`);
    console.log("   Assuming MCP server is already running...\n");
  } else {
    console.log("2️⃣  Starting MCP Server...");
    spawn("node", ["gemini-mcp-server.js"], {
      cwd: __dirname,
      stdio: "inherit",
    });
    console.log(`   ✅ MCP Server ready on port ${MCP_PORT}\n`);
  }

  console.log("==========================================");
  console.log("🚀 All services running!");
  console.log(`   - Gateway:  ws://localhost:${GATEWAY_PORT}`);
  console.log(`   - MCP:      http://localhost:${MCP_PORT}/health`);
  console.log("\n   Press Ctrl+C to stop\n");

  await new Promise(() => {});
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
