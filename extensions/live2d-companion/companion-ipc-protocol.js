export function isCompanionIpcRequestEnvelope(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const record = value;
    if (record.type === "auth") {
        return typeof record.token === "string";
    }
    return (record.type === "request" &&
        typeof record.id === "string" &&
        typeof record.action === "string");
}
