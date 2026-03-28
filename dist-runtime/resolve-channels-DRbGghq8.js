import { $o as removeOwnSlackReactions, Cs as parseSlackBlocksInput, Ds as resolveSlackAccount, Go as editSlackMessage, Jo as listSlackPins, Ko as getSlackMemberInfo, Qo as readSlackMessages, Uo as deleteSlackMessage, Wo as downloadSlackFile, Xo as pinSlackMessage, Yo as listSlackReactions, Zo as reactSlackMessage, as as resolveSlackChannelId, av as createActionGate, cv as readNumberParam, es as removeSlackReaction, is as parseSlackTarget, lv as readReactionParams, ms as createSlackWebClient, ns as unpinSlackMessage, ov as imageResultFromFile, qo as listSlackEmojis, sv as jsonResult, ts as sendSlackMessage, uv as readStringParam, wo as recordSlackThreadParticipation } from "./account-resolution-YAil9v6G.js";
import { s as withNormalizedTimestamp } from "./format-datetime-mXAnxAMs.js";
//#region extensions/slack/src/action-runtime.ts
const messagingActions = new Set([
	"sendMessage",
	"editMessage",
	"deleteMessage",
	"readMessages",
	"downloadFile"
]);
const reactionsActions = new Set(["react", "reactions"]);
const pinActions = new Set([
	"pinMessage",
	"unpinMessage",
	"listPins"
]);
const slackActionRuntime = {
	deleteSlackMessage,
	downloadSlackFile,
	editSlackMessage,
	getSlackMemberInfo,
	listSlackEmojis,
	listSlackPins,
	listSlackReactions,
	parseSlackBlocksInput,
	pinSlackMessage,
	reactSlackMessage,
	readSlackMessages,
	recordSlackThreadParticipation,
	removeOwnSlackReactions,
	removeSlackReaction,
	sendSlackMessage,
	unpinSlackMessage
};
/**
* Resolve threadTs for a Slack message based on context and replyToMode.
* - "all": always inject threadTs
* - "first": inject only for first message (updates hasRepliedRef)
* - "off": never auto-inject
*/
function resolveThreadTsFromContext(explicitThreadTs, targetChannel, context) {
	if (explicitThreadTs) return explicitThreadTs;
	if (!context?.currentThreadTs || !context?.currentChannelId) return;
	const parsedTarget = parseSlackTarget(targetChannel, { defaultKind: "channel" });
	if (!parsedTarget || parsedTarget.kind !== "channel") return;
	if (parsedTarget.id !== context.currentChannelId) return;
	if (context.replyToMode === "all") return context.currentThreadTs;
	if (context.replyToMode === "first" && context.hasRepliedRef && !context.hasRepliedRef.value) {
		context.hasRepliedRef.value = true;
		return context.currentThreadTs;
	}
}
function readSlackBlocksParam(params) {
	return slackActionRuntime.parseSlackBlocksInput(params.blocks);
}
async function handleSlackAction(params, cfg, context) {
	const resolveChannelId = () => resolveSlackChannelId(readStringParam(params, "channelId", { required: true }));
	const action = readStringParam(params, "action", { required: true });
	const accountId = readStringParam(params, "accountId");
	const account = resolveSlackAccount({
		cfg,
		accountId
	});
	const isActionEnabled = createActionGate(account.actions ?? cfg.channels?.slack?.actions);
	const userToken = account.userToken;
	const botToken = account.botToken?.trim();
	const allowUserWrites = account.config.userTokenReadOnly === false;
	const getTokenForOperation = (operation) => {
		if (operation === "read") return userToken ?? botToken;
		if (!allowUserWrites) return botToken;
		return botToken ?? userToken;
	};
	const buildActionOpts = (operation) => {
		const token = getTokenForOperation(operation);
		const tokenOverride = token && token !== botToken ? token : void 0;
		if (!accountId && !tokenOverride) return;
		return {
			...accountId ? { accountId } : {},
			...tokenOverride ? { token: tokenOverride } : {}
		};
	};
	const readOpts = buildActionOpts("read");
	const writeOpts = buildActionOpts("write");
	if (reactionsActions.has(action)) {
		if (!isActionEnabled("reactions")) throw new Error("Slack reactions are disabled.");
		const channelId = resolveChannelId();
		const messageId = readStringParam(params, "messageId", { required: true });
		if (action === "react") {
			const { emoji, remove, isEmpty } = readReactionParams(params, { removeErrorMessage: "Emoji is required to remove a Slack reaction." });
			if (remove) {
				if (writeOpts) await slackActionRuntime.removeSlackReaction(channelId, messageId, emoji, writeOpts);
				else await slackActionRuntime.removeSlackReaction(channelId, messageId, emoji);
				return jsonResult({
					ok: true,
					removed: emoji
				});
			}
			if (isEmpty) return jsonResult({
				ok: true,
				removed: writeOpts ? await slackActionRuntime.removeOwnSlackReactions(channelId, messageId, writeOpts) : await slackActionRuntime.removeOwnSlackReactions(channelId, messageId)
			});
			if (writeOpts) await slackActionRuntime.reactSlackMessage(channelId, messageId, emoji, writeOpts);
			else await slackActionRuntime.reactSlackMessage(channelId, messageId, emoji);
			return jsonResult({
				ok: true,
				added: emoji
			});
		}
		return jsonResult({
			ok: true,
			reactions: readOpts ? await slackActionRuntime.listSlackReactions(channelId, messageId, readOpts) : await slackActionRuntime.listSlackReactions(channelId, messageId)
		});
	}
	if (messagingActions.has(action)) {
		if (!isActionEnabled("messages")) throw new Error("Slack messages are disabled.");
		switch (action) {
			case "sendMessage": {
				const to = readStringParam(params, "to", { required: true });
				const content = readStringParam(params, "content", { allowEmpty: true });
				const mediaUrl = readStringParam(params, "mediaUrl");
				const blocks = readSlackBlocksParam(params);
				if (!content && !mediaUrl && !blocks) throw new Error("Slack sendMessage requires content, blocks, or mediaUrl.");
				if (mediaUrl && blocks) throw new Error("Slack sendMessage does not support blocks with mediaUrl.");
				const threadTs = resolveThreadTsFromContext(readStringParam(params, "threadTs"), to, context);
				const result = await slackActionRuntime.sendSlackMessage(to, content ?? "", {
					...writeOpts,
					mediaUrl: mediaUrl ?? void 0,
					mediaLocalRoots: context?.mediaLocalRoots,
					threadTs: threadTs ?? void 0,
					blocks
				});
				if (threadTs && result.channelId && account.accountId) slackActionRuntime.recordSlackThreadParticipation(account.accountId, result.channelId, threadTs);
				if (context?.hasRepliedRef && context.currentChannelId) {
					const parsedTarget = parseSlackTarget(to, { defaultKind: "channel" });
					if (parsedTarget?.kind === "channel" && parsedTarget.id === context.currentChannelId) context.hasRepliedRef.value = true;
				}
				return jsonResult({
					ok: true,
					result
				});
			}
			case "editMessage": {
				const channelId = resolveChannelId();
				const messageId = readStringParam(params, "messageId", { required: true });
				const content = readStringParam(params, "content", { allowEmpty: true });
				const blocks = readSlackBlocksParam(params);
				if (!content && !blocks) throw new Error("Slack editMessage requires content or blocks.");
				if (writeOpts) await slackActionRuntime.editSlackMessage(channelId, messageId, content ?? "", {
					...writeOpts,
					blocks
				});
				else await slackActionRuntime.editSlackMessage(channelId, messageId, content ?? "", { blocks });
				return jsonResult({ ok: true });
			}
			case "deleteMessage": {
				const channelId = resolveChannelId();
				const messageId = readStringParam(params, "messageId", { required: true });
				if (writeOpts) await slackActionRuntime.deleteSlackMessage(channelId, messageId, writeOpts);
				else await slackActionRuntime.deleteSlackMessage(channelId, messageId);
				return jsonResult({ ok: true });
			}
			case "readMessages": {
				const channelId = resolveChannelId();
				const limitRaw = params.limit;
				const limit = typeof limitRaw === "number" && Number.isFinite(limitRaw) ? limitRaw : void 0;
				const before = readStringParam(params, "before");
				const after = readStringParam(params, "after");
				const threadId = readStringParam(params, "threadId");
				const result = await slackActionRuntime.readSlackMessages(channelId, {
					...readOpts,
					limit,
					before: before ?? void 0,
					after: after ?? void 0,
					threadId: threadId ?? void 0
				});
				return jsonResult({
					ok: true,
					messages: result.messages.map((message) => withNormalizedTimestamp(message, message.ts)),
					hasMore: result.hasMore
				});
			}
			case "downloadFile": {
				const fileId = readStringParam(params, "fileId", { required: true });
				const channelTarget = readStringParam(params, "channelId") ?? readStringParam(params, "to");
				const channelId = channelTarget ? resolveSlackChannelId(channelTarget) : void 0;
				const threadId = readStringParam(params, "threadId") ?? readStringParam(params, "replyTo");
				const maxBytes = account.config?.mediaMaxMb ? account.config.mediaMaxMb * 1024 * 1024 : 20 * 1024 * 1024;
				const downloaded = await slackActionRuntime.downloadSlackFile(fileId, {
					...readOpts,
					maxBytes,
					channelId,
					threadId: threadId ?? void 0
				});
				if (!downloaded) return jsonResult({
					ok: false,
					error: "File could not be downloaded (not found, too large, or inaccessible)."
				});
				return await imageResultFromFile({
					label: "slack-file",
					path: downloaded.path,
					extraText: downloaded.placeholder,
					details: {
						fileId,
						path: downloaded.path
					}
				});
			}
			default: break;
		}
	}
	if (pinActions.has(action)) {
		if (!isActionEnabled("pins")) throw new Error("Slack pins are disabled.");
		const channelId = resolveChannelId();
		if (action === "pinMessage") {
			const messageId = readStringParam(params, "messageId", { required: true });
			if (writeOpts) await slackActionRuntime.pinSlackMessage(channelId, messageId, writeOpts);
			else await slackActionRuntime.pinSlackMessage(channelId, messageId);
			return jsonResult({ ok: true });
		}
		if (action === "unpinMessage") {
			const messageId = readStringParam(params, "messageId", { required: true });
			if (writeOpts) await slackActionRuntime.unpinSlackMessage(channelId, messageId, writeOpts);
			else await slackActionRuntime.unpinSlackMessage(channelId, messageId);
			return jsonResult({ ok: true });
		}
		return jsonResult({
			ok: true,
			pins: (writeOpts ? await slackActionRuntime.listSlackPins(channelId, readOpts) : await slackActionRuntime.listSlackPins(channelId)).map((pin) => {
				const message = pin.message ? withNormalizedTimestamp(pin.message, pin.message.ts) : pin.message;
				return message ? {
					...pin,
					message
				} : pin;
			})
		});
	}
	if (action === "memberInfo") {
		if (!isActionEnabled("memberInfo")) throw new Error("Slack member info is disabled.");
		const userId = readStringParam(params, "userId", { required: true });
		return jsonResult({
			ok: true,
			info: writeOpts ? await slackActionRuntime.getSlackMemberInfo(userId, readOpts) : await slackActionRuntime.getSlackMemberInfo(userId)
		});
	}
	if (action === "emojiList") {
		if (!isActionEnabled("emojiList")) throw new Error("Slack emoji list is disabled.");
		const result = readOpts ? await slackActionRuntime.listSlackEmojis(readOpts) : await slackActionRuntime.listSlackEmojis();
		const limit = readNumberParam(params, "limit", { integer: true });
		if (limit != null && limit > 0 && result.emoji != null) {
			const entries = Object.entries(result.emoji).toSorted(([a], [b]) => a.localeCompare(b));
			if (entries.length > limit) return jsonResult({
				ok: true,
				emojis: {
					...result,
					emoji: Object.fromEntries(entries.slice(0, limit))
				}
			});
		}
		return jsonResult({
			ok: true,
			emojis: result
		});
	}
	throw new Error(`Unknown action: ${action}`);
}
//#endregion
//#region extensions/slack/src/resolve-allowlist-common.ts
function readSlackNextCursor(response) {
	const next = response.response_metadata?.next_cursor?.trim();
	return next ? next : void 0;
}
async function collectSlackCursorItems(params) {
	const items = [];
	let cursor;
	do {
		const response = await params.fetchPage(cursor);
		items.push(...params.collectPageItems(response));
		cursor = readSlackNextCursor(response);
	} while (cursor);
	return items;
}
function resolveSlackAllowlistEntries(params) {
	const results = [];
	for (const input of params.entries) {
		const parsed = params.parseInput(input);
		if (parsed.id) {
			const match = params.findById(params.lookup, parsed.id);
			results.push(params.buildIdResolved({
				input,
				parsed,
				match
			}));
			continue;
		}
		const resolved = params.resolveNonId({
			input,
			parsed,
			lookup: params.lookup
		});
		if (resolved) {
			results.push(resolved);
			continue;
		}
		results.push(params.buildUnresolved(input));
	}
	return results;
}
//#endregion
//#region extensions/slack/src/resolve-users.ts
function parseSlackUserInput(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return {};
	const mention = trimmed.match(/^<@([A-Z0-9]+)>$/i);
	if (mention) return { id: mention[1]?.toUpperCase() };
	const prefixed = trimmed.replace(/^(slack:|user:)/i, "");
	if (/^[A-Z][A-Z0-9]+$/i.test(prefixed)) return { id: prefixed.toUpperCase() };
	if (trimmed.includes("@") && !trimmed.startsWith("@")) return { email: trimmed.toLowerCase() };
	const name = trimmed.replace(/^@/, "").trim();
	return name ? { name } : {};
}
async function listSlackUsers(client) {
	return collectSlackCursorItems({
		fetchPage: async (cursor) => await client.users.list({
			limit: 200,
			cursor
		}),
		collectPageItems: (res) => (res.members ?? []).map((member) => {
			const id = member.id?.trim();
			const name = member.name?.trim();
			if (!id || !name) return null;
			const profile = member.profile ?? {};
			return {
				id,
				name,
				displayName: profile.display_name?.trim() || void 0,
				realName: profile.real_name?.trim() || member.real_name?.trim() || void 0,
				email: profile.email?.trim()?.toLowerCase() || void 0,
				deleted: Boolean(member.deleted),
				isBot: Boolean(member.is_bot),
				isAppUser: Boolean(member.is_app_user)
			};
		}).filter(Boolean)
	});
}
function scoreSlackUser(user, match) {
	let score = 0;
	if (!user.deleted) score += 3;
	if (!user.isBot && !user.isAppUser) score += 2;
	if (match.email && user.email === match.email) score += 5;
	if (match.name) {
		const target = match.name.toLowerCase();
		if ([
			user.name,
			user.displayName,
			user.realName
		].map((value) => value?.toLowerCase()).filter(Boolean).some((value) => value === target)) score += 2;
	}
	return score;
}
function resolveSlackUserFromMatches(input, matches, parsed) {
	const best = matches.map((user) => ({
		user,
		score: scoreSlackUser(user, parsed)
	})).toSorted((a, b) => b.score - a.score)[0]?.user ?? matches[0];
	return {
		input,
		resolved: true,
		id: best.id,
		name: best.displayName ?? best.realName ?? best.name,
		email: best.email,
		deleted: best.deleted,
		isBot: best.isBot,
		note: matches.length > 1 ? "multiple matches; chose best" : void 0
	};
}
async function resolveSlackUserAllowlist(params) {
	const users = await listSlackUsers(params.client ?? createSlackWebClient(params.token));
	return resolveSlackAllowlistEntries({
		entries: params.entries,
		lookup: users,
		parseInput: parseSlackUserInput,
		findById: (lookup, id) => lookup.find((user) => user.id === id),
		buildIdResolved: ({ input, parsed, match }) => ({
			input,
			resolved: true,
			id: parsed.id,
			name: match?.displayName ?? match?.realName ?? match?.name,
			email: match?.email,
			deleted: match?.deleted,
			isBot: match?.isBot
		}),
		resolveNonId: ({ input, parsed, lookup }) => {
			if (parsed.email) {
				const matches = lookup.filter((user) => user.email === parsed.email);
				if (matches.length > 0) return resolveSlackUserFromMatches(input, matches, parsed);
			}
			if (parsed.name) {
				const target = parsed.name.toLowerCase();
				const matches = lookup.filter((user) => {
					return [
						user.name,
						user.displayName,
						user.realName
					].map((value) => value?.toLowerCase()).filter(Boolean).includes(target);
				});
				if (matches.length > 0) return resolveSlackUserFromMatches(input, matches, parsed);
			}
		},
		buildUnresolved: (input) => ({
			input,
			resolved: false
		})
	});
}
//#endregion
//#region extensions/slack/src/resolve-channels.ts
function parseSlackChannelMention(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return {};
	const mention = trimmed.match(/^<#([A-Z0-9]+)(?:\|([^>]+))?>$/i);
	if (mention) return {
		id: mention[1]?.toUpperCase(),
		name: mention[2]?.trim()
	};
	const prefixed = trimmed.replace(/^(slack:|channel:)/i, "");
	if (/^[CG][A-Z0-9]+$/i.test(prefixed)) return { id: prefixed.toUpperCase() };
	const name = prefixed.replace(/^#/, "").trim();
	return name ? { name } : {};
}
async function listSlackChannels(client) {
	return collectSlackCursorItems({
		fetchPage: async (cursor) => await client.conversations.list({
			types: "public_channel,private_channel",
			exclude_archived: false,
			limit: 1e3,
			cursor
		}),
		collectPageItems: (res) => (res.channels ?? []).map((channel) => {
			const id = channel.id?.trim();
			const name = channel.name?.trim();
			if (!id || !name) return null;
			return {
				id,
				name,
				archived: Boolean(channel.is_archived),
				isPrivate: Boolean(channel.is_private)
			};
		}).filter(Boolean)
	});
}
function resolveByName(name, channels) {
	const target = name.trim().toLowerCase();
	if (!target) return;
	const matches = channels.filter((channel) => channel.name.toLowerCase() === target);
	if (matches.length === 0) return;
	return matches.find((channel) => !channel.archived) ?? matches[0];
}
async function resolveSlackChannelAllowlist(params) {
	const channels = await listSlackChannels(params.client ?? createSlackWebClient(params.token));
	return resolveSlackAllowlistEntries({
		entries: params.entries,
		lookup: channels,
		parseInput: parseSlackChannelMention,
		findById: (lookup, id) => lookup.find((channel) => channel.id === id),
		buildIdResolved: ({ input, parsed, match }) => ({
			input,
			resolved: true,
			id: parsed.id,
			name: match?.name ?? parsed.name,
			archived: match?.archived
		}),
		resolveNonId: ({ input, parsed, lookup }) => {
			if (!parsed.name) return;
			const match = resolveByName(parsed.name, lookup);
			if (!match) return;
			return {
				input,
				resolved: true,
				id: match.id,
				name: match.name,
				archived: match.archived
			};
		},
		buildUnresolved: (input) => ({
			input,
			resolved: false
		})
	});
}
//#endregion
export { resolveSlackUserAllowlist as n, handleSlackAction as r, resolveSlackChannelAllowlist as t };
