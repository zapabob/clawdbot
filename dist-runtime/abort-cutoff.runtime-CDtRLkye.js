import "./io-BeL7sW7Y.js";
import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import "./subsystem-BZRyMoTO.js";
import "./ansi-D3lUajt1.js";
import "./agent-scope-BIySJgkJ.js";
import "./file-identity-DgWfjfnD.js";
import "./boundary-file-read-DZTg2Wyt.js";
import "./logger-BsvC8P6f.js";
import "./exec-CbOKTdtq.js";
import "./registry-B5KsIQB2.js";
import "./message-channel-BTVKzHsu.js";
import "./boolean-CsNbQKvJ.js";
import "./env-C-KVzFmc.js";
import "./shell-env-BOjFl6MZ.js";
import "./config-state-CGV1IKLE.js";
import "./version-yfoo3YbF.js";
import "./min-host-version-DM6er2ZX.js";
import "./manifest-registry-CMy5XLiN.js";
import "./runtime-guard-WQAOpX6v.js";
import "./safe-text-CpFY0TZg.js";
import "./model-selection-CNzhkJya.js";
import "./env-substitution-X9lTyhgh.js";
import "./network-mode-JwypQ_rG.js";
import "./ip-CWtG939A.js";
import "./config-Cfud9qZm.js";
import "./runtime-Bd4XqlOP.js";
import {
  n as hasAbortCutoff,
  t as applyAbortCutoffToSessionEntry,
} from "./abort-cutoff-tvZDYFHB.js";
import "./plugins-AUGbKgu9.js";
import "./paths-0NHK4yJk.js";
import "./session-write-lock-D4oaWfci.js";
import { l as updateSessionStore } from "./store-Bo1TX1Sc.js";
//#region src/auto-reply/reply/abort-cutoff.runtime.ts
async function clearAbortCutoffInSessionRuntime(params) {
  const { sessionEntry, sessionStore, sessionKey, storePath } = params;
  if (!sessionEntry || !sessionStore || !sessionKey || !hasAbortCutoff(sessionEntry)) return false;
  applyAbortCutoffToSessionEntry(sessionEntry, void 0);
  sessionEntry.updatedAt = Date.now();
  sessionStore[sessionKey] = sessionEntry;
  if (storePath)
    await updateSessionStore(storePath, (store) => {
      const existing = store[sessionKey] ?? sessionEntry;
      if (!existing) return;
      applyAbortCutoffToSessionEntry(existing, void 0);
      existing.updatedAt = Date.now();
      store[sessionKey] = existing;
    });
  return true;
}
//#endregion
export { clearAbortCutoffInSessionRuntime };
