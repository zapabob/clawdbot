import { r as normalizeStringEntries } from "./string-normalization-BjIDwXwa.js";
import { i as readChannelAllowFromStore } from "./pairing-store-C5UkJF1E.js";
//#region src/config/runtime-group-policy.ts
function resolveRuntimeGroupPolicy(params) {
	const configuredFallbackPolicy = params.configuredFallbackPolicy ?? "open";
	const missingProviderFallbackPolicy = params.missingProviderFallbackPolicy ?? "allowlist";
	return {
		groupPolicy: params.providerConfigPresent ? params.groupPolicy ?? params.defaultGroupPolicy ?? configuredFallbackPolicy : params.groupPolicy ?? missingProviderFallbackPolicy,
		providerMissingFallbackApplied: !params.providerConfigPresent && params.groupPolicy === void 0
	};
}
function resolveDefaultGroupPolicy(cfg) {
	return cfg.channels?.defaults?.groupPolicy;
}
const GROUP_POLICY_BLOCKED_LABEL = {
	group: "group messages",
	guild: "guild messages",
	room: "room messages",
	channel: "channel messages",
	space: "space messages"
};
/**
* Standard provider runtime policy:
* - configured provider fallback: open
* - missing provider fallback: allowlist (fail-closed)
*/
function resolveOpenProviderRuntimeGroupPolicy(params) {
	return resolveRuntimeGroupPolicy({
		providerConfigPresent: params.providerConfigPresent,
		groupPolicy: params.groupPolicy,
		defaultGroupPolicy: params.defaultGroupPolicy,
		configuredFallbackPolicy: "open",
		missingProviderFallbackPolicy: "allowlist"
	});
}
/**
* Strict provider runtime policy:
* - configured provider fallback: allowlist
* - missing provider fallback: allowlist (fail-closed)
*/
function resolveAllowlistProviderRuntimeGroupPolicy(params) {
	return resolveRuntimeGroupPolicy({
		providerConfigPresent: params.providerConfigPresent,
		groupPolicy: params.groupPolicy,
		defaultGroupPolicy: params.defaultGroupPolicy,
		configuredFallbackPolicy: "allowlist",
		missingProviderFallbackPolicy: "allowlist"
	});
}
const warnedMissingProviderGroupPolicy = /* @__PURE__ */ new Set();
function warnMissingProviderGroupPolicyFallbackOnce(params) {
	if (!params.providerMissingFallbackApplied) return false;
	const key = `${params.providerKey}:${params.accountId ?? "*"}`;
	if (warnedMissingProviderGroupPolicy.has(key)) return false;
	warnedMissingProviderGroupPolicy.add(key);
	const blockedLabel = params.blockedLabel?.trim() || "group messages";
	params.log(`${params.providerKey}: channels.${params.providerKey} is missing; defaulting groupPolicy to "allowlist" (${blockedLabel} blocked until explicitly configured).`);
	return true;
}
//#endregion
//#region src/channels/allow-from.ts
function mergeDmAllowFromSources(params) {
	const storeEntries = params.dmPolicy === "allowlist" ? [] : params.storeAllowFrom ?? [];
	return [...params.allowFrom ?? [], ...storeEntries].map((value) => String(value).trim()).filter(Boolean);
}
function resolveGroupAllowFromSources(params) {
	const explicitGroupAllowFrom = Array.isArray(params.groupAllowFrom) && params.groupAllowFrom.length > 0 ? params.groupAllowFrom : void 0;
	return (explicitGroupAllowFrom ? explicitGroupAllowFrom : params.fallbackToAllowFrom === false ? [] : params.allowFrom ?? []).map((value) => String(value).trim()).filter(Boolean);
}
function firstDefined(...values) {
	for (const value of values) if (typeof value !== "undefined") return value;
}
function isSenderIdAllowed(allow, senderId, allowWhenEmpty) {
	if (!allow.hasEntries) return allowWhenEmpty;
	if (allow.hasWildcard) return true;
	if (!senderId) return false;
	return allow.entries.includes(senderId);
}
//#endregion
//#region src/config/dangerous-name-matching.ts
function asObjectRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value;
}
function asOptionalBoolean(value) {
	return typeof value === "boolean" ? value : void 0;
}
function isDangerousNameMatchingEnabled(config) {
	return config?.dangerouslyAllowNameMatching === true;
}
function resolveDangerousNameMatchingEnabled(input) {
	if (typeof input.accountConfig?.dangerouslyAllowNameMatching === "boolean") return input.accountConfig.dangerouslyAllowNameMatching;
	return isDangerousNameMatchingEnabled(input.providerConfig);
}
function collectProviderDangerousNameMatchingScopes(cfg, provider) {
	const scopes = [];
	const channels = asObjectRecord(cfg.channels);
	if (!channels) return scopes;
	const providerCfg = asObjectRecord(channels[provider]);
	if (!providerCfg) return scopes;
	const providerPrefix = `channels.${provider}`;
	const providerDangerousFlagPath = `${providerPrefix}.dangerouslyAllowNameMatching`;
	const providerDangerousNameMatchingEnabled = isDangerousNameMatchingEnabled(providerCfg);
	scopes.push({
		prefix: providerPrefix,
		account: providerCfg,
		dangerousNameMatchingEnabled: providerDangerousNameMatchingEnabled,
		dangerousFlagPath: providerDangerousFlagPath
	});
	const accounts = asObjectRecord(providerCfg.accounts);
	if (!accounts) return scopes;
	for (const key of Object.keys(accounts)) {
		const account = asObjectRecord(accounts[key]);
		if (!account) continue;
		const accountPrefix = `${providerPrefix}.accounts.${key}`;
		const accountDangerousNameMatching = asOptionalBoolean(account.dangerouslyAllowNameMatching);
		scopes.push({
			prefix: accountPrefix,
			account,
			dangerousNameMatchingEnabled: accountDangerousNameMatching ?? providerDangerousNameMatchingEnabled,
			dangerousFlagPath: accountDangerousNameMatching == null ? providerDangerousFlagPath : `${accountPrefix}.dangerouslyAllowNameMatching`
		});
	}
	return scopes;
}
//#endregion
//#region src/plugin-sdk/group-access.ts
/** Evaluate route-level group access after policy, route match, and enablement checks. */
function evaluateGroupRouteAccessForPolicy(params) {
	if (params.groupPolicy === "disabled") return {
		allowed: false,
		groupPolicy: params.groupPolicy,
		reason: "disabled"
	};
	if (params.routeMatched && params.routeEnabled === false) return {
		allowed: false,
		groupPolicy: params.groupPolicy,
		reason: "route_disabled"
	};
	if (params.groupPolicy === "allowlist") {
		if (!params.routeAllowlistConfigured) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			reason: "empty_allowlist"
		};
		if (!params.routeMatched) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			reason: "route_not_allowlisted"
		};
	}
	return {
		allowed: true,
		groupPolicy: params.groupPolicy,
		reason: "allowed"
	};
}
/** Evaluate generic allowlist match state for channels that compare derived group identifiers. */
function evaluateMatchedGroupAccessForPolicy(params) {
	if (params.groupPolicy === "disabled") return {
		allowed: false,
		groupPolicy: params.groupPolicy,
		reason: "disabled"
	};
	if (params.groupPolicy === "allowlist") {
		if (params.requireMatchInput && !params.hasMatchInput) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			reason: "missing_match_input"
		};
		if (!params.allowlistConfigured) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			reason: "empty_allowlist"
		};
		if (!params.allowlistMatched) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			reason: "not_allowlisted"
		};
	}
	return {
		allowed: true,
		groupPolicy: params.groupPolicy,
		reason: "allowed"
	};
}
/** Evaluate sender access for an already-resolved group policy and allowlist. */
function evaluateSenderGroupAccessForPolicy(params) {
	if (params.groupPolicy === "disabled") return {
		allowed: false,
		groupPolicy: params.groupPolicy,
		providerMissingFallbackApplied: Boolean(params.providerMissingFallbackApplied),
		reason: "disabled"
	};
	if (params.groupPolicy === "allowlist") {
		if (params.groupAllowFrom.length === 0) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			providerMissingFallbackApplied: Boolean(params.providerMissingFallbackApplied),
			reason: "empty_allowlist"
		};
		if (!params.isSenderAllowed(params.senderId, params.groupAllowFrom)) return {
			allowed: false,
			groupPolicy: params.groupPolicy,
			providerMissingFallbackApplied: Boolean(params.providerMissingFallbackApplied),
			reason: "sender_not_allowlisted"
		};
	}
	return {
		allowed: true,
		groupPolicy: params.groupPolicy,
		providerMissingFallbackApplied: Boolean(params.providerMissingFallbackApplied),
		reason: "allowed"
	};
}
/** Resolve provider fallback policy first, then evaluate sender access against that result. */
function evaluateSenderGroupAccess(params) {
	const { groupPolicy, providerMissingFallbackApplied } = resolveOpenProviderRuntimeGroupPolicy({
		providerConfigPresent: params.providerConfigPresent,
		groupPolicy: params.configuredGroupPolicy,
		defaultGroupPolicy: params.defaultGroupPolicy
	});
	return evaluateSenderGroupAccessForPolicy({
		groupPolicy,
		providerMissingFallbackApplied,
		groupAllowFrom: params.groupAllowFrom,
		senderId: params.senderId,
		isSenderAllowed: params.isSenderAllowed
	});
}
//#endregion
//#region src/channels/command-gating.ts
function resolveCommandAuthorizedFromAuthorizers(params) {
	const { useAccessGroups, authorizers } = params;
	const mode = params.modeWhenAccessGroupsOff ?? "allow";
	if (!useAccessGroups) {
		if (mode === "allow") return true;
		if (mode === "deny") return false;
		if (!authorizers.some((entry) => entry.configured)) return true;
		return authorizers.some((entry) => entry.configured && entry.allowed);
	}
	return authorizers.some((entry) => entry.configured && entry.allowed);
}
function resolveControlCommandGate(params) {
	const commandAuthorized = resolveCommandAuthorizedFromAuthorizers({
		useAccessGroups: params.useAccessGroups,
		authorizers: params.authorizers,
		modeWhenAccessGroupsOff: params.modeWhenAccessGroupsOff
	});
	return {
		commandAuthorized,
		shouldBlock: params.allowTextCommands && params.hasControlCommand && !commandAuthorized
	};
}
function resolveDualTextControlCommandGate(params) {
	return resolveControlCommandGate({
		useAccessGroups: params.useAccessGroups,
		authorizers: [{
			configured: params.primaryConfigured,
			allowed: params.primaryAllowed
		}, {
			configured: params.secondaryConfigured,
			allowed: params.secondaryAllowed
		}],
		allowTextCommands: true,
		hasControlCommand: params.hasControlCommand,
		modeWhenAccessGroupsOff: params.modeWhenAccessGroupsOff
	});
}
//#endregion
//#region src/security/dm-policy-shared.ts
function resolvePinnedMainDmOwnerFromAllowlist(params) {
	if ((params.dmScope ?? "main") !== "main") return null;
	const rawAllowFrom = Array.isArray(params.allowFrom) ? params.allowFrom : [];
	if (rawAllowFrom.some((entry) => String(entry).trim() === "*")) return null;
	const normalizedOwners = Array.from(new Set(rawAllowFrom.map((entry) => params.normalizeEntry(String(entry))).filter((entry) => Boolean(entry))));
	return normalizedOwners.length === 1 ? normalizedOwners[0] : null;
}
function resolveEffectiveAllowFromLists(params) {
	const allowFrom = Array.isArray(params.allowFrom) ? params.allowFrom : void 0;
	const groupAllowFrom = Array.isArray(params.groupAllowFrom) ? params.groupAllowFrom : void 0;
	return {
		effectiveAllowFrom: normalizeStringEntries(mergeDmAllowFromSources({
			allowFrom,
			storeAllowFrom: Array.isArray(params.storeAllowFrom) ? params.storeAllowFrom : void 0,
			dmPolicy: params.dmPolicy ?? void 0
		})),
		effectiveGroupAllowFrom: normalizeStringEntries(resolveGroupAllowFromSources({
			allowFrom,
			groupAllowFrom,
			fallbackToAllowFrom: params.groupAllowFromFallbackToAllowFrom ?? void 0
		}))
	};
}
const DM_GROUP_ACCESS_REASON = {
	GROUP_POLICY_ALLOWED: "group_policy_allowed",
	GROUP_POLICY_DISABLED: "group_policy_disabled",
	GROUP_POLICY_EMPTY_ALLOWLIST: "group_policy_empty_allowlist",
	GROUP_POLICY_NOT_ALLOWLISTED: "group_policy_not_allowlisted",
	DM_POLICY_OPEN: "dm_policy_open",
	DM_POLICY_DISABLED: "dm_policy_disabled",
	DM_POLICY_ALLOWLISTED: "dm_policy_allowlisted",
	DM_POLICY_PAIRING_REQUIRED: "dm_policy_pairing_required",
	DM_POLICY_NOT_ALLOWLISTED: "dm_policy_not_allowlisted"
};
async function readStoreAllowFromForDmPolicy(params) {
	if (params.shouldRead === false || params.dmPolicy === "allowlist") return [];
	return await (params.readStore ?? ((provider, accountId) => readChannelAllowFromStore(provider, process.env, accountId)))(params.provider, params.accountId).catch(() => []);
}
function resolveDmGroupAccessDecision(params) {
	const dmPolicy = params.dmPolicy ?? "pairing";
	const groupPolicy = params.groupPolicy === "open" || params.groupPolicy === "disabled" ? params.groupPolicy : "allowlist";
	const effectiveAllowFrom = normalizeStringEntries(params.effectiveAllowFrom);
	const effectiveGroupAllowFrom = normalizeStringEntries(params.effectiveGroupAllowFrom);
	if (params.isGroup) {
		const groupAccess = evaluateMatchedGroupAccessForPolicy({
			groupPolicy,
			allowlistConfigured: effectiveGroupAllowFrom.length > 0,
			allowlistMatched: params.isSenderAllowed(effectiveGroupAllowFrom)
		});
		if (!groupAccess.allowed) {
			if (groupAccess.reason === "disabled") return {
				decision: "block",
				reasonCode: DM_GROUP_ACCESS_REASON.GROUP_POLICY_DISABLED,
				reason: "groupPolicy=disabled"
			};
			if (groupAccess.reason === "empty_allowlist") return {
				decision: "block",
				reasonCode: DM_GROUP_ACCESS_REASON.GROUP_POLICY_EMPTY_ALLOWLIST,
				reason: "groupPolicy=allowlist (empty allowlist)"
			};
			if (groupAccess.reason === "not_allowlisted") return {
				decision: "block",
				reasonCode: DM_GROUP_ACCESS_REASON.GROUP_POLICY_NOT_ALLOWLISTED,
				reason: "groupPolicy=allowlist (not allowlisted)"
			};
		}
		return {
			decision: "allow",
			reasonCode: DM_GROUP_ACCESS_REASON.GROUP_POLICY_ALLOWED,
			reason: `groupPolicy=${groupPolicy}`
		};
	}
	if (dmPolicy === "disabled") return {
		decision: "block",
		reasonCode: DM_GROUP_ACCESS_REASON.DM_POLICY_DISABLED,
		reason: "dmPolicy=disabled"
	};
	if (dmPolicy === "open") return {
		decision: "allow",
		reasonCode: DM_GROUP_ACCESS_REASON.DM_POLICY_OPEN,
		reason: "dmPolicy=open"
	};
	if (params.isSenderAllowed(effectiveAllowFrom)) return {
		decision: "allow",
		reasonCode: DM_GROUP_ACCESS_REASON.DM_POLICY_ALLOWLISTED,
		reason: `dmPolicy=${dmPolicy} (allowlisted)`
	};
	if (dmPolicy === "pairing") return {
		decision: "pairing",
		reasonCode: DM_GROUP_ACCESS_REASON.DM_POLICY_PAIRING_REQUIRED,
		reason: "dmPolicy=pairing (not allowlisted)"
	};
	return {
		decision: "block",
		reasonCode: DM_GROUP_ACCESS_REASON.DM_POLICY_NOT_ALLOWLISTED,
		reason: `dmPolicy=${dmPolicy} (not allowlisted)`
	};
}
function resolveDmGroupAccessWithLists(params) {
	const { effectiveAllowFrom, effectiveGroupAllowFrom } = resolveEffectiveAllowFromLists({
		allowFrom: params.allowFrom,
		groupAllowFrom: params.groupAllowFrom,
		storeAllowFrom: params.storeAllowFrom,
		dmPolicy: params.dmPolicy,
		groupAllowFromFallbackToAllowFrom: params.groupAllowFromFallbackToAllowFrom
	});
	return {
		...resolveDmGroupAccessDecision({
			isGroup: params.isGroup,
			dmPolicy: params.dmPolicy,
			groupPolicy: params.groupPolicy,
			effectiveAllowFrom,
			effectiveGroupAllowFrom,
			isSenderAllowed: params.isSenderAllowed
		}),
		effectiveAllowFrom,
		effectiveGroupAllowFrom
	};
}
function resolveDmGroupAccessWithCommandGate(params) {
	const access = resolveDmGroupAccessWithLists({
		isGroup: params.isGroup,
		dmPolicy: params.dmPolicy,
		groupPolicy: params.groupPolicy,
		allowFrom: params.allowFrom,
		groupAllowFrom: params.groupAllowFrom,
		storeAllowFrom: params.storeAllowFrom,
		groupAllowFromFallbackToAllowFrom: params.groupAllowFromFallbackToAllowFrom,
		isSenderAllowed: params.isSenderAllowed
	});
	const configuredAllowFrom = normalizeStringEntries(params.allowFrom ?? []);
	const configuredGroupAllowFrom = normalizeStringEntries(resolveGroupAllowFromSources({
		allowFrom: configuredAllowFrom,
		groupAllowFrom: normalizeStringEntries(params.groupAllowFrom ?? []),
		fallbackToAllowFrom: params.groupAllowFromFallbackToAllowFrom ?? void 0
	}));
	const commandDmAllowFrom = params.isGroup ? configuredAllowFrom : access.effectiveAllowFrom;
	const commandGroupAllowFrom = params.isGroup ? configuredGroupAllowFrom : access.effectiveGroupAllowFrom;
	const ownerAllowedForCommands = params.isSenderAllowed(commandDmAllowFrom);
	const groupAllowedForCommands = params.isSenderAllowed(commandGroupAllowFrom);
	const commandGate = params.command ? resolveControlCommandGate({
		useAccessGroups: params.command.useAccessGroups,
		authorizers: [{
			configured: commandDmAllowFrom.length > 0,
			allowed: ownerAllowedForCommands
		}, {
			configured: commandGroupAllowFrom.length > 0,
			allowed: groupAllowedForCommands
		}],
		allowTextCommands: params.command.allowTextCommands,
		hasControlCommand: params.command.hasControlCommand
	}) : {
		commandAuthorized: false,
		shouldBlock: false
	};
	return {
		...access,
		commandAuthorized: commandGate.commandAuthorized,
		shouldBlockControlCommand: params.isGroup && commandGate.shouldBlock
	};
}
async function resolveDmAllowState(params) {
	const configAllowFrom = normalizeStringEntries(Array.isArray(params.allowFrom) ? params.allowFrom : void 0);
	const hasWildcard = configAllowFrom.includes("*");
	const storeAllowFrom = await readStoreAllowFromForDmPolicy({
		provider: params.provider,
		accountId: params.accountId,
		readStore: params.readStore
	});
	const normalizeEntry = params.normalizeEntry ?? ((value) => value);
	const normalizedCfg = configAllowFrom.filter((value) => value !== "*").map((value) => normalizeEntry(value)).map((value) => value.trim()).filter(Boolean);
	const normalizedStore = storeAllowFrom.map((value) => normalizeEntry(value)).map((value) => value.trim()).filter(Boolean);
	const allowCount = Array.from(new Set([...normalizedCfg, ...normalizedStore])).length;
	return {
		configAllowFrom,
		hasWildcard,
		allowCount,
		isMultiUserDm: hasWildcard || allowCount > 1
	};
}
//#endregion
export { resolveDefaultGroupPolicy as C, resolveAllowlistProviderRuntimeGroupPolicy as S, warnMissingProviderGroupPolicyFallbackOnce as T, resolveDangerousNameMatchingEnabled as _, resolveDmGroupAccessWithLists as a, mergeDmAllowFromSources as b, resolveCommandAuthorizedFromAuthorizers as c, evaluateGroupRouteAccessForPolicy as d, evaluateMatchedGroupAccessForPolicy as f, isDangerousNameMatchingEnabled as g, collectProviderDangerousNameMatchingScopes as h, resolveDmGroupAccessWithCommandGate as i, resolveControlCommandGate as l, evaluateSenderGroupAccessForPolicy as m, readStoreAllowFromForDmPolicy as n, resolveEffectiveAllowFromLists as o, evaluateSenderGroupAccess as p, resolveDmAllowState as r, resolvePinnedMainDmOwnerFromAllowlist as s, DM_GROUP_ACCESS_REASON as t, resolveDualTextControlCommandGate as u, firstDefined as v, resolveOpenProviderRuntimeGroupPolicy as w, GROUP_POLICY_BLOCKED_LABEL as x, isSenderIdAllowed as y };
