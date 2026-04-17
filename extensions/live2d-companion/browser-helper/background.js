const HOST_NAME = "io.openclaw.desktop_companion";
const ATTACHMENT_KEY = "desktopCompanionAttachment";

let nativePort = null;

function connectNativeHost() {
  if (nativePort) {
    return nativePort;
  }
  nativePort = chrome.runtime.connectNative(HOST_NAME);
  nativePort.onDisconnect.addListener(() => {
    nativePort = null;
  });
  return nativePort;
}

function setBadge(attached) {
  chrome.action.setBadgeBackgroundColor({ color: attached ? "#62d0ff" : "#8a93a9" });
  chrome.action.setBadgeText({ text: attached ? "ON" : "" });
}

async function getStoredAttachment() {
  const stored = await chrome.storage.local.get(ATTACHMENT_KEY);
  return stored[ATTACHMENT_KEY] ?? null;
}

async function setStoredAttachment(attachment) {
  if (!attachment) {
    await chrome.storage.local.remove(ATTACHMENT_KEY);
    setBadge(false);
    return;
  }
  await chrome.storage.local.set({ [ATTACHMENT_KEY]: attachment });
  setBadge(true);
}

async function captureVisibleText(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const text = document.body?.innerText ?? "";
        return text.replace(/\s+/g, " ").trim().slice(0, 4000);
      },
    });
    return typeof result?.result === "string" ? result.result : "";
  } catch {
    return "";
  }
}

function postNative(message) {
  try {
    connectNativeHost().postMessage(message);
    return true;
  } catch {
    nativePort = null;
    return false;
  }
}

async function attachActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id || !tab.url) {
    return { status: "No active tab is available." };
  }
  const textSnapshot = await captureVisibleText(tab.id);
  const attachment = {
    attached: true,
    tabId: String(tab.id),
    title: tab.title ?? "",
    url: tab.url,
    textSnapshot,
    lastScreenshot: false,
    status: "Attached to the active tab.",
  };
  await setStoredAttachment(attachment);
  postNative({
    type: "attach-tab",
    tabId: attachment.tabId,
    title: attachment.title,
    url: attachment.url,
    textSnapshot: attachment.textSnapshot,
  });
  return attachment;
}

async function detachTab() {
  const attachment = await getStoredAttachment();
  if (attachment?.tabId) {
    postNative({ type: "detach-tab", tabId: attachment.tabId });
  }
  await setStoredAttachment(null);
  return { attached: false, status: "Detached from the tab." };
}

async function forwardTabUpdate(tabId, tab) {
  const attachment = await getStoredAttachment();
  if (!attachment || attachment.tabId !== String(tabId)) {
    return;
  }
  const textSnapshot = await captureVisibleText(tabId);
  const next = {
    ...attachment,
    title: tab.title ?? attachment.title,
    url: tab.url ?? attachment.url,
    textSnapshot,
    status: "Following the attached tab.",
  };
  await setStoredAttachment(next);
  postNative({
    type: "update-tab-context",
    tabId: next.tabId,
    title: next.title,
    url: next.url,
    textSnapshot: next.textSnapshot,
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setBadge(false);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    if (message?.type === "attach-active-tab") {
      sendResponse(await attachActiveTab());
      return;
    }
    if (message?.type === "detach-tab") {
      sendResponse(await detachTab());
      return;
    }
    if (message?.type === "get-state") {
      sendResponse((await getStoredAttachment()) ?? { attached: false, status: "" });
      return;
    }
    sendResponse({ status: "Unknown helper command." });
  })();
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || typeof changeInfo.url === "string") {
    void forwardTabUpdate(tabId, tab);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void (async () => {
    const attachment = await getStoredAttachment();
    if (attachment?.tabId === String(tabId)) {
      await detachTab();
    }
  })();
});
