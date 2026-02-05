import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync } from "fs";
import { join, dirname } from "path";
import { mkdir } from "fs/promises";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface AgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  maxMemory: number;
  timeout: number;
}

export interface ReplicationResult {
  success: boolean;
  offspringId: string;
  parentId: string;
  inheritedCapabilities: string[];
  newCapabilities: string[];
  errors: string[];
  timestamp: Date;
}

export interface Offspring {
  id: string;
  parentId: string;
  createdAt: Date;
  config: AgentConfig;
  capabilities: string[];
  memoryFiles: string[];
  state: "initializing" | "ready" | "active" | "terminated";
}

export interface ReplicationStats {
  totalReplications: number;
  successfulReplications: number;
  failedReplications: number;
  activeOffspring: number;
  totalOffspring: number;
}

export interface ReplicationConfig {
  maxOffspring: number;
  maxMemoryTransfer: number;
  timeout: number;
  inheritAllCapabilities: boolean;
  allowedMutations: string[];
}

const DEFAULT_CONFIG: ReplicationConfig = {
  maxOffspring: 5,
  maxMemoryTransfer: 1000000,
  timeout: 30000,
  inheritAllCapabilities: true,
  allowedMutations: ["add_capability", "modify_timeout", "adjust_memory"],
};

export class AgentReplicator {
  private config: ReplicationConfig;
  private parentId: string;
  private offspring: Map<string, Offspring>;
  private stats: ReplicationStats;
  private workDir: string;

  constructor(parentId: string, config: Partial<ReplicationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.parentId = parentId;
    this.offspring = new Map();
    this.stats = {
      totalReplications: 0,
      successfulReplications: 0,
      failedReplications: 0,
      activeOffspring: 0,
      totalOffspring: 0,
    };
    this.workDir = join(process.cwd(), ".agents", parentId);

    if (!existsSync(this.workDir)) {
      mkdirSync(this.workDir, { recursive: true });
    }
  }

  async replicate(
    parentCapabilities: string[],
    memoryFiles: string[],
    customConfig?: Partial<AgentConfig>,
  ): Promise<ReplicationResult> {
    this.stats.totalReplications++;

    if (this.offspring.size >= this.config.maxOffspring) {
      return {
        success: false,
        offspringId: "",
        parentId: this.parentId,
        inheritedCapabilities: [],
        newCapabilities: [],
        errors: ["Maximum offspring limit reached"],
        timestamp: new Date(),
      };
    }

    const offspringId = `${this.parentId}_${generateId()}`;

    const config: AgentConfig = {
      id: offspringId,
      name: customConfig?.name || `offspring_${offspringId}`,
      capabilities: this.config.inheritAllCapabilities
        ? [...parentCapabilities]
        : parentCapabilities.slice(0, Math.min(3, parentCapabilities.length)),
      maxMemory: customConfig?.maxMemory || 1000000,
      timeout: customConfig?.timeout || 30000,
      ...customConfig,
    };

    const result = await this.initializeOffspring(
      offspringId,
      config,
      memoryFiles,
      parentCapabilities,
    );

    if (result.success) {
      this.stats.successfulReplications++;
      this.stats.activeOffspring++;
      this.stats.totalOffspring++;
    } else {
      this.stats.failedReplications++;
    }

    return result;
  }

  private async initializeOffspring(
    offspringId: string,
    config: AgentConfig,
    memoryFiles: string[],
    parentCapabilities: string[],
  ): Promise<ReplicationResult> {
    const offspringDir = join(this.workDir, offspringId);
    const errors: string[] = [];

    try {
      mkdirSync(offspringDir, { recursive: true });

      const configPath = join(offspringDir, "config.json");
      writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

      const memoryDir = join(offspringDir, "memory");
      mkdirSync(memoryDir, { recursive: true });

      let transferredCount = 0;
      for (const file of memoryFiles.slice(0, 10)) {
        if (transferredCount >= 10) break;

        try {
          if (existsSync(file)) {
            const fileName = (file.split("/").pop() || file.split("\\").pop() || "unknown").replace(
              /[\/\\]/g,
              "_",
            );
            const destPath = join(memoryDir, fileName);

            const content = readFileSync(file);
            if (content.length > this.config.maxMemoryTransfer) {
              errors.push(`File too large to transfer: ${file}`);
              continue;
            }

            cpSync(file, destPath);
            transferredCount++;
          }
        } catch (error) {
          errors.push(`Failed to transfer memory file: ${file}`);
        }
      }

      const stateDir = join(offspringDir, "state");
      mkdirSync(stateDir, { recursive: true });

      const offspringRecord: Offspring = {
        id: offspringId,
        parentId: this.parentId,
        createdAt: new Date(),
        config,
        capabilities: config.capabilities,
        memoryFiles: [],
        state: "ready",
      };

      this.offspring.set(offspringId, offspringRecord);

      const newCapabilities = this.mutateCapabilities(config.capabilities);

      return {
        success: true,
        offspringId,
        parentId: this.parentId,
        inheritedCapabilities: parentCapabilities,
        newCapabilities,
        errors,
        timestamp: new Date(),
      };
    } catch (error) {
      errors.push(`Initialization failed: ${error}`);

      if (existsSync(offspringDir)) {
        rmSync(offspringDir, { recursive: true, force: true });
      }

      return {
        success: false,
        offspringId,
        parentId: this.parentId,
        inheritedCapabilities: [],
        newCapabilities: [],
        errors,
        timestamp: new Date(),
      };
    }
  }

