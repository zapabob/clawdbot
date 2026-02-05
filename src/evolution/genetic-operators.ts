import type { Genome, Individual } from "./population.js";

export interface CrossoverResult {
  offspring: Genome[];
  crossoverPoints: number[];
}

export interface MutationResult {
  mutated: Genome;
  mutationsApplied: string[];
}

const MUTATION_RATE = 0.1;
const PARAMETER_MUTATION_RANGE = 0.2;
const CODE_MUTATION_CHUNK_SIZE = 50;

const CODE_MUTATIONS = [
  "extract_function",
  "inline_code",
  "rename_variables",
  "add_type_hints",
  "optimize_loop",
  "simplify_condition",
  "extract_class",
  "add_error_handling",
  "add_logging",
  "refactor_method",
];

export class GeneticOperators {
  private mutationRate: number;
  private parameterRange: number;

  constructor(
    mutationRate: number = MUTATION_RATE,
    parameterRange: number = PARAMETER_MUTATION_RANGE,
  ) {
    this.mutationRate = mutationRate;
    this.parameterRange = parameterRange;
  }

  crossover(parent1: Genome, parent2: Genome): CrossoverResult {
    const strategies = [this.uniformCrossover, this.singlePointCrossover, this.blendCrossover];
    const method = strategies[Math.floor(Math.random() * strategies.length)];
    return method.call(this, parent1, parent2);
  }

  private uniformCrossover(parent1: Genome, parent2: Genome): CrossoverResult {
    const offspringGenome: Genome = {
      code: "",
      strategy: Math.random() > 0.5 ? parent1.strategy : parent2.strategy,
      parameters: {},
      mutations: [],
    };

    const code1Lines = parent1.code.split("\n");
    const code2Lines = parent2.code.split("\n");
    const minLines = Math.min(code1Lines.length, code2Lines.length);

    let crossoverPoints: number[] = [];

    for (let i = 0; i < minLines; i++) {
      if (Math.random() > 0.5) {
        offspringGenome.code += code1Lines[i] + "\n";
      } else {
        offspringGenome.code += code2Lines[i] + "\n";
        crossoverPoints.push(i);
      }
    }

    offspringGenome.code = offspringGenome.code.trimEnd();

    for (const key of new Set([
      ...Object.keys(parent1.parameters),
      ...Object.keys(parent2.parameters),
    ])) {
      offspringGenome.parameters[key] =
        Math.random() > 0.5 ? (parent1.parameters[key] ?? 0) : (parent2.parameters[key] ?? 0);
    }

    offspringGenome.mutations = ["uniform_crossover"];

    return { offspring: [offspringGenome], crossoverPoints };
  }

  private singlePointCrossover(parent1: Genome, parent2: Genome): CrossoverResult {
    const code1Lines = parent1.code.split("\n");
    const code2Lines = parent2.code.split("\n");

    if (code1Lines.length < 2 || code2Lines.length < 2) {
      return this.uniformCrossover(parent1, parent2);
    }

    const point =
      Math.floor(Math.random() * (Math.min(code1Lines.length, code2Lines.length) - 1)) + 1;

    const offspringGenome: Genome = {
      code: [...code1Lines.slice(0, point), ...code2Lines.slice(point)].join("\n"),
      strategy: Math.random() > 0.5 ? parent1.strategy : parent2.strategy,
      parameters: {},
      mutations: [],
    };

    const paramKeys = [
      ...new Set([...Object.keys(parent1.parameters), ...Object.keys(parent2.parameters)]),
    ];

    for (const key of paramKeys) {
      const p1Val = parent1.parameters[key] ?? 0;
      const p2Val = parent2.parameters[key] ?? 0;
      offspringGenome.parameters[key] = point < code1Lines.length ? p1Val : p2Val;
    }

    offspringGenome.mutations = [`single_point_crossover_${point}`];

    return { offspring: [offspringGenome], crossoverPoints: [point] };
  }

