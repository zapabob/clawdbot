// Model Catalog Preloader - Background warming for faster first queries
import type { OpenClawConfig } from "../config/config.js";
import type { ModelCatalogEntry } from "./model-catalog.js";
import { loadModelCatalog } from "./model-catalog.js";

// Preloaded catalog storage
let preloadedCatalog: ModelCatalogEntry[] | null = null;
let preloadingPromise: Promise<ModelCatalogEntry[]> | null = null;

// Preload model catalog in background (call during startup)
export function preloadModelCatalog(config?: OpenClawConfig): Promise<ModelCatalogEntry[]> {
  if (preloadedCatalog) {
    return Promise.resolve(preloadedCatalog);
  }

  if (!preloadingPromise) {
    preloadingPromise = loadModelCatalog(config ? { config } : undefined).then((catalog) => {
      preloadedCatalog = catalog;
      return catalog;
    });
  }

  return preloadingPromise;
}

// Get preloaded catalog (synchronous, returns null if not ready)
export function getPreloadedModelCatalog(): ModelCatalogEntry[] | null {
  return preloadedCatalog;
}

// Check if preloading is complete
export function isModelCatalogPreloaded(): boolean {
  return preloadedCatalog !== null;
}

// Reset preloaded catalog (for testing)
export function resetModelCatalogPreload(): void {
  preloadedCatalog = null;
  preloadingPromise = null;
}
