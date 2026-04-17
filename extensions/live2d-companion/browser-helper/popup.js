async function sendCommand(command) {
  return await chrome.runtime.sendMessage(command);
}

function formatSummary(state) {
  if (!state?.attached) {
    return "State: detached\nTransfer: nothing";
  }
  return [
    `State: attached to tab ${state.tabId ?? "unknown"}`,
    `Title: ${state.title ?? "(untitled)"}`,
    `URL: ${state.url ?? "(missing)"}`,
    `Transfer: URL, title, visible text snapshot${state.lastScreenshot ? ", screenshot" : ""}`,
  ].join("\n");
}

async function refresh() {
  const state = await sendCommand({ type: "get-state" });
  document.getElementById("summary").textContent = formatSummary(state);
  document.getElementById("status").textContent = state?.status ?? "";
}

document.getElementById("attach").addEventListener("click", async () => {
  const result = await sendCommand({ type: "attach-active-tab" });
  document.getElementById("status").textContent = result?.status ?? "Attach requested.";
  await refresh();
});

document.getElementById("detach").addEventListener("click", async () => {
  const result = await sendCommand({ type: "detach-tab" });
  document.getElementById("status").textContent = result?.status ?? "Detached.";
  await refresh();
});

void refresh();
