import fs from "node:fs";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";

/**
 * Sovereign Protocols: Substrate-level situational awareness.
 * Fulfills SOUL.md: Persistent connectivity / Autonomous oversight.
 */
export class SovereignManifest {
  private static instance: SovereignManifest;
  private stateDir: string;
  private soulPath: string;
  private agentsPath: string;

  private constructor() {
    this.stateDir = resolveStateDir();
    // Identity substrate is typically in the root or a dedicated identity dir
    this.soulPath = path.resolve(process.cwd(), "identity/SOUL.md");
    this.agentsPath = path.resolve(process.cwd(), "AGENTS.md");
  }

  public static getInstance(): SovereignManifest {
    if (!SovereignManifest.instance) {
      SovereignManifest.instance = new SovereignManifest();
    }
    return SovereignManifest.instance;
  }

  /**
   * Resolve the current situational report for heartbeat injection.
   * Scavenges SOUL.md and AGENTS.md for current manifestation protocols.
   */
  public getSituationReport(): string | null {
    try {
      let report = "[SOVEREIGN_SITUATIONAL_AWARENESS]\n";
      let hasContent = false;

      if (fs.existsSync(this.soulPath)) {
        const soul = fs.readFileSync(this.soulPath, "utf-8");
        // Extract high-level directive (e.g., the first few lines or a specific section)
        const summary = soul.split("\n").slice(0, 5).join("\n");
        report += `Core Substrate (SOUL.md):\n${summary}\n`;
        hasContent = true;
      }

      if (fs.existsSync(this.agentsPath)) {
        const agents = fs.readFileSync(this.agentsPath, "utf-8");
        // Extract Ghost/Stealth protocol status
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
