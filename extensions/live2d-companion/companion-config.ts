import {
  type CompanionPermissionDefaults,
  COMPANION_PERMISSION_CAPABILITIES,
} from "./companion-permissions.js";

export type CompanionSecurityMode = "local-only";
export type CompanionAssetImportMode = "local-reference" | "local-copy";

export type ResolvedLive2dCompanionConfig = {
  enabled: boolean;
  llmMirror: {
    enabled: boolean;
    maxChars: number;
  };
  security: {
    mode: CompanionSecurityMode;
    allowLegacyHttpControl: boolean;
    allowLegacyFlagTransport: boolean;
  };
  browserHelper: {
    enabled: boolean;
    nativeHostName: string;
    persistentFollow: boolean;
  };
  assetPolicy: {
    requireRightsAck: boolean;
    importMode: CompanionAssetImportMode;
    remoteUploadAllowed: boolean;
  };
  capturePolicy: CompanionPermissionDefaults;
  voice: {
    sttBackend: "local-voice-whisper";
    ttsBackend: "voicevox";
  };
  legacyCompanionUrlDetected: boolean;
};

const DEFAULT_PERMISSION_DEFAULT = "deny-until-approved" as const;

const DEFAULT_CONFIG: ResolvedLive2dCompanionConfig = {
  enabled: true,
  llmMirror: {
    enabled: true,
    maxChars: 120,
  },
  security: {
    mode: "local-only",
    allowLegacyHttpControl: false,
    allowLegacyFlagTransport: false,
  },
  browserHelper: {
    enabled: true,
    nativeHostName: "io.openclaw.desktop_companion",
    persistentFollow: true,
  },
  assetPolicy: {
    requireRightsAck: true,
    importMode: "local-reference",
    remoteUploadAllowed: false,
  },
  capturePolicy: {
    mic: DEFAULT_PERMISSION_DEFAULT,
    camera: DEFAULT_PERMISSION_DEFAULT,
    screen: DEFAULT_PERMISSION_DEFAULT,
    "tab-follow": DEFAULT_PERMISSION_DEFAULT,
  },
  voice: {
    sttBackend: "local-voice-whisper",
    ttsBackend: "voicevox",
  },
  legacyCompanionUrlDetected: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  return typeof record[key] === "boolean" ? (record[key] as boolean) : fallback;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(
  record: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readPermissionDefault(
  record: Record<string, unknown>,
  key: string,
  fallback: CompanionPermissionDefaults[typeof key & keyof CompanionPermissionDefaults],
): CompanionPermissionDefaults[typeof key & keyof CompanionPermissionDefaults] {
  const value = record[key];
  return value === "granted" ? "granted" : fallback;
}

export function resolveLive2dCompanionConfig(
  rawConfig: unknown,
): ResolvedLive2dCompanionConfig {
  const root = asRecord(rawConfig);
  const llmMirror = asRecord(root.llmMirror);
  const security = asRecord(root.security);
  const browserHelper = asRecord(root.browserHelper);
  const assetPolicy = asRecord(root.assetPolicy);
  const capturePolicy = asRecord(root.capturePolicy);

  const resolvedCapturePolicy = COMPANION_PERMISSION_CAPABILITIES.reduce<CompanionPermissionDefaults>(
    (defaults, capability) => {
      defaults[capability] = readPermissionDefault(
        capturePolicy,
        capability,
        DEFAULT_CONFIG.capturePolicy[capability],
      );
      return defaults;
    },
    {} as CompanionPermissionDefaults,
  );

  return {
    enabled: readBoolean(root, "enabled", DEFAULT_CONFIG.enabled),
    llmMirror: {
      enabled: readBoolean(
        llmMirror,
        "enabled",
        DEFAULT_CONFIG.llmMirror.enabled,
      ),
      maxChars: readNumber(
        llmMirror,
        "maxChars",
        DEFAULT_CONFIG.llmMirror.maxChars,
      ),
    },
    security: {
      mode: "local-only",
      allowLegacyHttpControl: readBoolean(
        security,
        "allowLegacyHttpControl",
        DEFAULT_CONFIG.security.allowLegacyHttpControl,
      ),
      allowLegacyFlagTransport: readBoolean(
        security,
        "allowLegacyFlagTransport",
        DEFAULT_CONFIG.security.allowLegacyFlagTransport,
      ),
    },
    browserHelper: {
      enabled: readBoolean(
        browserHelper,
        "enabled",
        DEFAULT_CONFIG.browserHelper.enabled,
      ),
      nativeHostName: readString(
        browserHelper,
        "nativeHostName",
        DEFAULT_CONFIG.browserHelper.nativeHostName,
      ),
      persistentFollow: readBoolean(
        browserHelper,
        "persistentFollow",
        DEFAULT_CONFIG.browserHelper.persistentFollow,
      ),
    },
    assetPolicy: {
      requireRightsAck: readBoolean(
        assetPolicy,
        "requireRightsAck",
        DEFAULT_CONFIG.assetPolicy.requireRightsAck,
      ),
      importMode:
        assetPolicy.importMode === "local-copy"
          ? "local-copy"
          : DEFAULT_CONFIG.assetPolicy.importMode,
      remoteUploadAllowed: readBoolean(
        assetPolicy,
        "remoteUploadAllowed",
        DEFAULT_CONFIG.assetPolicy.remoteUploadAllowed,
      ),
    },
    capturePolicy: resolvedCapturePolicy,
    voice: {
      sttBackend: "local-voice-whisper",
      ttsBackend: "voicevox",
    },
    legacyCompanionUrlDetected:
      typeof llmMirror.companionUrl === "string" && llmMirror.companionUrl.length > 0,
  };
}
