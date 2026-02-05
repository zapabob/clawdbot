export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  maxTokens: number;
  costPer1kTokens: number;
  latency: number;
  available: boolean;
}

export interface ModelResponse {
  modelId: string;
  response: string;
  tokens: number;
  latency: number;
  cost: number;
  success: boolean;
  error?: string;
}

export interface ModelPoolConfig {
  maxConcurrent: number;
  timeout: number;
  fallbackEnabled: boolean;
  loadBalancing: "round_robin" | "least_used" | "random" | "weighted";
}

export interface PoolStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  averageCost: number;
  modelUsage: Map<string, number>;
}

const DEFAULT_CONFIG: ModelPoolConfig = {
  maxConcurrent: 3,
  timeout: 30000,
  fallbackEnabled: true,
  loadBalancing: "weighted",
};

export class ModelPool {
  private config: ModelPoolConfig;
  private models: Map<string, AIModel>;
  private requestCounts: Map<string, number>;
  private stats: PoolStats;

  constructor(config: Partial<ModelPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.models = new Map();
    this.requestCounts = new Map();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      averageCost: 0,
      modelUsage: new Map(),
    };
  }

  registerModel(model: AIModel): void {
    this.models.set(model.id, model);
    this.requestCounts.set(model.id, 0);
  }

  unregisterModel(modelId: string): boolean {
    this.requestCounts.delete(modelId);
    return this.models.delete(modelId);
  }

  getModel(modelId: string): AIModel | undefined {
    return this.models.get(modelId);
  }

  getAllModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  getAvailableModels(): AIModel[] {
    return Array.from(this.models.values()).filter((m) => m.available);
  }

  setModelAvailability(modelId: string, available: boolean): boolean {
    const model = this.models.get(modelId);
    if (model) {
      model.available = available;
      return true;
    }
    return false;
  }

  async query(prompt: string, modelPreferences?: string[]): Promise<ModelResponse[]> {
    const availableModels = this.getAvailableModels();
    if (availableModels.length === 0) {
      return [
        {
          modelId: "",
          response: "",
          tokens: 0,
          latency: 0,
          cost: 0,
          success: false,
          error: "No models available",
        },
      ];
    }

    const selectedModels = this.selectModels(prompt, modelPreferences);
    const responses: ModelResponse[] = [];

    for (const model of selectedModels.slice(0, this.config.maxConcurrent)) {
      const response = await this.queryModel(model, prompt);
      responses.push(response);
      this.recordResponse(model.id, response);

      if (!this.config.fallbackEnabled) {
        break;
      }
    }

    return responses;
  }

  private async queryModel(model: AIModel, prompt: string): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      const response = await this.callModelAPI(model, prompt);
      const latency = Date.now() - startTime;
      const tokens = this.estimateTokens(prompt + response);
      const cost = (tokens / 1000) * model.costPer1kTokens;

      return {
        modelId: model.id,
        response,
        tokens,
        latency,
        cost,
        success: true,
      };
    } catch (error) {
      return {
        modelId: model.id,
        response: "",
        tokens: 0,
        latency: Date.now() - startTime,
        cost: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async callModelAPI(model: AIModel, prompt: string): Promise<string> {
    switch (model.provider) {
      case "openai": {
        const { default: openai } = await import("openai");
        const client = new openai({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await client.chat.completions.create({
          model: model.id,
          messages: [{ role: "user", content: prompt }],
          max_tokens: model.maxTokens,
        });
        return completion.choices[0]?.message?.content || "";
      }
      case "anthropic": {
        const { Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await client.messages.create({
          model: model.id,
          max_tokens: model.maxTokens,
          messages: [{ role: "user", content: prompt }],
        });
        return message.content[0]?.type === "text" ? message.content[0].text : "";
      }
      case "google": {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model2 = client.getGenerativeModel({ model: model.id });
        const result = await model2.generateContent(prompt);
        return result.response.text();
      }
      case "codex": {
        return this.callCodexAPI(prompt);
      }
      case "gemini": {
        return this.callGeminiAPI(prompt);
      }
      case "opencode": {
        return this.callOpencodeAPI(prompt);
      }
      default:
        return `[${model.name}] ${prompt}`;
    }
  }

  private async callCodexAPI(prompt: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return "[Codex] API key not configured";
    }
    return `[Codex] Processed: ${prompt.slice(0, 100)}...`;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return "[Gemini] API key not configured";
    }
    return `[Gemini] Processed: ${prompt.slice(0, 100)}...`;
  }

  private async callOpencodeAPI(prompt: string): Promise<string> {
    return `[Opencode] Processed: ${prompt.slice(0, 100)}...`;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private selectModels(prompt: string, preferences?: string[]): AIModel[] {
    let candidates = this.getAvailableModels();

    if (preferences && preferences.length > 0) {
      const preferred = candidates.filter((m) => preferences.includes(m.id));
      const others = candidates.filter((m) => !preferences.includes(m.id));
      candidates = [...preferred, ...others];
    }

    switch (this.config.loadBalancing) {
      case "round_robin": {
        return this.roundRobinSelect(candidates);
      }
      case "least_used": {
        return this.leastUsedSelect(candidates);
      }
      case "random": {
        return this.randomSelect(candidates);
      }
      case "weighted": {
        return this.weightedSelect(candidates);
      }
      default:
        return candidates.slice(0, 1);
    }
  }

  private roundRobinSelect(candidates: AIModel[]): AIModel[] {
    const sorted = candidates.sort((a, b) => {
      const aCount = this.requestCounts.get(a.id) || 0;
      const bCount = this.requestCounts.get(b.id) || 0;
      return aCount - bCount;
    });
    return sorted.slice(0, Math.min(2, sorted.length));
  }

  private leastUsedSelect(candidates: AIModel[]): AIModel[] {
    return candidates
      .sort((a, b) => {
        const aCount = this.requestCounts.get(a.id) || 0;
        const bCount = this.requestCounts.get(b.id) || 0;
        return aCount - bCount;
      })
      .slice(0, Math.min(2, candidates.length));
  }

  private randomSelect(candidates: AIModel[]): AIModel[] {
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(2, shuffled.length));
  }

  private weightedSelect(candidates: AIModel[]): AIModel[] {
    const weights = candidates.map((m) => ({
      model: m,
      weight: this.calculateWeight(m),
    }));

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    const selected: AIModel[] = [];
    for (const { model, weight } of weights) {
      random -= weight;
      if (random <= 0 || selected.length === 0) {
        selected.push(model);
      }
      if (selected.length >= 2) break;
    }

    return selected;
  }

  private calculateWeight(model: AIModel): number {
    const baseWeight = model.available ? 1 : 0;
    const usageCount = this.requestCounts.get(model.id) || 0;
    const usagePenalty = Math.min(usageCount * 0.1, 0.5);
    const capabilityBonus = model.capabilities.length * 0.1;

    return Math.max(0.1, baseWeight - usagePenalty + capabilityBonus);
  }

  private recordResponse(modelId: string, response: ModelResponse): void {
    this.stats.totalRequests++;
    this.requestCounts.set(modelId, (this.requestCounts.get(modelId) || 0) + 1);

    if (response.success) {
      this.stats.successfulRequests++;
      const currentUsage = this.stats.modelUsage.get(modelId) || 0;
      this.stats.modelUsage.set(modelId, currentUsage + 1);

      const latencyWeight = this.stats.averageLatency > 0 ? 0.1 : 0;
      this.stats.averageLatency =
        this.stats.averageLatency * (1 - latencyWeight) + response.latency * latencyWeight;

      const costWeight = this.stats.averageCost > 0 ? 0.1 : 0;
      this.stats.averageCost =
        this.stats.averageCost * (1 - costWeight) + response.cost * costWeight;
    } else {
      this.stats.failedRequests++;
    }
  }

  getStats(): PoolStats {
    return { ...this.stats, modelUsage: new Map(this.stats.modelUsage) };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      averageCost: 0,
      modelUsage: new Map(),
    };
  }
}
