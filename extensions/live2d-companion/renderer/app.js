import companionConfig from "../companion.config.json" with { type: "json" };
import { createAvatarController, inferAvatarType } from "./avatar-factory.js";
import { detectEmotion, applyEmotion } from "./emotion-mapper.js";
import { LipSyncController } from "./lip-sync.js";
import { SttHandler } from "./stt-handler.js";
async function main() {
  const container = document.getElementById("canvas-container");
  const statusText = document.getElementById("status-text");
  const modelBadge = document.getElementById("model-badge");
  const micBtn = document.getElementById("mic-btn");
  if (!container) return;
  // ── Initialize avatar via factory ────────────────────────────────────────
  const configType = companionConfig.avatarType ?? "auto";
  let avatar = await createAvatarController(configType === "auto" ? "live2d" : configType);
  await avatar.init(container);
  // ── Lip sync ──────────────────────────────────────────────────────────────
  const lipSync = new LipSyncController(avatar);
  // ── STT Handler ───────────────────────────────────────────────────────────
  const stt = new SttHandler((transcript) => {
    if (statusText) statusText.textContent = `🎤 ${transcript}`;
    window.companionBridge?.sendSttResult(transcript);
    const emotion = detectEmotion(transcript);
    applyEmotion(avatar, emotion);
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
  // ── Avatar command handler (AI agent control) ─────────────────────────────
  async function handleAvatarCommand(cmd) {
    if (cmd.loadModel) {
      const type = inferAvatarType(cmd.loadModel);
      if (type !== configType && type !== "auto") {
        // Avatar type changed — need a different controller
        avatar.destroy();
        const newAvatar = await createAvatarController(type);
        await newAvatar.init(container);
        Object.assign(avatar, newAvatar); // swap in-place via prototype copy is not clean;
        // instead we restart — signal main process to reload window (simple approach)
        window.location.reload();
        return;
      }
      if (statusText) statusText.textContent = "モデル読み込み中…";
      await avatar.reloadModel(cmd.loadModel);
      const name = cmd.loadModel.split(/[/\\]/).pop() ?? cmd.loadModel;
      if (modelBadge) modelBadge.textContent = name;
      if (statusText) statusText.textContent = "";
    }
    if (cmd.expression) {
      applyEmotion(avatar, detectEmotion(`[EMOTION:${cmd.expression}]`));
    }
    if (cmd.motion) {
      avatar.playMotion(cmd.motion);
    }
    if (cmd.lookAt) {
      avatar.lookAt(cmd.lookAt.x, cmd.lookAt.y);
    }
    if (cmd.speakText) {
      const emotion = detectEmotion(cmd.speakText);
      applyEmotion(avatar, emotion);
      void lipSync.speak(cmd.speakText);
      if (statusText) statusText.textContent = cmd.speakText.slice(0, 40);
    }
  }
  // ── IPC events from main process ──────────────────────────────────────────
  if (window.companionBridge) {
    // LINE / chat messages → speak + emotion
    window.companionBridge.onLineEvent((event) => {
      const text = event.text ?? "";
      if (!text) return;
      const emotion = detectEmotion(text);
      applyEmotion(avatar, emotion);
      void lipSync.speak(text);
      if (statusText) statusText.textContent = `LINE: ${text.slice(0, 30)}`;
    });
    // Emotion events
    window.companionBridge.onEmotionEvent((event) => {
      applyEmotion(avatar, event.emotion);
      if (event.text) {
        void lipSync.speak(event.text);
        if (statusText) statusText.textContent = event.text.slice(0, 40);
      }
    });
    // Speak-text from main process (triggered via HTTP control API)
    window.companionBridge.onSpeakText?.((text) => {
      if (!text) return;
      const emotion = detectEmotion(text);
      applyEmotion(avatar, emotion);
      void lipSync.speak(text);
      if (statusText) statusText.textContent = text.slice(0, 40);
    });
    // Control events: agentId / ttsProvider changes + avatarCommand
    window.companionBridge.onControlEvent?.((cmd) => {
      if (cmd.ttsProvider === "voicevox" || cmd.ttsProvider === "web-speech") {
        lipSync.ttsProvider = cmd.ttsProvider;
        window.companionBridge?.sendStateUpdate?.({ ttsProvider: lipSync.ttsProvider });
        if (statusText) {
          const label = lipSync.ttsProvider === "voicevox" ? "VOICEVOX" : "Web Speech (無料)";
          statusText.textContent = `TTS: ${label}`;
          setTimeout(() => {
            if (statusText) statusText.textContent = "";
          }, 2000);
        }
      }
      if (typeof cmd.agentId === "string" && cmd.agentId) {
        window.companionBridge?.sendStateUpdate?.({ agentId: cmd.agentId });
        if (statusText) {
          statusText.textContent = `エージェント: ${cmd.agentId}`;
          setTimeout(() => {
            if (statusText) statusText.textContent = "";
          }, 2000);
        }
      }
      if (cmd.avatarCommand) {
        void handleAvatarCommand(cmd.avatarCommand);
      }
    });
    // Dedicated avatar command channel
    const bridge = window.companionBridge;
    bridge.onAvatarCommand?.((cmd) => void handleAvatarCommand(cmd));
  }
  // ── Avatar Model Drag-and-Drop (.model3.json / .vrm / .fbx) ──────────────
  function setDragActive(active) {
    document.body.classList.toggle("drag-active", active);
  }
  document.addEventListener("dragenter", (e) => {
    if (hasModeFile(e)) setDragActive(true);
  });
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (hasModeFile(e)) {
      e.dataTransfer.dropEffect = "copy";
      setDragActive(true);
    }
  });
  document.addEventListener("dragleave", (e) => {
    if (!e.relatedTarget) setDragActive(false);
  });
  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    let modelPath = null;
    const name = file.name.toLowerCase();
    if (name.endsWith(".vrm") || name.endsWith(".fbx")) {
      modelPath = file.path ?? null;
    } else if (name.endsWith(".model3.json") || name.endsWith(".model.json")) {
      modelPath = file.path ?? null;
    } else {
      // Check for directory containing a model file
      const item = e.dataTransfer?.items[0];
      if (item) {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          modelPath = await findModelInDirectory(entry);
        }
      }
    }
    if (!modelPath) {
      if (statusText)
        statusText.textContent = "⚠ .vrm / .fbx / .model3.json を含むファイル/フォルダをドロップ";
      return;
    }
    const droppedType = inferAvatarType(modelPath);
    // If the dropped type differs from the running controller type, we need to
    // destroy the current controller and create a new one of the correct type.
    const currentType = avatar.avatarType;
    if (droppedType !== currentType) {
      if (statusText) statusText.textContent = "アバター切替中…";
      avatar.destroy();
      const newCtrl = await createAvatarController(droppedType);
      await newCtrl.init(container);
      // Rebind avatar variable and lipSync to the new controller
      avatar = newCtrl;
      lipSync.live2d = newCtrl;
      // Load the dropped model in the new controller
      await avatar.reloadModel(modelPath);
      const fname = modelPath.split(/[/\\]/).pop() ?? modelPath;
      if (modelBadge) modelBadge.textContent = fname;
      if (statusText) statusText.textContent = "";
      return;
    }
    if (statusText) statusText.textContent = "モデル読み込み中…";
    try {
      await avatar.reloadModel(modelPath);
      const fname = modelPath.split(/[/\\]/).pop() ?? modelPath;
      if (modelBadge) modelBadge.textContent = fname;
      if (statusText) statusText.textContent = "";
    } catch (err) {
      console.error("[DD] model load failed:", err);
      if (statusText) statusText.textContent = "⚠ モデル読み込み失敗";
    }
  });
}
function hasModeFile(e) {
  if (!e.dataTransfer) return false;
  for (const item of Array.from(e.dataTransfer.items)) {
    if (item.kind === "file") return true;
  }
  return false;
}
async function findModelInDirectory(dir) {
  return new Promise((resolve) => {
    const reader = dir.createReader();
    reader.readEntries(async (entries) => {
      // Prefer VRM, then FBX, then Live2D
      for (const ext of [".vrm", ".fbx", ".model3.json", ".model.json"]) {
        for (const entry of entries) {
          if (entry.isFile && entry.name.toLowerCase().endsWith(ext)) {
            resolve(await entryToPath(entry));
            return;
          }
        }
      }
      for (const entry of entries) {
        if (entry.isDirectory) {
          const found = await findModelInDirectory(entry);
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
function entryToPath(entry) {
  return new Promise((resolve) => {
    entry.file(
      (f) => {
        resolve(f.path ?? null);
      },
      () => resolve(null),
    );
  });
}
void main();
