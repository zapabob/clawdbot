/**
 * Mode Switcher for VRChat Control
 *
 * Supports LINE, CLI, and GUI modes for VRChat control:
 * - LINE mode: Natural language commands via LINE messaging
 * - CLI mode: Command-line control
 * - GUI mode: Graphical interface commands
 * - Automatic routing based on context
 */

import { EventEmitter } from "events";

export type ControlMode = "LINE" | "CLI" | "GUI";

export interface ModeConfig {
  defaultMode: ControlMode;
  enableAutoSwitch: boolean;
  modePreferences: Partial<Record<ControlMode, ModePreferences>>;
}

export interface ModePreferences {
  enabled: boolean;
  priority: number;
  timeout: number;
  confirmations: boolean;
}

export interface CommandContext {
  source: "line" | "cli" | "gui" | "osc" | "api";
  userId?: string;
  channelId?: string;
  sessionId?: string;
  timestamp: number;
  platform?: string;
  isInteractive: boolean;
  requiresConfirmation: boolean;
}

export interface ParsedCommand {
  raw: string;
  intent: CommandIntent;
  entities: CommandEntities;
  confidence: number;
  mode: ControlMode;
}

export type CommandIntent =
  | "avatar_control"
  | "world_navigation"
  | "chat_communication"
  | "camera_control"
  | "input_control"
  | "social_interaction"
  | "system_query"
  | "configuration"
  | "session_management"
  | "unknown";

export interface CommandEntities {
  target?: string;
  action?: string;
  value?: string | number | boolean;
  parameter?: string;
  worldId?: string;
  avatarId?: string;
  message?: string;
}

export interface ModeSwitchResult {
  fromMode: ControlMode;
  toMode: ControlMode;
  reason: string;
  timestamp: number;
  context: CommandContext;
}

export interface ModeCapabilities {
  avatarControl: boolean;
  worldNavigation: boolean;
  chatCommunication: boolean;
  cameraControl: boolean;
  inputControl: boolean;
  socialInteraction: boolean;
  systemQuery: boolean;
  configuration: boolean;
  sessionManagement: boolean;
  voiceCommands: boolean;
  gestureCommands: boolean;
}

export class ModeSwitcher extends EventEmitter {
  private config: Required<ModeConfig>;
  private currentMode: ControlMode;
  private modeHistory: ModeSwitchResult[] = [];
  private commandHistory: ParsedCommand[] = [];
  private readonly MAX_HISTORY = 100;

  constructor(config: Partial<ModeConfig>) {
    super();
    this.config = {
      defaultMode: config.defaultMode ?? "CLI",
      enableAutoSwitch: config.enableAutoSwitch ?? true,
      modePreferences: config.modePreferences ?? {},
    };

    this.currentMode = this.config.defaultMode;
    this.initializeDefaultPreferences();
  }

  private initializeDefaultPreferences(): void {
    const defaultPrefs: Record<ControlMode, ModePreferences> = {
      LINE: {
        enabled: true,
        priority: 1,
        timeout: 30000,
        confirmations: true,
      },
      CLI: {
        enabled: true,
        priority: 2,
        timeout: 5000,
        confirmations: false,
      },
      GUI: {
        enabled: true,
        priority: 3,
        timeout: 10000,
        confirmations: true,
      },
    };

    for (const mode of ["LINE", "CLI", "GUI"] as ControlMode[]) {
      this.config.modePreferences[mode] = {
        ...defaultPrefs[mode],
        ...this.config.modePreferences[mode],
      };
    }
  }

  setMode(mode: ControlMode, reason: string, context?: CommandContext): ModeSwitchResult {
    const previousMode = this.currentMode;

    const result: ModeSwitchResult = {
      fromMode: previousMode,
      toMode: mode,
      reason,
      timestamp: Date.now(),
      context: context ?? {
        source: "cli",
        timestamp: Date.now(),
        isInteractive: false,
        requiresConfirmation: false,
      },
    };

    this.currentMode = mode;
    this.modeHistory.push(result);

    if (this.modeHistory.length > this.MAX_HISTORY) {
      this.modeHistory.shift();
    }

    this.emit("modeChanged", result);
    return result;
  }

  getCurrentMode(): ControlMode {
    return this.currentMode;
  }

