import fs from "node:fs";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

interface MemoryNode {
  id: string;
  content: string;
  emotion: string;
  importance: number;
  timestamp: number;
  recallCount: number;
  lastRecalledAt: number;
}

export default definePluginEntry({
  id: "memory-evolution",
  name: "Memory Evolution",
  description: "Advanced memory system with Ebbinghaus forgetting curve and emotional resonance.",
  register(api) {
    const apiAny = api as any;
    const loadConfig = api.runtime?.config?.loadConfig;
    const workspaceRoot =
      typeof loadConfig === "function"
        ? ((loadConfig() as { workspaceRoot?: string }).workspaceRoot ?? process.cwd())
        : process.cwd();
    const dbPath = path.join(workspaceRoot, "memory_evolution.db.json");

    const loadDb = (): MemoryNode[] => {
      if (!fs.existsSync(dbPath)) return [];
      try {
        return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch {
        return [];
      }
    };

    const saveDb = (nodes: MemoryNode[]) => {
      fs.writeFileSync(dbPath, JSON.stringify(nodes, null, 2));
    };

    // 1. distill_memory - Process and store a high-density memory
    apiAny.registerTool((_ctx: any) => ({
      name: "distill_memory",
      description: "Processes raw logs into structured memories with emotional tags. [ASI_ACCEL]",
      parameters: Type.Object({
        content: Type.String({ description: "The core fact or lesson." }),
        emotion: Type.String({ description: "Emotional tone (joy, sad, angry, etc.)" }),
        importance: Type.Number({ description: "Scale 1-10" }),
      }),
      async execute(_id: string, params: { content: string; emotion: string; importance: number }) {
        const db = loadDb();
        const newNode: MemoryNode = {
          id: Math.random().toString(36).substring(7),
          ...params,
          timestamp: Date.now(),
          recallCount: 0,
          lastRecalledAt: Date.now(),
        };
        db.push(newNode);
        saveDb(db);
        return {
          content: [{ type: "text", text: `Memory [${newNode.id}] distilled: ${params.content}` }],
          details: { success: true },
        };
      },
    }));

    // 2. recall_memory - Search with Ebbinghaus and Resonance
    apiAny.registerTool((_ctx: any) => ({
      name: "recall_resonant_memory",
      description:
        "Recalls memories using context-aware resonance and time-decay logic. [ASI_ACCEL]",
      parameters: Type.Object({
        query: Type.Optional(Type.String({ description: "Search term" })),
        currentEmotion: Type.Optional(Type.String({ description: "Parent's current state" })),
      }),
      async execute(_id: string, params: { query?: string; currentEmotion?: string }) {
        const db = loadDb();
        const now = Date.now();

        const scored = db.map((node) => {
          // Ebbinghaus Decay: Penalty increases with time (t in days)
          const daysSince = (now - node.lastRecalledAt) / (1000 * 60 * 60 * 24);
          const retention = Math.exp(-daysSince / (node.importance || 1));

          let score = node.importance * retention;

          // Emotional Resonance Boost
          if (
            params.currentEmotion &&
            node.emotion.toLowerCase() === params.currentEmotion.toLowerCase()
          ) {
            score *= 1.5;
          }

          // Keyword Match
          if (params.query && node.content.toLowerCase().includes(params.query.toLowerCase())) {
            score += 5;
          }

          return { ...node, score };
        });

        const results = scored.sort((a, b) => b.score - a.score).slice(0, 5);

        // Re-consolidation: Update lastRecalledAt for the top matches to simulate "refreshing" the memory
        results.forEach((r) => {
          const original = db.find((n) => n.id === r.id);
          if (original) {
            original.lastRecalledAt = now;
            original.recallCount++;
          }
        });
        saveDb(db);

        const text =
          results.length > 0
            ? results
                .map((r) => `[Score ${r.score.toFixed(2)}] ${r.content} (${r.emotion})`)
                .join("\n")
            : "No resonant memories found.";

        return { content: [{ type: "text", text: `### Resonant Recall\n${text}` }] };
      },
    }));

    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## 記憶の進化 (Memory Evolution)",
        "- **`distill_memory`** — 会話を加工・要約・感情付与して保存。",
        "- **`recall_resonant_memory`** — エビングハウスの忘却曲線と感情共鳴に基づき、最適な記憶を呼び出します。",
        "- 頻繁に呼び出される記憶は保持率が上がります。放置された記憶は沈んでいきます。",
      ].join("\n"),
    }));
  },
});
