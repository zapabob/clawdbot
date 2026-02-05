/**
 * GRPO (Group Relative Policy Optimization) Engine
 *
 * Based on DeepSeekMath paper for group-based policy optimization
 * without requiring a critic model. Uses relative rewards within groups
 * for advantage estimation.
 */

import { EventEmitter } from "events";

export interface GRPOConfig {
  groupSize: number;
  learningRate: number;
  clipRatio: number;
  referenceKLWeight: number;
  updateInterval: number;
}

export interface PolicyState {
  parameters: Record<string, number>;
  logProb: number;
  action: string;
}

export interface GRPOSample {
  id: string;
  state: string;
  actions: PolicyState[];
  rewards: number[];
  groupId: string;
  timestamp: number;
}

export interface GRPOGroup {
  id: string;
  samples: GRPOSample[];
  meanReward: number;
  stdReward: number;
  advantages: number[];
  policyHistory: PolicyState[][];
}

export interface GRPOStats {
  totalSamples: number;
  totalGroups: number;
  avgReward: number;
  avgAdvantage: number;
  policyUpdateCount: number;
  klDivergence: number;
  clipFraction: number;
  recentRewards: number[];
}

export interface RewardFunction {
  (context: {
    action: string;
    state: string;
    outcome: string;
    success: boolean;
    responseTime: number;
    userFeedback?: number;
  }): number;
}

export class GRPOEngine extends EventEmitter {
  private config: GRPOConfig;
  private currentPolicy: Map<string, number> = new Map();
  private referencePolicy: Map<string, number> = new Map();
  private pendingSamples: GRPOSample[] = [];
  private groups: Map<string, GRPOGroup> = new Map();
  private sampleIdCounter = 0;
  private stats: GRPOStats;
  private rewardFunction: RewardFunction;
  private groupBuffer: GRPOSample[][] = [];

  constructor(config: Partial<GRPOConfig>, rewardFunction?: RewardFunction) {
    super();
    this.config = {
      groupSize: config.groupSize ?? 8,
      learningRate: config.learningRate ?? 0.001,
      clipRatio: config.clipRatio ?? 0.2,
      referenceKLWeight: config.referenceKLWeight ?? 0.03,
      updateInterval: config.updateInterval ?? 100,
    };
    this.rewardFunction = rewardFunction ?? this.defaultRewardFunction;
    this.stats = this.initStats();
  }

  private initStats(): GRPOStats {
    return {
      totalSamples: 0,
      totalGroups: 0,
      avgReward: 0,
      avgAdvantage: 0,
      policyUpdateCount: 0,
      klDivergence: 0,
      clipFraction: 0,
      recentRewards: [],
    };
  }

  private defaultRewardFunction(context: {
    action: string;
    state: string;
    outcome: string;
    success: boolean;
    responseTime: number;
    userFeedback?: number;
  }): number {
    let reward = 0;

    if (context.success) {
      reward += 1.0;
      if (context.responseTime < 1000) {
        reward += 0.5;
      } else if (context.responseTime < 3000) {
        reward += 0.25;
      }
    } else {
      reward -= 0.5;
    }

    if (context.userFeedback !== undefined) {
      reward += (context.userFeedback - 0.5) * 2;
    }

    return Math.max(-1, Math.min(1, reward));
  }

  initializePolicy(parameterDefaults: Record<string, number>): void {
    for (const [key, value] of Object.entries(parameterDefaults)) {
      this.currentPolicy.set(key, value);
      this.referencePolicy.set(key, value);
    }
    this.emit("policyInitialized", { parameters: parameterDefaults });
  }

  setRewardFunction(fn: RewardFunction): void {
    this.rewardFunction = fn;
  }