  private blendCrossover(parent1: Genome, parent2: Genome): CrossoverResult {
    const offspringGenome: Genome = {
      code: Math.random() > 0.5 ? parent1.code : parent2.code,
      strategy: Math.random() > 0.5 ? parent1.strategy : parent2.strategy,
      parameters: {},
      mutations: [],
    };

    const alpha = 0.5;
    const paramKeys = [
      ...new Set([...Object.keys(parent1.parameters), ...Object.keys(parent2.parameters)]),
    ];

    for (const key of paramKeys) {
      const p1 = parent1.parameters[key] ?? 0;
      const p2 = parent2.parameters[key] ?? 0;
      const min = Math.min(p1, p2);
      const max = Math.max(p1, p2);
      const range = max - min;

      offspringGenome.parameters[key] =
        min + Math.random() * range + (Math.random() - 0.5) * alpha * range;
    }

    offspringGenome.mutations = ["blend_crossover"];

    return { offspring: [offspringGenome], crossoverPoints: [] };
  }

  mutate(genome: Genome): MutationResult {
    const mutationsApplied: string[] = [];
    let mutatedGenome: Genome = {
      ...genome,
      parameters: { ...genome.parameters },
      mutations: [...genome.mutations],
    };

    if (Math.random() < this.mutationRate) {
      const codeMutation = this.mutateCode(mutatedGenome.code);
      mutatedGenome.code = codeMutation.mutated;
      mutationsApplied.push(...codeMutation.mutations);
    }

    for (const [key, value] of Object.entries(mutatedGenome.parameters)) {
      if (Math.random() < this.mutationRate) {
        mutatedGenome.parameters[key] = this.mutateParameter(value);
        mutationsApplied.push(`parameter_${key}`);
      }
    }

    if (Math.random() < this.mutationRate * 0.5) {
      mutatedGenome.strategy = this.mutateStrategy(mutatedGenome.strategy);
      mutationsApplied.push("strategy_change");
    }

    return { mutated: mutatedGenome, mutationsApplied };
  }

  private mutateCode(code: string): { mutated: string; mutations: string[] } {
    const lines = code.split("\n");
    const mutations: string[] = [];

    if (lines.length < 2) {
      return { mutated: code, mutations };
    }

    const mutationType = CODE_MUTATIONS[Math.floor(Math.random() * CODE_MUTATIONS.length)];
    mutations.push(mutationType);

    switch (mutationType) {
      case "rename_variables": {
        const varNames = code.match(/\b([a-z_][a-z0-9_]*)\b/g) || [];
        if (varNames.length > 0) {
          const toRename = varNames[Math.floor(Math.random() * varNames.length)];
          const newName = toRename + "_" + Math.floor(Math.random() * 1000);
          return { mutated: code.replace(new RegExp(toRename, "g"), newName), mutations };
        }
        break;
      }
      case "add_type_hints": {
        const functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (functionMatch) {
          const funcName = functionMatch[1];
          const newFunc = `def ${functionMatch[2]}:\n    # Type hints added\n    pass`;
          return { mutated: code.replace(/def\s+(\w+)\s*\(([^)]*)\)/, newFunc), mutations };
        }
        break;
      }
      case "add_error_handling": {
        const linesWithDef = lines.findIndex((l) => l.trim().startsWith("def "));
        if (linesWithDef >= 0) {
          const funcBody = lines.slice(linesWithDef + 1);
          const indentedBody = funcBody.map((l) => (l.trim() ? "    " + l : l)).join("\n");
          const newBody = `try:\n${indentedBody}\nexcept Exception as e:\n    print(f"Error: {e}")`;
          const newLines = [...lines.slice(0, linesWithDef + 1), newBody];
          return { mutated: newLines.join("\n"), mutations };
        }
        break;
      }
      case "add_logging": {
        const logging = 'print(f"[DEBUG] Function called")';
        const linesWithDef = lines.findIndex((l) => l.trim().startsWith("def "));
        if (linesWithDef >= 0) {
          const newLines = [
            ...lines.slice(0, linesWithDef + 1),
            logging,
            ...lines.slice(linesWithDef + 1),
          ];
          return { mutated: newLines.join("\n"), mutations };
        }
        break;
      }
      case "extract_function": {
        const extractStart = Math.floor(Math.random() * Math.max(1, lines.length - 5));
        const extractEnd = Math.min(extractStart + Math.floor(Math.random() * 5) + 1, lines.length);
        const extracted = lines.slice(extractStart, extractEnd).join("\n");
        const newFunc = `def extracted_function():\n${extracted
          .split("\n")
          .map((l) => "    " + l)
          .join("\n")}\n`;
        const newCode = [...lines.slice(0, extractStart), newFunc, ...lines.slice(extractEnd)].join(
          "\n",
        );
        return { mutated: newCode, mutations };
      }
      default: {
        const chunkStart = Math.floor(
          Math.random() * Math.max(1, lines.length - CODE_MUTATION_CHUNK_SIZE),
        );
        const chunkEnd = Math.min(chunkStart + CODE_MUTATION_CHUNK_SIZE, lines.length);
        const chunk = lines.slice(chunkStart, chunkEnd);
        const modifiedChunk = chunk.map((line) => line.replace(/\s+/g, " ").trim()).join("\n");
        const newLines = [...lines.slice(0, chunkStart), modifiedChunk, ...lines.slice(chunkEnd)];
        return { mutated: newLines.join("\n"), mutations };
      }
    }

