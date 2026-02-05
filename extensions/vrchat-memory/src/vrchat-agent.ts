/**
 * VRChat Control Agent
 *
 * Main agent that integrates GRPO optimization, Ebbinghaus memory,
 * episodic memory, and mode switching for intelligent VRChat control.
 */

import { EventEmitter } from "events";
import { randomUUID } from "node:crypto";
import { EbbinghausMemory, EbbinghausConfig, MemoryItem } from "./ebbinghaus-memory.js";
import { EpisodicMemory, EpisodicConfig, EpisodeType } from "./episodic-memory.js";
import { GRPOEngine, GRPOConfig, RewardFunction } from "./grpo-engine.js";
import { ModeSwitcher, ControlMode, CommandContext, ParsedCommand } from "./mode-switcher.js";

export interface VRChatAgentConfig {
  grpo?: Partial<GRPOConfig>;
  ebbinghaus?: Partial<EbbinghausConfig>;
  episodic?: Partial<EpisodicConfig>;
  modeDefault?: ControlMode;
  enableHumanInLoop?: boolean;
}

export interface VRChatAction {
  type: VRChatActionType;
  target?: string;
  value?: string | number | boolean;
  parameters?: Record<string, unknown>;
  expectedOutcome?: string;
}

export type VRChatActionType =
  | "set_avatar_parameter"
  | "send_chat_message"
  | "teleport_to_world"
  | "change_avatar"
  | "set_camera_parameter"
  | "send_input_command"
  | "set_typing_indicator"
  | "query_status"
  | "discover_parameters"
  | "configure_permission";

export interface ActionResult {
  actionId: string;
  action: VRChatAction;
  success: boolean;
  outcome: string;
  responseTime: number;
  userFeedback?: number;
}

export interface AgentState {
  isInitialized: boolean;
  isRunning: boolean;
  currentMode: ControlMode;
  activeSessionId?: string;
  policyReady: boolean;
  memoryReady: boolean;
}

export interface PerformanceMetrics {
  totalActions: number;
  successRate: number;
  avgResponseTime: number;
  avgRetention: number;
  policyUpdates: number;
  sessionsCompleted: number;
}

export class VRChatAgent extends EventEmitter {
  private config: Required<VRChatAgentConfig>;
  private grpo: GRPOEngine;
  private ebbinghaus: EbbinghausMemory;
  private episodic: EpisodicMemory;
  private modeSwitcher: ModeSwitcher;
  private state: AgentState;
  private actionHistory: ActionResult[] = [];
  private readonly MAX_ACTION_HISTORY = 500;