  getModeCapabilities(mode: ControlMode): ModeCapabilities {
    const capabilities: Record<ControlMode, ModeCapabilities> = {
      LINE: {
        avatarControl: true,
        worldNavigation: true,
        chatCommunication: true,
        cameraControl: false,
        inputControl: false,
        socialInteraction: true,
        systemQuery: true,
        configuration: false,
        sessionManagement: true,
        voiceCommands: false,
        gestureCommands: false,
      },
      CLI: {
        avatarControl: true,
        worldNavigation: true,
        chatCommunication: true,
        cameraControl: true,
        inputControl: true,
        socialInteraction: true,
        systemQuery: true,
        configuration: true,
        sessionManagement: true,
        voiceCommands: false,
        gestureCommands: false,
      },
      GUI: {
        avatarControl: true,
        worldNavigation: true,
        chatCommunication: true,
        cameraControl: true,
        inputControl: true,
        socialInteraction: true,
        systemQuery: true,
        configuration: true,
        sessionManagement: true,
        voiceCommands: true,
        gestureCommands: true,
      },
    };

    return capabilities[mode];
  }

  canExecute(intent: CommandIntent, mode?: ControlMode): boolean {
    const targetMode = mode ?? this.currentMode;
    const capabilities = this.getModeCapabilities(targetMode);

    switch (intent) {
      case "avatar_control":
        return capabilities.avatarControl;
      case "world_navigation":
        return capabilities.worldNavigation;
      case "chat_communication":
        return capabilities.chatCommunication;
      case "camera_control":
        return capabilities.cameraControl;
      case "input_control":
        return capabilities.inputControl;
      case "social_interaction":
        return capabilities.socialInteraction;
      case "system_query":
        return capabilities.systemQuery;
      case "configuration":
        return capabilities.configuration;
      case "session_management":
        return capabilities.sessionManagement;
      default:
        return false;
    }
  }

  parseCommand(input: string, context: CommandContext): ParsedCommand {
    const normalized = input.trim().toLowerCase();
    const { intent, entities, confidence } = this.extractIntentAndEntities(normalized);
    const mode = this.determineBestMode(intent, context);

    const parsed: ParsedCommand = {
      raw: input,
      intent,
      entities,
      confidence,
      mode,
    };

    this.commandHistory.push(parsed);

    if (this.commandHistory.length > this.MAX_HISTORY) {
      this.commandHistory.shift();
    }

    if (this.config.enableAutoSwitch && mode !== this.currentMode) {
      this.setMode(mode, `Auto-switch for ${intent}`, context);
    }

    return parsed;
  }

  private extractIntentAndEntities(input: string): {
    intent: CommandIntent;
    entities: CommandEntities;
    confidence: number;
  } {
    const lower = input.toLowerCase();
    let intent: CommandIntent = "unknown";
    let confidence = 0.5;
    const entities: CommandEntities = {};

    if (/\b(change|set|switch)\s*(avatar|to)\b/.test(lower)) {
      intent = "avatar_control";
      confidence = 0.9;
      const avatarMatch = input.match(/(?:avatar|to)\s+(.+)/i);
      entities.avatarId = avatarMatch?.[1]?.trim();
    } else if (/\b(go|join|visit|teleport)\s*(to|world)\b/.test(lower)) {
      intent = "world_navigation";
      confidence = 0.9;
      const worldMatch = input.match(/(?:world|to)\s+(.+)/i);
      entities.worldId = worldMatch?.[1]?.trim();
    } else if (/\b(say|send|chat|message)\b/.test(lower)) {
      intent = "chat_communication";
      confidence = 0.9;
      const msgMatch = input.match(/(?:say|send|message)\s+(?:to\s+)?(.+)/i);
      entities.message = msgMatch?.[1]?.trim();
    } else if (/\b(zoom|focus|look|camera)\b/.test(lower)) {
      intent = "camera_control";
      confidence = 0.85;
      const paramMatch = input.match(/(\w+)\s*(?:to|at)?\s*([-\d.]+)/i);
      if (paramMatch) {
        entities.parameter = paramMatch[1];
        entities.value = parseFloat(paramMatch[2]);
      }
    } else if (/\b(jump|move|walk|run| interact)\b/.test(lower)) {
      intent = "input_control";
      confidence = 0.85;
      const actionMatch = input.match(/(jump|move|walk|run|interact)/i);
      entities.action = actionMatch?.[1]?.toLowerCase();
    } else if (/\b(hi|hello|hey|howdy)\b/.test(lower)) {
      intent = "social_interaction";
      confidence = 0.8;
    } else if (/\b(status|what|where|who)\b/.test(lower)) {
      intent = "system_query";
      confidence = 0.85;
    } else if (/\b(set|config|change|update)\s*(setting|config|preferences)\b/.test(lower)) {
      intent = "configuration";
      confidence = 0.9;
    } else if (/\b(start|end|quit|leave)\s*(session|world)\b/.test(lower)) {
      intent = "session_management";
      confidence = 0.9;
    }

    return { intent, entities, confidence };
  }

