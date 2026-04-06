// Async Parallel Processor for Commands
// Enables concurrent command execution

import { EventEmitter } from "node:events";

export interface Task<T> {
  id: string;
  run: () => Promise<T>;
  priority?: number;
}

export interface TaskResult<T> {
  id: string;
  success: boolean;
  result?: T;
  error?: Error;
  durationMs: number;
}

export class ParallelProcessor<T> extends EventEmitter {
  private queue: Task<T>[] = [];
  private running = 0;
  private results: Map<string, TaskResult<T>> = new Map();

  constructor(private concurrency: number = 4) {
    super();
  }

  add(task: Task<T>): void {
    this.queue.push(task);
    void this.processNext();
  }

  addBatch(tasks: Task<T>[]): void {
    this.queue.push(...tasks);
    void this.processNext();
  }

  private async processNext(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) {
        break;
      }

      this.running++;
      void this.executeTask(task);
    }
  }

  private async executeTask(task: Task<T>): Promise<void> {
    const start = Date.now();
    try {
      const result = await task.run();
      this.results.set(task.id, {
        id: task.id,
        success: true,
        result,
        durationMs: Date.now() - start,
      });
      this.emit("task:complete", task.id, result);
    } catch (error) {
      this.results.set(task.id, {
        id: task.id,
        success: false,
        error: error as Error,
        durationMs: Date.now() - start,
      });
      this.emit("task:error", task.id, error);
    }
    this.running--;
    void this.processNext();
  }

  getResult(id: string): TaskResult<T> | undefined {
    return this.results.get(id);
  }

  getAllResults(): TaskResult<T>[] {
    return Array.from(this.results.values());
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.running;
  }

  async waitAll(): Promise<TaskResult<T>[]> {
    while (this.queue.length > 0 || this.running > 0) {
      await new Promise((r) => setTimeout(r, 10));
    }
    return this.getAllResults();
  }
}

// === Batch Processor ===
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private batchSize: number,
    private delayMs: number,
    private processor: (batch: T[]) => Promise<R[]>,
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);

      const processBatch = async () => {
        const items = [...this.batch];
        this.batch = [];
        try {
          const results = await this.processor(items);
          // Resolve individual promises
          resolve(results[0]);
        } catch (e) {
          reject(e);
        }
      };

      if (this.batch.length >= this.batchSize) {
        void processBatch();
      } else if (!this.timer) {
        this.timer = setTimeout(() => void processBatch(), this.delayMs);
      }
    });
  }
}
