/**
 * SakanaAI-Inspired Evolutionary Algorithm Engine
 * 
 * Based on principles from:
 * - Evolutionary Computation
 * - Nature-Inspired Optimization
 * - Collective Intelligence Systems
 * - Self-Improving Algorithms
 */

import { EventEmitter } from 'events';

export interface EvolutionConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  maxGenerations: number;
  fitnessThreshold: number;
  selectionPressure: number;
}

export interface Individual<T> {
  genotype: T;
  fitness: number;
  age: number;
  history: FitnessHistory[];
}

export interface FitnessHistory {
  generation: number;
  fitness: number;
  mutation: string;
}

export interface EvolutionStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  diversity: number;
  convergence: number;
  innovations: number;
}

export interface MutationOperator<T> {
  name: string;
  apply(individual: Individual<T>): Individual<T>;
  probability: number;
}

export interface CrossoverOperator<T> {
  name: string;
  apply(parent1: Individual<T>, parent2: Individual<T>): [Individual<T>, Individual<T>];
  probability: number;
}

export type FitnessFunction<T> = (genotype: T) => number;

export type SelectionStrategy<T> = {
  name: string;
  select(population: Individual<T>[], fitnessFn: FitnessFunction<T>): Individual<T>[];
};

export class EvolutionaryEngine<T> extends EventEmitter {
  private config: EvolutionConfig;
  private population: Individual<T>[] = [];
  private mutationOperators: MutationOperator<T>[] = [];
  private crossoverOperators: CrossoverOperator<T>[] = [];
  private fitnessFn: FitnessFunction<T>;
  private stats: EvolutionStats;
  private generation = 0;
  private hallOfFame: Individual<T>[] = [];
  private fitnessHistory: number[] = [];
  private diversityHistory: number[] = [];
  private innovationRegistry = new Map<string, number>();

  constructor(
    config: Partial<EvolutionConfig>,
    fitnessFn: FitnessFunction<T>
  ) {
    super();
    this.config = {
      populationSize: config.populationSize ?? 50,
      mutationRate: config.mutationRate ?? 0.1,
      crossoverRate: config.crossoverRate ?? 0.8,
      eliteSize: config.eliteSize ?? 5,
      maxGenerations: config.maxGenerations ?? 1000,
      fitnessThreshold: config.fitnessThreshold ?? 0.95,
      selectionPressure: config.selectionPressure ?? 0.5,
    };
    this.fitnessFn = fitnessFn;
    this.stats = this.initStats();
    this.registerDefaultOperators();
  }

  private initStats(): EvolutionStats {
    return {
      generation: 0,
      bestFitness: 0,
      avgFitness: 0,
      diversity: 1,
      convergence: 0,
      innovations: 0,
    };
  }

  private registerDefaultOperators(): void {
    this.mutationOperators.push({
      name: 'gaussian_mutation',
      probability: 0.6,
      apply: (individual) => this.gaussianMutation(individual),
    });

    this.mutationOperators.push({
      name: 'adaptive_mutation',
      probability: 0.3,
      apply: (individual) => this.adaptiveMutation(individual),
    });

    this.mutationOperators.push({
      name: 'reset_mutation',
      probability: 0.1,
      apply: (individual) => this.resetMutation(individual),
    });

    this.crossoverOperators.push({
      name: 'blend_crossover',
      probability: 0.4,
      apply: (p1, p2) => this.blendCrossover(p1, p2),
    });

    this.crossoverOperators.push({
      name: 'simulated_binary_crossover',
      probability: 0.4,
      apply: (p1, p2) => this.sbxCrossover(p1, p2),
    });

    this.crossoverOperators.push({
      name: 'uniform_crossover',
      probability: 0.2,
      apply: (p1, p2) => this.uniformCrossover(p1, p2),
    });
  }

  registerMutationOperator(op: MutationOperator<T>): void {
    this.mutationOperators.push(op);
  }

  registerCrossoverOperator(op: CrossoverOperator<T>): void {
    this.crossoverOperators.push(op);
  }

