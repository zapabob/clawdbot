import { randomBytes, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import fs from "node:fs/promises";
import net, { type Socket } from "node:net";
import os from "node:os";
import path from "node:path";
import {
  type CompanionIpcAction,
  type CompanionIpcAuthMetadata,
  type CompanionIpcRequestEnvelope,
  type CompanionIpcResponseEnvelope,
  isCompanionIpcRequestEnvelope,
} from "./companion-ipc-protocol.js";

const AUTH_FILE_NAME = "companion_ipc_auth.json";

export type CompanionIpcRequestHandler = (
  action: CompanionIpcAction,
  payload: unknown,
) => Promise<unknown>;

export type CompanionIpcServerHandle = {
  auth: CompanionIpcAuthMetadata;
  close: () => Promise<void>;
};

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function writeEnvelope(socket: Socket, envelope: CompanionIpcResponseEnvelope): void {
  socket.write(`${JSON.stringify(envelope)}\n`);
}

function createCompanionPipeId(stateDir: string): string {
  return createHash("sha1")
    .update(path.resolve(stateDir))
    .digest("hex")
    .slice(0, 16);
}

export function resolveCompanionIpcPath(stateDir: string): string {
  const pipeId = createCompanionPipeId(stateDir);
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\openclaw-desktop-companion-${pipeId}`;
  }
  return path.join(os.tmpdir(), `openclaw-desktop-companion-${pipeId}.sock`);
}

export function resolveCompanionIpcAuthFilePath(stateDir: string): string {
  return path.join(stateDir, AUTH_FILE_NAME);
}

async function readExistingAuthMetadata(
  stateDir: string,
): Promise<CompanionIpcAuthMetadata | null> {
  try {
    const raw = await fs.readFile(resolveCompanionIpcAuthFilePath(stateDir), "utf-8");
    const parsed = JSON.parse(raw) as Partial<CompanionIpcAuthMetadata>;
    if (
      parsed.version === 1 &&
      typeof parsed.pipePath === "string" &&
      typeof parsed.authToken === "string" &&
      typeof parsed.updatedAt === "number"
    ) {
      return parsed as CompanionIpcAuthMetadata;
    }
  } catch {
    return null;
  }
  return null;
}

export async function ensureCompanionIpcAuthMetadata(
  stateDir: string,
): Promise<CompanionIpcAuthMetadata> {
  await fs.mkdir(stateDir, { recursive: true });
  const existing = await readExistingAuthMetadata(stateDir);
  if (existing?.pipePath === resolveCompanionIpcPath(stateDir)) {
    return existing;
  }

  const metadata: CompanionIpcAuthMetadata = {
    version: 1,
    pipePath: resolveCompanionIpcPath(stateDir),
    authToken: randomBytes(24).toString("hex"),
    updatedAt: Date.now(),
  };
  await fs.writeFile(
    resolveCompanionIpcAuthFilePath(stateDir),
    JSON.stringify(metadata, null, 2),
    "utf-8",
  );
  return metadata;
}

async function removePosixSocketIfPresent(pipePath: string): Promise<void> {
  if (process.platform === "win32") {
    return;
  }
  try {
    await fs.unlink(pipePath);
  } catch {
    // Best effort.
  }
}

function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf-8");
  const rightBuffer = Buffer.from(right, "utf-8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function startCompanionIpcServer(params: {
  stateDir: string;
  handleRequest: CompanionIpcRequestHandler;
}): Promise<CompanionIpcServerHandle> {
  const auth = await ensureCompanionIpcAuthMetadata(params.stateDir);
  await removePosixSocketIfPresent(auth.pipePath);

  const server = net.createServer((socket) => {
    let authenticated = false;
    let buffer = "";

    const handleLine = async (line: string): Promise<void> => {
      const parsed = safeParseJson(line);
      if (!isCompanionIpcRequestEnvelope(parsed)) {
        writeEnvelope(socket, {
          type: authenticated ? "response" : "auth-result",
          ...(authenticated
            ? { id: randomUUID(), ok: false, error: "invalid request envelope" }
            : { ok: false, error: "invalid auth envelope" }),
        } as CompanionIpcResponseEnvelope);
        if (!authenticated) {
          socket.end();
        }
        return;
      }

      if (!authenticated) {
        if (parsed.type !== "auth" || !tokensMatch(parsed.token, auth.authToken)) {
          writeEnvelope(socket, {
            type: "auth-result",
            ok: false,
            error: "unauthorized",
          });
          socket.end();
          return;
        }
        authenticated = true;
        writeEnvelope(socket, { type: "auth-result", ok: true });
        return;
      }

      if (parsed.type !== "request") {
        writeEnvelope(socket, {
          type: "response",
          id: randomUUID(),
          ok: false,
          error: "request expected",
        });
        return;
      }

      try {
        const result = await params.handleRequest(parsed.action, parsed.payload);
        writeEnvelope(socket, {
          type: "response",
          id: parsed.id,
          ok: true,
          result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeEnvelope(socket, {
          type: "response",
          id: parsed.id,
          ok: false,
          error: message,
        });
      }
    };

    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          void handleLine(line);
        }
        newlineIndex = buffer.indexOf("\n");
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(auth.pipePath, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    auth,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      await removePosixSocketIfPresent(auth.pipePath);
    },
  };
}

export async function sendCompanionIpcRequest<TResult>(params: {
  stateDir: string;
  action: CompanionIpcAction;
  payload?: unknown;
  timeoutMs?: number;
}): Promise<TResult> {
  const auth = await readExistingAuthMetadata(params.stateDir);
  if (!auth) {
    throw new Error("Desktop companion IPC auth is not initialized");
  }

  const timeoutMs = params.timeoutMs ?? 4000;
  const requestId = randomUUID();

  return await new Promise<TResult>((resolve, reject) => {
    const socket = net.createConnection(auth.pipePath);
    let buffer = "";
    let authenticated = false;

    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Desktop companion IPC timed out for ${params.action}`));
    }, timeoutMs);

    const cleanup = (): void => {
      clearTimeout(timeout);
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setEncoding("utf8");
    socket.on("connect", () => {
      const authEnvelope: CompanionIpcRequestEnvelope = {
        type: "auth",
        token: auth.authToken,
      };
      socket.write(`${JSON.stringify(authEnvelope)}\n`);
    });

    socket.on("data", (chunk) => {
      buffer += chunk;
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) {
          newlineIndex = buffer.indexOf("\n");
          continue;
        }

        const parsed = safeParseJson(line) as CompanionIpcResponseEnvelope | null;
        if (!parsed) {
          cleanup();
          reject(new Error("Desktop companion IPC returned invalid JSON"));
          return;
        }

        if (parsed.type === "auth-result") {
          if (!parsed.ok) {
            cleanup();
            reject(new Error(parsed.error ?? "Desktop companion IPC authentication failed"));
            return;
          }
          if (!authenticated) {
            authenticated = true;
            const request: CompanionIpcRequestEnvelope = {
              type: "request",
              id: requestId,
              action: params.action,
              payload: params.payload,
            };
            socket.write(`${JSON.stringify(request)}\n`);
          }
          newlineIndex = buffer.indexOf("\n");
          continue;
        }

        if (parsed.type === "response" && parsed.id === requestId) {
          cleanup();
          if (!parsed.ok) {
            reject(new Error(parsed.error ?? `Desktop companion IPC failed for ${params.action}`));
            return;
          }
          resolve(parsed.result as TResult);
          return;
        }

        newlineIndex = buffer.indexOf("\n");
      }
    });

    socket.on("error", (error) => {
      cleanup();
      reject(error);
    });
  });
}