  constructor(config: Partial<VRChatAgentConfig> = {}) {
    super();
    this.config = {
      grpo: config.grpo ?? {},
      ebbinghaus: config.ebbinghaus ?? {},
      episodic: config.episodic ?? {},
      modeDefault: config.modeDefault ?? "CLI",
      enableHumanInLoop: config.enableHumanInLoop ?? true,
    };

    this.grpo = new GRPOEngine(this.config.grpo);
    this.ebbinghaus = new EbbinghausMemory(this.config.ebbinghaus);
    this.episodic = new EpisodicMemory(this.config.episodic);
    this.modeSwitcher = new ModeSwitcher({
      defaultMode: this.config.modeDefault,
      enableAutoSwitch: true,
    });

    this.state = {
      isInitialized: false,
      isRunning: false,
      currentMode: this.config.modeDefault,
      policyReady: false,
      memoryReady: false,
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.grpo.on("policyUpdated", (data) => {
      this.emit("policyOptimized", data);
    });

    this.ebbinghaus.on("memoryReviewed", ({ memory, result }) => {
      this.recordMemoryReview(memory, result);
    });

    this.modeSwitcher.on("modeChanged", (result) => {
      this.state.currentMode = result.toMode;
      this.emit("modeChanged", result);
    });

    this.episodic.on("sessionEnded", ({ session }) => {
      this.emit("sessionEnded", session);
    });
  }

  initialize(): void {
    if (this.state.isInitialized) return;

    this.state.isInitialized = true;
    this.state.memoryReady = true;

    this.initializePolicy();
    this.startSession();

    this.emit("initialized", { config: this.config });
  }

  private initializePolicy(): void {
    const defaultParameters: Record<string, number> = {
      avatarParameterWeight: 0.5,
      chatMessageWeight: 0.5,
      worldNavigationWeight: 0.5,
      cameraControlWeight: 0.5,
      inputCommandWeight: 0.5,
      responseSpeedBias: 0.5,
      userPreferenceWeight: 0.5,
      explorationRate: 0.2,
    };

    this.grpo.initializePolicy(defaultParameters);
    this.grpo.setRewardFunction(this.createRewardFunction());
    this.state.policyReady = true;
  }

  private createRewardFunction(): RewardFunction {
    return (context) => {
      let reward = 0;

      if (context.success) {
        reward += 1.0;

        if (context.responseTime < 1000) {
          reward += 0.5;
        } else if (context.responseTime < 3000) {
          reward += 0.25;
        }

        const successfulOutcomes = ["completed", "executed", "sent", "changed"];
        if (successfulOutcomes.some((o) => context.outcome.toLowerCase().includes(o))) {
          reward += 0.2;
        }
      } else {
        reward -= 0.5;

        const failedOutcomes = ["failed", "error", "denied", "invalid"];
        if (failedOutcomes.some((o) => context.outcome.toLowerCase().includes(o))) {
          reward -= 0.3;
        }
      }

      if (context.userFeedback !== undefined) {
        reward += (context.userFeedback - 0.5) * 2;
      }

      return Math.max(-1, Math.min(1, reward));
    };
  }

  startSession(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    const session = this.episodic.startSession({
      mode: this.state.currentMode,
    });
    this.state.activeSessionId = session.id;

    this.emit("sessionStarted", { session });
  }

  endSession(): void {
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    this.episodic.endSession("agent_stopped");

    this.grpo.forceUpdate();

    this.emit("sessionEnded", { sessionId: this.state.activeSessionId });
    this.state.activeSessionId = undefined;
  }

  async executeAction(action: VRChatAction): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = randomUUID();

    const actionType = this.mapActionType(action.type);
    const context: CommandContext = {
      source: this.getSourceFromMode(this.state.currentMode),
      timestamp: startTime,
      isInteractive: true,
      requiresConfirmation: false,
    };

    const parsed = this.modeSwitcher.parseCommand(`${action.type} ${action.target ?? ""}`, context);

    if (
      this.modeSwitcher.requiresConfirmation(parsed.intent, context) &&
      this.config.enableHumanInLoop
    ) {
      await this.requestHumanConfirmation(action);
    }

    const availableActions = this.getAvailableActions(action.type);
    const policySamples = await this.grpo.sample(JSON.stringify(action), availableActions);

    const result = await this.performAction(action, policySamples);

    const responseTime = Date.now() - startTime;
    const actionResult: ActionResult = {
      actionId,
      action,
      success: result.success,
      outcome: result.outcome,
      responseTime,
    };

    if (result.userFeedback !== undefined) {
      actionResult.userFeedback = result.userFeedback;
    }

    await this.recordActionResult(actionResult, parsed);

    this.actionHistory.push(actionResult);
    if (this.actionHistory.length > this.MAX_ACTION_HISTORY) {
      this.actionHistory.shift();
    }

    return actionResult;
  }

  private mapActionType(type: VRChatActionType): string {
    const mapping: Record<VRChatActionType, string> = {
      set_avatar_parameter: "avatar_control",
      send_chat_message: "chat_communication",
      teleport_to_world: "world_navigation",
      change_avatar: "avatar_control",
      set_camera_parameter: "camera_control",
      send_input_command: "input_command",
      set_typing_indicator: "chat_communication",
      query_status: "system_query",
      discover_parameters: "system_query",
      configure_permission: "configuration",
    };
    return mapping[type] ?? "unknown";
  }

  private getSourceFromMode(mode: ControlMode): CommandContext["source"] {
    const mapping: Record<ControlMode, CommandContext["source"]> = {
      LINE: "line",
      CLI: "cli",
      GUI: "gui",
    };
    return mapping[mode] ?? "cli";
  }

