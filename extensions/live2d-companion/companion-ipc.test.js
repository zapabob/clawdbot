import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveCompanionIpcAuthFilePath, sendCompanionIpcRequest, startCompanionIpcServer, } from "./companion-ipc.js";
const stateDirs = [];
afterEach(async () => {
    await Promise.all(stateDirs.splice(0).map(async (stateDir) => {
        await fs.rm(stateDir, { recursive: true, force: true });
    }));
});
async function createTempStateDir() {
    const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "companion-ipc-"));
    stateDirs.push(stateDir);
    return stateDir;
}
describe("companion IPC", () => {
    it("accepts authenticated local requests", async () => {
        const stateDir = await createTempStateDir();
        const server = await startCompanionIpcServer({
            stateDir,
            handleRequest: async (action, payload) => ({
                action,
                payload,
            }),
        });
        try {
            const result = await sendCompanionIpcRequest({
                stateDir,
                action: "speak",
                payload: { text: "hello" },
            });
            expect(result).toEqual({
                action: "speak",
                payload: { text: "hello" },
            });
        }
        finally {
            await server.close();
        }
    });
    it("rejects requests when the stored auth token is wrong", async () => {
        const stateDir = await createTempStateDir();
        const server = await startCompanionIpcServer({
            stateDir,
            handleRequest: async () => ({ ok: true }),
        });
        try {
            const authPath = resolveCompanionIpcAuthFilePath(stateDir);
            const raw = await fs.readFile(authPath, "utf-8");
            const auth = JSON.parse(raw);
            auth.authToken = `${auth.authToken}-wrong`;
            await fs.writeFile(authPath, JSON.stringify(auth, null, 2), "utf-8");
            await expect(sendCompanionIpcRequest({
                stateDir,
                action: "get-state",
            })).rejects.toThrow("unauthorized");
        }
        finally {
            await server.close();
        }
    });
});
