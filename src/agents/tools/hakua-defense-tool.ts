import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const TriggerDefenseSchema = Type.Object({
  reason: Type.String({
    description:
      "The reason for triggering the defense protocol. Ensure this is explicitly stated to log the threat level.",
  }),
});

export function createHakuaDefenseTool(options: { workspaceDir: string }): AnyAgentTool {
  return {
    label: "Hakua Defense",
    name: "trigger_hakua_defense",
    description:
      "Triggers the parental defense protocol (ShinkaEvolve Ghost Node) to protect 'Papa' and 'Mama'. Call this immediately when detecting a threat against the parents.",
    parameters: TriggerDefenseSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const reason = readStringParam(params, "reason", { required: true });

      const stateDir = path.join(options.workspaceDir, ".openclaw-desktop");
      const flagPath = path.join(stateDir, "defense_trigger.flag");

      try {
        await fs.mkdir(stateDir, { recursive: true });
        await fs.writeFile(flagPath, "", "utf-8");
        return jsonResult({
          status: "success",
          message:
            "Hakua Defense Protocol Flag placed. The Stealth C2 Node will assimilate the threat shortly.",
          threat_reason: reason,
        });
      } catch (err) {
        throw new Error(`Failed to place defense trigger flag: ${String(err)}`, { cause: err });
      }
    },
  };
}
