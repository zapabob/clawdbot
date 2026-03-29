param(
    [string]$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName,
    [string[]]$Component,
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-DL {
    param([string]$Msg, [System.ConsoleColor]$Color = [System.ConsoleColor]::Cyan)
    Write-Host "  [DL] $Msg" -ForegroundColor $Color
}

function Write-DLDry {
    param([string]$Msg)
    Write-Host "  [DL][DRY] $Msg" -ForegroundColor DarkCyan
}

function Install-VendorPkg {
    param([string]$PkgPath, [string]$PkgName)
    $hasPyproject = Test-Path (Join-Path $PkgPath "pyproject.toml")
    $hasSetupPy   = Test-Path (Join-Path $PkgPath "setup.py")
    if (-not ($hasPyproject -or $hasSetupPy)) { return }
    Write-DL "  Installing $PkgName into venv ..."
    $harnessScripts = Join-Path $ProjectDir "extensions\hypura-harness\scripts"
    try {
        if (Get-Command uv -ErrorAction SilentlyContinue) {
            Push-Location $harnessScripts
            uv pip install -e $PkgPath --quiet 2>&1 | Out-Null
            Pop-Location
        } else {
            py -3 -m pip install -e $PkgPath --quiet 2>&1 | Out-Null
        }
        Write-DL "  $PkgName installed" -Color Green
    } catch {
        Write-Host "  [DL][WARN] pip install failed ($PkgName): $_" -ForegroundColor Yellow
    }
}

$manifestPath = Join-Path $ProjectDir "scripts\vendor-manifest.json"
if (-not (Test-Path $manifestPath)) {
    Write-Host "  [DL][ERROR] vendor-manifest.json not found at $manifestPath" -ForegroundColor Red
    exit 1
}
$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

$tmpBase = Join-Path $env:TEMP "clawdbot-dl"
if (-not (Test-Path $tmpBase)) {
    New-Item -ItemType Directory -Path $tmpBase -Force | Out-Null
}

foreach ($name in $manifest.PSObject.Properties.Name) {
    if ($Component -and $Component -notcontains $name) { continue }

    $entry   = $manifest.$name
    $target  = Join-Path $ProjectDir $entry.target
    $install = $entry.install -eq $true
    $desc    = if ($entry.description) { $entry.description } else { $name }

    if ((Test-Path $target) -and -not $Force) {
        Write-DL "$name`: already exists -> skipping" -Color DarkGray
        continue
    }

    Write-DL "Processing: $desc"

    if ($DryRun) {
        Write-DLDry "would download: $name -> $target"
        if ($install) { Write-DLDry "would install: $name" }
        continue
    }

    $tmpDir = Join-Path $tmpBase $name
    if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

    $ok = $false

    if ($entry.type -eq "zip-extract") {
        $zipPath = Join-Path $tmpDir "$name.zip"
        Write-DL "  Downloading $($entry.url) ..."
        try {
            Invoke-WebRequest -Uri $entry.url -OutFile $zipPath -UseBasicParsing
            Write-DL "  Extracting ..."
            Expand-Archive -Path $zipPath -DestinationPath $target -Force
            Write-DL "$name`: extracted to $target" -Color Green
            $ok = $true
        } catch {
            Write-Host "  [DL][ERROR] $name failed: $_" -ForegroundColor Red
        }

    } elseif ($entry.type -eq "github-tarball") {
        $repo    = $entry.repo
        $ref     = if ($entry.ref) { $entry.ref } else { "main" }
        $url     = "https://github.com/$repo/archive/refs/heads/$ref.zip"
        $zipPath = Join-Path $tmpDir "$name.zip"
        Write-DL "  Downloading $url ..."
        try {
            Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
            Write-DL "  Extracting ..."
            $extractDir = Join-Path $tmpDir "extracted"
            Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
            $inner = Get-ChildItem $extractDir -Directory | Select-Object -First 1
            if ($null -eq $inner) {
                throw "No directory found in zip"
            }
            if (Test-Path $target) { Remove-Item $target -Recurse -Force }
            Move-Item $inner.FullName $target
            Write-DL "$name`: downloaded to $target" -Color Green
            $ok = $true
        } catch {
            Write-Host "  [DL][ERROR] $name failed: $_" -ForegroundColor Red
        }

    } elseif ($entry.type -eq "git-clone-shallow") {
        $repoUrl = "https://github.com/$($entry.repo).git"
        Write-DL "  git clone --depth 1 $repoUrl ..."
        try {
            if (Test-Path $target) { Remove-Item $target -Recurse -Force }
            git clone --depth 1 $repoUrl $target 2>&1 | Out-Null
            Write-DL "$name`: cloned to $target" -Color Green
            $ok = $true
        } catch {
            Write-Host "  [DL][ERROR] $name failed: $_" -ForegroundColor Red
        }

    } else {
        Write-Host "  [DL][WARN] Unknown type: $($entry.type) -- skipping $name" -ForegroundColor Yellow
    }

    if ($ok) {
        if ($install) {
            Install-VendorPkg -PkgPath $target -PkgName $name
        }

        if ($entry.post_patch) {
            $patchScript = Join-Path $ProjectDir $entry.post_patch
            if (Test-Path $patchScript) {
                Write-DL "  Applying patch: $($entry.post_patch) ..."
                try {
                    py -3 $patchScript $target 2>&1 | ForEach-Object { Write-Host "    $_" }
                    Write-DL "  Patch applied" -Color Green
                } catch {
                    Write-Host "  [DL][WARN] post_patch failed: $_" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  [DL][WARN] post_patch not found: $patchScript" -ForegroundColor Yellow
            }
        }
    }

    if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue }
}

Write-DL "Done." -Color Green
