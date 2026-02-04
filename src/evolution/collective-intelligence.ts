/**
 * Collective Intelligence System (SakanaAI-Inspired)
 * 
 * Implements:
 * - Swarm Intelligence
 * - Emergent Behavior
 * - Distributed Decision Making
 * - Collective Learning
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface Agent {
  id: string;
  role: AgentRole;
  state: AgentState;
  capabilities: string[];
  trustScore: number;
  lastActive: Date;
  contributions: Contribution[];
}

export type AgentRole = 'worker' | 'coordinator' | 'observer' | 'critic' | 'synthesizer';

export interface AgentState {
  status: 'idle' | 'working' | 'learning' | 'communicating';
  currentTask?: string;
  load: number;
  energy: number;
}

export interface Contribution {
  type: string;
  content: any;
  timestamp: Date;
  trustVotes: number;
  relevanceScore: number;
}

export interface CollectiveMemory {
  id: string;
  content: any;
  embeddings: number[];
  trustScore: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  agentIds: string[];
}

export interface ConsensusResult {
  reached: boolean;
  confidence: number;
  proposals: Proposal[];
  winningProposal?: Proposal;
}

export interface Proposal {
  id: string;
  content: any;
  votes: Map<string, boolean>;
  agentIds: string[];
  timestamp: Date;
  score: number;
}

export interface SwarmingConfig {
  agentCount: number;
  minAgents: number;
  quorumSize: number;
  consensusThreshold: number;
  trustDecay: number;
  memoryTTL: number;
}

export class CollectiveIntelligence extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private memory: Map<string, CollectiveMemory> = new Map();
  private proposals: Map<string, Proposal> = new Map();
  private config: SwarmingConfig;
  private coordinatorId: string | null = null;

  constructor(config: Partial<SwarmingConfig> = {}) {
    super();
    this.config = {
      agentCount: config.agentCount ?? 10,
      minAgents: config.minAgents ?? 3,
      quorumSize: config.quorumSize ?? 5,
      consensusThreshold: config.consensusThreshold ?? 0.7,
      trustDecay: config.trustDecay ?? 0.01,
      memoryTTL: config.memoryTTL ?? 86400000,
    };
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const roles: AgentRole[] = ['worker', 'worker', 'worker', 'observer', 'critic', 'synthesizer'];
    
    for (let i = 0; i < this.config.agentCount; i++) {
      const agent: Agent = {
        id: crypto.randomUUID(),
        role: roles[i % roles.length],
        state: {
          status: 'idle',
          load: 0,
          energy: 1.0,
        },
        capabilities: this.generateCapabilities(),
        trustScore: 0.5,
        lastActive: new Date(),
        contributions: [],
      };
      this.agents.set(agent.id, agent);
    }

    // Set initial coordinator
    const agentArray = Array.from(this.agents.values());
    this.coordinatorId = agentArray.find(a => a.role === 'synthesizer')?.id || agentArray[0]?.id;
  }

  private generateCapabilities(): string[] {
    const caps = [
      'reasoning', 'coding', 'analysis', 'creativity', 'communication',
      'research', 'optimization', 'debugging', 'documentation', 'testing'
    ];
    const numCaps = 3 + Math.floor(Math.random() * 4);
    const shuffled = caps.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numCaps);
  }

  // Swarming behavior
  async swarm(task: any): Promise<ConsensusResult> {
    this.emit('swarm_start', { task });

    // Select agents for the task
    const selectedAgents = this.selectAgentsForTask(task);
    if (selectedAgents.length < this.config.minAgents) {
      return { reached: false, confidence: 0, proposals: [], };
    }

    // Create proposals from selected agents
    const proposals = await this.collectProposals(selectedAgents, task);
    
    // Evaluate and vote on proposals
    const consensus = await this.achieveConsensus(proposals, selectedAgents);

    // Store successful solutions in collective memory
    if (consensus.winningProposal) {
      this.storeInMemory(consensus.winningProposal, selectedAgents);
    }

    // Update trust scores based on contribution
    this.updateTrustScores(selectedAgents, consensus);

    // Decay trust for inactive agents
    this.decayTrust();

    this.emit('swarm_complete', { task, consensus });

    return consensus;
  }

  private selectAgentsForTask(task: any): Agent[] {
    const taskCaps = this.extractRequiredCapabilities(task);
    const scoredAgents = Array.from(this.agents.values()).map(agent => {
      const capabilityMatch = agent.capabilities.filter(c => taskCaps.includes(c)).length;
      const score = capabilityMatch / taskCaps.length * 0.6 +
                   agent.trustScore * 0.3 +
                   (1 - agent.state.load) * 0.1;
      return { agent, score };
    });

    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents.slice(0, this.config.quorumSize).map(s => s.agent);
  }

  private extractRequiredCapabilities(task: any): string[] {
    const keywords = ['reasoning', 'coding', 'analysis', 'creativity', 'communication',
                      'research', 'optimization', 'debugging', 'documentation', 'testing'];
    const taskStr = JSON.stringify(task).toLowerCase();
    return keywords.filter(kw => taskStr.includes(kw.toLowerCase()));
  }

  private async collectProposals(agents: Agent[], task: any): Promise<Proposal[]> {
    const proposals: Proposal[] = [];

    for (const agent of agents) {
      agent.state.status = 'working';
      agent.state.currentTask = task.id || 'unknown';
      agent.state.load += 0.2;

      const proposal: Proposal = {
        id: crypto.randomUUID(),
        content: await this.generateProposal(agent, task),
        votes: new Map(),
        agentIds: [agent.id],
        timestamp: new Date(),
        score: 0,
      };

      this.proposals.set(proposal.id, proposal);
      proposals.push(proposal);

      this.emit('proposal_created', { agentId: agent.id, proposalId: proposal.id });
    }

    return proposals;
  }

  private async generateProposal(agent: Agent, task: any): Promise<any> {
    // Each agent generates a unique proposal based on their capabilities
    // In a real implementation, this would call the agent's reasoning engine
    return {
      solution: `Solution from ${agent.role} agent ${agent.id.slice(0, 8)}`,
      reasoning: `Based on capabilities: ${agent.capabilities.join(', ')}`,
      confidence: 0.5 + Math.random() * 0.5,
    };
  }

  private async achieveConsensus(proposals: Proposal[], voters: Agent[]): Promise<ConsensusResult> {
    if (proposals.length === 0) {
      return { reached: false, confidence: 0, proposals: [] };
    }

    // Voting phase
    for (const voter of voters) {
      for (const proposal of proposals) {
        if (voter.id !== proposal.agentIds[0]) {
          const vote = await this.evaluateVote(voter, proposal);
          proposal.votes.set(voter.id, vote);
        }
      }
    }

    // Calculate scores
    for (const proposal of proposals) {
      let yesVotes = 0;
      let totalVotes = 0;
      
      for (const [agentId, voted] of proposal.votes) {
        totalVotes++;
        if (voted) yesVotes++;
      }

      proposal.score = totalVotes > 0 ? yesVotes / totalVotes : 0;
    }

    // Sort by score
    proposals.sort((a, b) => b.score - a.score);

    const best = proposals[0];
    const confidence = best.score;
    const reached = confidence >= this.config.consensusThreshold;

    return {
      reached,
      confidence,
      proposals,
      winningProposal: reached ? best : undefined,
    };
  }

  private async evaluateVote(voter: Agent, proposal: Proposal): Promise<boolean> {
    // Simplified voting logic
    const relevance = Math.random() * 0.3 + 0.5;
    const quality = proposal.score;
    return relevance + quality > 0.8;
  }

  private storeInMemory(proposal: Proposal, contributors: Agent[]): void {
    const memory: CollectiveMemory = {
      id: crypto.randomUUID(),
      content: proposal.content,
      embeddings: this.generateEmbeddings(proposal.content),
      trustScore: proposal.score,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      agentIds: contributors.map(c => c.id),
    };

    this.memory.set(memory.id, memory);

    // Update contributions
    for (const agent of contributors) {
      agent.contributions.push({
        type: 'memory_store',
        content: memory.id,
        timestamp: new Date(),
        trustVotes: proposal.votes.size,
        relevanceScore: proposal.score,
      });
    }
  }

  private generateEmbeddings(content: any): number[] {
    // Simplified embedding generation
    // In reality, this would use a proper embedding model
    const str = JSON.stringify(content);
    const embeddings: number[] = [];
    for (let i = 0; i < 64; i++) {
      embeddings.push(Math.sin(str.charCodeAt(i % str.length) * (i + 1)) * 0.5 + 0.5);
    }
    return embeddings;
  }

  private updateTrustScores(agents: Agent[], consensus: ConsensusResult): void {
    for (const agent of agents) {
      const contribution = agent.contributions[agent.contributions.length - 1];
      if (contribution) {
        const adjustment = contribution.relevanceScore * 0.1;
        agent.trustScore = Math.min(1, Math.max(0, agent.trustScore + adjustment));
      }
      agent.state.load = Math.max(0, agent.state.load - 0.2);
      agent.state.status = 'idle';
      agent.lastActive = new Date();
    }
  }

  private decayTrust(): void {
    for (const [id, agent] of this.agents) {
      const inactiveTime = Date.now() - agent.lastActive.getTime();
      if (inactiveTime > 3600000) { // 1 hour
        agent.trustScore = Math.max(0.1, agent.trustScore - this.config.trustDecay);
      }
    }
  }

  // Collective memory retrieval
  async retrieveMemory(query: any): Promise<CollectiveMemory[]> {
    const queryEmbedding = this.generateEmbeddings(query);
    const memories = Array.from(this.memory.values());

    // Calculate similarity scores
    const scored = memories.map(memory => {
      const similarity = this.cosineSimilarity(queryEmbedding, memory.embeddings);
      memory.lastAccessed = new Date();
      memory.accessCount++;
      return { memory, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, 5).map(s => s.memory);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Agent management
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.agents.values())
      .filter(a => a.state.status === 'working' || a.state.status === 'learning');
  }

  // Statistics
  getStats(): CollectiveStats {
    const agents = Array.from(this.agents.values());
    const avgTrust = agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length;
    const avgLoad = agents.reduce((sum, a) => sum + a.state.load, 0) / agents.length;

    return {
      totalAgents: agents.length,
      activeAgents: this.getActiveAgents().length,
      averageTrustScore: avgTrust,
      averageLoad: avgLoad,
      totalMemories: this.memory.size,
      totalProposals: this.proposals.size,
    };
  }
}

export interface CollectiveStats {
  totalAgents: number;
  activeAgents: number;
  averageTrustScore: number;
  averageLoad: number;
  totalMemories: number;
  totalProposals: number;
}

export default CollectiveIntelligence;
