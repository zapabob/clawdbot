import type {
  CompanionAssetManifestEntry,
  CompanionPermissionCapability,
  CompanionRuntimeState,
} from "../runtime-api.js";

export type SetupChecklistItemId =
  | "import-avatar"
  | "confirm-rights"
  | "enable-mic"
  | "optional-camera"
  | "optional-browser-follow";

export type SetupChecklistItem = {
  id: SetupChecklistItemId;
  title: string;
  description: string;
  complete: boolean;
  optional: boolean;
};

export type AssetLibraryViewEntry = CompanionAssetManifestEntry & {
  isActive: boolean;
};

export type PermissionDialogState = {
  kind: "permission";
  capability: CompanionPermissionCapability;
  title: string;
  message: string;
};

export type AssetImportDialogState = {
  kind: "asset-import";
  filePath: string;
  assetType: CompanionAssetManifestEntry["assetType"];
  fileName: string;
  defaultLicenseMemo: string;
  importMode?: CompanionAssetManifestEntry["importMode"];
};

export type CompanionUiDialogState = PermissionDialogState | AssetImportDialogState;

export type CompanionUiState = {
  panelExpanded: boolean;
  activeDialog: CompanionUiDialogState | null;
  onboardingSeen: boolean;
  selectedAssetId: string | null;
};

export type CompanionUiAction =
  | { type: "panel/expand" }
  | { type: "panel/collapse" }
  | { type: "asset/select"; assetId: string | null }
  | { type: "dialog/open"; dialog: CompanionUiDialogState }
  | { type: "dialog/close" }
  | { type: "onboarding/mark-seen" };

export function buildSetupChecklist(params: {
  runtimeState: CompanionRuntimeState;
  assets: CompanionAssetManifestEntry[];
}): SetupChecklistItem[] {
  const activeAsset = params.runtimeState.activeAsset;
  const assetImported = activeAsset !== null;
  const rightsConfirmed = activeAsset?.rightsAcknowledged === true;
  const micEnabled = params.runtimeState.permissions.mic.decision === "granted";
  const cameraEnabled = params.runtimeState.permissions.camera.decision === "granted";
  const browserAttached = params.runtimeState.browser.attached;

  return [
    {
      id: "import-avatar",
      title: "Import avatar",
      description: "Bring in a local VRM or FBX avatar for this companion.",
      complete: assetImported,
      optional: false,
    },
    {
      id: "confirm-rights",
      title: "Confirm creator rights",
      description: "Keep remote upload disabled and confirm you can use this asset locally.",
      complete: rightsConfirmed,
      optional: false,
    },
    {
      id: "enable-mic",
      title: "Enable local mic",
      description: "Use the local whisper pipeline for microphone input.",
      complete: micEnabled,
      optional: false,
    },
    {
      id: "optional-camera",
      title: "Optional camera",
      description: "Allow explicit local camera captures only when you choose.",
      complete: cameraEnabled,
      optional: true,
    },
    {
      id: "optional-browser-follow",
      title: "Optional browser follow",
      description: "Show the currently attached tab when the helper is connected.",
      complete: browserAttached,
      optional: true,
    },
  ];
}

export function buildAssetLibraryView(
  assets: CompanionAssetManifestEntry[],
  activeAssetId: string | null,
): AssetLibraryViewEntry[] {
  return assets.map((asset) => ({
    ...asset,
    isActive: asset.id === activeAssetId,
  }));
}

export function createCompanionUiState(params: {
  onboardingSeen: boolean;
  autoExpanded?: boolean;
  selectedAssetId?: string | null;
}): CompanionUiState {
  return {
    panelExpanded: params.autoExpanded ?? !params.onboardingSeen,
    activeDialog: null,
    onboardingSeen: params.onboardingSeen,
    selectedAssetId: params.selectedAssetId ?? null,
  };
}

export function reduceCompanionUiState(
  state: CompanionUiState,
  action: CompanionUiAction,
): CompanionUiState {
  switch (action.type) {
    case "panel/expand":
      return {
        ...state,
        panelExpanded: true,
      };
    case "panel/collapse":
      return {
        ...state,
        panelExpanded: false,
        activeDialog: null,
        onboardingSeen: true,
      };
    case "asset/select":
      return {
        ...state,
        selectedAssetId: action.assetId,
      };
    case "dialog/open":
      return {
        ...state,
        panelExpanded: true,
        activeDialog: action.dialog,
      };
    case "dialog/close":
      return {
        ...state,
        activeDialog: null,
      };
    case "onboarding/mark-seen":
      return {
        ...state,
        onboardingSeen: true,
      };
    default:
      return state;
  }
}
