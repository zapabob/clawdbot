// Lazy Module Loader - Reduces startup time
// Only loads modules when first accessed

export interface LazyModuleConfig {
  modules: Record<string, () => Promise<unknown>>;
}

export class LazyModuleLoader {
  private moduleMap: Map<string, () => Promise<unknown>>;
  private loaded = new Map<string, unknown>();

  constructor(modules: Record<string, () => Promise<unknown>>) {
    this.moduleMap = new Map(Object.entries(modules));
  }

  async get<T>(name: string): Promise<T> {
    if (this.loaded.has(name)) {
      return this.loaded.get(name) as T;
    }

    const loader = this.moduleMap.get(name);
    if (!loader) {
      throw new Error(`Lazy module '${name}' not found`);
    }

    const module = await loader();
    this.loaded.set(name, module);
    return module as T;
  }

  has(name: string): boolean {
    return this.moduleMap.has(name);
  }

  preload(name: string): void {
    const loader = this.moduleMap.get(name);
    if (loader) {
      void loader().then((m) => this.loaded.set(name, m));
    }
  }

  preloadAll(): void {
    for (const [name] of this.moduleMap) {
      this.preload(name);
    }
  }

  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  clear(): void {
    this.loaded.clear();
  }
}

// === Preload List for Common Modules ===
// Note: These paths are examples - adjust based on actual module locations
// This is a placeholder - actual modules should be imported where needed

export const lazyLoader = new LazyModuleLoader({});
