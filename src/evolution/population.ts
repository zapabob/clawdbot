export interface Individual {
  id: string;
  genome: Genome;
  fitness: number;
  age: number;
  parentIds: string[];
  lineage: string[];
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface Genome {
  code: string;
  strategy: string;
  parameters: Record<string, number>;
  mutations: string[];
}

export interface PopulationConfig {
  maxSize: number;
  maxAge: number;
  eliteSize: number;
  diversityThreshold: number;
}

export interface EvolutionStats {
  generation: number;
  populationSize: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  diversity: number;
  totalArchived: number;
}

const DEFAULT_CONFIG: PopulationConfig = {
  maxSize: 100,
  maxAge: 100,
  eliteSize: 5,
  diversityThreshold: 0.1,
};

export class Population {
  private individuals: Map<string, Individual>;
  private config: PopulationConfig;
  private generation: number;
  private idCounter: number;

  constructor(config: Partial<PopulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.individuals = new Map();
    this.generation = 0;
    this.idCounter = 0;
  }

  initialize(initialGenomes: Genome[]): void {
    for (const genome of initialGenomes) {
      const individual = this.createIndividual(genome, []);
      this.individuals.set(individual.id, individual);
    }
  }

  createIndividual(genome: Genome, parentIds: string[]): Individual {
    const id = `ind_${++this.idCounter}_${Date.now()}`;
    const lineage = parentIds.length > 0 ? this.getLineage(parentIds[0]) : [id];

    return {
      id,
      genome,
      fitness: 0,
      age: 0,
      parentIds,
      lineage,
      createdAt: new Date(),
      metadata: {},
    };
  }

  private getLineage(parentId: string): string[] {
    const parent = this.individuals.get(parentId);
    if (!parent) return [];
    return [...parent.lineage, parentId];
  }

  add(individual: Individual): void {
    if (this.individuals.size >= this.config.maxSize) {
      this.cull();
    }
    this.individuals.set(individual.id, individual);
  }

  private cull(): void {
    const sorted = this.getSortedByFitness();
    const toRemove = this.individuals.size - this.config.maxSize + this.config.eliteSize;

    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      const worst = sorted[sorted.length - 1 - i];
      if (worst.age >= this.config.maxAge) {
        this.individuals.delete(worst.id);
      }
    }
  }

  selectParents(count: number = 2): Individual[] {
    const sorted = this.getSortedByFitness();
    const eliteCount = Math.min(this.config.eliteSize, Math.floor(sorted.length * 0.2));

    const parents: Individual[] = [];

    for (let i = 0; i < eliteCount && parents.length < count; i++) {
      parents.push(sorted[i]);
    }

    if (parents.length < count) {
      const remaining = sorted.slice(eliteCount);
      while (parents.length < count && remaining.length > 0) {
        const index = Math.floor(Math.random() * remaining.length);
        parents.push(remaining[index]);
        remaining.splice(index, 1);
      }
    }

    return parents.slice(0, count);
  }

  selectForCrossover(count: number = 2): Individual[] {
    const tournamentSize = 3;
    const selected: Individual[] = [];

    while (selected.length < count) {
      const tournament: Individual[] = [];

      for (let i = 0; i < tournamentSize && this.individuals.size > 0; i++) {
        const randomIndex = Math.floor(Math.random() * this.individuals.size);
        const values = Array.from(this.individuals.values());
        tournament.push(values[randomIndex]);
      }

      tournament.sort((a, b) => b.fitness - a.fitness);
      selected.push(tournament[0]);
    }

    return selected.slice(0, count);
  }

  getAll(): Individual[] {
    return Array.from(this.individuals.values());
  }

  getById(id: string): Individual | undefined {
    return this.individuals.get(id);
  }

  getSortedByFitness(): Individual[] {
    return Array.from(this.individuals.values()).sort((a, b) => b.fitness - a.fitness);
  }

  getBest(): Individual | undefined {
    const sorted = this.getSortedByFitness();
    return sorted[0];
  }

  getWorst(): Individual | undefined {
    const sorted = this.getSortedByFitness();
    return sorted[sorted.length - 1];
  }

  getStats(): EvolutionStats {
    const all = this.getAll();
    const fitnesses = all.map((i) => i.fitness);

    return {
      generation: this.generation,
      populationSize: all.length,
      bestFitness: Math.max(...fitnesses),
      averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      worstFitness: Math.min(...fitnesses),
      diversity: this.calculateDiversity(),
      totalArchived: 0,
    };
  }

  private calculateDiversity(): number {
    const all = this.getAll();
    if (all.length < 2) return 0;

    const codes = all.map((i) => i.genome.code);
    const uniqueCodes = new Set(codes);

    return uniqueCodes.size / codes.length;
  }

  incrementAge(): void {
    for (const individual of this.individuals.values()) {
      individual.age++;
    }
  }

  advanceGeneration(): void {
    this.generation++;
    this.incrementAge();
    this.cull();
  }

  remove(id: string): boolean {
    return this.individuals.delete(id);
  }

  clear(): void {
    this.individuals.clear();
    this.generation = 0;
  }

  size(): number {
    return this.individuals.size;
  }
}