    return { mutated: code, mutations };
  }

  private mutateParameter(value: number): number {
    const delta = (Math.random() - 0.5) * 2 * this.parameterRange * Math.abs(value);
    return Math.max(0, value + delta);
  }

  private mutateStrategy(strategy: string): string {
    const strategies = ["aggressive", "conservative", "balanced", "exploratory", "exploitative"];
    const filtered = strategies.filter((s) => s !== strategy);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  createOffspring(parents: Individual[]): Individual[] {
    let idCounter = 0;
    const createIndividual = (genome: Genome, parentIds: string[]): Individual => {
      const id = `ind_${++idCounter}_${Date.now()}`;
      const lineage =
        parentIds.length > 0 ? [...this.getLineage(parentIds[0], parents), ...parentIds] : [id];
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
    };

    const getLineage = (parentId: string, parentList: Individual[]): string[] => {
      const parent = parentList.find((p) => p.id === parentId);
      if (!parent) return [];
      return [...parent.lineage, parentId];
    };

    if (parents.length < 2) {
      const { mutated, mutationsApplied } = this.mutate(parents[0].genome);
      const offspring = createIndividual(mutated, [parents[0].id]);
      offspring.genome.mutations = mutationsApplied;
      return [offspring];
    }

    const [parent1, parent2] = parents;
    const { offspring } = this.crossover(parent1.genome, parent2.genome);

    return offspring.map((genome) => {
      const { mutated, mutationsApplied } = this.mutate(genome);
      const individual = createIndividual(mutated, [parent1.id, parent2.id]);
      individual.genome.mutations = [
        ...parent1.genome.mutations.slice(-2),
        ...parent2.genome.mutations.slice(-2),
        ...mutationsApplied,
      ];
      return individual;
    });
  }

  private getLineage(parentId: string, parentList: Individual[]): string[] {
    const parent = parentList.find((p) => p.id === parentId);
    if (!parent) return [];
    return parent.lineage;
  }

  computeSimilarity(genome1: Genome, genome2: Genome): number {
    const lines1 = new Set(genome1.code.split("\n"));
    const lines2 = new Set(genome2.code.split("\n"));
    const intersection = new Set([...lines1].filter((x) => lines2.has(x)));
    const union = new Set([...lines1, ...lines2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}
