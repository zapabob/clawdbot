import type { CompanionLineEvent, CompanionEmotionEvent } from "../bridge/event-types.js";
import { detectEmotion, applyEmotion } from "./emotion-mapper.js";
import { LipSyncController } from "./lip-sync.js";
import { Live2DController } from "./live2d-controller.js";
import { SttHandler } from "./stt-handler.js";

async function main(): Promise<void> {
  const container = document.getElementById("canvas-container");
  const statusText = document.getElementById("status-text");
  const modelBadge = document.getElementById("model-badge");
  const micBtn = document.getElementById("mic-btn") as HTMLButtonElement;

  if (!container) return;

  // ── Initialize Live2D ───────────────────────────────────────────────────
  const live2d = new Live2DController();
  await live2d.init(container);

  // ── Lip sync ─────────────────────────────────────────────────────────────
  const lipSync = new LipSyncController(live2d);

  // ── STT Handler ──────────────────────────────────────────────────────────
  const stt = new SttHandler((transcript: string) => {
    if (statusText) statusText.textContent = `🎤 ${transcript}`;
    window.companionBridge?.sendSttResult(transcript);
    const emotion = detectEmotion(transcript);
    applyEmotion(live2d, emotion);
  });

  micBtn.addEventListener("click", () => {
    if (stt.isActive) {
      stt.stop();
      micBtn.classList.remove("active");
      micBtn.title = "音声入力 ON";
      if (statusText) statusText.textContent = "";
    } else {
      stt.start();
      micBtn.classList.add("active");
      micBtn.title = "音声入力 OFF";
      if (statusText) statusText.textContent = "🎤 聴いています…";
    }
  });

  // ── IPC events from main process ─────────────────────────────────────────
  if (window.companionBridge) {
    window.companionBridge.onLineEvent((event: CompanionLineEvent) => {
      const text = event.text ?? "";
      if (!text) return;
      const emotion = detectEmotion(text);
      applyEmotion(live2d, emotion);
      void lipSync.speak(text);
      if (statusText) statusText.textContent = `LINE: ${text.slice(0, 30)}`;
    });

    window.companionBridge.onEmotionEvent((event: CompanionEmotionEvent) => {
      applyEmotion(live2d, event.emotion);
      if (event.text) {
        void lipSync.speak(event.text);
        if (statusText) statusText.textContent = event.text.slice(0, 40);
      }
    });
  }

  // ── Live2D Model Drag-and-Drop ────────────────────────────────────────────
  // Accepts .model3.json dropped directly onto the window.
  // In Electron renderer, File objects have a non-standard `.path` property
  // containing the real filesystem path — used to build a file:// URL.

  function setDragActive(active: boolean): void {
    document.body.classList.toggle("drag-active", active);
  }

  document.addEventListener("dragenter", (e) => {
    if (hasModeFile(e)) setDragActive(true);
  });

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (hasModeFile(e)) {
      e.dataTransfer!.dropEffect = "copy";
      setDragActive(true);
    }
  });

  document.addEventListener("dragleave", (e) => {
    // Only clear when leaving the document root
    if (!e.relatedTarget) setDragActive(false);
  });

  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer?.files[0];
    if (!file) return;

    // Accept .model3.json directly, or scan a directory entry for one
    let modelPath: string | null = null;

    if (file.name.endsWith(".model3.json")) {
      modelPath = (file as File & { path?: string }).path ?? null;
    } else {
      // Electron DataTransferItem can expose directory entries
      const item = e.dataTransfer?.items[0];
      if (item) {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          modelPath = await findModelInDirectory(entry as FileSystemDirectoryEntry);
        }
      }
    }

    if (!modelPath) {
      if (statusText) statusText.textContent = "⚠ .model3.json を含むファイル/フォルダをドロップ";
      return;
    }

    if (statusText) statusText.textContent = "モデル読み込み中…";
    try {
      await live2d.reloadModel(modelPath);
      const name = modelPath.split(/[/\\]/).pop() ?? modelPath;
      if (modelBadge) modelBadge.textContent = name;
      if (statusText) statusText.textContent = "";
    } catch (err) {
      console.error("[DD] model load failed:", err);
      if (statusText) statusText.textContent = "⚠ モデル読み込み失敗";
    }
  });
}

/** Returns true when the dragged item looks like a model file or folder. */
function hasModeFile(e: DragEvent): boolean {
  if (!e.dataTransfer) return false;
  for (const item of Array.from(e.dataTransfer.items)) {
    if (item.kind === "file") return true;
  }
  return false;
}

/** Recursively find first .model3.json in a dropped directory entry. */
async function findModelInDirectory(dir: FileSystemDirectoryEntry): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = dir.createReader();
    reader.readEntries(async (entries) => {
      for (const entry of entries) {
        if (entry.isFile && entry.name.endsWith(".model3.json")) {
          resolve(await entryToPath(entry as FileSystemFileEntry));
          return;
        }
      }
      // Recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory) {
          const found = await findModelInDirectory(entry as FileSystemDirectoryEntry);
          if (found) {
            resolve(found);
            return;
          }
        }
      }
      resolve(null);
    });
  });
}

/** Extract filesystem path from a FileSystemFileEntry via Electron File.path. */
function entryToPath(entry: FileSystemFileEntry): Promise<string | null> {
  return new Promise((resolve) => {
    entry.file(
      (f) => {
        resolve((f as File & { path?: string }).path ?? null);
      },
      () => resolve(null),
    );
  });
}

void main();
