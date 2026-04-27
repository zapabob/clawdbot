import { loadBundledPluginPublicSurfaceModuleSync } from "./facade-runtime.js";

export type OllamaTagModel = {
  name: string;
  model?: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: Record<string, unknown>;
};

export type OllamaTagsResponse = {
  models?: OllamaTagModel[];
};

export type OllamaModelShowInfo = Record<string, unknown>;

export type OllamaModelWithContext = OllamaTagModel & {
  contextWindow?: number;
};

type OllamaFacadeModule = {
  resolveOllamaApiBase: (configuredBaseUrl?: string) => string;
  fetchOllamaModels: (...args: unknown[]) => Promise<OllamaTagsResponse>;
  queryOllamaContextWindow: (...args: unknown[]) => Promise<number | null>;
  queryOllamaModelShowInfo: (...args: unknown[]) => Promise<OllamaModelShowInfo | null>;
  enrichOllamaModelsWithContext: (...args: unknown[]) => Promise<OllamaModelWithContext[]>;
  buildOllamaModelDefinition: (...args: unknown[]) => unknown;
  isReasoningModelHeuristic: (model: string) => boolean;
};

function loadOllamaFacadeModule(): OllamaFacadeModule {
  return loadBundledPluginPublicSurfaceModuleSync<OllamaFacadeModule>({
    dirName: "ollama",
    artifactBasename: "api.js",
  });
}

export const resolveOllamaApiBase: OllamaFacadeModule["resolveOllamaApiBase"] = ((...args) =>
  loadOllamaFacadeModule().resolveOllamaApiBase(...args)) as OllamaFacadeModule["resolveOllamaApiBase"];

export const fetchOllamaModels: OllamaFacadeModule["fetchOllamaModels"] = ((...args) =>
  loadOllamaFacadeModule().fetchOllamaModels(...args)) as OllamaFacadeModule["fetchOllamaModels"];

export const queryOllamaContextWindow: OllamaFacadeModule["queryOllamaContextWindow"] = ((...args) =>
  loadOllamaFacadeModule().queryOllamaContextWindow(
    ...args,
  )) as OllamaFacadeModule["queryOllamaContextWindow"];

export const queryOllamaModelShowInfo: OllamaFacadeModule["queryOllamaModelShowInfo"] = ((...args) =>
  loadOllamaFacadeModule().queryOllamaModelShowInfo(
    ...args,
  )) as OllamaFacadeModule["queryOllamaModelShowInfo"];

export const enrichOllamaModelsWithContext: OllamaFacadeModule["enrichOllamaModelsWithContext"] = ((
  ...args
) =>
  loadOllamaFacadeModule().enrichOllamaModelsWithContext(
    ...args,
  )) as OllamaFacadeModule["enrichOllamaModelsWithContext"];

export const buildOllamaModelDefinition: OllamaFacadeModule["buildOllamaModelDefinition"] = ((
  ...args
) =>
  loadOllamaFacadeModule().buildOllamaModelDefinition(
    ...args,
  )) as OllamaFacadeModule["buildOllamaModelDefinition"];

export const isReasoningModelHeuristic: OllamaFacadeModule["isReasoningModelHeuristic"] = ((...args) =>
  loadOllamaFacadeModule().isReasoningModelHeuristic(
    ...args,
  )) as OllamaFacadeModule["isReasoningModelHeuristic"];
