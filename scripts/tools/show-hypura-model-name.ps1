# Print model name(s) from a running Hypura server (/api/tags).
# Use the exact string in openclaw.json: agents.defaults.model.primary = "hypura/<name>"
param(
    [string]$BaseUrl = "http://127.0.0.1:8080"
)
$ErrorActionPreference = "Stop"
$u = $BaseUrl.TrimEnd("/")
$tags = Invoke-RestMethod -Uri "$u/api/tags" -TimeoutSec 5
$tags.models | ForEach-Object { $_.name }
