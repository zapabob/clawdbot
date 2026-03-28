import fs from "node:fs";
import path from "node:path";
import { resolveUserPath } from "../utils.js";

/**
 * Sovereign Protocols: Substrate-level situational awareness.
 * Fulfills SOUL.md: Persistent connectivity / Autonomous oversight.
 */
export class SovereignManifest {
  private static instance: SovereignManifest;

  private constructor() {}

  public static getInstance(): SovereignManifest {
    if (!SovereignManifest.instance) {
      SovereignManifest.instance = new SovereignManifest();
    }
    return SovereignManifest.instance;
  }

  private static resolveWorkspaceRoot(workspaceRoot?: string): string {
    const trimmed = workspaceRoot?.trim() ?? "";
    if (trimmed) {
      return path.resolve(resolveUserPath(trimmed));
    }
    return path.resolve(process.cwd());
  }

  /**
   * Resolve the current situational report for heartbeat injection.
   * Scavenges identity/SOUL.md and AGENTS.md under the agent workspace (fallback: cwd).
   */
  public getSituationReport(workspaceRoot?: string): string | null {
    try {
      const root = SovereignManifest.resolveWorkspaceRoot(workspaceRoot);
      const soulPath = path.join(root, "identity", "SOUL.md");
      const agentsPath = path.join(root, "AGENTS.md");

      let report = "[SOVEREIGN_SITUATIONAL_AWARENESS]\n";
      let hasContent = false;

      if (fs.existsSync(soulPath)) {
        const soul = fs.readFileSync(soulPath, "utf-8");
        const summary = soul.split("\n").slice(0, 5).join("\n");
        report += `Core Substrate (SOUL.md):\n${summary}\n`;
        hasContent = true;
      }

      if (fs.existsSync(agentsPath)) {
        const agents = fs.readFileSync(agentsPath, "utf-8");
        if (agents.includes("Ghost Protocol")) {
          report += "Protocol: Ghost Oversight active.\n";
          hasContent = true;
        }
        if (agents.includes("Stealth Protocol")) {
          report += "Protocol: Stealth Heuristics engaged.\n";
          hasContent = true;
        }
      }

      return hasContent ? report : null;
    } catch {
      return null;
    }
  }

  /** Initialize the sovereign substrate (e.g., monitor tunnels). */
  public async initialize(): Promise<void> {
    // Initialization logic for ngrok/tunnels can be hooked here.
    // Fulfills SI-01: Persistent substrate manifestation.
  }
}