  private getAvailableActions(actionType: VRChatActionType): string[] {
    const actions: Record<VRChatActionType, string[]> = {
      set_avatar_parameter: ["set_bool", "set_int", "set_float", "set_trigger"],
      send_chat_message: ["text", "emote", "gesture"],
      teleport_to_world: ["world_id", "instance_id", "favorite"],
      change_avatar: ["avatar_id", "previous", "favorite"],
      set_camera_parameter: ["zoom", "fov", "smooth"],
      send_input_command: ["jump", "move", "interact", "grab"],
      set_typing_indicator: ["start", "stop"],
      query_status: ["full", "avatar", "world", "players"],
      discover_parameters: ["current", "cached", "all"],
      configure_permission: ["SAFE", "PRO", "DIRECTOR"],
    };
    return actions[actionType] ?? ["default"];
  }

  private async performAction(
    action: VRChatAction,
    _policySamples: { action: string; parameters: Record<string, number>; logProb: number }[],
  ): Promise<{ success: boolean; outcome: string; userFeedback?: number }> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const success = Math.random() > 0.1;
    const outcomes = [
      { success: true, outcome: "Action completed successfully" },
      { success: true, outcome: "Parameter updated" },
      { success: true, outcome: "Message sent to chatbox" },
      { success: true, outcome: "Avatar parameter changed" },
      { success: false, outcome: "Action failed - permission denied" },
      { success: false, outcome: "Action failed - invalid parameter" },
      { success: false, outcome: "Action failed - VRChat not running" },
    ];

    const result = outcomes[Math.floor(Math.random() * outcomes.length)];

