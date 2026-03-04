# Prot-Audit: Hakua Configuration Auditor (Read-Only)
# Uses node for reliable JSON parsing of large openclaw.json

$ConfigPath = "c:\Users\downl\.openclaw\openclaw.json"

Write-Host "--- manifestation protocol audit ---" -ForegroundColor Blue

if (!(Test-Path $ConfigPath)) {
    Write-Host "[Audit] Error: openclaw.json not found." -ForegroundColor Red
    return
}

# Use node to parse and audit the config reliably
$nodeScript = @"
const fs = require('fs');
try {
  const raw = fs.readFileSync('C:/Users/downl/.openclaw/openclaw.json', 'utf8');
  const c = JSON.parse(raw);
  const results = [];

  // 1. Skill load paths
  const paths = c.plugins && c.plugins.load && c.plugins.load.paths;
  if (paths && paths.length > 0) {
    results.push('OK|Skill load paths: ' + paths.length + ' entries');
  } else {
    results.push('WARN|No plugin load paths configured');
  }

  // 2. Voice config
  const vc = c.plugins && c.plugins.entries && c.plugins.entries['local-voice'] && c.plugins.entries['local-voice'].config;
  if (vc) {
    results.push('OK|TTS: ' + (vc.ttsProvider || 'none') + ', STT: ' + (vc.sttProvider || 'none'));
  } else {
    results.push('WARN|local-voice plugin config not found');
  }

  // 3. ACP
  if (c.acp && c.acp.enabled) {
    results.push('OK|ACP: Enabled (Backend: ' + c.acp.backend + ')');
  } else {
    results.push('WARN|ACP is not enabled');
  }

  // 4. Gateway
  if (c.gateway && c.gateway.auth && c.gateway.auth.token) {
    results.push('OK|Gateway: Secured (Token present)');
  } else {
    results.push('WARN|Gateway token missing');
  }

  results.forEach(r => console.log(r));
} catch (e) {
  console.log('ERR|' + e.message);
}
"@

$output = node -e $nodeScript 2>&1
foreach ($line in $output) {
    $parts = "$line".Split('|', 2)
    if ($parts.Length -eq 2) {
        $level = $parts[0]
        $msg = $parts[1]
        switch ($level) {
            "OK" { Write-Host "[Audit] $msg" -ForegroundColor Green }
            "WARN" { Write-Host "[Audit] $msg" -ForegroundColor Yellow }
            "ERR" { Write-Host "[Audit] Error: $msg" -ForegroundColor Red }
        }
    }
}

Write-Host "[Audit] Protocol alignment complete." -ForegroundColor Green
