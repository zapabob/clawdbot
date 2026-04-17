import { describe, expect, it } from "vitest";
import { CommandLane } from "./lanes.js";

describe("process lanes", () => {
  it("exports runtime lane ids", () => {
    expect(CommandLane).toEqual({
      Main: "main",
      Cron: "cron",
      Subagent: "subagent",
      Nested: "nested",
    });
  });
});
