import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import "./subsystem-BZRyMoTO.js";
import "./ansi-D3lUajt1.js";
import "./file-identity-DgWfjfnD.js";
import "./boundary-file-read-DZTg2Wyt.js";
import "./logger-BsvC8P6f.js";
import "./exec-CbOKTdtq.js";
import { a as resolveArchiveKind, i as readJsonFile, r as fileExists } from "./archive-Ccs4T-SG.js";
import { l as writeFileFromPathWithinRoot } from "./fs-safe-D6gPP2TP.js";
import "./runtime-guard-WQAOpX6v.js";
import "./path-alias-guards-Ced0dWkY.js";
import {
  i as withExtractedArchiveRoot,
  r as resolveExistingInstallPath,
  t as installPackageDir,
} from "./install-package-dir-ViPC1-Xa.js";
import { r as resolveArchiveSourcePath } from "./install-source-utils-CC2zjQA9.js";
import {
  a as finalizeNpmSpecArchiveInstall,
  i as resolveTimedInstallModeOptions,
  n as resolveCanonicalInstallTarget,
  o as installFromNpmSpecArchiveWithInstaller,
  r as resolveInstallModeOptions,
  t as ensureInstallTargetAvailable,
} from "./install-target-1LS9uj7g.js";
import {
  g as resolvePackageExtensionEntries,
  h as loadPluginManifest,
  l as detectBundleManifestFormat,
  m as getPackageManifestMetadata,
  r as isPathInside,
  t as checkMinHostVersion,
  u as loadBundleManifest,
} from "./min-host-version-DM6er2ZX.js";
import { i as validateRegistryNpmSpec } from "./npm-registry-spec-CX4uX8wk.js";
import { n as resolveRuntimeServiceVersion } from "./version-yfoo3YbF.js";
//#region src/plugins/install-security-scan.ts
async function loadInstallSecurityScanRuntime() {
  return await import("./install-security-scan.runtime-Q40PHku9.js");
}
async function scanBundleInstallSource(params) {
  const { scanBundleInstallSourceRuntime } = await loadInstallSecurityScanRuntime();
  await scanBundleInstallSourceRuntime(params);
}
async function scanPackageInstallSource(params) {
  const { scanPackageInstallSourceRuntime } = await loadInstallSecurityScanRuntime();
  await scanPackageInstallSourceRuntime(params);
}
//#endregion
export {
  checkMinHostVersion,
  detectBundleManifestFormat,
  ensureInstallTargetAvailable,
  fileExists,
  finalizeNpmSpecArchiveInstall,
  getPackageManifestMetadata,
  installFromNpmSpecArchiveWithInstaller,
  installPackageDir,
  isPathInside,
  loadBundleManifest,
  loadPluginManifest,
  readJsonFile,
  resolveArchiveKind,
  resolveArchiveSourcePath,
  resolveCanonicalInstallTarget,
  resolveExistingInstallPath,
  resolveInstallModeOptions,
  resolvePackageExtensionEntries,
  resolveRuntimeServiceVersion,
  resolveTimedInstallModeOptions,
  scanBundleInstallSource,
  scanPackageInstallSource,
  validateRegistryNpmSpec,
  withExtractedArchiveRoot,
  writeFileFromPathWithinRoot,
};