  initializePopulation(genotypeFactory: () => T): void {
    this.population = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      const individual: Individual<T> = {
        genotype: genotypeFactory(),
        fitness: 0,
        age: 0,
        history: [],
      };
      individual.fitness = this.evaluate(individual);
      this.population.push(individual);
    }
    this.updateStats();
    this.emit('initialized', { population: this.population.length });
  }

  private evaluate(individual: Individual<T>): number {
    return this.fitnessFn(individual.genotype);
  }

  tournamentSelect(k = 3): SelectionStrategy<T> {
    return {
      name: 'tournament',
      select: (pop, _fn) => this.tournamentSelection(pop, k),
    };
  }

  rouletteSelect(): SelectionStrategy<T> {
    return {
      name: 'roulette',
      select: (pop, _fn) => this.rouletteSelection(pop, 0),
    };
  }

  rankSelect(): SelectionStrategy<T> {
    return {
      name: 'rank',
      select: (pop, _fn) => this.rankSelection(pop, 0),
    };
  }

  evolve(
    selectionStrategy?: SelectionStrategy<T>,
    generations?: number
  ): EvolutionStats {
    const strategy = selectionStrategy ?? this.tournamentSelect();
    const maxGens = generations ?? this.config.maxGenerations;

    for (this.generation = this.stats.generation; this.generation < maxGens; this.generation++) {
      if (this.shouldTerminate()) {
        break;
      }

      this.evolveOneGeneration(strategy);
      this.updateStats();
      this.emit('generation', this.stats);

      if (this.generation % 10 === 0) {
        this.emit('progress', {
          generation: this.generation,
          bestFitness: this.stats.bestFitness,
          avgFitness: this.stats.avgFitness,
          diversity: this.stats.diversity,
        });
      }
    }

    return this.stats;
  }

  private evolveOneGeneration(selectionStrategy: SelectionStrategy<T>): void {
    const newPopulation: Individual<T>[] = [];
    const sortedPop = [...this.population].toSorted((a, b) => b.fitness - a.fitness);
    const elite = sortedPop.slice(0, this.config.eliteSize);
    
    for (const ind of elite) {
      newPopulation.push(this.cloneIndividual(ind));
    }

    const parents = selectionStrategy.select(this.population, this.fitnessFn);
    const offspringCount = this.config.populationSize - this.config.eliteSize;
    const count = Math.ceil(offspringCount * this.config.selectionPressure);

    while (newPopulation.length < this.config.populationSize) {
      const parent1 = parents[Math.floor(Math.random() * count)];
      const parent2 = parents[Math.floor(Math.random() * count)];

      let offspring1: Individual<T>;
      let offspring2: Individual<T>;

      if (Math.random() < this.config.crossoverRate) {
        [offspring1, offspring2] = this.crossover(parent1, parent2);
      } else {
        offspring1 = this.cloneIndividual(parent1);
        offspring2 = this.cloneIndividual(parent2);
      }

      newPopulation.push(this.mutate(offspring1));
      if (newPopulation.length < this.config.populationSize) {
        newPopulation.push(this.mutate(offspring2));
      }
    }

    for (const ind of newPopulation) {
      ind.fitness = this.evaluate(ind);
    }

    this.population = newPopulation;
    this.updateHallOfFame();
  }

  private cloneIndividual(ind: Individual<T>): Individual<T> {
    return {
      genotype: this.deepClone(ind.genotype),
      fitness: ind.fitness,
      age: 0,
      history: [...ind.history],
    };
  }

  private deepClone(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private crossover(parent1: Individual<T>, parent2: Individual<T>): [Individual<T>, Individual<T>] {
    const operator = this.selectCrossoverOperator();
    const [child1, child2] = operator.apply(parent1, parent2);
    child1.age = 0;
    child2.age = 0;
    return [child1, child2];
  }

  private mutate(individual: Individual<T>): Individual<T> {
    const mutation = this.selectMutationOperator();
    const mutated = mutation.apply(individual);
    mutated.fitness = this.evaluate(mutated);
    mutated.history.push({
      generation: this.generation,
      fitness: mutated.fitness,
      mutation: mutation.name,
    });
    return mutated;
  }

  private selectMutationOperator(): MutationOperator<T> {
    const totalProb = this.mutationOperators.reduce((sum, op) => sum + op.probability, 0);
    let rand = Math.random() * totalProb;
    for (const op of this.mutationOperators) {
      rand -= op.probability;
      if (rand <= 0) {
        return op;
      }
    }
    return this.mutationOperators[0]!;
  }

  private selectCrossoverOperator(): CrossoverOperator<T> {
    const totalProb = this.crossoverOperators.reduce((sum, op) => sum + op.probability, 0);
    let rand = Math.random() * totalProb;
    for (const op of this.crossoverOperators) {
      rand -= op.probability;
      if (rand <= 0) {
        return op;
      }
    }
    return this.crossoverOperators[0]!;
  }

  private tournamentSelection(population: Individual<T>[], k: number): Individual<T>[] {
    const selected: Individual<T>[] = [];
    const count = Math.ceil(population.length * this.config.selectionPressure);
    
    for (let i = 0; i < count; i++) {
      let best = population[Math.floor(Math.random() * population.length)];
      for (let j = 1; j < k; j++) {
        const candidate = population[Math.floor(Math.random() * population.length)];
        if (candidate.fitness > best.fitness) {
          best = candidate;
        }
      }
      selected.push(this.cloneIndividual(best));
    }
    return selected;
  }

  private rouletteSelection(population: Individual<T>[], _k: number): Individual<T>[] {
    const totalFitness = population.reduce((sum, ind) => sum + ind.fitness, 0);
    const selected: Individual<T>[] = [];
    const count = Math.ceil(population.length * this.config.selectionPressure);

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalFitness;
      for (const ind of population) {
        rand -= ind.fitness;
        if (rand <= 0) {
          selected.push(this.cloneIndividual(ind));
          break;
        }
      }
    }
    return selected;
  }

  private rankSelection(population: Individual<T>[], _k: number): Individual<T>[] {
    const sorted = [...population].toSorted((a, b) => b.fitness - a.fitness);
    const ranks = sorted.map((_val, idx) => idx + 1);
    const totalRank = ranks.reduce((a, b) => a + b, 0);
    
    const selected: Individual<T>[] = [];
    const count = Math.ceil(population.length * this.config.selectionPressure);

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalRank;
      for (let j = 0; j < sorted.length; j++) {
        rand -= ranks[j];
        if (rand <= 0) {
          selected.push(this.cloneIndividual(sorted[j]));
          break;
        }
      }
    }
    return selected;
  }

  private gaussianMutation(individual: Individual<T>): Individual<T> {
    const genotype = this.deepClone(individual.genotype) as Record<string, number>;
    for (const key in genotype) {
      if (typeof genotype[key] === 'number') {
        const mutationStrength = 0.1 * (1 - this.generation / this.config.maxGenerations);
        genotype[key] += this.gaussianRandom() * mutationStrength;
      }
    }
    return { ...individual, genotype: genotype as T };
  }

  private adaptiveMutation(individual: Individual<T>): Individual<T> {
    const genotype = this.deepClone(individual.genotype) as Record<string, number>;
    const ageFactor = Math.max(0.1, 1 - individual.age / 100);
    
    for (const key in genotype) {
      if (typeof genotype[key] === 'number') {
        const mutationStrength = 0.2 * ageFactor;
        genotype[key] += this.gaussianRandom() * mutationStrength;
      }
    }
    
    individual.age++;
    return { ...individual, genotype: genotype as T };
  }

  private resetMutation(individual: Individual<T>): Individual<T> {
    const genotype = this.deepClone(individual.genotype) as Record<string, number>;
    const keys = Object.keys(genotype);
    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if (typeof genotype[randomKey] === 'number') {
        genotype[randomKey] = Math.random() * 2 - 1;
        const innovKey = `reset_${randomKey}`;
        this.innovationRegistry.set(innovKey, (this.innovationRegistry.get(innovKey) ?? 0) + 1);
      }
    }
    return { ...individual, genotype: genotype as T };
  }

  private blendCrossover(
    parent1: Individual<T>,
    parent2: Individual<T>
  ): [Individual<T>, Individual<T>] {
    const g1 = this.deepClone(parent1.genotype) as Record<string, number>;
    const g2 = this.deepClone(parent2.genotype) as Record<string, number>;
    const alpha = 0.5;

    for (const key in g1) {
      if (typeof g1[key] === 'number' && typeof g2[key] === 'number') {
        const min = Math.min(g1[key], g2[key]);
        const max = Math.max(g1[key], g2[key]);
        const range = max - min;
        g1[key] = min - alpha * range + Math.random() * (1 + 2 * alpha) * range;
        g2[key] = min - alpha * range + Math.random() * (1 + 2 * alpha) * range;
      }
    }

    return [
      { ...parent1, genotype: g1 as T },
      { ...parent2, genotype: g2 as T },
    ];
  }

  private sbxCrossover(
    parent1: Individual<T>,
    parent2: Individual<T>
  ): [Individual<T>, Individual<T>] {
    const g1 = this.deepClone(parent1.genotype) as Record<string, number>;
    const g2 = this.deepClone(parent2.genotype) as Record<string, number>;
    const eta = 10;

    for (const key in g1) {
      if (typeof g1[key] === 'number' && typeof g2[key] === 'number') {
        const u = Math.random();
        const beta = u <= 0.5
          ? Math.pow(2 * u, 1 / (eta + 1))
          : Math.pow(1 / (2 * (1 - u)), 1 / (eta + 1));
        
        const avg = (g1[key] + g2[key]) / 2;
        const diff = (g1[key] - g2[key]) / 2;
        
        g1[key] = avg + beta * diff;
        g2[key] = avg - beta * diff;
      }
    }

    return [
      { ...parent1, genotype: g1 as T },
      { ...parent2, genotype: g2 as T },
    ];
  }

  private uniformCrossover(
    parent1: Individual<T>,
    parent2: Individual<T>
  ): [Individual<T>, Individual<T>] {
    const g1 = this.deepClone(parent1.genotype) as Record<string, unknown>;
    const g2 = this.deepClone(parent2.genotype) as Record<string, unknown>;

    for (const key in g1) {
      if (typeof g1[key] === typeof g2[key] && Math.random() < 0.5) {
        const temp = g1[key];
        g1[key] = g2[key];
        g2[key] = temp;
      }
    }

    return [
      { ...parent1, genotype: g1 as T },
      { ...parent2, genotype: g2 as T },
    ];
  }

  private gaussianRandom(): number {
    let u = 0;
    let v = 0;
    while (u === 0) { u = Math.random(); }
    while (v === 0) { v = Math.random(); }
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private updateStats(): void {
    const fitnesses = this.population.map(ind => ind.fitness);
    const bestFitness = Math.max(...fitnesses);
    
    this.stats = {
      generation: this.generation,
      bestFitness,
      avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      diversity: this.calculateDiversity(),
      convergence: this.calculateConvergence(),
      innovations: this.innovationRegistry.size,
    };

    this.fitnessHistory.push(this.stats.avgFitness);
    this.diversityHistory.push(this.stats.diversity);
  }

  private calculateDiversity(): number {
    if (this.population.length === 0) { return 1; }
    const features = this.population[0].genotype as Record<string, number>;
    const keys = Object.keys(features).filter(k => typeof features[k] === 'number');    
    if (keys.length === 0) { return 1; }

    let totalVariance = 0;
    for (const key of keys) {
      const values = this.population.map(ind => (ind.genotype as Record<string, number>)[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      totalVariance += variance;
    }
    
    return Math.min(1, totalVariance / keys.length);
  }

  private calculateConvergence(): number {
    if (this.fitnessHistory.length < 10) { return 0; }
    const recent = this.fitnessHistory.slice(-10);
    return this.variance(recent);
  }

  private variance(arr: number[]): number {
    if (arr.length === 0) { return 0; }
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
  }

  private updateHallOfFame(): void {
    const sorted = [...this.population].toSorted((a, b) => b.fitness - a.fitness);
    for (const ind of sorted) {
      if (!this.hallOfFame.some(h => h.fitness >= ind.fitness)) {
        this.hallOfFame.push(ind);
        if (this.hallOfFame.length > 10) {
          this.hallOfFame.shift();
        }
        break;
      }
    }
  }

  private shouldTerminate(): boolean {
    if (this.stats.bestFitness >= this.config.fitnessThreshold) {
      this.emit('terminated', { reason: 'fitness_threshold', stats: this.stats });
      return true;
    }
    if (this.generation >= this.config.maxGenerations) {
      this.emit('terminated', { reason: 'max_generations', stats: this.stats });
      return true;
    }
    if (this.stats.diversity < 0.01) {
      this.emit('terminated', { reason: 'convergence', stats: this.stats });
      return true;
    }
    return false;
  }

  getBestIndividual(): Individual<T> {
    return [...this.population].toSorted((a, b) => b.fitness - a.fitness)[0]!;
  }

  getStats(): EvolutionStats {
    return this.stats;
  }

  getHallOfFame(): Individual<T>[] {
    return this.hallOfFame;
  }

  getFitnessHistory(): number[] {
    return this.fitnessHistory;
  }

  getDiversityHistory(): number[] {
    return this.diversityHistory;
  }

  getPopulation(): Individual<T>[] {
    return this.population;
  }
}

export default EvolutionaryEngine;
