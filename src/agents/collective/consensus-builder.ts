export interface ModelResponse {
  modelId: string;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ConsensusConfig {
  minResponses: number;
  confidenceThreshold: number;
  votingMethod: "majority" | "weighted" | "borda" | "condorcet";
  weights?: Map<string, number>;
  tieBreaker?: string;
}

export interface ConsensusResult {
  consensus: string;
  confidence: number;
  agreement: number;
  method: string;
  responses: ModelResponse[];
  votes: Map<string, number>;
  winningResponse?: ModelResponse;
  timestamp: Date;
}

export interface ConsensusStats {
  totalConsensuses: number;
  successfulConsensuses: number;
  failedConsensuses: number;
  averageAgreement: number;
  averageConfidence: number;
  methodUsage: Map<string, number>;
}

const DEFAULT_CONFIG: ConsensusConfig = {
  minResponses: 2,
  confidenceThreshold: 0.6,
  votingMethod: "majority",
};

export class ConsensusBuilder {
  private config: ConsensusConfig;
  private stats: ConsensusStats;

  constructor(config: Partial<ConsensusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      totalConsensuses: 0,
      successfulConsensuses: 0,
      failedConsensuses: 0,
      averageAgreement: 0,
      averageConfidence: 0,
      methodUsage: new Map(),
    };
  }

  build(responses: ModelResponse[]): ConsensusResult | null {
    this.stats.totalConsensuses++;

    if (responses.length < this.config.minResponses) {
      this.stats.failedConsensuses++;
      return null;
    }

    const method = this.config.votingMethod;
    const methodCount = this.stats.methodUsage.get(method) || 0;
    this.stats.methodUsage.set(method, methodCount + 1);

    let result: ConsensusResult;

    switch (method) {
      case "majority":
        result = this.majorityVote(responses);
        break;
      case "weighted":
        result = this.weightedVote(responses);
        break;
      case "borda":
        result = this.bordaCount(responses);
        break;
      case "condorcet":
        result = this.condorcetMethod(responses);
        break;
      default:
        result = this.majorityVote(responses);
    }

    if (result.confidence >= this.config.confidenceThreshold) {
      this.stats.successfulConsensuses++;
    }

    this.updateAverages(result);

    return result;
  }

  private majorityVote(responses: ModelResponse[]): ConsensusResult {
    const voteCount = new Map<string, number>();

    for (const response of responses) {
      const normalized = this.normalizeResponse(response.content);
      voteCount.set(normalized, (voteCount.get(normalized) || 0) + 1);
    }

    let winningContent = "";
    let maxVotes = 0;
    let totalVotes = 0;

    for (const [content, votes] of voteCount) {
      totalVotes += votes;
      if (votes > maxVotes) {
        maxVotes = votes;
        winningContent = content;
      }
    }

    const agreement = totalVotes > 0 ? maxVotes / responses.length : 0;
    const confidence = this.calculateConfidence(responses);

    const winningResponse = responses.find(
      (r) => this.normalizeResponse(r.content) === winningContent,
    );

    return {
      consensus: winningContent,
      confidence,
      agreement,
      method: "majority",
      responses,
      votes: voteCount,
      winningResponse,
      timestamp: new Date(),
    };
  }

  private weightedVote(responses: ModelResponse[]): ConsensusResult {
    const weightedScore = new Map<string, number>();

    for (const response of responses) {
      const normalized = this.normalizeResponse(response.content);
      const weight = this.config.weights?.get(response.modelId) || response.confidence;
      weightedScore.set(normalized, (weightedScore.get(normalized) || 0) + weight);
    }

    let winningContent = "";
    let maxScore = 0;
    let totalScore = 0;

    for (const [content, score] of weightedScore) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        winningContent = content;
      }
    }

    const agreement = totalScore > 0 ? maxScore / totalScore : 0;
    const confidence = this.calculateConfidence(responses);

    const winningResponse = responses.find(
      (r) => this.normalizeResponse(r.content) === winningContent,
    );

    return {
      consensus: winningContent,
      confidence,
      agreement,
      method: "weighted",
      responses,
      votes: weightedScore,
      winningResponse,
      timestamp: new Date(),
    };
  }

  private bordaCount(responses: ModelResponse[]): ConsensusResult {
    const bordaScores = new Map<string, number>();
    const uniqueResponses = [...new Set(responses.map((r) => this.normalizeResponse(r.content)))];

    for (const response of responses) {
      const normalized = this.normalizeResponse(response.content);
      const rank = uniqueResponses.length - uniqueResponses.indexOf(normalized);
      const weight = this.config.weights?.get(response.modelId) || response.confidence;
      bordaScores.set(normalized, (bordaScores.get(normalized) || 0) + rank * weight);
    }

    let winningContent = "";
    let maxScore = 0;

    for (const [content, score] of bordaScores) {
      if (score > maxScore) {
        maxScore = score;
        winningContent = content;
      }
    }

    const totalScore = [...bordaScores.values()].reduce((a, b) => a + b, 0);
    const agreement = totalScore > 0 ? maxScore / totalScore : 0;
    const confidence = this.calculateConfidence(responses);

    const winningResponse = responses.find(
      (r) => this.normalizeResponse(r.content) === winningContent,
    );

    return {
      consensus: winningContent,
      confidence,
      agreement,
      method: "borda",
      responses,
      votes: bordaScores,
      winningResponse,
      timestamp: new Date(),
    };
  }

  private condorcetMethod(responses: ModelResponse[]): ConsensusResult {
    const unique = [...new Set(responses.map((r) => this.normalizeResponse(r.content)))];
    const headToHead = new Map<string, Map<string, number>>();

    for (const a of unique) {
      headToHead.set(a, new Map());
      for (const b of unique) {
        if (a !== b) {
          headToHead.get(a)!.set(b, 0);
        }
      }
    }

    for (const response of responses) {
      const normalized = this.normalizeResponse(response.content);
      for (const other of unique) {
        if (normalized !== other) {
          const weight = this.config.weights?.get(response.modelId) || response.confidence;
          const current = headToHead.get(normalized)?.get(other) || 0;
          headToHead.get(normalized)?.set(other, current + weight);
        }
      }
    }

    let condorcetWinner = "";
    let wins = 0;

    for (const candidate of unique) {
      let candidateWins = 0;
      for (const other of unique) {
        if (candidate !== other) {
          const candidateScore = headToHead.get(candidate)?.get(other) || 0;
          const otherScore = headToHead.get(other)?.get(candidate) || 0;
          if (candidateScore > otherScore) {
            candidateWins++;
          }
        }
      }
      if (candidateWins > wins) {
        wins = candidateWins;
        condorcetWinner = candidate;
      }
    }

    const agreement = wins / Math.max(1, unique.length - 1);
    const confidence = this.calculateConfidence(responses);

    const winningResponse = responses.find(
      (r) => this.normalizeResponse(r.content) === condorcetWinner,
    );

    return {
      consensus: condorcetWinner || this.majorityVote(responses).consensus,
      confidence,
      agreement,
      method: "condorcet",
      responses,
      votes: headToHead.get(condorcetWinner) || new Map(),
      winningResponse,
      timestamp: new Date(),
    };
  }

  private normalizeResponse(content: string): string {
    return content.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 200);
  }

  private calculateConfidence(responses: ModelResponse[]): number {
    if (responses.length === 0) return 0;

    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;

    const variance =
      responses.reduce((sum, r) => sum + Math.pow(r.confidence - avgConfidence, 2), 0) /
      responses.length;

    const agreement = 1 - Math.sqrt(variance);

    return avgConfidence * 0.6 + agreement * 0.4;
  }

  private updateAverages(result: ConsensusResult): void {
    const weight = 0.1;
    this.stats.averageAgreement =
      this.stats.averageAgreement * (1 - weight) + result.agreement * weight;
    this.stats.averageConfidence =
      this.stats.averageConfidence * (1 - weight) + result.confidence * weight;
  }

  setWeights(weights: Record<string, number>): void {
    this.config.weights = new Map(Object.entries(weights));
  }

  setVotingMethod(method: ConsensusConfig["votingMethod"]): void {
    this.config.votingMethod = method;
  }

  getStats(): ConsensusStats {
    return { ...this.stats, methodUsage: new Map(this.stats.methodUsage) };
  }

  reset(): void {
    this.stats = {
      totalConsensuses: 0,
      successfulConsensuses: 0,
      failedConsensuses: 0,
      averageAgreement: 0,
      averageConfidence: 0,
      methodUsage: new Map(),
    };
  }
}
