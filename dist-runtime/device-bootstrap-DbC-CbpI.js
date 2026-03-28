import { n as readJsonFile, r as writeJsonAtomic, t as createAsyncLock } from "./json-files-2kI3d1bW.js";
import { a as resolvePairingPaths, i as pruneExpiredPending, n as verifyPairingToken, t as generatePairingToken } from "./pairing-token-C6MdDkB2.js";
import { cn as normalizeDeviceAuthScopes, sn as normalizeDeviceAuthRole } from "./method-scopes-Le0rX1x3.js";
import path from "node:path";
//#region src/shared/device-bootstrap-profile.ts
const PAIRING_SETUP_BOOTSTRAP_PROFILE = {
	roles: ["node"],
	scopes: []
};
function normalizeBootstrapRoles(roles) {
	if (!Array.isArray(roles)) return [];
	const out = /* @__PURE__ */ new Set();
	for (const role of roles) {
		const normalized = normalizeDeviceAuthRole(role);
		if (normalized) out.add(normalized);
	}
	return [...out].toSorted();
}
function normalizeDeviceBootstrapProfile(input) {
	return {
		roles: normalizeBootstrapRoles(input?.roles),
		scopes: normalizeDeviceAuthScopes(input?.scopes ? [...input.scopes] : [])
	};
}
function sameDeviceBootstrapProfile(left, right) {
	return left.roles.length === right.roles.length && left.scopes.length === right.scopes.length && left.roles.every((value, index) => value === right.roles[index]) && left.scopes.every((value, index) => value === right.scopes[index]);
}
//#endregion
//#region src/infra/device-bootstrap.ts
const DEVICE_BOOTSTRAP_TOKEN_TTL_MS = 600 * 1e3;
const withLock = createAsyncLock();
function resolveBootstrapPath(baseDir) {
	return path.join(resolvePairingPaths(baseDir, "devices").dir, "bootstrap.json");
}
function resolvePersistedBootstrapProfile(record) {
	return normalizeDeviceBootstrapProfile(record.profile ?? record);
}
function resolveIssuedBootstrapProfile(params) {
	if (params.profile) return normalizeDeviceBootstrapProfile(params.profile);
	if (params.roles || params.scopes) return normalizeDeviceBootstrapProfile({
		roles: params.roles,
		scopes: params.scopes
	});
	return PAIRING_SETUP_BOOTSTRAP_PROFILE;
}
async function loadState(baseDir) {
	const rawState = await readJsonFile(resolveBootstrapPath(baseDir)) ?? {};
	const state = {};
	if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) return state;
	for (const [tokenKey, entry] of Object.entries(rawState)) {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
		const record = entry;
		const token = typeof record.token === "string" && record.token.trim().length > 0 ? record.token : tokenKey;
		const issuedAtMs = typeof record.issuedAtMs === "number" ? record.issuedAtMs : 0;
		state[tokenKey] = {
			token,
			profile: resolvePersistedBootstrapProfile(record),
			deviceId: typeof record.deviceId === "string" ? record.deviceId : void 0,
			publicKey: typeof record.publicKey === "string" ? record.publicKey : void 0,
			issuedAtMs,
			ts: typeof record.ts === "number" ? record.ts : issuedAtMs,
			lastUsedAtMs: typeof record.lastUsedAtMs === "number" ? record.lastUsedAtMs : void 0
		};
	}
	pruneExpiredPending(state, Date.now(), DEVICE_BOOTSTRAP_TOKEN_TTL_MS);
	return state;
}
async function persistState(state, baseDir) {
	await writeJsonAtomic(resolveBootstrapPath(baseDir), state);
}
async function issueDeviceBootstrapToken(params = {}) {
	return await withLock(async () => {
		const state = await loadState(params.baseDir);
		const token = generatePairingToken();
		const issuedAtMs = Date.now();
		state[token] = {
			token,
			ts: issuedAtMs,
			profile: resolveIssuedBootstrapProfile(params),
			issuedAtMs
		};
		await persistState(state, params.baseDir);
		return {
			token,
			expiresAtMs: issuedAtMs + DEVICE_BOOTSTRAP_TOKEN_TTL_MS
		};
	});
}
async function verifyDeviceBootstrapToken(params) {
	return await withLock(async () => {
		const state = await loadState(params.baseDir);
		const providedToken = params.token.trim();
		if (!providedToken) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const found = Object.entries(state).find(([, candidate]) => verifyPairingToken(providedToken, candidate.token));
		if (!found) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const [tokenKey, record] = found;
		const deviceId = params.deviceId.trim();
		const publicKey = params.publicKey.trim();
		const role = params.role.trim();
		if (!deviceId || !publicKey || !role) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const requestedProfile = normalizeDeviceBootstrapProfile({
			roles: [role],
			scopes: params.scopes
		});
		const allowedProfile = resolvePersistedBootstrapProfile(record);
		if (allowedProfile.roles.length === 0 || !sameDeviceBootstrapProfile(requestedProfile, allowedProfile)) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		delete state[tokenKey];
		await persistState(state, params.baseDir);
		return { ok: true };
	});
}
//#endregion
export { verifyDeviceBootstrapToken as n, PAIRING_SETUP_BOOTSTRAP_PROFILE as r, issueDeviceBootstrapToken as t };
