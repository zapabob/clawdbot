import type { Session, BridgeMessage, AIToolType } from "../types.js";

/**
 * Session manager for LINE-AI bridge conversations
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private timeoutMinutes: number;

  constructor(timeoutMinutes: number = 30) {
    this.timeoutMinutes = timeoutMinutes;
  }

  /**
   * Get or create a session for a LINE user
   */
  getOrCreateSession(lineUserId: string, defaultTool: AIToolType): Session {
    // Clean up expired sessions first
    this.cleanupExpiredSessions();

    // Check for existing session
    const existingSession = this.findSessionByUserId(lineUserId);
    if (existingSession) {
      // Update last activity
      existingSession.lastActivityAt = new Date();
      return existingSession;
    }

    // Create new session
    const session: Session = {
      id: this.generateSessionId(),
      lineUserId,
      currentTool: defaultTool,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      messageHistory: [],
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Find session by LINE user ID
   */
  findSessionByUserId(lineUserId: string): Session | undefined {
    for (const session of this.sessions.values()) {
      if (session.lineUserId === lineUserId) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Add message to session history
   */
  addMessage(sessionId: string, message: BridgeMessage): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messageHistory.push(message);
      session.lastActivityAt = new Date();

      // Keep only last 50 messages to prevent memory bloat
      if (session.messageHistory.length > 50) {
        session.messageHistory = session.messageHistory.slice(-50);
      }
    }
  }

  /**
   * Get message history for context
   */
  getMessageHistory(sessionId: string, limit: number = 10): BridgeMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return session.messageHistory.slice(-limit);
  }

  /**
   * Switch AI tool for a session
   */
  switchTool(sessionId: string, tool: AIToolType): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.currentTool = tool;
      session.lastActivityAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * End a session
   */
  endSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    this.cleanupExpiredSessions();
    return Array.from(this.sessions.values());
  }

  /**
   * Get session statistics
   */
  getStats(): { total: number; byTool: Record<AIToolType, number> } {
    const byTool: Record<AIToolType, number> = {
      codex: 0,
      gemini: 0,
      opencode: 0,
    };

    for (const session of this.sessions.values()) {
      byTool[session.currentTool]++;
    }

    return {
      total: this.sessions.size,
      byTool,
    };
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessionIds: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      const diffMinutes = (now.getTime() - session.lastActivityAt.getTime()) / (1000 * 60);
      if (diffMinutes > this.timeoutMinutes) {
        expiredSessionIds.push(id);
      }
    }

    for (const id of expiredSessionIds) {
      this.sessions.delete(id);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
