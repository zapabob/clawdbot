import type {
  AvatarCommand,
  CompanionAvatarStateUpdate,
  CompanionEmotionEvent,
  CompanionLineEvent,
  TtsProvider,
} from "../bridge/event-types.js";
import type {
  CompanionAssetManifestEntry,
  CompanionPermissionCapability,
  CompanionRuntimeState,
} from "../runtime-api.js";
import type { IAvatarController } from "./avatar-controller.js";
import { createAvatarController, inferAvatarType, type AvatarType } from "./avatar-factory.js";
import { buildAvatarEmotionState, buildAvatarSpeechState } from "./avatar-state.js";
import { applyEmotion, detectEmotion, isEmotionType } from "./emotion-mapper.js";
import { LipSyncController, type LipSyncConfig } from "./lip-sync.js";
import {
  buildAssetLibraryView,
  buildCompanionProfilePatch,
  buildSetupChecklist,
  createCompanionProfileDraft,
  createCompanionUiState,
  reduceCompanionUiState,
  type AssetImportDialogState,
  type CompanionProfileDraft,
} from "./ui-state.js";

const ONBOARDING_STORAGE_KEY = "desktop-companion:onboarding-seen:v1";
const TOAST_DURATION_MS = 3200;
const PERMISSION_CAPABILITIES: CompanionPermissionCapability[] = [
  "mic",
  "camera",
  "screen",
  "tab-follow",
];

type ToastTone = "info" | "success" | "warning" | "danger";
type ConcreteAvatarType = Exclude<AvatarType, "auto">;
type CompanionRendererConfig = {
  avatarType?: AvatarType;
  voicevoxUrl?: unknown;
  voicevoxSpeaker?: unknown;
  webSpeechLang?: unknown;
  webSpeechRate?: unknown;
  webSpeechPitch?: unknown;
  assetPolicy?: {
    importMode?: string;
  };
  browserHelper?: {
    enabled?: boolean;
  };
};

type PermissionDialogConfig = {
  capability: CompanionPermissionCapability;
  title: string;
  message: string;
};

type AssetImportDialogResult = {
  licenseMemo: string;
};

type PendingDialogResolver =
  | { kind: "permission"; resolve: (allowed: boolean) => void }
  | { kind: "asset-import"; resolve: (result: AssetImportDialogResult | null) => void };

type AssetImportDialogDraft = {
  licenseMemo: string;
  rightsAcknowledged: boolean;
};

class CameraHandler {
  private stream: MediaStream | null = null;
  active = false;

  constructor(
    private readonly videoEl: HTMLVideoElement,
    private readonly canvasEl: HTMLCanvasElement,
  ) {}

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.videoEl.srcObject = this.stream;
      this.active = true;
      return true;
    } catch (error) {
      console.warn("[Camera] start failed:", error);
      return false;
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.videoEl.srcObject = null;
    this.active = false;
  }

  captureFrame(): string | null {
    if (!this.active) {
      return null;
    }
    const context = this.canvasEl.getContext("2d");
    if (!context) {
      return null;
    }
    const width = this.videoEl.videoWidth || this.canvasEl.width;
    const height = this.videoEl.videoHeight || this.canvasEl.height;
    if (width > 0 && height > 0) {
      this.canvasEl.width = width;
      this.canvasEl.height = height;
    }
    context.drawImage(this.videoEl, 0, 0, this.canvasEl.width, this.canvasEl.height);
    return this.canvasEl.toDataURL("image/jpeg", 0.7).split(",")[1] ?? null;
  }
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

function basename(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

function inferAssetTypeFromPath(filePath: string): CompanionAssetManifestEntry["assetType"] {
  const normalized = filePath.toLowerCase();
  if (normalized.endsWith(".vrm")) {
    return "vrm";
  }
  if (normalized.endsWith(".fbx")) {
    return "fbx";
  }
  if (normalized.endsWith(".model3.json") || normalized.endsWith(".model.json")) {
    return "live2d";
  }
  return "unknown";
}

function formatAssetType(assetType: CompanionAssetManifestEntry["assetType"]): string {
  switch (assetType) {
    case "vrm":
      return "VRM";
    case "fbx":
      return "FBX";
    case "live2d":
      return "Live2D";
    default:
      return "Asset";
  }
}

function formatCapabilityTitle(capability: CompanionPermissionCapability): string {
  switch (capability) {
    case "mic":
      return "Microphone";
    case "camera":
      return "Camera";
    case "screen":
      return "Screen";
    case "tab-follow":
      return "Tab follow";
    default:
      return capability;
  }
}

function formatPermissionState(
  state: CompanionRuntimeState["permissions"][CompanionPermissionCapability],
): string {
  if (state.decision === "granted") {
    return state.source === "helper" ? "Allowed by helper" : "Allowed";
  }
  return "Blocked";
}

function trimText(value: string | null | undefined, maxChars = 120): string {
  if (!value) {
    return "";
  }
  return value.length > maxChars ? `${value.slice(0, maxChars - 1)}...` : value;
}

function readOnboardingSeen(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // Ignore storage errors in restricted Electron sessions.
  }
}

function showToast(target: HTMLElement, message: string, tone: ToastTone = "info"): void {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.tone = tone;
  toast.textContent = message;
  target.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, TOAST_DURATION_MS);
}

function toConcreteAvatarType(type: AvatarType): ConcreteAvatarType {
  return type === "auto" ? "vrm" : type;
}

function shouldAutoExpandPanel(params: {
  onboardingSeen: boolean;
  activeAssetId: string | null;
  assetCount: number;
}): boolean {
  if (!params.onboardingSeen) {
    return true;
  }
  return params.activeAssetId === null || params.assetCount === 0;
}

function toAvatarTypeFromAsset(
  assetType: CompanionAssetManifestEntry["assetType"],
  filePath?: string,
): ConcreteAvatarType {
  if (assetType === "vrm" || assetType === "fbx" || assetType === "live2d") {
    return assetType;
  }
  return toConcreteAvatarType(filePath ? inferAvatarType(filePath) : "vrm");
}

function createNoopAvatarController(avatarType: ConcreteAvatarType): IAvatarController {
  return {
    avatarType,
    init: async () => {},
    reloadModel: async () => {},
    playMotion: () => {},
    playExpression: () => {},
    setLipSyncValue: () => {},
    lookAt: () => {},
    destroy: () => {},
  };
}

