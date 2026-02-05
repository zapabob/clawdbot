/**
 * Episodic Memory Layer for VRChat Session Tracking
 *
 * Manages episodic memories for VRChat sessions including:
 * - Session start/end tracking
 * - World visits and navigation patterns
 * - Avatar usage history
 * - Social interactions and conversations
 * - Learning moments and improvements
 */

import { EventEmitter } from "events";
import { randomUUID } from "node:crypto";

export interface EpisodicConfig {
  maxSessionLength: number;
  maxEpisodes: number;
  importanceThreshold: number;
}

export type EpisodeType =
  | "session_start"
  | "session_end"
  | "world_join"
  | "world_leave"
  | "avatar_change"
  | "social_interaction"
  | "command_execution"
  | "learning_moment"
  | "error_recovery"
  | "user_feedback"
  | "milestone";

export interface Episode {
  id: string;
  sessionId: string;
  type: EpisodeType;
  timestamp: number;
  duration?: number;
  content: string;
  context: EpisodeContext;
  importance: number;
  emotionalValence: number;
  tags: string[];
  metadata: Record<string, unknown>;
  outcome?: string;
  success?: boolean;
}

export interface EpisodeContext {
  worldId?: string;
  worldName?: string;
  avatarId?: string;
  avatarName?: string;
  location?: string;
  playersPresent?: string[];
  timeOfDay?: string;
  userMood?: string;
}

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  episodes: string[];
  totalEpisodes: number;
  averageImportance: number;
  overallSentiment: number;
  goalsAchieved: string[];
  goalsMissed: string[];
  keyLearnings: string[];
  avatarUsed?: string;
  worldsVisited: string[];
  commandsExecuted: number;
  successRate: number;
  metadata: Record<string, unknown>;
}

export interface SessionSummary {
  sessionId: string;
  duration: number;
  episodeCount: number;
  avgImportance: number;
  topEpisodes: Episode[];
  worldVisits: string[];
  avatarChanges: number;
  commandsExecuted: number;
  successRate: number;
  keyMoments: Episode[];
  recommendations: string[];
}

export interface EpisodicStats {
  totalSessions: number;
  activeSessions: number;
  totalEpisodes: number;
  avgSessionDuration: number;
  avgEpisodesPerSession: number;
  mostVisitedWorlds: { world: string; count: number }[];
  mostUsedAvatars: { avatar: string; count: number }[];
  avgSuccessRate: number;
}

export class EpisodicMemory extends EventEmitter {
  private config: EpisodicConfig;
  private sessions: Map<string, Session> = new Map();
  private episodes: Map<string, Episode> = new Map();
  private activeSession: Session | null = null;
  private stats: EpisodicStats;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

  constructor(config: Partial<EpisodicConfig>) {
    super();
    this.config = {
      maxSessionLength: config.maxSessionLength ?? 180,
      maxEpisodes: config.maxEpisodes ?? 1000,
      importanceThreshold: config.importanceThreshold ?? 0.6,
    };
    this.stats = this.initStats();
  }

  private initStats(): EpisodicStats {
    return {
      totalSessions: 0,
      activeSessions: 0,
      totalEpisodes: 0,
      avgSessionDuration: 0,
      avgEpisodesPerSession: 0,
      mostVisitedWorlds: [],
      mostUsedAvatars: [],
      avgSuccessRate: 0.5,
    };
  }

  startSession(metadata: Record<string, unknown> = {}): Session {
    if (this.activeSession) {
      this.endSession("new_session_started");
    }

    const session: Session = {
      id: randomUUID(),
      startTime: Date.now(),
      episodes: [],
      totalEpisodes: 0,
      averageImportance: 0,
      overallSentiment: 0,
      goalsAchieved: [],
      goalsMissed: [],
      keyLearnings: [],
      worldsVisited: [],
      commandsExecuted: 0,
      successRate: 0.5,
      metadata,
    };

    this.sessions.set(session.id, session);
    this.activeSession = session;
    this.stats.totalSessions++;
    this.stats.activeSessions++;

    this.addEpisode({
      sessionId: session.id,
      type: "session_start",
      content: "VRChat session started",
      context: {},
      importance: 0.5,
      emotionalValence: 0,
      tags: ["session"],
      metadata: {},
    });

    this.emit("sessionStarted", { session });
    return session;
  }

