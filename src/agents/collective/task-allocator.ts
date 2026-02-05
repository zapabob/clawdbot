export interface Task {
  id: string;
  type: TaskType;
  description: string;
  input: unknown;
  priority: number;
  deadline?: Date;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export type TaskType =
  | "code_analysis"
  | "code_generation"
  | "code_review"
  | "refactoring"
  | "testing"
  | "documentation"
  | "research"
  | "problem_solving"
  | "optimization"
  | "debugging";

export interface AllocationResult {
  taskId: string;
  modelId: string;
  confidence: number;
  estimatedTime: number;
  cost: number;
}

export interface TaskAllocatorConfig {
  maxQueueSize: number;
  defaultTimeout: number;
  autoRequeue: boolean;
  loadBalancing: "round_robin" | "least_loaded" | "priority" | "deadline";
  modelCapabilities: Map<string, TaskType[]>;
}

export interface AllocatorStats {
  totalTasks: number;
  allocatedTasks: number;
  failedAllocations: number;
  averageWaitTime: number;
  queueSize: number;
  modelLoad: Map<string, number>;
}

const DEFAULT_CONFIG: TaskAllocatorConfig = {
  maxQueueSize: 1000,
  defaultTimeout: 30000,
  autoRequeue: true,
  loadBalancing: "priority",
  modelCapabilities: new Map(),
};

export class TaskAllocator {
  private config: TaskAllocatorConfig;
  private taskQueue: Task[];
  private taskIndex: Map<string, Task>;
  private allocationHistory: AllocationResult[];
  private stats: Omit<AllocatorStats, "modelLoad"> & { modelLoad: Map<string, number> };

  constructor(config: Partial<TaskAllocatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.taskQueue = [];
    this.taskIndex = new Map();
    this.allocationHistory = [];
    this.stats = {
      totalTasks: 0,
      allocatedTasks: 0,
      failedAllocations: 0,
      averageWaitTime: 0,
      queueSize: 0,
      modelLoad: new Map(),
    };
  }

  setModelCapabilities(modelId: string, capabilities: TaskType[]): void {
    this.config.modelCapabilities.set(modelId, capabilities);
  }

  enqueue(task: Task): boolean {
    if (this.taskQueue.length >= this.config.maxQueueSize) {
      return false;
    }

    this.taskQueue.push(task);
    this.taskIndex.set(task.id, task);
    this.stats.totalTasks++;
    this.stats.queueSize = this.taskQueue.length;

    return true;
  }

  dequeue(): Task | null {
    this.sortQueue();
    const task = this.taskQueue.shift() || null;

    if (task) {
      this.taskIndex.delete(task.id);
      this.stats.queueSize = this.taskQueue.length;
    }

    return task;
  }

  peek(): Task | null {
    this.sortQueue();
    return this.taskQueue[0] || null;
  }

  allocate(task: Task, availableModels: string[]): AllocationResult | null {
    const suitableModels = this.findSuitableModels(task.type, availableModels);

    if (suitableModels.length === 0) {
      this.stats.failedAllocations++;
      return null;
    }

    const selectedModel = this.selectModel(task, suitableModels);
    const result: AllocationResult = {
      taskId: task.id,
      modelId: selectedModel,
      confidence: this.calculateConfidence(task, selectedModel),
      estimatedTime: this.estimateTime(task, selectedModel),
      cost: this.estimateCost(task, selectedModel),
    };

    this.allocationHistory.push(result);
    this.stats.allocatedTasks++;

    const currentLoad = this.stats.modelLoad.get(selectedModel) || 0;
    this.stats.modelLoad.set(selectedModel, currentLoad + 1);

    return result;
  }

  private sortQueue(): void {
    switch (this.config.loadBalancing) {
      case "priority": {
        this.taskQueue.sort((a, b) => b.priority - a.priority);
        break;
      }
      case "deadline": {
        this.taskQueue.sort((a, b) => {
          const aTime = a.deadline?.getTime() || Infinity;
          const bTime = b.deadline?.getTime() || Infinity;
          return aTime - bTime;
        });
        break;
      }
      case "least_loaded": {
        const loads = new Map<string, number>();
        for (const model of this.config.modelCapabilities.keys()) {
          loads.set(model, this.stats.modelLoad.get(model) || 0);
        }
        this.taskQueue.sort((a, b) => {
          const aLoad = Math.min(
            ...this.findSuitableModels(a.type, Array.from(loads.keys())).map(
              (m) => loads.get(m) || 0,
            ),
          );
          const bLoad = Math.min(
            ...this.findSuitableModels(b.type, Array.from(loads.keys())).map(
              (m) => loads.get(m) || 0,
            ),
          );
          return aLoad - bLoad;
        });
        break;
      }
      case "round_robin":
      default: {
        let lastModel = "";
        if (this.allocationHistory.length > 0) {
          lastModel = this.allocationHistory[this.allocationHistory.length - 1].modelId;
        }
        const models = Array.from(this.config.modelCapabilities.keys());
        const lastIndex = models.indexOf(lastModel);
        models.sort((_, __) => Math.random() - 0.5);
        this.taskQueue.sort((a, b) => {
          const aPriority = a.priority + (b.id === lastModel ? 1 : 0);
          const bPriority = b.priority + (a.id === lastModel ? 1 : 0);
          return bPriority - aPriority;
        });
        break;
      }
    }
  }

  private findSuitableModels(taskType: TaskType, availableModels: string[]): string[] {
    return availableModels.filter((modelId) => {
      const capabilities = this.config.modelCapabilities.get(modelId) || [];
      return capabilities.includes(taskType) || capabilities.length === 0;
    });
  }

  private selectModel(task: Task, suitableModels: string[]): string {
    if (suitableModels.length === 1) {
      return suitableModels[0];
    }

    const loads = suitableModels.map((modelId) => ({
      modelId,
      load: this.stats.modelLoad.get(modelId) || 0,
    }));

    loads.sort((a, b) => a.load - b.load);

    const lowestLoad = loads[0].load;

    const candidates = loads.filter((l) => l.load === lowestLoad);

    return candidates[Math.floor(Math.random() * candidates.length)].modelId;
  }

  private calculateConfidence(task: Task, modelId: string): number {
    const capabilities = this.config.modelCapabilities.get(modelId) || [];
    const hasCapability = capabilities.includes(task.type);

    if (!hasCapability) return 0.3;

    const load = this.stats.modelLoad.get(modelId) || 0;
    const loadFactor = Math.max(0, 1 - load * 0.1);

    const priorityFactor = task.priority / 10;

    return hasCapability ? loadFactor * priorityFactor * 0.9 + 0.1 : 0.3;
  }

  private estimateTime(task: Task, modelId: string): number {
    const baseTime = this.config.defaultTimeout;

    const complexityFactor = this.getTaskComplexityFactor(task.type);

    const loadFactor = (this.stats.modelLoad.get(modelId) || 0) * 0.1 + 1;

    return Math.round(baseTime * complexityFactor * loadFactor);
  }

  private estimateCost(task: Task, modelId: string): number {
    return this.getTaskBaseCost(task.type);
  }

  private getTaskComplexityFactor(taskType: TaskType): number {
    const factors: Record<TaskType, number> = {
      code_analysis: 0.5,
      code_generation: 0.7,
      code_review: 0.6,
      refactoring: 0.8,
      testing: 0.5,
      documentation: 0.4,
      research: 0.9,
      problem_solving: 1.0,
      optimization: 0.75,
      debugging: 0.65,
    };
    return factors[taskType] || 0.5;
  }

  private getTaskBaseCost(taskType: TaskType): number {
    const costs: Record<TaskType, number> = {
      code_analysis: 0.01,
      code_generation: 0.02,
      code_review: 0.015,
      refactoring: 0.025,
      testing: 0.01,
      documentation: 0.005,
      research: 0.03,
      problem_solving: 0.035,
      optimization: 0.02,
      debugging: 0.015,
    };
    return costs[taskType] || 0.01;
  }

  getNextTask(): Task | null {
    return this.dequeue();
  }

  getTask(taskId: string): Task | undefined {
    return this.taskIndex.get(taskId);
  }

  getQueueSize(): number {
    return this.taskQueue.length;
  }

  getStats(): AllocatorStats {
    return {
      ...this.stats,
      modelLoad: new Map(this.stats.modelLoad),
    };
  }

  reset(): void {
    this.taskQueue = [];
    this.taskIndex.clear();
    this.allocationHistory = [];
    this.stats = {
      totalTasks: 0,
      allocatedTasks: 0,
      failedAllocations: 0,
      averageWaitTime: 0,
      queueSize: 0,
      modelLoad: new Map(),
    };
  }
}
