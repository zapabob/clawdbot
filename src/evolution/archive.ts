import type { Genome } from "./population.js";

export interface ArchivedIndividual {
  id: string;
  genome: Genome;
  fitness: number;
  generation: number;
  lineage: string[];
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface ArchiveConfig {
  maxSize: number;
  minFitnessThreshold: number;
  diversityRetention: number;
}

export interface ArchiveStats {
  totalArchived: number;
  currentSize: number;
  averageFitness: number;
  bestFitness: number;
  generationRange: { min: number; max: number };
}

const DEFAULT_CONFIG: ArchiveConfig = {
  maxSize: 1000,
  minFitnessThreshold: 0.3,
  diversityRetention: 0.2,
};

export class Archive {
  private individuals: Map<string, ArchivedIndividual>;
  private config: ArchiveConfig;

  constructor(config: Partial<ArchiveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.individuals = new Map();
  }

  add(individual: ArchivedIndividual): void {
    if (individual.fitness < this.config.minFitnessThreshold) {
      return;
    }

    if (this.individuals.size >= this.config.maxSize) {
      this.prune();
    }

    this.individuals.set(individual.id, individual);
  }

  private prune(): void {
    const sorted = Array.from(this.individuals.values()).sort((a, b) => b.fitness - a.fitness);
    const keepCount = Math.floor(this.config.maxSize * (1 - this.config.diversityRetention));
    const toRemove = this.individuals.size - keepCount;

    for (let i = sorted.length - 1; i >= keepCount && toRemove > 0; i--) {
      const individual = sorted[i];
      if (individual.fitness < this.config.minFitnessThreshold) {
        this.individuals.delete(individual.id);
      }
    }

    if (this.individuals.size > this.config.maxSize) {
      const remaining = Array.from(this.individuals.values()).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      for (let i = 0; i < this.individuals.size - this.config.maxSize; i++) {
        this.individuals.delete(remaining[i].id);
      }
    }
  }

  sample(count: number): ArchivedIndividual[] {
    const all = Array.from(this.individuals.values());

    if (all.length <= count) {
      return all;
    }

    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  sampleByFitness(
    count: number,
    strategy: "top" | "bottom" | "diverse" = "top",
  ): ArchivedIndividual[] {
    const all = Array.from(this.individuals.values());

    if (all.length <= count) {
      return all;
    }

    switch (strategy) {
      case "top": {
        return all.sort((a, b) => b.fitness - a.fitness).slice(0, count);
      }
      case "bottom": {
        return all.sort((a, b) => a.fitness - b.fitness).slice(0, count);
      }
      case "diverse": {
        const sorted = all.sort((a, b) => b.fitness - a.fitness);
        const selected: ArchivedIndividual[] = [];
        const stride = Math.floor(all.length / count);

        for (let i = 0; i < all.length && selected.length < count; i += stride) {
          selected.push(sorted[i]);
        }

        return selected;
      }
      default:
        return all.slice(0, count);
    }
  }

  getById(id: string): ArchivedIndividual | undefined {
    return this.individuals.get(id);
  }

  getAll(): ArchivedIndividual[] {
    return Array.from(this.individuals.values());
  }

  getBest(): ArchivedIndividual | undefined {
    const all = Array.from(this.individuals.values());
    return all.sort((a, b) => b.fitness - a.fitness)[0];
  }

  getStats(): ArchiveStats {
    const all = Array.from(this.individuals.values());

    if (all.length === 0) {
      return {
        totalArchived: 0,
        currentSize: 0,
        averageFitness: 0,
        bestFitness: 0,
        generationRange: { min: 0, max: 0 },
      };
    }

    const fitnesses = all.map((i) => i.fitness);
    const generations = all.map((i) => i.generation);

    return {
      totalArchived: all.length,
      currentSize: this.individuals.size,
      averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      bestFitness: Math.max(...fitnesses),
      generationRange: {
        min: Math.min(...generations),
        max: Math.max(...generations),
      },
    };
  }

  remove(id: string): boolean {
    return this.individuals.delete(id);
  }

  clear(): void {
    this.individuals.clear();
  }

  size(): number {
    return this.individuals.size;
  }

  findByLineage(lineageId: string): ArchivedIndividual[] {
    return Array.from(this.individuals.values()).filter((i) => i.lineage.includes(lineageId));
  }

  findByGeneration(generation: number): ArchivedIndividual[] {
    return Array.from(this.individuals.values()).filter((i) => i.generation === generation);
  }

  findByFitnessRange(min: number, max: number): ArchivedIndividual[] {
    return Array.from(this.individuals.values()).filter(
      (i) => i.fitness >= min && i.fitness <= max,
    );
  }

  getUniqueStrategies(): string[] {
    const strategies = new Set<string>();
    for (const individual of this.individuals.values()) {
      strategies.add(individual.genome.strategy);
    }
    return Array.from(strategies);
  }

  getStrategyStats(): Map<string, { count: number; avgFitness: number; bestFitness: number }> {
    const strategyMap = new Map<string, ArchivedIndividual[]>();

    for (const individual of this.individuals.values()) {
      const strategy = individual.genome.strategy;
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, []);
      }
      strategyMap.get(strategy)!.push(individual);
    }

    const stats = new Map<string, { count: number; avgFitness: number; bestFitness: number }>();

    for (const [strategy, individuals] of strategyMap) {
      const fitnesses = individuals.map((i) => i.fitness);
      stats.set(strategy, {
        count: individuals.length,
        avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
        bestFitness: Math.max(...fitnesses),
      });
    }

    return stats;
  }

  export(): ArchivedIndividual[] {
    return Array.from(this.individuals.values());
  }

  import(individuals: ArchivedIndividual[]): void {
    for (const individual of individuals) {
      this.add(individual);
    }
  }
}