function formatUpdatedAt(timestamp: number | null): string {
  if (!timestamp) {
    return "No updates yet";
  }
  return new Date(timestamp).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createInfoRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "info-row";

  const labelEl = document.createElement("div");
  labelEl.className = "info-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("div");
  valueEl.className = "info-value";
  valueEl.textContent = value;

  row.append(labelEl, valueEl);
  return row;
}

function resolvePermissionDialog(
  capability: CompanionPermissionCapability,
): PermissionDialogConfig {
  switch (capability) {
    case "mic":
      return {
        capability,
        title: "Allow microphone",
        message:
          "Microphone access stays local and feeds the local whisper pipeline only while you explicitly keep listening enabled.",
      };
    case "camera":
      return {
        capability,
        title: "Allow camera",
        message:
          "Camera access stays local and only captures frames when this overlay explicitly requests them.",
      };
    case "screen":
      return {
        capability,
        title: "Allow screen capture",
        message:
          "Screen capture stores only the screenshot you explicitly trigger from this local overlay.",
      };
    case "tab-follow":
      return {
        capability,
        title: "Allow browser follow",
        message:
          "Browser follow only reflects the helper tab you explicitly attached. Global scraping remains disabled.",
      };
    default:
      return {
        capability,
        title: "Allow capability",
        message: "This capability remains local-only and can be revoked at any time.",
      };
  }
}

