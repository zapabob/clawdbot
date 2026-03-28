import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import "./subsystem-BZRyMoTO.js";
import "./ansi-D3lUajt1.js";
import "./file-identity-DgWfjfnD.js";
import "./logger-BsvC8P6f.js";
import "./exec-CbOKTdtq.js";
import { a as resolveArchiveKind, i as readJsonFile, r as fileExists } from "./archive-Ccs4T-SG.js";
import "./path-alias-guards-Ced0dWkY.js";
import {
  i as withExtractedArchiveRoot,
  n as installPackageDirWithManifestDeps,
  r as resolveExistingInstallPath,
  t as installPackageDir,
} from "./install-package-dir-ViPC1-Xa.js";
import "./fs-safe-D6gPP2TP.js";
import { r as resolveArchiveSourcePath } from "./install-source-utils-CC2zjQA9.js";
import {
  a as finalizeNpmSpecArchiveInstall,
  i as resolveTimedInstallModeOptions,
  n as resolveCanonicalInstallTarget,
  o as installFromNpmSpecArchiveWithInstaller,
  r as resolveInstallModeOptions,
  t as ensureInstallTargetAvailable,
} from "./install-target-1LS9uj7g.js";
import { i as validateRegistryNpmSpec } from "./npm-registry-spec-CX4uX8wk.js";
import { n as isPathInside, r as isPathInsideWithRealpath } from "./scan-paths-B4rpj8y5.js";
//#region src/infra/install-from-npm-spec.ts
async function installFromValidatedNpmSpecArchive(params) {
  const spec = params.spec.trim();
  const specError = validateRegistryNpmSpec(spec);
  if (specError)
    return {
      ok: false,
      error: specError,
    };
  return finalizeNpmSpecArchiveInstall(
    await installFromNpmSpecArchiveWithInstaller({
      tempDirPrefix: params.tempDirPrefix,
      spec,
      timeoutMs: params.timeoutMs,
      expectedIntegrity: params.expectedIntegrity,
      onIntegrityDrift: params.onIntegrityDrift,
      warn: params.warn,
      installFromArchive: params.installFromArchive,
      archiveInstallParams: params.archiveInstallParams,
    }),
  );
}
//#endregion
export {
  ensureInstallTargetAvailable,
  fileExists,
  installFromValidatedNpmSpecArchive,
  installPackageDir,
  installPackageDirWithManifestDeps,
  isPathInside,
  isPathInsideWithRealpath,
  readJsonFile,
  resolveArchiveKind,
  resolveArchiveSourcePath,
  resolveCanonicalInstallTarget,
  resolveExistingInstallPath,
  resolveInstallModeOptions,
  resolveTimedInstallModeOptions,
  withExtractedArchiveRoot,
};
