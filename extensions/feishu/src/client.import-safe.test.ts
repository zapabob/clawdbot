import { describe, expect, it, vi } from "vitest";

describe("feishu client module import safety", () => {
  it("imports without eagerly loading the SDK runtime", async () => {
    vi.resetModules();
    vi.doMock("@larksuiteoapi/node-sdk", () => {
      throw new Error("Feishu SDK should stay lazy during module import");
    });
    vi.doMock("https-proxy-agent", () => {
      throw new Error("Proxy agent should stay lazy during module import");
    });

    await expect(import("./client.js")).resolves.toMatchObject({
      createFeishuClient: expect.any(Function),
      createFeishuWSClient: expect.any(Function),
    });
  });
});
