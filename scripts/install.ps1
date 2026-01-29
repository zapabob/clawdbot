# Moltbot Unified Install Script for Windows
# Usage:
#   .\scripts\install.ps1              - Normal install
#   .\scripts\install.ps1 -Clean       - Clean build
#   .\scripts\install.ps1 -SkipBuild   - Skip build step
#   .\scripts\install.ps1 -Production  - Production build

param(
    [switch]$Clean,
    [switch]$SkipBuild,
    [switch]$Production
)

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptRoot -Parent

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Moltbot Unified Install" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------
# 1. Prerequisites check
# --------------------------------
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Error "Node.js is not installed. v22.12.0 or later required."
    exit 1
}
$nodeMajor = [int]($nodeVersion -replace "v(\d+)\.\d+\.\d+.*", '$1')
if ($nodeMajor -lt 22) {
    Write-Error "Node.js v22.12.0 or later required. Current: $nodeVersion"
    exit 1
}
Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green

# Check pnpm
$pnpmVersion = pnpm --version 2>$null
if (-not $pnpmVersion) {
    Write-Host "  pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
    $pnpmVersion = pnpm --version
}
Write-Host "  [OK] pnpm: $pnpmVersion" -ForegroundColor Green

# --------------------------------
# 2. Clean (optional)
# --------------------------------
if ($Clean) {
    Write-Host ""
    Write-Host "[2/5] Cleaning..." -ForegroundColor Yellow
    
    $distPath = Join-Path $ProjectRoot "dist"
    $nodeModulesPath = Join-Path $ProjectRoot "node_modules"
    
    if (Test-Path $distPath) {
        Write-Host "  Removing dist/..."
        Remove-Item -Recurse -Force $distPath
    }
    if (Test-Path $nodeModulesPath) {
        Write-Host "  Removing node_modules/..."
        Remove-Item -Recurse -Force $nodeModulesPath
    }
    Write-Host "  [OK] Clean complete" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "[2/5] Skipping clean (use -Clean to enable)" -ForegroundColor DarkGray
}

# --------------------------------
# 3. Install dependencies
# --------------------------------
Write-Host ""
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow

Push-Location $ProjectRoot
try {
    if ($Production) {
        & pnpm install --prod
    }
    else {
        & pnpm install
    }
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
    Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
}
finally {
    Pop-Location
}

# --------------------------------
# 4. Type check
# --------------------------------
Write-Host ""
Write-Host "[4/5] Type checking..." -ForegroundColor Yellow

Push-Location $ProjectRoot
try {
    & npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) { 
        Write-Warning "Type check has errors. Continuing..."
    }
    else {
        Write-Host "  [OK] Type check passed (0 errors)" -ForegroundColor Green
    }
}
finally {
    Pop-Location
}

# --------------------------------
# 5. Build
# --------------------------------
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[5/5] Building..." -ForegroundColor Yellow

    Push-Location $ProjectRoot
    try {
        # Run TypeScript compilation directly
        Write-Host "  Compiling TypeScript..."
        & npx tsc -p tsconfig.json
        if ($LASTEXITCODE -ne 0) { throw "TypeScript compilation failed" }
        
        # Run post-build scripts
        Write-Host "  Running post-build scripts..."
        & node --import tsx scripts/copy-hook-metadata.ts
        & node --import tsx scripts/write-build-info.ts
        
        Write-Host "  [OK] Build complete" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host ""
    Write-Host "[5/5] Skipping build (-SkipBuild specified)" -ForegroundColor DarkGray
}

# --------------------------------
# Summary
# --------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  pnpm start            - Start in dev mode"
Write-Host "  pnpm gateway:dev      - Start Gateway dev server"
Write-Host "  pnpm tui              - Start TUI mode"
Write-Host "  pnpm test             - Run tests"
Write-Host ""
Write-Host "Global install (optional):" -ForegroundColor Cyan
Write-Host "  pnpm link --global    - Register moltbot command globally"
Write-Host ""
