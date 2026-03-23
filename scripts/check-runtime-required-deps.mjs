#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const runtimeRequiredPackages = ["@anthropic-ai/vertex-sdk"];

function packageJsonPath(cwd, packageName) {
  const parts = packageName.split("/");
  return path.join(cwd, "node_modules", ...parts, "package.json");
}

function main() {
  const cwd = process.cwd();
  const missing = [];

  for (const packageName of runtimeRequiredPackages) {
    const pkgJson = packageJsonPath(cwd, packageName);
    if (!fs.existsSync(pkgJson)) {
      missing.push(packageName);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[openclaw] Missing required runtime dependencies: ${missing.join(", ")}. Run \`pnpm install\` in the project root.`,
    );
    process.exit(1);
  }

  console.log(
    `[openclaw] Runtime dependency check passed (${runtimeRequiredPackages.length} packages).`,
  );
}

main();
