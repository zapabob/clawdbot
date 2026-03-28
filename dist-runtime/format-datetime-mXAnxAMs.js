import { execFileSync } from "node:child_process";
//#region src/agents/date-time.ts
let cachedTimeFormat;
function resolveUserTimezone(configured) {
  const trimmed = configured?.trim();
  if (trimmed)
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(/* @__PURE__ */ new Date());
      return trimmed;
    } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone?.trim() || "UTC";
}
function resolveUserTimeFormat(preference) {
  if (preference === "12" || preference === "24") return preference;
  if (cachedTimeFormat) return cachedTimeFormat;
  cachedTimeFormat = detectSystemTimeFormat() ? "24" : "12";
  return cachedTimeFormat;
}
function normalizeTimestamp(raw) {
  if (raw == null) return;
  let timestampMs;
  if (raw instanceof Date) timestampMs = raw.getTime();
  else if (typeof raw === "number" && Number.isFinite(raw))
    timestampMs = raw < 0xe8d4a51000 ? Math.round(raw * 1e3) : Math.round(raw);
  else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isFinite(num))
        if (trimmed.includes(".")) timestampMs = Math.round(num * 1e3);
        else if (trimmed.length >= 13) timestampMs = Math.round(num);
        else timestampMs = Math.round(num * 1e3);
    } else {
      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) timestampMs = parsed;
    }
  }
  if (timestampMs === void 0 || !Number.isFinite(timestampMs)) return;
  return {
    timestampMs,
    timestampUtc: new Date(timestampMs).toISOString(),
  };
}
function withNormalizedTimestamp(value, rawTimestamp) {
  const normalized = normalizeTimestamp(rawTimestamp);
  if (!normalized) return value;
  return {
    ...value,
    timestampMs:
      typeof value.timestampMs === "number" && Number.isFinite(value.timestampMs)
        ? value.timestampMs
        : normalized.timestampMs,
    timestampUtc:
      typeof value.timestampUtc === "string" && value.timestampUtc.trim()
        ? value.timestampUtc
        : normalized.timestampUtc,
  };
}
function detectSystemTimeFormat() {
  if (process.platform === "darwin")
    try {
      const result = execFileSync("defaults", ["read", "-g", "AppleICUForce24HourTime"], {
        encoding: "utf8",
        timeout: 500,
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      if (result === "1") return true;
      if (result === "0") return false;
    } catch {}
  if (process.platform === "win32")
    try {
      const result = execFileSync(
        "powershell",
        ["-Command", "(Get-Culture).DateTimeFormat.ShortTimePattern"],
        {
          encoding: "utf8",
          timeout: 1e3,
        },
      ).trim();
      if (result.startsWith("H")) return true;
      if (result.startsWith("h")) return false;
    } catch {}
  try {
    const sample = new Date(2e3, 0, 1, 13, 0);
    return new Intl.DateTimeFormat(void 0, { hour: "numeric" }).format(sample).includes("13");
  } catch {
    return false;
  }
}
function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
function formatUserTime(date, timeZone, format) {
  const use24Hour = format === "24";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: use24Hour ? "2-digit" : "numeric",
      minute: "2-digit",
      hourCycle: use24Hour ? "h23" : "h12",
    }).formatToParts(date);
    const map = {};
    for (const part of parts) if (part.type !== "literal") map[part.type] = part.value;
    if (!map.weekday || !map.year || !map.month || !map.day || !map.hour || !map.minute) return;
    const dayNum = parseInt(map.day, 10);
    const suffix = ordinalSuffix(dayNum);
    const timePart = use24Hour
      ? `${map.hour}:${map.minute}`
      : `${map.hour}:${map.minute} ${map.dayPeriod ?? ""}`.trim();
    return `${map.weekday}, ${map.month} ${dayNum}${suffix}, ${map.year} — ${timePart}`;
  } catch {
    return;
  }
}
//#endregion
//#region src/infra/format-time/format-datetime.ts
/**
 * Centralized date/time formatting utilities.
 *
 * All formatters are timezone-aware, using Intl.DateTimeFormat.
 * Consolidates duplicated formatUtcTimestamp / formatZonedTimestamp / resolveExplicitTimezone
 * that previously lived in envelope.ts and session-updates.ts.
 */
/**
 * Validate an IANA timezone string. Returns the string if valid, undefined otherwise.
 */
function resolveTimezone(value) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(/* @__PURE__ */ new Date());
    return value;
  } catch {
    return;
  }
}
/**
 * Format a Date as a UTC timestamp string.
 *
 * Without seconds: `2024-01-15T14:30Z`
 * With seconds:    `2024-01-15T14:30:05Z`
 */
function formatUtcTimestamp(date, options) {
  const yyyy = String(date.getUTCFullYear()).padStart(4, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  if (!options?.displaySeconds) return `${yyyy}-${mm}-${dd}T${hh}:${min}Z`;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${String(date.getUTCSeconds()).padStart(2, "0")}Z`;
}
/**
 * Format a Date with timezone display using Intl.DateTimeFormat.
 *
 * Without seconds: `2024-01-15 14:30 EST`
 * With seconds:    `2024-01-15 14:30:05 EST`
 *
 * Returns undefined if Intl formatting fails.
 */
function formatZonedTimestamp(date, options) {
  try {
    const intlOptions = {
      timeZone: options?.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short",
    };
    if (options?.displaySeconds) intlOptions.second = "2-digit";
    const parts = new Intl.DateTimeFormat("en-US", intlOptions).formatToParts(date);
    const pick = (type) => parts.find((part) => part.type === type)?.value;
    const yyyy = pick("year");
    const mm = pick("month");
    const dd = pick("day");
    const hh = pick("hour");
    const min = pick("minute");
    const sec = options?.displaySeconds ? pick("second") : void 0;
    const tz = [...parts]
      .toReversed()
      .find((part) => part.type === "timeZoneName")
      ?.value?.trim();
    if (!yyyy || !mm || !dd || !hh || !min) return;
    if (options?.displaySeconds && sec)
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}${tz ? ` ${tz}` : ""}`;
    return `${yyyy}-${mm}-${dd} ${hh}:${min}${tz ? ` ${tz}` : ""}`;
  } catch {
    return;
  }
}
//#endregion
export {
  resolveUserTimeFormat as a,
  formatUserTime as i,
  formatZonedTimestamp as n,
  resolveUserTimezone as o,
  resolveTimezone as r,
  withNormalizedTimestamp as s,
  formatUtcTimestamp as t,
};