  private determineBestMode(intent: CommandIntent, context: CommandContext): ControlMode {
    if (!this.config.enableAutoSwitch) {
      return this.currentMode;
    }

    const sourceModeMap: Record<CommandContext["source"], ControlMode> = {
      line: "LINE",
      cli: "CLI",
      gui: "GUI",
      osc: "CLI",
      api: "CLI",
    };

    if (context.source === "osc" || context.source === "api") {
      return "CLI";
    }

    const preferredMode = sourceModeMap[context.source] ?? "CLI";

    if (!this.getModeCapabilities(preferredMode)[this.capabilityFromIntent(intent)]) {
      const fallbackMode = this.findFallbackMode(intent);
      return fallbackMode;
    }

    return preferredMode;
  }

  private capabilityFromIntent(intent: CommandIntent): keyof ModeCapabilities {
    const mapping: Record<CommandIntent, keyof ModeCapabilities> = {
      avatar_control: "avatarControl",
      world_navigation: "worldNavigation",
      chat_communication: "chatCommunication",
      camera_control: "cameraControl",
      input_control: "inputControl",
      social_interaction: "socialInteraction",
      system_query: "systemQuery",
      configuration: "configuration",
      session_management: "sessionManagement",
      unknown: "systemQuery",
    };
    return mapping[intent];
  }

  private findFallbackMode(intent: CommandIntent): ControlMode {
    const capability = this.capabilityFromIntent(intent);

    const modeOrder: ControlMode[] = ["GUI", "CLI", "LINE"];

    for (const mode of modeOrder) {
      if (this.getModeCapabilities(mode)[capability]) {
        return mode;
      }
    }

    return "CLI";
  }

  requiresConfirmation(intent: CommandIntent, context: CommandContext): boolean {
    const modePrefs = this.config.modePreferences[this.currentMode];
    if (modePrefs?.confirmations === false) {
      return false;
    }

    if (context.requiresConfirmation) {
      return true;
    }

    const confirmationIntents: CommandIntent[] = [
      "avatar_control",
      "world_navigation",
      "configuration",
      "session_management",
    ];

    return confirmationIntents.includes(intent);
  }

  getModeHistory(): ModeSwitchResult[] {
    return [...this.modeHistory];
  }

  getCommandHistory(): ParsedCommand[] {
    return [...this.commandHistory];
  }

  getRecentCommands(limit: number = 10): ParsedCommand[] {
    return this.commandHistory.slice(-limit);
  }

  isModeEnabled(mode: ControlMode): boolean {
    return this.config.modePreferences[mode]?.enabled ?? false;
  }

  setModeEnabled(mode: ControlMode, enabled: boolean): void {
    if (!this.config.modePreferences[mode]) {
      this.config.modePreferences[mode] = {
        enabled: true,
        priority: 1,
        timeout: 30000,
        confirmations: true,
      };
    }
    this.config.modePreferences[mode]!.enabled = enabled;
  }

  getStats(): {
    currentMode: ControlMode;
    modeHistoryCount: number;
    commandHistoryCount: number;
    modeDistribution: Record<ControlMode, number>;
  } {
    const distribution = {
      LINE: 0,
      CLI: 0,
      GUI: 0,
    };

    for (const switchResult of this.modeHistory) {
      distribution[switchResult.toMode]++;
    }

    return {
      currentMode: this.currentMode,
      modeHistoryCount: this.modeHistory.length,
      commandHistoryCount: this.commandHistory.length,
      modeDistribution: distribution,
    };
  }

  serialize(): string {
    return JSON.stringify({
      config: this.config,
      currentMode: this.currentMode,
      modeHistory: this.modeHistory.slice(-50),
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.config = { ...this.config, ...parsed.config };
    this.currentMode = parsed.currentMode;
    this.modeHistory = parsed.modeHistory ?? [];
  }
}

export default ModeSwitcher;