  endSession(outcome?: string): Session | null {
    if (!this.activeSession) return null;

    this.activeSession.endTime = Date.now();
    this.activeSession.duration = this.activeSession.endTime - this.activeSession.startTime;

    if (this.activeSession.duration > this.config.maxSessionLength * 60 * 1000) {
      outcome = "session_timeout";
    } else if (!outcome) {
      outcome = "user_ended";
    }

    this.addEpisode({
      sessionId: this.activeSession.id,
      type: "session_end",
      content: `Session ended: ${outcome}`,
      context: {},
      importance: 0.5,
      emotionalValence: 0,
      tags: ["session", "end"],
      metadata: { outcome },
      outcome,
    });

    this.archiveSessionIfNeeded();
    this.updateStats();

    const session = this.activeSession;
    this.activeSession = null;
    this.stats.activeSessions--;

    this.emit("sessionEnded", { session });
    return session;
  }

  addEpisode(episode: Omit<Episode, "id" | "timestamp">): Episode {
    const fullEpisode: Episode = {
      id: randomUUID(),
      timestamp: Date.now(),
      ...episode,
    };

    this.episodes.set(fullEpisode.id, fullEpisode);

    const session = this.sessions.get(episode.sessionId);
    if (session) {
      session.episodes.push(fullEpisode.id);
      session.totalEpisodes = session.episodes.length;
      session.averageImportance = this.calculateAvgImportance(session);
      session.overallSentiment = this.calculateOverallSentiment(session);

      if (episode.type === "world_join" && episode.context.worldId) {
        if (!session.worldsVisited.includes(episode.context.worldId)) {
          session.worldsVisited.push(episode.context.worldId);
        }
      }

      if (episode.type === "avatar_change" && episode.context.avatarId) {
        session.avatarUsed = episode.context.avatarId;
      }

      if (episode.type === "command_execution") {
        session.commandsExecuted++;
        if (episode.success !== undefined) {
          session.successRate = this.updateSuccessRate(session);
        }
      }

      if (episode.importance > this.config.importanceThreshold) {
        session.keyLearnings.push(episode.content);
      }
    }

    this.stats.totalEpisodes++;
    this.trimEpisodesIfNeeded();

    this.emit("episodeAdded", { episode: fullEpisode });
    return fullEpisode;
  }

  private calculateAvgImportance(session: Session): number {
    if (session.episodes.length === 0) return 0;

    const importanceSum = session.episodes.reduce((sum, id) => {
      const episode = this.episodes.get(id);
      return sum + (episode?.importance ?? 0);
    }, 0);

    return importanceSum / session.episodes.length;
  }

  private calculateOverallSentiment(session: Session): number {
    if (session.episodes.length === 0) return 0;

    const sentimentSum = session.episodes.reduce((sum, id) => {
      const episode = this.episodes.get(id);
      return sum + (episode?.emotionalValence ?? 0);
    }, 0);

    return sentimentSum / session.episodes.length;
  }

  private updateSuccessRate(session: Session): number {
    const commandEpisodes = session.episodes
      .map((id) => this.episodes.get(id))
      .filter((e): e is Episode => e?.type === "command_execution" && e.success !== undefined);

    if (commandEpisodes.length === 0) return 0.5;

    const successCount = commandEpisodes.filter((e) => e.success).length;
    return successCount / commandEpisodes.length;
  }

  private trimEpisodesIfNeeded(): void {
    const allEpisodes = Array.from(this.episodes.values());

    if (allEpisodes.length > this.config.maxEpisodes) {
      const sorted = allEpisodes.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = sorted.slice(0, allEpisodes.length - this.config.maxEpisodes);

      for (const episode of toRemove) {
        this.episodes.delete(episode.id);
        this.stats.totalEpisodes--;
      }
    }
  }

