export const COMPANION_PERMISSION_CAPABILITIES = [
    "mic",
    "camera",
    "screen",
    "tab-follow",
];
export function createCompanionPermissionState(defaults, now = Date.now()) {
    return COMPANION_PERMISSION_CAPABILITIES.reduce((state, capability) => {
        state[capability] = {
            capability,
            decision: defaults[capability] === "granted" ? "granted" : "denied",
            source: "default",
            updatedAt: now,
        };
        return state;
    }, {});
}
export function setCompanionPermission(state, capability, decision, source = "user", now = Date.now()) {
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
export function isCompanionPermissionGranted(state, capability) {
    return state[capability]?.decision === "granted";
}
