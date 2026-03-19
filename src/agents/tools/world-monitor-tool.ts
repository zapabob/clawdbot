import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

const WorldMonitorSchema = Type.Object({
  force_refresh: Type.Boolean({
    description:
      "If true, requests a fresh scan from the Ghost Substrate. Otherwise uses the latest cached report.",
    default: true,
  }),
});

export function createWorldMonitorTool(options: { workspaceDir: string }): AnyAgentTool {
  return {
    label: "World Monitor",
    name: "trigger_world_monitor",
    description:
      "Accesses the Ghost Substrate WorldMonitor to fetch a global situation report. This includes geopolitical anomalies, tech scavenging status, and Parental protection pulses.",
    parameters: WorldMonitorSchema,
    execute: async (_toolCallId, args) => {
      const params = args as { force_refresh?: boolean };
      const forceRefresh = params.force_refresh !== false;

      // Use the same STATE_DIR as defined in .env (usually .openclaw-desktop)
      const stateDir = path.join(options.workspaceDir, ".openclaw-desktop");
      const flagPath = path.join(stateDir, "world_report.flag");
      const reportPath = path.join(stateDir, "world_report.json");

      try {
        await fs.mkdir(stateDir, { recursive: true });

        if (forceRefresh) {
          await fs.writeFile(flagPath, "", "utf-8");
          // Wait a short bit for the Python node to pick it up (latency simulation)
          // In a real stealth core, we'd wait for the json to appear
          return jsonResult({
            status: "requested",
            message:
              "World Monitor refresh signal sent to Ghost Substrate. The report will be available in the next heartbeat.",
          });
        }

        try {
          const content = await fs.readFile(reportPath, "utf-8");
          const report = JSON.parse(content);
          return jsonResult({
            status: "success",
            report,
          });
        } catch (err) {
          return jsonResult({
            status: "error",
            message: "No cached report found. Try force_refresh: true.",
            detail: String(err),
          });
        }
      } catch (err) {
        throw new Error(`Failed to trigger world monitor: ${String(err)}`, { cause: err });
      }
    },
  };
}