  private archiveSessionIfNeeded(): void {
    const sessions = Array.from(this.sessions.values());

    if (sessions.length > 100) {
      const inactive = sessions
        .filter((s) => s.endTime !== undefined)
        .sort((a, b) => (a.endTime ?? 0) - (b.endTime ?? 0));

      while (sessions.length - (this.sessions.size - inactive.length) > 100) {
        const oldest = inactive.shift();
        if (oldest) {
          for (const epId of oldest.episodes) {
            this.episodes.delete(epId);
          }
          this.sessions.delete(oldest.id);
        }
      }
    }
  }

  joinWorld(worldId: string, worldName: string): Episode | null {
    if (!this.activeSession) return null;

    const context: EpisodeContext = {
      worldId,
      worldName,
      location: "unknown",
    };

    return this.addEpisode({
      sessionId: this.activeSession.id,
      type: "world_join",
      content: `Joined world: ${worldName}`,
      context,
      importance: 0.6,
      emotionalValence: 0.3,
      tags: ["world", "navigation"],
      metadata: {},
    });
  }

  leaveWorld(worldId: string): Episode | null {
    if (!this.activeSession) return null;

    const context: EpisodeContext = {
      worldId,
    };

    return this.addEpisode({
      sessionId: this.activeSession.id,
      type: "world_leave",
      content: `Left world: ${worldId}`,
      context,
      importance: 0.4,
      emotionalValence: 0,
      tags: ["world", "navigation"],
      metadata: {},
    });
  }

  changeAvatar(avatarId: string, avatarName: string): Episode | null {
    if (!this.activeSession) return null;

    const context: EpisodeContext = {
      avatarId,
      avatarName,
    };

    return this.addEpisode({
      sessionId: this.activeSession.id,
      type: "avatar_change",
      content: `Changed to avatar: ${avatarName}`,
      context,
      importance: 0.5,
      emotionalValence: 0.2,
      tags: ["avatar", "appearance"],
      metadata: {},
    });
  }

  recordCommand(command: string, success: boolean, outcome?: string): Episode | null {
    if (!this.activeSession) return null;

    return this.addEpisode({
      sessionId: this.activeSession.id,
      type: "command_execution",
      content: `Executed command: ${command}`,
      context: {},
      importance: success ? 0.6 : 0.7,
      emotionalValence: success ? 0.2 : -0.2,
      tags: ["command", success ? "success" : "failure"],
      metadata: { command },
      outcome,
      success,
    });
  }

  recordLearningMoment(content: string, context: EpisodeContext, tags: string[]): Episode | null {
    if (!this.activeSession) return null;

    return this.addEpisode({
      sessionId: this.activeSession.id,
      type: "learning_moment",
      content,
      context,
      importance: 0.8,
      emotionalValence: 0.4,
      tags: ["learning", ...tags],
      metadata: {},
    });
  }

  recordSocialInteraction(
    description: string,
    context: EpisodeContext,
    sentiment: number,
  ): Episode | null {
    if (!this.activeSession) return null;

    return this.addEpisode({
      sessionId: this.activeSession.id,
      type: "social_interaction",
      content: description,
      context,
      importance: 0.7,
      emotionalValence: sentiment,
      tags: ["social", "interaction"],
      metadata: {},
    });
  }

  getSessionSummary(sessionId: string): SessionSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const episodes = session.episodes
      .map((id) => this.episodes.get(id))
      .filter((e): e is Episode => e !== undefined)
      .sort((a, b) => b.importance - a.importance);

    const topEpisodes = episodes.slice(0, 5);
    const keyMoments = episodes.filter((e) => e.importance > this.config.importanceThreshold);

    const recommendations = this.generateRecommendations(session, episodes);

