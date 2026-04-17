export const COMPANION_PERMISSION_CAPABILITIES = [
  "mic",
  "camera",
  "screen",
  "tab-follow",
] as const;

export type CompanionPermissionCapability =
  (typeof COMPANION_PERMISSION_CAPABILITIES)[number];

export type CompanionPermissionDefault = "deny-until-approved" | "granted";
export type CompanionPermissionDecision = "granted" | "denied";
export type CompanionPermissionSource = "default" | "user" | "helper";

export type CompanionPermissionDefaults = Record<
  CompanionPermissionCapability,
  CompanionPermissionDefault
>;

export type CompanionPermissionStateEntry = {
  capability: CompanionPermissionCapability;
  decision: CompanionPermissionDecision;
  source: CompanionPermissionSource;
  updatedAt: number;
};

export type CompanionPermissionState = Record<
  CompanionPermissionCapability,
  CompanionPermissionStateEntry
>;

export function createCompanionPermissionState(
  defaults: CompanionPermissionDefaults,
  now = Date.now(),
): CompanionPermissionState {
  return COMPANION_PERMISSION_CAPABILITIES.reduce<CompanionPermissionState>(
    (state, capability) => {
      state[capability] = {
        capability,
        decision: defaults[capability] === "granted" ? "granted" : "denied",
        source: "default",
        updatedAt: now,
      };
      return state;
    },
    {} as CompanionPermissionState,
  );
}

export function setCompanionPermission(
  state: CompanionPermissionState,
  capability: CompanionPermissionCapability,
  decision: CompanionPermissionDecision,
  source: CompanionPermissionSource = "user",
  now = Date.now(),
): CompanionPermissionState {
  return {
    ...state,
    [capability]: {
      capability,
      decision,
      source,
      updatedAt: now,
    },
  };
}

export function isCompanionPermissionGranted(
  state: CompanionPermissionState,
  capability: CompanionPermissionCapability,
): boolean {
  return state[capability]?.decision === "granted";
}
