# SakanaAI-Inspired Self-Evolving Agent System

Self-improving, self-repairing, and self-replicating AI agent system inspired by SakanaAI's research.

## Overview

This system implements three main capabilities:

1. **Self-Evolution** - Genetic algorithm-based code and strategy evolution
2. **Self-Repair** - Automated code fixing and validation
3. **Self-Replication** - Agent spawning with capability inheritance

## Architecture

```
src/
├── evolution/                    # Phase 1: Evolutionary Framework
│   ├── population.ts              # Population management
│   ├── genetic-operators.ts      # Selection, crossover, mutation
│   ├── fitness-evaluator.ts      # Fitness evaluation metrics
│   ├── evolution-engine.ts       # Main evolution engine
│   └── archive.ts                # LQ-CD style archive
│
├── agents/
│   ├── self-evolution/           # Phase 2: Self-Evolution
│   │   ├── code-modifier.ts     # Code modification & validation
│   │   ├── strategy-evolver.ts # Strategy evolution
│   │   ├── benchmark-runner.ts   # Benchmark testing
│   │   └── mutation-generator.ts # Mutation templates
│   │
│   └── collective/               # Phase 3: Collective & Replication
│       ├── model-pool.ts         # AI model pool management
│       ├── task-allocator.ts     # Task assignment
│       ├── consensus-builder.ts  # Multi-model voting
│       └── replicator.ts         # Agent replication
```

## Phase 1: Evolution Framework

### Genetic Algorithm

```typescript
import { EvolutionEngine, Population, FitnessEvaluator } from "./evolution/index.js";

const evaluator = new FitnessEvaluator({
  weights: {
    correctness: 0.35,
    efficiency: 0.2,
    readability: 0.15,
    security: 0.1,
  },
});

const engine = new EvolutionEngine({
  maxGenerations: 100,
  populationSize: 50,
  mutationRate: 0.15,
  crossoverRate: 0.8,
  eliteSize: 5,
});

await engine.evolveWithTimeout(30000);
```

### Population Management

```typescript
import { Population } from "./evolution/population.js";

const population = new Population({
  maxSize: 100,
  eliteSize: 5,
  maxAge: 100,
});

population.initialize(initialGenomes);
const parents = population.selectForCrossover(2);
population.add(offspring);
```

### Fitness Evaluation

```typescript
const evaluator = new FitnessEvaluator({
  weights: {
    correctness: 0.35,
    efficiency: 0.2,
    readability: 0.15,
    maintainability: 0.1,
    security: 0.1,
    testCoverage: 0.1,
  },
});

const result = evaluator.evaluate(individual);
console.log(result.fitness, result.metrics);
```

## Phase 2: Self-Evolution

### Code Modifier

```typescript
import { CodeModifier } from "./self-evolution/code-modifier.js";

const modifier = new CodeModifier();

const result = await modifier.requestModification({
  filePath: "src/utils.ts",
  issue: "Add error handling",
  severity: "high",
  requireApproval: true,
});

if (result.approvalRequired) {
  await modifier.approveModification(0, "admin");
}
```

### Strategy Evolver

```typescript
import { StrategyEvolver } from "./self-evolution/strategy-evolver.js";

const evolver = new StrategyEvolver({
  populationSize: 30,
  maxGenerations: 50,
  mutationRate: 0.2,
});

evolver.initialize(initialStrategies);
const progress = await evolver.evolveWithTimeout(60000);

console.log(progress.bestStrategy);
```

### Benchmark Runner

```typescript
import { BenchmarkRunner } from "./self-evolution/benchmark-runner.js";

const runner = new BenchmarkRunner({
  timeout: 30000,
  maxRetries: 2,
});

const suite = runner.createCodeReviewSuite();
const result = await runner.runSuite(suite);

console.log(result.metrics.passRate);
```

## Phase 3: Collective Intelligence & Replication

### Model Pool

```typescript
import { ModelPool } from "./collective/model-pool.js";

const pool = new ModelPool({
  maxConcurrent: 3,
  loadBalancing: "weighted",
});

pool.registerModel({
  id: "gpt-4",
  name: "GPT-4",
  provider: "openai",
  capabilities: ["code_generation", "analysis"],
  maxTokens: 8192,
  costPer1kTokens: 0.03,
  latency: 1000,
  available: true,
});

const responses = await pool.query("Analyze this code");
```

### Task Allocator

```typescript
import { TaskAllocator } from "./collective/task-allocator.js";

const allocator = new TaskAllocator({
  maxQueueSize: 1000,
  loadBalancing: "priority",
});

allocator.enqueue({
  id: "task_1",
  type: "code_analysis",
  description: "Analyze function performance",
  input: code,
  priority: 8,
});

const task = allocator.allocate(task, ["gpt-4", "claude"]);
```

### Consensus Builder

```typescript
import { ConsensusBuilder } from "./collective/consensus-builder.js";

const builder = new ConsensusBuilder({
  minResponses: 2,
  votingMethod: "majority",
  confidenceThreshold: 0.6,
});

const responses = [
  { modelId: "gpt-4", content: "...", confidence: 0.9 },
  { modelId: "claude", content: "...", confidence: 0.85 },
];

const consensus = builder.build(responses);
console.log(consensus.consensus, consensus.confidence);
```

### Agent Replicator

```typescript
import { AgentReplicator } from "./collective/replicator.js";

const replicator = new AgentReplicator("parent_agent", {
  maxOffspring: 5,
  inheritAllCapabilities: true,
});

const result = await replicator.replicate(["code_analysis", "testing"], ["./memory/*.json"]);

console.log(result.offspringId);
```

## Constraints

| Constraint         | Value                    |
| ------------------ | ------------------------ |
| Max Execution Time | 30 seconds per operation |
| Max Memory         | 512 MB                   |
| Max Tokens         | 8192 per request         |
| Auto-Commit Limit  | 10 per day               |
| Max Offspring      | 5 per agent              |
| Archive Size       | 1000 individuals         |

## Configuration

Create `.env` with:

```env
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

MODEL_POOL_MAX_CONCURRENT=3
EVOLUTION_TIMEOUT_MS=30000
REPLICATION_MAX_OFFSPRING=5
```

## Files

```
src/evolution/              # Phase 1
src/agents/self-evolution/  # Phase 2
src/agents/collective/      # Phase 3
```

## References

- SakanaAI Evolutionary Model Merging: https://github.com/SakanaAI/evolutionary-model-merge
- Darwin Gödel Machine: https://arxiv.org/abs/2505.22954
- ShinkaEvolve: https://github.com/SakanaAI/ShinkaEvolve

## License

MIT