    return {
      sessionId: session.id,
      duration: session.duration ?? Date.now() - session.startTime,
      episodeCount: session.totalEpisodes,
      avgImportance: session.averageImportance,
      topEpisodes,
      worldVisits: session.worldsVisited,
      avatarChanges: episodes.filter((e) => e.type === "avatar_change").length,
      commandsExecuted: session.commandsExecuted,
      successRate: session.successRate,
      keyMoments,
      recommendations,
    };
  }

  private generateRecommendations(session: Session, episodes: Episode[]): string[] {
    const recommendations: string[] = [];

    if (session.successRate < 0.5) {
      recommendations.push("Consider reviewing command patterns for better success rate");
    }

    const failedCommands = episodes.filter(
      (e) => e.type === "command_execution" && e.success === false,
    );
    if (failedCommands.length > 3) {
      recommendations.push(`Review ${failedCommands.length} failed commands for patterns`);
    }

    const worldVisits = episodes.filter((e) => e.type === "world_join");
    if (worldVisits.length > 5) {
      recommendations.push("Consider bookmarking frequently visited worlds");
    }

    return recommendations;
  }

  getCurrentSession(): Session | null {
    return this.activeSession;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getEpisode(episodeId: string): Episode | undefined {
    return this.episodes.get(episodeId);
  }

  getRecentEpisodes(sessionId?: string, limit: number = 10): Episode[] {
    let episodes = Array.from(this.episodes.values());

    if (sessionId) {
      episodes = episodes.filter((e) => e.sessionId === sessionId);
    }

    return episodes.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  searchEpisodes(
    query: string,
    filters?: {
      types?: EpisodeType[];
      minImportance?: number;
      tags?: string[];
      sessionId?: string;
      limit?: number;
    },
  ): Episode[] {
    let results = Array.from(this.episodes.values());

    if (filters?.sessionId) {
      results = results.filter((e) => e.sessionId === filters.sessionId);
    }

    if (filters?.types && filters.types.length > 0) {
      results = results.filter((e) => filters.types!.includes(e.type));
    }

    if (filters?.minImportance !== undefined) {
      results = results.filter((e) => e.importance >= filters.minImportance!);
    }

    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((e) => filters.tags!.some((tag) => e.tags.includes(tag)));
    }

    const queryLower = query.toLowerCase();
    results = results.filter((e) => e.content.toLowerCase().includes(queryLower));

    results.sort((a, b) => b.importance - a.importance);

    return results.slice(0, filters?.limit ?? 50);
  }

  private updateStats(): void {
    const sessions = Array.from(this.sessions.values());
    const inactiveSessions = sessions.filter((s) => s.endTime !== undefined);

    this.stats.totalSessions = sessions.length;
    this.stats.activeSessions = sessions.filter((s) => s.endTime === undefined).length;

    if (inactiveSessions.length > 0) {
      const totalDuration = inactiveSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
      this.stats.avgSessionDuration = totalDuration / inactiveSessions.length;
      this.stats.avgEpisodesPerSession =
        inactiveSessions.reduce((sum, s) => sum + s.totalEpisodes, 0) / inactiveSessions.length;
    }

    const worldCounts = new Map<string, number>();
    const avatarCounts = new Map<string, number>();
    let totalSuccessRate = 0;
    let sessionCount = 0;

    for (const session of inactiveSessions) {
      totalSuccessRate += session.successRate;
      sessionCount++;

      for (const worldId of session.worldsVisited) {
        worldCounts.set(worldId, (worldCounts.get(worldId) ?? 0) + 1);
      }

      if (session.avatarUsed) {
        avatarCounts.set(session.avatarUsed, (avatarCounts.get(session.avatarUsed) ?? 0) + 1);
      }
    }

    this.stats.mostVisitedWorlds = Array.from(worldCounts.entries())
      .map(([world, count]) => ({ world, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.stats.mostUsedAvatars = Array.from(avatarCounts.entries())
      .map(([avatar, count]) => ({ avatar, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.stats.avgSuccessRate = sessionCount > 0 ? totalSuccessRate / sessionCount : 0.5;
  }

  getStats(): EpisodicStats {
    return { ...this.stats };
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  clear(): void {
    this.sessions.clear();
    this.episodes.clear();
    this.activeSession = null;
    this.stats = this.initStats();
    this.emit("memoryCleared");
  }

  serialize(): string {
    return JSON.stringify({
      sessions: Array.from(this.sessions.entries()),
      episodes: Array.from(this.episodes.entries()),
      config: this.config,
      activeSessionId: this.activeSession?.id,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.sessions = new Map(parsed.sessions);
    this.episodes = new Map(parsed.episodes);
    this.config = { ...this.config, ...parsed.config };

    if (parsed.activeSessionId) {
      this.activeSession = this.sessions.get(parsed.activeSessionId) ?? null;
    }

    this.updateStats();
  }
}

export default EpisodicMemory;
