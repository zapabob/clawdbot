import companionConfig from "../companion.config.json" with { type: "json" };
import { createAvatarController, inferAvatarType } from "./avatar-factory.js";
import { applyEmotion, detectEmotion } from "./emotion-mapper.js";
import { LipSyncController } from "./lip-sync.js";
import { buildAssetLibraryView, buildSetupChecklist, createCompanionUiState, reduceCompanionUiState, } from "./ui-state.js";
const ONBOARDING_STORAGE_KEY = "desktop-companion:onboarding-seen:v1";
const TOAST_DURATION_MS = 3200;
const PERMISSION_CAPABILITIES = [
    "mic",
    "camera",
    "screen",
    "tab-follow",
];
class CameraHandler {
    videoEl;
    canvasEl;
    stream = null;
    active = false;
    constructor(videoEl, canvasEl) {
        this.videoEl = videoEl;
        this.canvasEl = canvasEl;
    }
    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            this.videoEl.srcObject = this.stream;
            this.active = true;
            return true;
        }
        catch (error) {
            console.warn("[Camera] start failed:", error);
            return false;
        }
    }
    stop() {
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.videoEl.srcObject = null;
        this.active = false;
    }
    captureFrame() {
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
function requireElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }
    return element;
}
function basename(filePath) {
    return filePath.split(/[/\\]/).pop() ?? filePath;
}
function inferAssetTypeFromPath(filePath) {
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
function formatAssetType(assetType) {
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
function formatCapabilityTitle(capability) {
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
function formatPermissionState(state) {
    if (state.decision === "granted") {
        return state.source === "helper" ? "Allowed by helper" : "Allowed";
    }
    return "Blocked";
}
function trimText(value, maxChars = 120) {
    if (!value) {
        return "";
    }
    return value.length > maxChars ? `${value.slice(0, maxChars - 1)}...` : value;
}
function readOnboardingSeen() {
    try {
        return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
    }
    catch {
        return false;
    }
}
function persistOnboardingSeen() {
    try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    }
    catch {
        // Ignore storage errors in restricted Electron sessions.
    }
}
function showToast(target, message, tone = "info") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.dataset.tone = tone;
    toast.textContent = message;
    target.appendChild(toast);
    window.setTimeout(() => {
        toast.remove();
    }, TOAST_DURATION_MS);
}
function toConcreteAvatarType(type) {
    return type === "auto" ? "vrm" : type;
}
function toAvatarTypeFromAsset(assetType, filePath) {
    if (assetType === "vrm" || assetType === "fbx" || assetType === "live2d") {
        return assetType;
    }
    return toConcreteAvatarType(filePath ? inferAvatarType(filePath) : "vrm");
}
function createNoopAvatarController(avatarType) {
    return {
        avatarType,
        init: async () => { },
        reloadModel: async () => { },
        playMotion: () => { },
        playExpression: () => { },
        setLipSyncValue: () => { },
        lookAt: () => { },
        destroy: () => { },
    };
}
function formatUpdatedAt(timestamp) {
    if (!timestamp) {
        return "No updates yet";
    }
    return new Date(timestamp).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
    });
}
function createInfoRow(label, value) {
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
function resolvePermissionDialog(capability) {
    switch (capability) {
        case "mic":
            return {
                capability,
                title: "Allow microphone",
                message: "Microphone access stays local and feeds the local whisper pipeline only while you explicitly keep listening enabled.",
            };
        case "camera":
            return {
                capability,
                title: "Allow camera",
                message: "Camera access stays local and only captures frames when this overlay explicitly requests them.",
            };
        case "screen":
            return {
                capability,
                title: "Allow screen capture",
                message: "Screen capture stores only the screenshot you explicitly trigger from this local overlay.",
            };
        case "tab-follow":
            return {
                capability,
                title: "Allow browser follow",
                message: "Browser follow only reflects the helper tab you explicitly attached. Global scraping remains disabled.",
            };
        default:
            return {
                capability,
                title: "Allow capability",
                message: "This capability remains local-only and can be revoked at any time.",
            };
    }
}
async function main() {
    const configuredAvatarType = companionConfig.avatarType ??
        "auto";
    const importMode = companionConfig.assetPolicy?.importMode === "local-copy" ? "local-copy" : "local-reference";
    const container = requireElement("canvas-container");
    const dockAvatarName = requireElement("dock-avatar-name");
    const dockVoiceStatus = requireElement("dock-voice-status");
    const dockMicToggle = requireElement("dock-mic-toggle");
    const dockPanelToggle = requireElement("dock-panel-toggle");
    const panel = requireElement("companion-panel");
    const panelClose = requireElement("panel-close");
    const safetyRuntimeBadge = requireElement("safety-runtime-badge");
    const permissionChipList = requireElement("permission-chip-list");
    const panelMicToggle = requireElement("panel-mic-toggle");
    const panelCameraToggle = requireElement("panel-camera-toggle");
    const panelScreenCapture = requireElement("panel-screen-capture");
    const setupProgress = requireElement("setup-progress");
    const setupChecklist = requireElement("setup-checklist");
    const browserFollowStatus = requireElement("browser-follow-status");
    const assetLibraryBadge = requireElement("asset-library-badge");
    const assetLibrary = requireElement("asset-library");
    const importVrmButton = requireElement("import-vrm");
    const importFbxButton = requireElement("import-fbx");
    const importLive2dButton = requireElement("import-live2d");
    const cameraPreview = requireElement("camera-preview");
    const cameraCanvas = requireElement("camera-canvas");
    const cameraPreviewBadge = requireElement("camera-preview-badge");
    const cameraStatusCopy = requireElement("camera-status-copy");
    const cameraPreviewEmpty = requireElement("camera-preview-empty");
    const toastRegion = requireElement("toast-region");
    const dialogBackdrop = requireElement("dialog-backdrop");
    const dialogTitle = requireElement("dialog-title");
    const dialogMessage = requireElement("dialog-message");
    const dialogFileLine = requireElement("dialog-file-line");
    const dialogLicenseField = requireElement("dialog-license-field");
    const dialogLicenseInput = requireElement("dialog-license-input");
    const dialogRightsRow = requireElement("dialog-rights-row");
    const dialogRightsCheckbox = requireElement("dialog-rights-checkbox");
    const dialogCancel = requireElement("dialog-cancel");
    const dialogConfirm = requireElement("dialog-confirm");
    const camera = new CameraHandler(cameraPreview, cameraCanvas);
    let runtimeState = await window.companionBridge.getStateSnapshot();
    let assets = await window.companionBridge.listAssets();
    let uiState = createCompanionUiState({
        onboardingSeen: readOnboardingSeen(),
        selectedAssetId: runtimeState.activeAssetId,
    });
    let assetDialogDraft = {
        licenseMemo: "",
        rightsAcknowledged: false,
    };
    let pendingDialogResolver = null;
    const discoveredModel = runtimeState.activeAsset?.resolvedPath ?? (await window.companionBridge.discoverModel());
    const initialAvatarType = toConcreteAvatarType(discoveredModel ? inferAvatarType(discoveredModel) : configuredAvatarType);
    let avatar = await initializeAvatar(initialAvatarType);
    let lipSync = new LipSyncController(avatar);
    lipSync.ttsProvider = runtimeState.ttsProvider;
    let currentModelName = runtimeState.activeAsset?.fileName ??
        (discoveredModel ? basename(discoveredModel) : "No avatar selected");
    let loadedAssetPath = discoveredModel;
    if (!uiState.onboardingSeen && uiState.panelExpanded) {
        uiState = reduceCompanionUiState(uiState, { type: "onboarding/mark-seen" });
        persistOnboardingSeen();
    }
    if (runtimeState.activeAsset?.resolvedPath) {
        await syncActiveAsset();
    }
    function updateUiState(action) {
        uiState = reduceCompanionUiState(uiState, action);
    }
    async function initializeAvatar(type) {
        container.replaceChildren();
        try {
            const nextAvatar = await createAvatarController(type);
            await nextAvatar.init(container);
            return nextAvatar;
        }
        catch (error) {
            console.error("[Companion] avatar init failed:", error);
            showToast(toastRegion, "Avatar renderer failed to initialize.", "danger");
            return createNoopAvatarController(type);
        }
    }
    async function switchAvatar(params) {
        const nextAvatarType = toAvatarTypeFromAsset(params.assetType ?? "unknown", params.filePath);
        if (avatar.avatarType !== nextAvatarType) {
            avatar.destroy();
            avatar = await initializeAvatar(nextAvatarType);
            lipSync = new LipSyncController(avatar);
            lipSync.ttsProvider = runtimeState.ttsProvider;
        }
        await avatar.reloadModel(params.filePath);
        currentModelName = params.label ?? basename(params.filePath);
        loadedAssetPath = params.filePath;
        render();
    }
    async function syncActiveAsset() {
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
        }
        catch (error) {
            console.error("[Companion] failed to activate asset", error);
            showToast(toastRegion, `Failed to load ${activeAsset.fileName}.`, "danger");
        }
    }
    async function refreshAssets(params) {
        assets = await window.companionBridge.listAssets();
        if (params?.activeAssetId !== undefined) {
            updateUiState({ type: "asset/select", assetId: params.activeAssetId });
        }
        else if (uiState.selectedAssetId &&
            !assets.some((asset) => asset.id === uiState.selectedAssetId)) {
            updateUiState({ type: "asset/select", assetId: runtimeState.activeAssetId });
        }
        render();
    }
    function renderPermissions() {
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
    function renderChecklist() {
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
    function renderBrowserCard() {
        browserFollowStatus.replaceChildren();
        const permission = runtimeState.permissions["tab-follow"];
        const browser = runtimeState.browser;
        const statusSummary = permission.decision === "granted"
            ? browser.attached
                ? "Attached to the selected helper tab."
                : "Waiting for an attached helper tab."
            : "Blocked until tab follow is explicitly allowed.";
        browserFollowStatus.appendChild(createInfoRow("Status", statusSummary));
        if (browser.attached) {
            browserFollowStatus.appendChild(createInfoRow("Tab", trimText(browser.title || browser.url || "Attached tab", 80)));
            if (browser.url) {
                browserFollowStatus.appendChild(createInfoRow("URL", trimText(browser.url, 96)));
            }
            if (browser.textSnapshot) {
                browserFollowStatus.appendChild(createInfoRow("Visible text snapshot", trimText(browser.textSnapshot, 180)));
            }
            browserFollowStatus.appendChild(createInfoRow("Updated", formatUpdatedAt(browser.updatedAt)));
        }
        else {
            browserFollowStatus.appendChild(createInfoRow("Helper", companionConfig.browserHelper?.enabled === false
                ? "Disabled in config."
                : "No helper tab attached yet."));
        }
    }
    function renderAssets() {
        const rows = buildAssetLibraryView(assets, runtimeState.activeAssetId);
        assetLibraryBadge.textContent = `${rows.length} asset${rows.length === 1 ? "" : "s"}`;
        assetLibrary.replaceChildren();
        if (rows.length === 0) {
            assetLibrary.appendChild(createInfoRow("Library", "No avatars imported yet. Start with VRM or FBX."));
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
    function renderCameraCard() {
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
        }
        else if (permission.decision === "granted") {
            cameraStatusCopy.textContent =
                "Camera access is allowed, but the local preview remains off until you start it.";
        }
        else {
            cameraStatusCopy.textContent = "Camera access is off until you explicitly allow it.";
        }
    }
    function renderDock() {
        const activeName = runtimeState.activeAsset?.fileName ?? currentModelName;
        dockAvatarName.textContent = activeName;
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
    function renderPanel() {
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
    function renderDialog() {
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
    function render() {
        renderDock();
        renderPanel();
        renderPermissions();
        renderChecklist();
        renderBrowserCard();
        renderAssets();
        renderCameraCard();
        renderDialog();
    }
    function closeDialogWithResult(kind) {
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
        pending.resolve(kind === "confirm"
            ? {
                licenseMemo: assetDialogDraft.licenseMemo.trim(),
            }
            : null);
    }
    function openPermissionDialog(config) {
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
        return new Promise((resolve) => {
            pendingDialogResolver = { kind: "permission", resolve };
        });
    }
    function openAssetImportDialog(dialog) {
        if (pendingDialogResolver) {
            closeDialogWithResult("cancel");
        }
        assetDialogDraft = {
            licenseMemo: dialog.defaultLicenseMemo,
            rightsAcknowledged: false,
        };
        updateUiState({ type: "dialog/open", dialog });
        render();
        return new Promise((resolve) => {
            pendingDialogResolver = { kind: "asset-import", resolve };
        });
    }
    async function requestPermission(capability) {
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
    async function togglePermissionFromChip(capability) {
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
    async function toggleMicSession() {
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
    async function toggleCameraSession() {
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
    async function captureScreenNow() {
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
    async function activateAsset(assetId) {
        runtimeState = await window.companionBridge.activateAsset(assetId);
        updateUiState({ type: "asset/select", assetId });
        await syncActiveAsset();
        await refreshAssets({ activeAssetId: assetId });
        showToast(toastRegion, `Activated ${runtimeState.activeAsset?.fileName ?? "asset"}.`, "success");
    }
    async function importAssetFromPath(filePath) {
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
        }
        catch (error) {
            console.error("[Companion] asset import failed", error);
            showToast(toastRegion, `Failed to import ${basename(filePath)}.`, "danger");
        }
    }
    async function openAssetPicker(assetType) {
        const filters = assetType === "vrm"
            ? [{ name: "VRM Avatar", extensions: ["vrm"] }]
            : assetType === "fbx"
                ? [{ name: "FBX Avatar", extensions: ["fbx"] }]
                : [{ name: "Live2D Model", extensions: ["model3.json", "model.json"] }];
        const title = assetType === "vrm"
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
    async function speakWithEmotion(text, emotion) {
        const trimmed = text.trim();
        if (!trimmed) {
            return;
        }
        const resolvedEmotion = emotion ?? detectEmotion(trimmed);
        const emotionProfile = applyEmotion(avatar, resolvedEmotion);
        lipSync.ttsProvider = runtimeState.ttsProvider;
        showToast(toastRegion, trimText(trimmed, 72), "info");
        await lipSync.speak(trimmed, emotionProfile);
    }
    async function handleAvatarCommand(cmd) {
        if (cmd.loadModel) {
            try {
                await switchAvatar({
                    filePath: cmd.loadModel,
                    assetType: inferAssetTypeFromPath(cmd.loadModel),
                });
            }
            catch (error) {
                console.error("[Companion] command load failed", error);
                showToast(toastRegion, `Failed to load ${basename(cmd.loadModel)}.`, "danger");
            }
        }
        if (cmd.expression) {
            applyEmotion(avatar, detectEmotion(`[EMOTION:${cmd.expression}]`));
        }
        if (cmd.motion) {
            avatar.playMotion(cmd.motion, cmd.motionIndex);
        }
        if (cmd.lookAt) {
            avatar.lookAt(cmd.lookAt.x, cmd.lookAt.y);
        }
        if (cmd.speakText) {
            await speakWithEmotion(cmd.speakText);
        }
    }
    function setDragActive(active) {
        document.body.classList.toggle("drag-active", active);
    }
    function hasModelFile(event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        return files.some((file) => file.name.toLowerCase().endsWith(".vrm") ||
            file.name.toLowerCase().endsWith(".fbx") ||
            file.name.toLowerCase().endsWith(".model3.json") ||
            file.name.toLowerCase().endsWith(".model.json"));
    }
    render();
    dockPanelToggle.addEventListener("click", () => {
        if (uiState.panelExpanded) {
            updateUiState({ type: "panel/collapse" });
            persistOnboardingSeen();
        }
        else {
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
        const file = Array.from(event.dataTransfer?.files ?? []).find((candidate) => candidate.name.toLowerCase().endsWith(".vrm") ||
            candidate.name.toLowerCase().endsWith(".fbx") ||
            candidate.name.toLowerCase().endsWith(".model3.json") ||
            candidate.name.toLowerCase().endsWith(".model.json"));
        if (!file) {
            return;
        }
        const filePath = file.path;
        if (!filePath) {
            showToast(toastRegion, "Drag a local file from the desktop companion host.", "warning");
            return;
        }
        void importAssetFromPath(filePath);
    });
    document.addEventListener("mouseenter", () => {
        window.companionBridge.notifyMouseActive(true);
    });
    document.addEventListener("mouseleave", () => {
        window.companionBridge.notifyMouseActive(false);
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
        lipSync.ttsProvider = runtimeState.ttsProvider;
        const activeAsset = runtimeState.activeAsset;
        if (runtimeState.activeAssetId !== previousActiveAssetId) {
            updateUiState({ type: "asset/select", assetId: runtimeState.activeAssetId });
            void syncActiveAsset();
        }
        else if (activeAsset && !assets.some((asset) => asset.id === activeAsset.id)) {
            void refreshAssets({ activeAssetId: runtimeState.activeAssetId });
        }
        else {
            render();
        }
    });
    window.companionBridge.onLineEvent((event) => {
        void speakWithEmotion(event.text);
    });
    window.companionBridge.onEmotionEvent((event) => {
        if (event.text) {
            void speakWithEmotion(event.text, event.emotion);
            return;
        }
        applyEmotion(avatar, event.emotion);
        showToast(toastRegion, `Emotion: ${event.emotion}`, "info");
    });
    window.companionBridge.onSpeakText((text) => {
        void speakWithEmotion(text);
    });
    window.companionBridge.onControlEvent((cmd) => {
        if (cmd.ttsProvider === "voicevox" || cmd.ttsProvider === "web-speech") {
            runtimeState = {
                ...runtimeState,
                ttsProvider: cmd.ttsProvider,
            };
            lipSync.ttsProvider = runtimeState.ttsProvider;
            render();
        }
        if (cmd.avatarCommand) {
            void handleAvatarCommand(cmd.avatarCommand);
        }
    });
    window.companionBridge.onAvatarCommand((cmd) => {
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
