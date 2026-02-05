import {
  EvolutionaryEngine,
  type Individual,
  type EvolutionConfig,
  type EvolutionStats,
} from "../../evolution/evolution-engine.js";

export interface StrategyGenome {
  code: string;
  parameters: Record<string, number>;
  heuristics: string[];
  name: string;
  version: string;
}

export interface StrategyEvaluation {
  strategy: StrategyGenome;
  fitness: number;
  metrics: {
    accuracy: number;
    efficiency: number;
    robustness: number;
    adaptability: number;
  };
  testResults: {
    passed: number;
    failed: number;
    skipped: number;
  };
  timestamp: Date;
}

export interface StrategyConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  maxGenerations: number;
  evaluationInterval: number;
}

export interface EvolutionProgress {
  generation: number;
  bestStrategy: StrategyGenome | null;
  bestFitness: number;
  averageFitness: number;
  improvements: number[];
  evaluationHistory: StrategyEvaluation[];
}

const DEFAULT_CONFIG: StrategyConfig = {
  populationSize: 30,
  mutationRate: 0.2,
  crossoverRate: 0.7,
  eliteSize: 3,
  maxGenerations: 50,
  evaluationInterval: 5,
};

export class StrategyEvolver {
  private config: StrategyConfig;
  private engine: EvolutionaryEngine<StrategyGenome>;
  private evaluationHistory: StrategyEvaluation[];
  private improvementMilestones: number[];
  private currentBest: StrategyGenome | null;
  private currentBestFitness: number;

  constructor(config: Partial<StrategyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.evaluationHistory = [];
    this.improvementMilestones = [];
    this.currentBest = null;
    this.currentBestFitness = 0;

    const evolutionConfig: Partial<EvolutionConfig> = {
      populationSize: this.config.populationSize,
      mutationRate: this.config.mutationRate,
      crossoverRate: this.config.crossoverRate,
      eliteSize: this.config.eliteSize,
      maxGenerations: this.config.maxGenerations,
    };

    this.engine = new EvolutionaryEngine<StrategyGenome>(evolutionConfig, (genome) =>
      this.evaluateStrategy(genome),
    );

    this.setupEvolutionListeners();
  }

  private setupEvolutionListeners(): void {
    this.engine.on("generation", (stats: EvolutionStats) => {
      if (stats.bestFitness > this.currentBestFitness) {
        this.currentBestFitness = stats.bestFitness;
        this.improvementMilestones.push(stats.bestFitness);
      }
    });
  }

  private evaluateStrategy(genome: StrategyGenome): number {
    let fitness = 0;

    if (genome.code && genome.code.length > 0) {
      fitness += Math.min(0.3, genome.code.length / 1000);
    }

    const paramValues = Object.values(genome.parameters);
    if (paramValues.length > 0) {
      const avgParam = paramValues.reduce((a, b) => a + b, 0) / paramValues.length;
      fitness += Math.min(0.3, Math.abs(avgParam));
    }

    if (genome.heuristics && genome.heuristics.length > 0) {
      fitness += Math.min(0.4, genome.heuristics.length / 10);
    }

    return Math.min(1, fitness);
  }

  initialize(initialStrategies: StrategyGenome[]): void {
    const genotypes = initialStrategies.map((s) => ({
      genotype: s,
      fitness: 0,
      age: 0,
      history: [],
    }));

    for (const g of genotypes) {
      this.engine.getPopulation().push(g);
    }

    this.evaluateAll();
  }

  private evaluateAll(): void {
    const population = this.engine.getPopulation();
    for (const individual of population) {
      individual.fitness = this.evaluateStrategy(individual.genotype);
    }
  }

  evolve(): Promise<EvolutionProgress> {
    return new Promise((resolve) => {
      this.engine.evolve();
      const progress = this.getProgress();
      resolve(progress);
    });
  }

  evolveWithTimeout(timeoutMs: number = 30000): Promise<EvolutionProgress | null> {
    const timeoutPromise = new Promise<EvolutionProgress | null>((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, timeoutMs);
    });

    const evolutionPromise = this.evolve();