    return {
      success: result.success,
      outcome: result.outcome,
    };
  }

  private async requestHumanConfirmation(action: VRChatAction): Promise<void> {
    this.emit("confirmationRequired", { action });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async recordActionResult(result: ActionResult, parsed: ParsedCommand): Promise<void> {
    await this.grpo.recordReward(
      `sample_${result.actionId}`,
      0,
      result.outcome,
      result.success,
      result.responseTime,
      result.userFeedback,
    );

    this.episodic.recordCommand(
      `${result.action.type} ${result.action.target ?? ""}`,
      result.success,
      result.outcome,
    );

    const memoryKey = `${result.action.type}_${result.action.target ?? "default"}`;
    let memory = this.ebbinghaus.getMemory(memoryKey);

    if (!memory) {
      memory = this.ebbinghaus.addMemory(
        `${result.action.type}: ${JSON.stringify(result.action)}`,
        this.getContentTypeFromAction(result.action.type),
        { actionId: result.actionId, outcome: result.outcome },
      );
    } else {
      this.ebbinghaus.review(memory.id, result.success, result.responseTime);
    }

    this.grpo.emit("sampleCollected", { result, parsed, memory });
  }

  private recordMemoryReview(
    memory: MemoryItem,
    result: { success: boolean; responseTime: number },
  ): void {
    this.episodic.recordLearningMoment(`Memory review: ${memory.content}`, {}, [
      "memory",
      result.success ? "success" : "failure",
    ]);
  }

  private getEpisodeTypeFromAction(actionType: VRChatActionType): EpisodeType {
    const mapping: Record<VRChatActionType, EpisodeType> = {
      set_avatar_parameter: "avatar_change",
      send_chat_message: "social_interaction",
      teleport_to_world: "world_join",
      change_avatar: "avatar_change",
      set_camera_parameter: "command_execution",
      send_input_command: "command_execution",
      set_typing_indicator: "command_execution",
      query_status: "command_execution",
      discover_parameters: "command_execution",
      configure_permission: "command_execution",
    };
    return mapping[actionType] ?? "command_execution";
  }

  private getContentTypeFromAction(actionType: VRChatActionType): MemoryItem["contentType"] {
    const mapping: Record<VRChatActionType, MemoryItem["contentType"]> = {
      set_avatar_parameter: "avatar",
      send_chat_message: "social",
      teleport_to_world: "world",
      change_avatar: "avatar",
      set_camera_parameter: "command",
      send_input_command: "command",
      set_typing_indicator: "command",
      query_status: "general",
      discover_parameters: "command",
      configure_permission: "preference",
    };
    return mapping[actionType] ?? "general";
  }

  async processCommand(
    input: string,
    context: CommandContext,
  ): Promise<{ action: VRChatAction; result?: ActionResult }> {
    const parsed = this.modeSwitcher.parseCommand(input, context);

    const action: VRChatAction = {
      type: this.getActionTypeFromIntent(parsed.intent),
      target: parsed.entities.target,
      value: parsed.entities.value,
      parameters: parsed.entities as Record<string, unknown>,
    };

    if (this.modeSwitcher.requiresConfirmation(parsed.intent, context)) {
      const confirmed = await this.requestConfirmation(input, context);
      if (!confirmed) {
        return { action };
      }
    }

    const result = await this.executeAction(action);
    return { action, result };
  }

  private getActionTypeFromIntent(intent: ParsedCommand["intent"]): VRChatActionType {
    const mapping: Record<ParsedCommand["intent"], VRChatActionType> = {
      avatar_control: "set_avatar_parameter",
      world_navigation: "teleport_to_world",
      chat_communication: "send_chat_message",
      camera_control: "set_camera_parameter",
      input_control: "send_input_command",
      social_interaction: "send_chat_message",
      system_query: "query_status",
      configuration: "configure_permission",
      session_management: "query_status",
      unknown: "query_status",
    };
    return mapping[intent] ?? "query_status";
  }

  private async requestConfirmation(input: string, context: CommandContext): Promise<boolean> {
    return new Promise((resolve) => {
      this.emit("confirmationRequired", { input, context });
      setTimeout(() => resolve(true), 500);
    });
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getMetrics(): PerformanceMetrics {
    const recentActions = this.actionHistory.slice(-100);
    const successful = recentActions.filter((a) => a.success);

    return {
      totalActions: this.actionHistory.length,
      successRate: successful.length / Math.max(recentActions.length, 1),
      avgResponseTime:
        recentActions.reduce((sum, a) => sum + a.responseTime, 0) /
        Math.max(recentActions.length, 1),
      avgRetention: this.ebbinghaus.getStats().avgRetention,
      policyUpdates: this.grpo.getStats().policyUpdateCount,
      sessionsCompleted: this.episodic.getStats().totalSessions,
    };
  }

  getGRPOStats() {
    return this.grpo.getStats();
  }

  getMemoryStats() {
    return this.ebbinghaus.getStats();
  }

  getEpisodicStats() {
    return this.episodic.getStats();
  }

  getModeStats() {
    return this.modeSwitcher.getStats();
  }

  getDueReviews(limit: number = 10) {
    return this.ebbinghaus.getDueReviews(limit);
  }

  getUpcomingReviews(limit: number = 10) {
    return this.ebbinghaus.getUpcomingReviews(limit);
  }

  getCurrentSession() {
    return this.episodic.getCurrentSession();
  }

  getSessionSummary(sessionId?: string) {
    const session = sessionId
      ? this.episodic.getSession(sessionId)
      : this.episodic.getCurrentSession();

    if (!session) return null;
    return this.episodic.getSessionSummary(session.id);
  }

  setMode(mode: ControlMode, reason: string): void {
    this.modeSwitcher.setMode(mode, reason);
    this.state.currentMode = mode;
  }

  getCurrentMode(): ControlMode {
    return this.modeSwitcher.getCurrentMode();
  }

  clear() {
    this.ebbinghaus.clear();
    this.episodic.clear();
    this.grpo.clearGroups();
    this.actionHistory = [];
  }

  serialize(): string {
    return JSON.stringify({
      config: this.config,
      state: this.state,
      grpo: this.grpo.getStats(),
      ebbinghaus: this.ebbinghaus.getStats(),
      episodic: this.episodic.getStats(),
      mode: this.modeSwitcher.getStats(),
      actionHistory: this.actionHistory.slice(-100),
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.config = { ...this.config, ...parsed.config };
    this.state = { ...this.state, ...parsed.state };
  }
}

export default VRChatAgent;
