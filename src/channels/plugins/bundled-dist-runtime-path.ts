/**
 * Map a dist-runtime bundled module path to its canonical dist build path.
 * Uses a separator-agnostic match so mixed `/` and `\\` (or all-forward-slash
 * paths on Windows) still rewrite correctly; `path.sep`-only replacement can
 * miss and leave dist-runtime wrapper shims on the load path (jiti + re-export
 * can blow the stack).
 */
export function rewriteBundledDistRuntimePathToDist(modulePath: string): string {
  return modulePath.replace(/([\\/])dist-runtime([\\/])/g, "$1dist$2");
}