    return Promise.race([evolutionPromise, timeoutPromise]);
  }

  getProgress(): EvolutionProgress {
    const stats = this.engine.getStats();

    const population = this.engine.getPopulation();
    const best = population[0];

    return {
      generation: stats.generation,
      bestStrategy: best?.genotype ?? null,
      bestFitness: stats.bestFitness,
      averageFitness: stats.avgFitness,
      improvements: [...this.improvementMilestones],
      evaluationHistory: [...this.evaluationHistory],
    };
  }

  getBestStrategy(): StrategyGenome | null {
    const population = this.engine.getPopulation();
    if (population.length === 0) return null;

    const best = population.sort((a, b) => b.fitness - a.fitness)[0];
    return best.genotype;
  }

  generateVariant(parent: StrategyGenome, mutationType: string): StrategyGenome {
    const variant: StrategyGenome = {
      ...parent,
      version: `${parent.version}.${Date.now()}`,
    };

    switch (mutationType) {
      case "parameter_tweak": {
        const paramKeys = Object.keys(variant.parameters);
        if (paramKeys.length > 0) {
          const key = paramKeys[Math.floor(Math.random() * paramKeys.length)];
          variant.parameters[key] = variant.parameters[key] * (0.8 + Math.random() * 0.4);
        }
        break;
      }
      case "heuristic_add": {
        const newHeuristics = [
          "aggressive",
          "conservative",
          "balanced",
          "exploratory",
          "exploitative",
          "adaptive",
          "reactive",
          "predictive",
        ];
        const available = newHeuristics.filter((h) => !variant.heuristics.includes(h));
        if (available.length > 0 && Math.random() > 0.5) {
          variant.heuristics.push(available[Math.floor(Math.random() * available.length)]);
        }
        break;
      }
      case "code_refactor": {
        variant.code = variant.code.replace(/\s+/g, " ").trim();
        break;
      }
      case "parameter_reset": {
        const newParams: Record<string, number> = {};
        for (const key of Object.keys(variant.parameters)) {
          newParams[key] = Math.random();
        }
        variant.parameters = newParams;
        break;
      }
      default: {
        if (Math.random() < 0.3) {
          const newHeuristics = [
            "aggressive",
            "conservative",
            "balanced",
            "exploratory",
            "exploitative",
          ];
          const available = newHeuristics.filter((h) => !variant.heuristics.includes(h));
          if (available.length > 0) {
            variant.heuristics.push(available[Math.floor(Math.random() * available.length)]);
          }
        }
      }
    }

    return variant;
  }

  crossover(parent1: StrategyGenome, parent2: StrategyGenome): [StrategyGenome, StrategyGenome] {
    const child1: StrategyGenome = {
      code: Math.random() > 0.5 ? parent1.code : parent2.code,
      parameters: { ...parent1.parameters },
      heuristics: [...parent1.heuristics],
      name: `${parent1.name}-${parent2.name}`,
      version: `${Math.max(parseInt(parent1.version), parseInt(parent2.version)) + 1}`,
    };

    const child2: StrategyGenome = {
      code: Math.random() > 0.5 ? parent2.code : parent1.code,
      parameters: { ...parent2.parameters },
      heuristics: [...parent2.heuristics],
      name: `${parent2.name}-${parent1.name}`,
      version: `${Math.max(parseInt(parent1.version), parseInt(parent2.version)) + 1}`,
    };

    for (const key of new Set([
      ...Object.keys(parent1.parameters),
      ...Object.keys(parent2.parameters),
    ])) {
      if (Math.random() > 0.5) {
        child1.parameters[key] = parent2.parameters[key] ?? Math.random();
        child2.parameters[key] = parent1.parameters[key] ?? Math.random();
      }
    }

    const allHeuristics = new Set([...parent1.heuristics, ...parent2.heuristics]);
    child1.heuristics = Array.from(allHeuristics).slice(0, Math.min(5, allHeuristics.size));
    child2.heuristics = Array.from(allHeuristics).slice(0, Math.min(5, allHeuristics.size));

    return [child1, child2];
  }

  createStrategyTemplate(name: string): StrategyGenome {
    return {
      code: `def ${name.toLowerCase().replace(/\s+/g, "_")}_strategy():\n    pass`,
      parameters: {
        threshold: 0.5,
        learningRate: 0.01,
        discountFactor: 0.95,
        explorationRate: 0.1,
        explorationDecay: 0.99,
      },
      heuristics: ["balanced"],
      name,
      version: "1",
    };
  }

  exportStrategies(): string {
    const best = this.getBestStrategy();
    return JSON.stringify(best, null, 2);
  }

  importStrategies(jsonString: string): void {
    try {
      const strategies = JSON.parse(jsonString);
      const genomes = Array.isArray(strategies) ? strategies : [strategies];
      for (const s of genomes) {
        const genome: StrategyGenome = {
          code: s.code || "",
          parameters: s.parameters || {},
          heuristics: s.heuristics || [],
          name: s.name || "imported",
          version: s.version || "1",
        };
        this.engine.getPopulation().push({
          genotype: genome,
          fitness: s.fitness || 0,
          age: 0,
          history: [],
        });
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  }

  getStats(): EvolutionStats {
    return this.engine.getStats();
  }

  reset(): void {
    this.engine.getPopulation().length = 0;
    this.evaluationHistory = [];
    this.improvementMilestones = [];
    this.currentBest = null;
    this.currentBestFitness = 0;
  }
}
