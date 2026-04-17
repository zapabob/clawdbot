// Runtime consumers import these lane ids directly, so this module must
// emit a real value export instead of an erased const enum.
export const CommandLane = {
  Main: "main",
  Cron: "cron",
  Subagent: "subagent",
  Nested: "nested",
} as const;