async function main(): Promise<void> {
  const companionConfig = (await window.companionBridge.getConfig()) as CompanionRendererConfig;
  const configuredAvatarType = (companionConfig.avatarType as AvatarType | undefined) ?? "auto";
  const importMode =
    companionConfig.assetPolicy?.importMode === "local-copy" ? "local-copy" : "local-reference";

  const container = requireElement<HTMLDivElement>("canvas-container");
  const companionDock = requireElement<HTMLElement>("companion-dock");
  const dockAvatarName = requireElement<HTMLDivElement>("dock-avatar-name");
  const dockVoiceStatus = requireElement<HTMLSpanElement>("dock-voice-status");
  const dockMicToggle = requireElement<HTMLButtonElement>("dock-mic-toggle");
  const dockPanelToggle = requireElement<HTMLButtonElement>("dock-panel-toggle");
  const panel = requireElement<HTMLElement>("companion-panel");
  const panelClose = requireElement<HTMLButtonElement>("panel-close");
  const safetyRuntimeBadge = requireElement<HTMLSpanElement>("safety-runtime-badge");
  const permissionChipList = requireElement<HTMLDivElement>("permission-chip-list");
  const panelMicToggle = requireElement<HTMLButtonElement>("panel-mic-toggle");
  const panelCameraToggle = requireElement<HTMLButtonElement>("panel-camera-toggle");
  const panelScreenCapture = requireElement<HTMLButtonElement>("panel-screen-capture");
  const setupProgress = requireElement<HTMLDivElement>("setup-progress");
  const setupChecklist = requireElement<HTMLOListElement>("setup-checklist");
  const profileStatusBadge = requireElement<HTMLSpanElement>("profile-status-badge");
  const profileDisplayName = requireElement<HTMLInputElement>("profile-display-name");
  const profileMood = requireElement<HTMLInputElement>("profile-mood");
  const profileGreeting = requireElement<HTMLInputElement>("profile-greeting");
  const profileVoice = requireElement<HTMLInputElement>("profile-voice");
  const profileCharacterPrompt = requireElement<HTMLTextAreaElement>("profile-character-prompt");
  const profileRelationshipLevel = requireElement<HTMLInputElement>("profile-relationship-level");
  const profileRelationshipValue = requireElement<HTMLDivElement>("profile-relationship-value");
  const profileRelationshipLabel = requireElement<HTMLInputElement>("profile-relationship-label");
  const profileSave = requireElement<HTMLButtonElement>("profile-save");
  const profileReset = requireElement<HTMLButtonElement>("profile-reset");
  const browserFollowStatus = requireElement<HTMLDivElement>("browser-follow-status");
  const avatarActionIdle = requireElement<HTMLButtonElement>("avatar-action-idle");
  const avatarActionHappy = requireElement<HTMLButtonElement>("avatar-action-happy");
  const avatarActionSurprised = requireElement<HTMLButtonElement>("avatar-action-surprised");
  const avatarActionLookLeft = requireElement<HTMLButtonElement>("avatar-action-look-left");
  const avatarActionLookCenter = requireElement<HTMLButtonElement>("avatar-action-look-center");
  const avatarActionLookRight = requireElement<HTMLButtonElement>("avatar-action-look-right");
  const avatarActionDemoSpeak = requireElement<HTMLButtonElement>("avatar-action-demo-speak");
  const assetLibraryBadge = requireElement<HTMLSpanElement>("asset-library-badge");
  const assetLibrary = requireElement<HTMLDivElement>("asset-library");
  const importVrmButton = requireElement<HTMLButtonElement>("import-vrm");
  const importFbxButton = requireElement<HTMLButtonElement>("import-fbx");
  const importLive2dButton = requireElement<HTMLButtonElement>("import-live2d");
  const cameraPreview = requireElement<HTMLVideoElement>("camera-preview");
  const cameraCanvas = requireElement<HTMLCanvasElement>("camera-canvas");
  const cameraPreviewBadge = requireElement<HTMLSpanElement>("camera-preview-badge");
  const cameraStatusCopy = requireElement<HTMLDivElement>("camera-status-copy");
  const cameraPreviewEmpty = requireElement<HTMLDivElement>("camera-preview-empty");
  const toastRegion = requireElement<HTMLDivElement>("toast-region");
  const dialogBackdrop = requireElement<HTMLDivElement>("dialog-backdrop");
  const dialogTitle = requireElement<HTMLHeadingElement>("dialog-title");
  const dialogMessage = requireElement<HTMLParagraphElement>("dialog-message");
  const dialogFileLine = requireElement<HTMLDivElement>("dialog-file-line");
  const dialogLicenseField = requireElement<HTMLDivElement>("dialog-license-field");
  const dialogLicenseInput = requireElement<HTMLTextAreaElement>("dialog-license-input");
  const dialogRightsRow = requireElement<HTMLLabelElement>("dialog-rights-row");
  const dialogRightsCheckbox = requireElement<HTMLInputElement>("dialog-rights-checkbox");
  const dialogCancel = requireElement<HTMLButtonElement>("dialog-cancel");
  const dialogConfirm = requireElement<HTMLButtonElement>("dialog-confirm");

  const camera = new CameraHandler(cameraPreview, cameraCanvas);
  let runtimeState = await window.companionBridge.getStateSnapshot();
  let assets = await window.companionBridge.listAssets();
  const discoveredModel =
    runtimeState.activeAsset?.resolvedPath ?? (await window.companionBridge.discoverModel());
  let uiState = createCompanionUiState({
    onboardingSeen: readOnboardingSeen(),
    autoExpanded: shouldAutoExpandPanel({
      onboardingSeen: readOnboardingSeen(),
      activeAssetId: runtimeState.activeAssetId,
      assetCount: assets.length,
    }),
    selectedAssetId: runtimeState.activeAssetId,
  });
  let assetDialogDraft: AssetImportDialogDraft = {
    licenseMemo: "",
    rightsAcknowledged: false,
  };
  let profileDraft: CompanionProfileDraft = createCompanionProfileDraft(runtimeState.profile);
  let profileDirty = false;
  let profileSaving = false;
  let pendingDialogResolver: PendingDialogResolver | null = null;

  const initialAvatarType = toConcreteAvatarType(
    discoveredModel ? inferAvatarType(discoveredModel) : configuredAvatarType,
  );

  let avatar = await initializeAvatar(initialAvatarType);
  const lipSyncConfig: LipSyncConfig = {
    voicevoxUrl: companionConfig.voicevoxUrl,
    voicevoxSpeaker: companionConfig.voicevoxSpeaker,
    webSpeechLang: companionConfig.webSpeechLang,
    webSpeechRate: companionConfig.webSpeechRate,
    webSpeechPitch: companionConfig.webSpeechPitch,
    ttsProvider: runtimeState.ttsProvider,
  };
  let lipSync = new LipSyncController(avatar, lipSyncConfig);
  lipSync.ttsProvider = runtimeState.ttsProvider;

  let currentModelName =
    runtimeState.activeAsset?.fileName ??
    (discoveredModel ? basename(discoveredModel) : "No avatar selected");
  let loadedAssetPath: string | null = null;
  let interactiveRegionPublishQueued = false;

  if (!uiState.onboardingSeen && uiState.panelExpanded) {
    uiState = reduceCompanionUiState(uiState, { type: "onboarding/mark-seen" });
    persistOnboardingSeen();
  }

  if (runtimeState.activeAsset?.resolvedPath) {
    await syncActiveAsset();
  } else if (discoveredModel) {
    await syncDiscoveredModel(discoveredModel);
  }

  function updateUiState(action: Parameters<typeof reduceCompanionUiState>[1]): void {
    uiState = reduceCompanionUiState(uiState, action);
  }

  async function initializeAvatar(type: ConcreteAvatarType): Promise<IAvatarController> {
    container.replaceChildren();
    try {
      const nextAvatar = await createAvatarController(type);
      await nextAvatar.init(container);
      return nextAvatar;
    } catch (error) {
      console.error("[Companion] avatar init failed:", error);
      showToast(toastRegion, "Avatar renderer failed to initialize.", "danger");
      return createNoopAvatarController(type);
    }
  }

  async function switchAvatar(params: {
    filePath: string;
    assetType?: CompanionAssetManifestEntry["assetType"];
    label?: string;
  }): Promise<void> {
    const nextAvatarType = toAvatarTypeFromAsset(params.assetType ?? "unknown", params.filePath);
    if (avatar.avatarType !== nextAvatarType) {
      avatar.destroy();
      avatar = await initializeAvatar(nextAvatarType);
      lipSync = new LipSyncController(avatar, lipSyncConfig);
      lipSync.ttsProvider = runtimeState.ttsProvider;
    }

    await avatar.reloadModel(params.filePath);
    currentModelName = params.label ?? basename(params.filePath);
    loadedAssetPath = params.filePath;
    render();
  }

  async function syncActiveAsset(): Promise<void> {
    const activeAsset = runtimeState.activeAsset;
    if (!activeAsset) {
      return;
    }
    if (loadedAssetPath === activeAsset.resolvedPath) {
      currentModelName = activeAsset.fileName;
      render();
      return;
    }

    try {
      await switchAvatar({
        filePath: activeAsset.resolvedPath,
        assetType: activeAsset.assetType,
        label: activeAsset.fileName,
      });
    } catch (error) {
      console.error("[Companion] failed to activate asset", error);
      showToast(toastRegion, `Failed to load ${activeAsset.fileName}.`, "danger");
    }
  }

  async function syncDiscoveredModel(modelPath: string): Promise<void> {
    if (loadedAssetPath === modelPath) {
      currentModelName = basename(modelPath);
      render();
      return;
    }
    try {
      await switchAvatar({
        filePath: modelPath,
        assetType: inferAssetTypeFromPath(modelPath),
        label: basename(modelPath),
      });
    } catch (error) {
      console.error("[Companion] failed to load discovered avatar", error);
      showToast(toastRegion, `Failed to load ${basename(modelPath)}.`, "danger");
    }
  }

  async function refreshAssets(params?: { activeAssetId?: string | null }): Promise<void> {
    assets = await window.companionBridge.listAssets();
    if (params?.activeAssetId !== undefined) {
      updateUiState({ type: "asset/select", assetId: params.activeAssetId });
    } else if (
      uiState.selectedAssetId &&
      !assets.some((asset) => asset.id === uiState.selectedAssetId)
    ) {
      updateUiState({ type: "asset/select", assetId: runtimeState.activeAssetId });
    }
    render();
  }

  function renderPermissions(): void {
    permissionChipList.replaceChildren();

    for (const capability of PERMISSION_CAPABILITIES) {
      const state = runtimeState.permissions[capability];
      const chip = document.createElement("div");
      chip.className = "permission-chip";

      const label = document.createElement("div");
      label.className = "permission-chip-label";

      const title = document.createElement("div");
      title.className = "permission-chip-title";
      title.textContent = formatCapabilityTitle(capability);

      const subtitle = document.createElement("div");
      subtitle.className = "permission-chip-state";
      subtitle.textContent = formatPermissionState(state);

      label.append(title, subtitle);

      const button = document.createElement("button");
      button.textContent = state.decision === "granted" ? "Block" : "Allow";
      button.classList.toggle("is-enabled", state.decision === "granted");
      button.addEventListener("click", () => {
        void togglePermissionFromChip(capability);
      });

      chip.append(label, button);
      permissionChipList.appendChild(chip);
    }
  }

  function renderChecklist(): void {
    const checklist = buildSetupChecklist({ runtimeState, assets });
    const completeCount = checklist.filter((item) => item.complete).length;

    setupProgress.replaceChildren();

    const copy = document.createElement("div");
    copy.className = "progress-copy";
    const strong = document.createElement("strong");
    strong.textContent = "Creator-safe setup";
    const span = document.createElement("span");
    span.textContent =
      completeCount === checklist.length
        ? "The essentials are ready. Optional items remain available below."
        : "Finish the required items first, then add optional capabilities when needed.";
    copy.append(strong, span);

    const pill = document.createElement("div");
    pill.className = "progress-pill";
    pill.textContent = `${completeCount} / ${checklist.length} complete`;

    setupProgress.append(copy, pill);

    setupChecklist.replaceChildren();
    for (const item of checklist) {
      const li = document.createElement("li");
      li.className = "checklist-item";

      const indicator = document.createElement("div");
      indicator.className = "check-indicator";
      indicator.classList.toggle("is-complete", item.complete);
      indicator.classList.toggle("is-optional", item.optional && !item.complete);
      indicator.textContent = item.complete ? "OK" : item.optional ? "OP" : "--";

      const text = document.createElement("div");
      text.className = "check-text";

      const title = document.createElement("strong");
      title.textContent = item.title;
      if (item.optional) {
        const tag = document.createElement("span");
        tag.className = "check-tag";
        tag.textContent = "Optional";
        title.appendChild(tag);
      }

      const description = document.createElement("span");
      description.textContent = item.description;

      text.append(title, description);
      li.append(indicator, text);
      setupChecklist.appendChild(li);
    }
  }

  function renderProfileEditor(): void {
    profileDisplayName.value = profileDraft.displayName;
    profileMood.value = profileDraft.mood;
    profileGreeting.value = profileDraft.greeting;
    profileVoice.value = profileDraft.voiceProfile;
    profileCharacterPrompt.value = profileDraft.characterPrompt;
    profileRelationshipLevel.value = String(profileDraft.relationshipLevel);
    profileRelationshipValue.textContent = `${profileDraft.relationshipLevel} / 100`;
    profileRelationshipLabel.value = profileDraft.relationshipLabel;

    profileStatusBadge.textContent = profileSaving ? "Saving" : profileDirty ? "Unsaved" : "Saved";
    profileStatusBadge.className = `badge ${profileDirty || profileSaving ? "badge--accent" : "badge--muted"}`;
    profileSave.disabled = profileSaving || !profileDirty;
    profileReset.disabled = profileSaving || !profileDirty;
  }

  function renderBrowserCard(): void {
    browserFollowStatus.replaceChildren();
    const permission = runtimeState.permissions["tab-follow"];
    const browser = runtimeState.browser;

    const statusSummary =
      permission.decision === "granted"
        ? browser.attached
          ? "Attached to the selected helper tab."
          : "Waiting for an attached helper tab."
        : "Blocked until tab follow is explicitly allowed.";
    browserFollowStatus.appendChild(createInfoRow("Status", statusSummary));

    if (browser.attached) {
      browserFollowStatus.appendChild(
        createInfoRow("Tab", trimText(browser.title || browser.url || "Attached tab", 80)),
      );
      if (browser.url) {
        browserFollowStatus.appendChild(createInfoRow("URL", trimText(browser.url, 96)));
      }
      if (browser.textSnapshot) {
        browserFollowStatus.appendChild(
          createInfoRow("Visible text snapshot", trimText(browser.textSnapshot, 180)),
        );
      }
      browserFollowStatus.appendChild(createInfoRow("Updated", formatUpdatedAt(browser.updatedAt)));
    } else {
      browserFollowStatus.appendChild(
        createInfoRow(
          "Helper",
          companionConfig.browserHelper?.enabled === false
            ? "Disabled in config."
            : "No helper tab attached yet.",
        ),
      );
    }
  }

  function renderAssets(): void {
    const rows = buildAssetLibraryView(assets, runtimeState.activeAssetId);
    assetLibraryBadge.textContent = `${rows.length} asset${rows.length === 1 ? "" : "s"}`;
    assetLibrary.replaceChildren();

    if (rows.length === 0) {
      assetLibrary.appendChild(
        createInfoRow("Library", "No avatars imported yet. Start with VRM or FBX."),
      );
      return;
    }

    for (const asset of rows) {
      const row = document.createElement("div");
      row.className = "asset-row";
      row.classList.toggle("is-active", asset.isActive);
      row.classList.toggle("is-selected", uiState.selectedAssetId === asset.id);
      row.addEventListener("click", () => {
        updateUiState({ type: "asset/select", assetId: asset.id });
        render();
      });

      const meta = document.createElement("div");
      const title = document.createElement("div");
      title.className = "asset-title";
      title.textContent = asset.fileName;

      const type = document.createElement("span");
      type.className = "asset-type";
      type.textContent = formatAssetType(asset.assetType);
      title.appendChild(type);

      const copy = document.createElement("div");
      copy.className = "asset-copy";
      copy.textContent = `${asset.importMode === "local-copy" ? "Local copy" : "Local reference"} | ${asset.rightsAcknowledged ? "Rights confirmed" : "Rights pending"} | ${trimText(asset.licenseMemo || "No memo", 96)}`;

      meta.append(title, copy);

      const controls = document.createElement("div");
      controls.className = "asset-controls";

      const pathLabel = document.createElement("div");
      pathLabel.className = "info-label";
      pathLabel.textContent = trimText(asset.sourcePath, 42);

      const activate = document.createElement("button");
      activate.className = "ghost-button";
      activate.textContent = asset.isActive ? "Active" : "Activate";
      activate.disabled = asset.isActive;
      activate.addEventListener("click", (event) => {
        event.stopPropagation();
        void activateAsset(asset.id);
      });

      controls.append(pathLabel, activate);
      row.append(meta, controls);
      assetLibrary.appendChild(row);
    }
  }

  function renderCameraCard(): void {
    const permission = runtimeState.permissions.camera;
    const live = camera.active;
    cameraPreview.classList.toggle("is-live", live);
    cameraPreviewEmpty.hidden = live;
    cameraPreviewBadge.textContent = live ? "Camera live" : "Camera idle";
    cameraPreviewBadge.classList.toggle("badge--success", live);
    cameraPreviewBadge.classList.toggle("badge--muted", !live);

    if (live) {
      cameraStatusCopy.textContent =
        "Local camera preview is live. Frames only leave the preview when this overlay explicitly requests them.";
    } else if (permission.decision === "granted") {
      cameraStatusCopy.textContent =
        "Camera access is allowed, but the local preview remains off until you start it.";
    } else {
      cameraStatusCopy.textContent = "Camera access is off until you explicitly allow it.";
    }
  }

  function renderDock(): void {
    const activeName = runtimeState.activeAsset?.fileName ?? currentModelName;
    const profileName = runtimeState.profile.displayName.trim() || "OpenClaw Companion";
    const mood = runtimeState.profile.mood.trim() || "neutral";
    const assetSuffix = activeName && activeName !== "No avatar selected" ? ` | ${activeName}` : "";
    dockAvatarName.textContent = `${profileName} | ${mood}${assetSuffix}`;

    const voiceStatus = runtimeState.voice.speaking
      ? "Speaking"
      : runtimeState.voice.micActive
        ? "Mic listening"
        : runtimeState.voice.sttAvailable
          ? "Mic off"
          : "Mic unavailable";
    dockVoiceStatus.textContent = voiceStatus;
    dockVoiceStatus.className = `badge ${runtimeState.voice.micActive || runtimeState.voice.speaking ? "badge--success" : "badge--muted"}`;

    dockMicToggle.classList.toggle("is-active", runtimeState.voice.micActive);
    dockMicToggle.disabled = !runtimeState.voice.sttAvailable && !runtimeState.voice.micActive;
    dockMicToggle.textContent = runtimeState.voice.micActive ? "Mute" : "Mic";
    dockPanelToggle.textContent = uiState.panelExpanded ? "Hide panel" : "Open setup";
  }

  function renderPanel(): void {
    panel.classList.toggle("is-open", uiState.panelExpanded);
    panel.setAttribute("aria-hidden", String(!uiState.panelExpanded));

    const micGranted = runtimeState.permissions.mic.decision === "granted";
    const cameraGranted = runtimeState.permissions.camera.decision === "granted";

    safetyRuntimeBadge.textContent = `Strict local | ${runtimeState.voice.sttBackend} + ${runtimeState.voice.ttsBackend}`;
    panelMicToggle.textContent = runtimeState.voice.micActive ? "Stop mic" : "Start mic";
    panelMicToggle.disabled = !runtimeState.voice.sttAvailable && !runtimeState.voice.micActive;
    panelCameraToggle.textContent = camera.active ? "Stop camera" : "Start camera";
    panelScreenCapture.textContent =
      runtimeState.permissions.screen.decision === "granted" ? "Capture screen" : "Allow + capture";

    dockMicToggle.title = micGranted
      ? runtimeState.voice.micActive
        ? "Stop local microphone"
        : "Start local microphone"
      : "Allow microphone";
    panelCameraToggle.title = cameraGranted
      ? camera.active
        ? "Stop local camera preview"
        : "Start local camera preview"
      : "Allow camera";
  }

  function renderDialog(): void {
    const dialog = uiState.activeDialog;
    dialogBackdrop.classList.toggle("is-open", dialog !== null);
    dialogBackdrop.setAttribute("aria-hidden", String(dialog === null));

    if (!dialog) {
      dialogFileLine.textContent = "";
      return;
    }

    if (dialog.kind === "permission") {
      dialogTitle.textContent = dialog.title;
      dialogMessage.textContent = dialog.message;
      dialogFileLine.textContent = "";
      dialogLicenseField.hidden = true;
      dialogRightsRow.hidden = true;
      dialogCancel.textContent = "Not now";
      dialogConfirm.textContent = "Allow";
      dialogConfirm.disabled = false;
      return;
    }

    dialogTitle.textContent = `Import ${formatAssetType(dialog.assetType)}`;
    dialogMessage.textContent =
      "Confirm creator rights before this asset enters the local-only companion library.";
    dialogFileLine.textContent = dialog.filePath;
    dialogLicenseField.hidden = false;
    dialogRightsRow.hidden = false;
    dialogLicenseInput.value = assetDialogDraft.licenseMemo;
    dialogRightsCheckbox.checked = assetDialogDraft.rightsAcknowledged;
    dialogCancel.textContent = "Cancel";
    dialogConfirm.textContent = "Import asset";
    dialogConfirm.disabled = !assetDialogDraft.rightsAcknowledged;
  }

  function render(): void {
    renderDock();
    renderPanel();
    renderPermissions();
    renderChecklist();
    renderProfileEditor();
    renderBrowserCard();
    renderAssets();
    renderCameraCard();
    renderDialog();
    queueInteractiveRegionPublish();
  }

  function collectInteractiveRegions(): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const candidates = [
      companionDock,
      uiState.panelExpanded ? panel : null,
      uiState.activeDialog ? dialogBackdrop : null,
    ];

    return candidates.flatMap((element) => {
      if (!element || element.hidden) {
        return [];
      }
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return [];
      }
      return [
        {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      ];
    });
  }

  function queueInteractiveRegionPublish(): void {
    if (interactiveRegionPublishQueued) {
      return;
    }
    interactiveRegionPublishQueued = true;
    requestAnimationFrame(() => {
      interactiveRegionPublishQueued = false;
      window.companionBridge.notifyInteractiveRegions(collectInteractiveRegions());
    });
  }

  function closeDialogWithResult(kind: "cancel" | "confirm"): void {
    const pending = pendingDialogResolver;
    const dialog = uiState.activeDialog;
    pendingDialogResolver = null;
    updateUiState({ type: "dialog/close" });
    render();

    if (!pending || !dialog) {
      return;
    }

    if (pending.kind === "permission") {
      pending.resolve(kind === "confirm");
      return;
    }

    pending.resolve(
      kind === "confirm"
        ? {
            licenseMemo: assetDialogDraft.licenseMemo.trim(),
          }
        : null,
    );
  }

  function openPermissionDialog(config: PermissionDialogConfig): Promise<boolean> {
    if (pendingDialogResolver) {
      closeDialogWithResult("cancel");
    }

    updateUiState({
      type: "dialog/open",
      dialog: {
        kind: "permission",
        capability: config.capability,
        title: config.title,
        message: config.message,
      },
    });
    render();

    return new Promise<boolean>((resolve) => {
      pendingDialogResolver = { kind: "permission", resolve };
    });
  }

  function openAssetImportDialog(
    dialog: AssetImportDialogState,
  ): Promise<AssetImportDialogResult | null> {
    if (pendingDialogResolver) {
      closeDialogWithResult("cancel");
    }

    assetDialogDraft = {
      licenseMemo: dialog.defaultLicenseMemo,
      rightsAcknowledged: false,
    };
    updateUiState({ type: "dialog/open", dialog });
    render();

    return new Promise<AssetImportDialogResult | null>((resolve) => {
      pendingDialogResolver = { kind: "asset-import", resolve };
    });
  }

  async function requestPermission(capability: CompanionPermissionCapability): Promise<boolean> {
    if (runtimeState.permissions[capability].decision === "granted") {
      return true;
    }

    const allowed = await openPermissionDialog(resolvePermissionDialog(capability));
    if (!allowed) {
      return false;
    }

    runtimeState = await window.companionBridge.setPermission(capability, "granted");
    render();
    showToast(toastRegion, `${formatCapabilityTitle(capability)} allowed locally.`, "success");
    return true;
  }

  async function togglePermissionFromChip(
    capability: CompanionPermissionCapability,
  ): Promise<void> {
    const state = runtimeState.permissions[capability];
    if (state.decision === "granted") {
      runtimeState = await window.companionBridge.setPermission(capability, "denied");
      if (capability === "mic" && runtimeState.voice.micActive) {
        await window.companionBridge.stopStt();
      }
      if (capability === "camera" && camera.active) {
        camera.stop();
      }
      render();
      showToast(toastRegion, `${formatCapabilityTitle(capability)} blocked.`, "warning");
      return;
    }

    await requestPermission(capability);
  }

  function updateProfileDraft(patch: Partial<CompanionProfileDraft>): void {
    profileDraft = {
      ...profileDraft,
      ...patch,
    };
    profileDirty = true;
    render();
  }

  async function saveProfileDraft(): Promise<void> {
    if (!profileDirty || profileSaving) {
      return;
    }
    profileSaving = true;
    render();
    try {
      const profile = await window.companionBridge.updateProfile(
        buildCompanionProfilePatch(profileDraft),
      );
      runtimeState = {
        ...runtimeState,
        profile,
      };
      profileDraft = createCompanionProfileDraft(profile);
      profileDirty = false;
      showToast(toastRegion, "Character profile saved locally.", "success");
    } catch (error) {
      console.error("[Companion] profile save failed", error);
      showToast(toastRegion, "Character profile save failed.", "danger");
    } finally {
      profileSaving = false;
      render();
    }
  }

  function resetProfileDraft(): void {
    profileDraft = createCompanionProfileDraft(runtimeState.profile);
    profileDirty = false;
    render();
  }

  async function toggleMicSession(): Promise<void> {
    if (runtimeState.voice.micActive) {
      const result = await window.companionBridge.stopStt();
      if (!result.ok) {
        showToast(toastRegion, result.reason ?? "Unable to stop microphone.", "danger");
        return;
      }
      showToast(toastRegion, "Microphone stopped.", "info");
      return;
    }

    const allowed = await requestPermission("mic");
    if (!allowed) {
      return;
    }

    const result = await window.companionBridge.startStt();
    if (!result.ok) {
      showToast(toastRegion, result.reason ?? "Unable to start microphone.", "danger");
      return;
    }
    showToast(toastRegion, "Microphone listening with local whisper.", "success");
  }

  async function toggleCameraSession(): Promise<void> {
    if (camera.active) {
      camera.stop();
      render();
      showToast(toastRegion, "Camera preview stopped.", "info");
      return;
    }

    const allowed = await requestPermission("camera");
    if (!allowed) {
      return;
    }

    const started = await camera.start();
    render();
    if (!started) {
      showToast(toastRegion, "Camera is unavailable on this device.", "danger");
      return;
    }
    showToast(toastRegion, "Camera preview started locally.", "success");
  }

  async function captureScreenNow(): Promise<void> {
    const allowed = await requestPermission("screen");
    if (!allowed) {
      return;
    }

    const result = await window.companionBridge.captureScreen();
    if (!result.ok) {
      showToast(toastRegion, result.error ?? "Screen capture failed.", "danger");
      return;
    }
    showToast(toastRegion, "Screen capture stored locally.", "success");
  }

  async function activateAsset(assetId: string): Promise<void> {
    runtimeState = await window.companionBridge.activateAsset(assetId);
    updateUiState({ type: "asset/select", assetId });
    await syncActiveAsset();
    await refreshAssets({ activeAssetId: assetId });
    showToast(
      toastRegion,
      `Activated ${runtimeState.activeAsset?.fileName ?? "asset"}.`,
      "success",
    );
  }

  async function importAssetFromPath(filePath: string): Promise<void> {
    const assetType = inferAssetTypeFromPath(filePath);
    const dialogResult = await openAssetImportDialog({
      kind: "asset-import",
      filePath,
      assetType,
      fileName: basename(filePath),
      defaultLicenseMemo: `Source: ${basename(filePath)}`,
      importMode,
    });

    if (!dialogResult) {
      return;
    }

    try {
      const imported = await window.companionBridge.importAsset({
        filePath,
        licenseMemo: dialogResult.licenseMemo,
        rightsAcknowledged: true,
        importMode,
      });
      await refreshAssets({ activeAssetId: imported.id });
      runtimeState = await window.companionBridge.activateAsset(imported.id);
      await syncActiveAsset();
      showToast(toastRegion, `${imported.fileName} imported locally.`, "success");
    } catch (error) {
      console.error("[Companion] asset import failed", error);
      showToast(toastRegion, `Failed to import ${basename(filePath)}.`, "danger");
    }
  }

  async function openAssetPicker(assetType: ConcreteAvatarType): Promise<void> {
    const filters =
      assetType === "vrm"
        ? [{ name: "VRM Avatar", extensions: ["vrm"] }]
        : assetType === "fbx"
          ? [{ name: "FBX Avatar", extensions: ["fbx"] }]
          : [{ name: "Live2D Model", extensions: ["model3.json", "model.json"] }];
    const title =
      assetType === "vrm"
        ? "Import VRM avatar"
        : assetType === "fbx"
          ? "Import FBX avatar"
          : "Import Live2D model";
    const result = await window.companionBridge.openFileDialog({ filters, title });
    if (!result.ok || result.canceled || !result.filePath) {
      return;
    }
    await importAssetFromPath(result.filePath);
  }

  function reportAvatarActivity(update: CompanionAvatarStateUpdate): void {
    window.companionBridge.sendStateUpdate({
      avatar: {
        ...update,
        lastUpdatedAt: Date.now(),
      },
    });
  }

  async function speakWithEmotion(
    text: string,
    emotion?: CompanionEmotionEvent["emotion"],
  ): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const resolvedEmotion = emotion ?? detectEmotion(trimmed);
    const emotionProfile = applyEmotion(avatar, resolvedEmotion);
    reportAvatarActivity(
      buildAvatarSpeechState({
        avatarType: avatar.avatarType,
        emotion: resolvedEmotion,
        emotionProfile,
      }),
    );
    lipSync.ttsProvider = runtimeState.ttsProvider;
    showToast(toastRegion, trimText(trimmed, 72), "info");
    await lipSync.speak(trimmed, emotionProfile);
  }

  function cueAvatarExpression(emotion: CompanionEmotionEvent["emotion"]): void {
    const emotionProfile = applyEmotion(avatar, emotion);
    reportAvatarActivity({
      lastAction: "emotion",
      lastEmotion: emotion,
      ...buildAvatarEmotionState({ avatarType: avatar.avatarType, emotionProfile }),
    });
    showToast(toastRegion, `Avatar emotion: ${emotion}`, "info");
  }

  function cueAvatarLook(x: number): void {
    avatar.lookAt(x, 0);
    reportAvatarActivity({
      lastAction: "look_at",
      lastLookAt: { x, y: 0 },
    });
  }

  function cueAvatarIdle(): void {
    avatar.playMotion("Idle", 0, true);
    reportAvatarActivity({
      lastAction: "motion",
      lastMotion: "Idle",
      lastMotionIndex: 0,
    });
    showToast(toastRegion, "Avatar idle motion queued.", "info");
  }

  async function handleAvatarCommand(cmd: AvatarCommand): Promise<void> {
    if (cmd.ttsProvider === "voicevox" || cmd.ttsProvider === "web-speech") {
      runtimeState = {
        ...runtimeState,
        ttsProvider: cmd.ttsProvider,
      };
      lipSync.ttsProvider = runtimeState.ttsProvider;
      render();
    }

    if (cmd.loadModel) {
      try {
        await switchAvatar({
          filePath: cmd.loadModel,
          assetType: inferAssetTypeFromPath(cmd.loadModel),
        });
        reportAvatarActivity({
          lastAction: "load_model",
        });
      } catch (error) {
        console.error("[Companion] command load failed", error);
        showToast(toastRegion, `Failed to load ${basename(cmd.loadModel)}.`, "danger");
      }
    }

    if (cmd.expression) {
      const expression = cmd.expression.trim();
      if (isEmotionType(expression)) {
        const emotionProfile = applyEmotion(avatar, expression);
        reportAvatarActivity({
          lastAction: "emotion",
          lastEmotion: expression,
          ...buildAvatarEmotionState({ avatarType: avatar.avatarType, emotionProfile }),
        });
      } else if (expression) {
        avatar.playExpression(expression);
        reportAvatarActivity({
          lastAction: "expression",
          lastExpression: expression,
        });
      }
    }

    if (cmd.motion) {
      avatar.playMotion(cmd.motion, cmd.motionIndex);
      reportAvatarActivity({
        lastAction: "motion",
        lastMotion: cmd.motion,
        lastMotionIndex: cmd.motionIndex ?? null,
      });
    }

    if (cmd.gesture) {
      avatar.playMotion(cmd.gesture, cmd.motionIndex);
      reportAvatarActivity({
        lastAction: "gesture",
        lastMotion: cmd.gesture,
        lastMotionIndex: cmd.motionIndex ?? null,
      });
    }

    if (cmd.pose) {
      avatar.applyPose?.(cmd.pose);
      reportAvatarActivity({
        lastAction: "pose",
      });
    }

    if (cmd.lookAt) {
      avatar.lookAt(cmd.lookAt.x, cmd.lookAt.y);
      reportAvatarActivity({
        lastAction: "look_at",
        lastLookAt: cmd.lookAt,
      });
    }

    if (cmd.speakText) {
      const speakEmotion = cmd.speakEmotion ?? "";
      await speakWithEmotion(cmd.speakText, isEmotionType(speakEmotion) ? speakEmotion : undefined);
    }
  }

  function setDragActive(active: boolean): void {
    document.body.classList.toggle("drag-active", active);
  }

  function hasModelFile(event: DragEvent): boolean {
    const files = Array.from(event.dataTransfer?.files ?? []);
    return files.some(
      (file) =>
        file.name.toLowerCase().endsWith(".vrm") ||
        file.name.toLowerCase().endsWith(".fbx") ||
        file.name.toLowerCase().endsWith(".model3.json") ||
        file.name.toLowerCase().endsWith(".model.json"),
    );
  }

  render();

  dockPanelToggle.addEventListener("click", () => {
    if (uiState.panelExpanded) {
      updateUiState({ type: "panel/collapse" });
      persistOnboardingSeen();
    } else {
      updateUiState({ type: "panel/expand" });
    }
    render();
  });

  panelClose.addEventListener("click", () => {
    updateUiState({ type: "panel/collapse" });
    persistOnboardingSeen();
    render();
  });

  dockMicToggle.addEventListener("click", () => {
    void toggleMicSession();
  });
  panelMicToggle.addEventListener("click", () => {
    void toggleMicSession();
  });
  panelCameraToggle.addEventListener("click", () => {
    void toggleCameraSession();
  });
  panelScreenCapture.addEventListener("click", () => {
    void captureScreenNow();
  });
  avatarActionIdle.addEventListener("click", () => {
    cueAvatarIdle();
  });
  avatarActionHappy.addEventListener("click", () => {
    cueAvatarExpression("happy");
  });
  avatarActionSurprised.addEventListener("click", () => {
    cueAvatarExpression("surprised");
  });
  avatarActionLookLeft.addEventListener("click", () => {
    cueAvatarLook(-0.8);
  });
  avatarActionLookCenter.addEventListener("click", () => {
    cueAvatarLook(0);
  });
  avatarActionLookRight.addEventListener("click", () => {
    cueAvatarLook(0.8);
  });
  avatarActionDemoSpeak.addEventListener("click", () => {
    void speakWithEmotion("こんにちは。ローカル companion の動作確認中です。", "happy");
  });
  importVrmButton.addEventListener("click", () => {
    void openAssetPicker("vrm");
  });
  importFbxButton.addEventListener("click", () => {
    void openAssetPicker("fbx");
  });
  importLive2dButton.addEventListener("click", () => {
    void openAssetPicker("live2d");
  });

  dialogCancel.addEventListener("click", () => {
    closeDialogWithResult("cancel");
  });
  dialogConfirm.addEventListener("click", () => {
    closeDialogWithResult("confirm");
  });
  dialogBackdrop.addEventListener("click", (event) => {
    if (event.target === dialogBackdrop) {
      closeDialogWithResult("cancel");
    }
  });
  dialogLicenseInput.addEventListener("input", () => {
    assetDialogDraft.licenseMemo = dialogLicenseInput.value;
  });
  dialogRightsCheckbox.addEventListener("change", () => {
    assetDialogDraft.rightsAcknowledged = dialogRightsCheckbox.checked;
    dialogConfirm.disabled = !assetDialogDraft.rightsAcknowledged;
  });

  profileDisplayName.addEventListener("input", () => {
    updateProfileDraft({ displayName: profileDisplayName.value });
  });
  profileMood.addEventListener("input", () => {
    updateProfileDraft({ mood: profileMood.value });
  });
  profileGreeting.addEventListener("input", () => {
    updateProfileDraft({ greeting: profileGreeting.value });
  });
  profileVoice.addEventListener("input", () => {
    updateProfileDraft({ voiceProfile: profileVoice.value });
  });
  profileCharacterPrompt.addEventListener("input", () => {
    updateProfileDraft({ characterPrompt: profileCharacterPrompt.value });
  });
  profileRelationshipLevel.addEventListener("input", () => {
    updateProfileDraft({ relationshipLevel: Number(profileRelationshipLevel.value) });
  });
  profileRelationshipLabel.addEventListener("input", () => {
    updateProfileDraft({ relationshipLabel: profileRelationshipLabel.value });
  });
  profileSave.addEventListener("click", () => {
    void saveProfileDraft();
  });
  profileReset.addEventListener("click", () => {
    resetProfileDraft();
  });

  document.addEventListener("dragenter", (event) => {
    if (hasModelFile(event)) {
      setDragActive(true);
    }
  });
  document.addEventListener("dragover", (event) => {
    if (!hasModelFile(event)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    setDragActive(true);
  });
  document.addEventListener("dragleave", (event) => {
    if (!(event.relatedTarget instanceof Node)) {
      setDragActive(false);
    }
  });
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = Array.from(event.dataTransfer?.files ?? []).find(
      (candidate) =>
        candidate.name.toLowerCase().endsWith(".vrm") ||
        candidate.name.toLowerCase().endsWith(".fbx") ||
        candidate.name.toLowerCase().endsWith(".model3.json") ||
        candidate.name.toLowerCase().endsWith(".model.json"),
    );
    if (!file) {
      return;
    }
    const filePath = (file as File & { path?: string }).path;
    if (!filePath) {
      showToast(toastRegion, "Drag a local file from the desktop companion host.", "warning");
      return;
    }
    void importAssetFromPath(filePath);
  });

  window.addEventListener("resize", () => {
    queueInteractiveRegionPublish();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (uiState.activeDialog) {
      closeDialogWithResult("cancel");
      return;
    }
    if (uiState.panelExpanded) {
      updateUiState({ type: "panel/collapse" });
      persistOnboardingSeen();
      render();
    }
  });

  window.companionBridge.onRuntimeState((state) => {
    const previousActiveAssetId = runtimeState.activeAssetId;
    runtimeState = state;
    if (!profileDirty) {
      profileDraft = createCompanionProfileDraft(runtimeState.profile);
    }
    lipSync.ttsProvider = runtimeState.ttsProvider;
    const activeAsset = runtimeState.activeAsset;

    if (runtimeState.activeAssetId !== previousActiveAssetId) {
      updateUiState({ type: "asset/select", assetId: runtimeState.activeAssetId });
      void syncActiveAsset();
    } else if (activeAsset && !assets.some((asset) => asset.id === activeAsset.id)) {
      void refreshAssets({ activeAssetId: runtimeState.activeAssetId });
    } else {
      render();
    }
  });

  window.companionBridge.onLineEvent((event: CompanionLineEvent) => {
    void speakWithEmotion(event.text);
  });

  window.companionBridge.onEmotionEvent((event: CompanionEmotionEvent) => {
    if (event.text) {
      void speakWithEmotion(event.text, event.emotion);
      return;
    }
    cueAvatarExpression(event.emotion);
  });

  window.companionBridge.onSpeakText((text: string) => {
    void speakWithEmotion(text);
  });

  window.companionBridge.onControlEvent((cmd: Record<string, unknown>) => {
    if (cmd.ttsProvider === "voicevox" || cmd.ttsProvider === "web-speech") {
      runtimeState = {
        ...runtimeState,
        ttsProvider: cmd.ttsProvider as TtsProvider,
      };
      lipSync.ttsProvider = runtimeState.ttsProvider;
      render();
    }
    if (cmd.avatarCommand) {
      void handleAvatarCommand(cmd.avatarCommand as AvatarCommand);
    }
  });

  window.companionBridge.onAvatarCommand((cmd: AvatarCommand) => {
    void handleAvatarCommand(cmd);
  });

  window.companionBridge.onCameraCaptureRequest(() => {
    const frame = camera.captureFrame();
    if (frame) {
      window.companionBridge.sendCameraFrame(frame);
    }
  });

  window.addEventListener("beforeunload", () => {
    camera.stop();
    avatar.destroy();
  });
}

void main().catch((error) => {
  console.error("[Companion] renderer failed to initialize", error);
});