  async sample(state: string, availableActions: string[]): Promise<PolicyState[]> {
    const samples: PolicyState[] = [];

    for (const action of availableActions) {
      const params = this.getActionParameters(action, state);
      const logProb = this.calculateLogProbability(params, state, action);

      samples.push({
        parameters: Object.fromEntries(params),
        logProb,
        action,
      });
    }

    const groupId = `group_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const sample: GRPOSample = {
      id: `sample_${++this.sampleIdCounter}`,
      state,
      actions: samples,
      rewards: [],
      groupId,
      timestamp: Date.now(),
    };

    this.pendingSamples.push(sample);
    this.stats.totalSamples++;

    if (this.pendingSamples.length >= this.config.groupSize) {
      await this.processGroup();
    }

    return samples;
  }

  async recordReward(
    sampleId: string,
    actionIndex: number,
    outcome: string,
    success: boolean,
    responseTime: number,
    userFeedback?: number,
  ): Promise<void> {
    const sample = this.pendingSamples.find((s) => s.id === sampleId);
    if (!sample) {
      throw new Error(`Sample ${sampleId} not found`);
    }

    const action = sample.actions[actionIndex];
    const reward = this.rewardFunction({
      action: action.action,
      state: sample.state,
      outcome,
      success,
      responseTime,
      userFeedback,
    });

    sample.rewards[actionIndex] = reward;
    this.stats.recentRewards.push(reward);
    if (this.stats.recentRewards.length > 100) {
      this.stats.recentRewards.shift();
    }

    if (sample.rewards.filter((r) => r !== undefined).length === sample.actions.length) {
      const group = this.groups.get(sample.groupId);
      if (group) {
        group.samples.push(sample);
      }
    }
  }

  private async processGroup(): Promise<void> {
    const groupSamples = this.pendingSamples.splice(0, this.config.groupSize);
    if (groupSamples.length < 2) return;

    const groupId = groupSamples[0].groupId;

    const allRewards = groupSamples.flatMap((s) => s.rewards).filter((r) => r !== undefined);
    const meanReward = allRewards.reduce((a, b) => a + b, 0) / allRewards.length;
    const stdReward = Math.sqrt(
      allRewards.reduce((sum, r) => sum + Math.pow(r - meanReward, 2), 0) / allRewards.length,
    );

    const group: GRPOGroup = {
      id: groupId,
      samples: groupSamples,
      meanReward,
      stdReward: stdReward || 1,
      advantages: [],
      policyHistory: [],
    };

    for (const sample of groupSamples) {
      const advantages: number[] = [];
      for (let i = 0; i < sample.actions.length; i++) {
        const reward = sample.rewards[i];
        if (reward !== undefined) {
          const advantage = (reward - meanReward) / (stdReward || 1);
          advantages.push(advantage);
        } else {
          advantages.push(0);
        }
      }
      group.advantages.push(...advantages);
      group.policyHistory.push(sample.actions.map((a) => ({ ...a })));
    }

    this.groups.set(groupId, group);
    this.stats.totalGroups++;

    await this.updatePolicy(group);
  }

  private async updatePolicy(group: GRPOGroup): Promise<void> {
    let totalClipped = 0;
    let totalKL = 0;
    let totalUpdates = 0;

    const oldPolicy = new Map(this.currentPolicy);

    for (const sample of group.samples) {
      const sampleIdx = group.samples.indexOf(sample);
      const advantages = group.advantages[sampleIdx];

      for (let i = 0; i < sample.actions.length; i++) {
        const action = sample.actions[i];
        const advantage = advantages[i];
        const oldLogProb = action.logProb;

        const newParams = this.updateParameters(
          action.parameters,
          action.action,
          sample.state,
          advantage,
        );

        const newLogProb = this.calculateLogProbability(
          new Map(Object.entries(newParams)),
          sample.state,
          action.action,
        );

        const ratio = Math.exp(newLogProb - oldLogProb);
        const clippedRatio = Math.max(
          1 - this.config.clipRatio,
          Math.min(1 + this.config.clipRatio, ratio),
        );

        if (ratio > 1 + this.config.clipRatio || ratio < 1 - this.config.clipRatio) {
          totalClipped++;
        }

        const kl = this.calculateKL(oldLogProb, newLogProb);
        totalKL += kl;

        for (const [key, value] of Object.entries(newParams)) {
          const currentValue = this.currentPolicy.get(key) ?? 0;
          this.currentPolicy.set(key, currentValue + value * this.config.learningRate);
        }

        totalUpdates++;
      }
    }

    const policyParams = Object.fromEntries(this.currentPolicy);
    this.referencePolicy = new Map(this.currentPolicy);

    this.stats.policyUpdateCount++;
    this.stats.avgReward = group.meanReward;
    this.stats.avgAdvantage =
      group.advantages.flat().reduce((a, b) => a + b, 0) / group.advantages.flat().length;
    this.stats.klDivergence = totalKL / totalUpdates;
    this.stats.clipFraction = totalUpdates > 0 ? totalClipped / totalUpdates : 0;

    this.emit("policyUpdated", {
      groupId: group.id,
      stats: { ...this.stats },
      parameters: policyParams,
    });
  }

  private getActionParameters(action: string, state: string): Map<string, number> {
    const params = new Map<string, number>();
    const baseParams = Object.fromEntries(this.currentPolicy);

    const actionHash = this.hashString(`${action}_${state}`);
    for (const [key, value] of Object.entries(baseParams)) {
      params.set(key, value + ((actionHash % 100) / 1000) * value);
    }

    return params;
  }

  private calculateLogProbability(
    params: Map<string, number>,
    state: string,
    action: string,
  ): number {
    let logProb = 0;
    const paramArray = Array.from(params.entries());

    for (let i = 0; i < paramArray.length; i++) {
      const [key, value] = paramArray[i];
      const stateAction = this.hashString(`${state}_${action}_${key}`);
      logProb += -0.5 * Math.pow((value - (stateAction % 1)) / 0.5, 2);
    }

    return logProb / Math.max(paramArray.length, 1);
  }

  private updateParameters(
    currentParams: Record<string, number>,
    action: string,
    state: string,
    advantage: number,
  ): Record<string, number> {
    const newParams: Record<string, number> = {};
    const gradientScale = advantage * 0.1;

    for (const [key, value] of Object.entries(currentParams)) {
      const stateAction = this.hashString(`${state}_${action}_${key}`);
      const gradient = ((stateAction % 1) - 0.5) * gradientScale;
      newParams[key] = value + gradient;
    }

    return newParams;
  }

  private calculateKL(p1: number, p2: number): number {
    return p1 - p2;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getPolicy(): Map<string, number> {
    return new Map(this.currentPolicy);
  }

  getReferencePolicy(): Map<string, number> {
    return new Map(this.referencePolicy);
  }

  getStats(): GRPOStats {
    return { ...this.stats };
  }

  getGroups(): GRPOGroup[] {
    return Array.from(this.groups.values());
  }

  clearGroups(): void {
    this.groups.clear();
    this.emit("groupsCleared");
  }

  async forceUpdate(): Promise<void> {
    if (this.pendingSamples.length > 0) {
      while (this.pendingSamples.length >= 2) {
        await this.processGroup();
      }
    }
  }
}

export default GRPOEngine;