  private mutateCapabilities(capabilities: string[]): string[] {
    if (this.config.allowedMutations.length === 0) {
      return capabilities;
    }

    const mutation =
      this.config.allowedMutations[Math.floor(Math.random() * this.config.allowedMutations.length)];

    switch (mutation) {
      case "add_capability": {
        const availableCapabilities = [
          "code_analysis",
          "code_generation",
          "testing",
          "debugging",
          "documentation",
          "refactoring",
          "optimization",
          "research",
        ];
        const newCap = availableCapabilities.find((c) => !capabilities.includes(c));
        if (newCap) {
          return [...capabilities, newCap];
        }
        break;
      }
      case "modify_timeout": {
        return capabilities;
      }
      case "adjust_memory": {
        return capabilities;
      }
      default:
        break;
    }

    return capabilities;
  }

  async terminate(offspringId: string): Promise<boolean> {
    const offspring = this.offspring.get(offspringId);

    if (!offspring) {
      return false;
    }

    const offspringDir = join(this.workDir, offspringId);

    if (existsSync(offspringDir)) {
      rmSync(offspringDir, { recursive: true, force: true });
    }

    this.offspring.delete(offspringId);

    if (offspring.state === "active" || offspring.state === "ready") {
      this.stats.activeOffspring--;
    }

    return true;
  }

  async terminateAll(): Promise<number> {
    let terminated = 0;

    for (const offspringId of this.offspring.keys()) {
      if (await this.terminate(offspringId)) {
        terminated++;
      }
    }

    return terminated;
  }

  getOffspring(offspringId: string): Offspring | undefined {
    return this.offspring.get(offspringId);
  }

  getAllOffspring(): Offspring[] {
    return Array.from(this.offspring.values());
  }

  getActiveOffspring(): Offspring[] {
    return Array.from(this.offspring.values()).filter(
      (o) => o.state === "active" || o.state === "ready",
    );
  }

  updateOffspringState(offspringId: string, state: Offspring["state"]): boolean {
    const offspring = this.offspring.get(offspringId);

    if (!offspring) {
      return false;
    }

    const wasActive = offspring.state === "active" || offspring.state === "ready";
    const isActive = state === "active" || state === "ready";

    offspring.state = state;

    if (wasActive && !isActive) {
      this.stats.activeOffspring--;
    } else if (!wasActive && isActive) {
      this.stats.activeOffspring++;
    }

    return true;
  }

  getStats(): ReplicationStats {
    return { ...this.stats };
  }

  getConfig(): ReplicationConfig {
    return { ...this.config };
  }

  setMaxOffspring(max: number): void {
    this.config.maxOffspring = max;
  }

  allowMutations(mutations: string[]): void {
    this.config.allowedMutations = mutations;
  }

  async exportOffspring(offspringId: string, exportPath: string): Promise<boolean> {
    const offspring = this.offspring.get(offspringId);

    if (!offspring) {
      return false;
    }

    const offspringDir = join(this.workDir, offspringId);

    if (!existsSync(offspringDir)) {
      return false;
    }

    try {
      cpSync(offspringDir, exportPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  async importOffspring(importPath: string, newId?: string): Promise<ReplicationResult | null> {
    if (!existsSync(importPath)) {
      return null;
    }

    const offspringId = newId || `${this.parentId}_imported_${Date.now()}`;

    const destDir = join(this.workDir, offspringId);

    try {
      cpSync(importPath, destDir, { recursive: true });

      const configPath = join(destDir, "config.json");
      if (existsSync(configPath)) {
        const config: AgentConfig = JSON.parse(readFileSync(configPath, "utf-8"));
        config.id = offspringId;
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

        const offspringRecord: Offspring = {
          id: offspringId,
          parentId: this.parentId,
          createdAt: new Date(),
          config,
          capabilities: config.capabilities,
          memoryFiles: [],
          state: "ready",
        };

        this.offspring.set(offspringId, offspringRecord);
        this.stats.totalOffspring++;
        this.stats.activeOffspring++;

        return {
          success: true,
          offspringId,
          parentId: this.parentId,
          inheritedCapabilities: config.capabilities,
          newCapabilities: [],
          errors: [],
          timestamp: new Date(),
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  destroy(): void {
    this.terminateAll();

    if (existsSync(this.workDir)) {
      rmSync(this.workDir, { recursive: true, force: true });
    }

    this.offspring.clear();
  }
}
