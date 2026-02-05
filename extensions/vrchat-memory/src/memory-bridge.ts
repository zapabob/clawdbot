/**
 * Upstream Memory Bridge
 *
 * Bridges VRChat memory system with official OpenClaw memory infrastructure
 */

import type { MemorySearchManager, MemorySearchResult, MemorySource } from "../../src/memory/types.js";
import type { ResolvedMemoryBackendConfig } from "../../src/memory/backend-config.js";
import type { OpenClawConfig } from "../../src/memory/config.js";

export interface MemoryBridgeConfig {
  backend: "builtin" | "qmd";
  qmd?: {
    command: string;
    collections: Array<{
      name: string;
      path: string;
      pattern: string;
      kind: "memory" | "sessions";
    }>;
  };
}

export interface BridgeSearchOptions {
  query: string;
  limit?: number;
  scope?: string;
}

export class MemoryBridge {
  private searchManager: MemorySearchManager | null = null;
  private initialized = false;

  constructor(
    private config: OpenClawConfig,
    private agentId: string,
  ) {}

  async initialize(): Promise<boolean> {
    try {
      const resolved = await this.resolveBackend();
      if (resolved.backend === "qmd" && resolved.qmd) {
        const { QmdMemoryManager } = await import("../../src/memory/qmd-manager.js");
        this.searchManager = await QmdMemoryManager.create({
          cfg: this.config,
          agentId: this.agentId,
          resolved,
        });
      } else {
        const { BuiltinMemoryManager } = await import("../../src/memory/manager.js");
        this.searchManager = await BuiltinMemoryManager.create({
          cfg: this.config,
          agentId: this.agentId,
          resolved,
        });
      }
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize memory bridge:", error);
      return false;
    }
  }

  private async resolveBackend(): Promise<ResolvedMemoryBackendConfig> {
    const { resolveMemoryBackendConfig } = await import("../../src/memory/backend-config.js");
    return resolveMemoryBackendConfig({
      cfg: this.config,
      agentId: this.agentId,
    });
  }

  async search(options: BridgeSearchOptions): Promise<MemorySearchResult[]> {
    if (!this.initialized || !this.searchManager) {
      await this.initialize();
    }

    if (!this.searchManager) {
      return [];
    }

    return this.searchManager.search({
      query: options.query,
      limit: options.limit ?? 10,
      scope: options.scope,
    });
  }

  async addMemory(content: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.initialized || !this.searchManager) {
      await this.initialize();
    }

    if (!this.searchManager?.add) {
      return;
    }

    await this.searchManager.add({
      content,
      metadata: {
        ...metadata,
        source: "vrchat-memory-bridge",
        timestamp: Date.now(),
      },
    });
  }

  async getStatus(): Promise<{
    initialized: boolean;
    backend: string;
    status?: string;
  }> {
    const backend = await this.resolveBackend();
    return {
      initialized: this.initialized,
      backend: backend.backend,
      status: this.searchManager?.status?.(),
    };
  }

  async close(): Promise<void> {
    if (this.searchManager?.close) {
      await this.searchManager.close();
    }
    this.initialized = false;
  }
}
