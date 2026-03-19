# setup-shortcut.ps1 — delegates to the canonical installer
# (旧来の Hakua.lnk 作成スクリプト。統合インストーラーに委譲する)

$installer = Join-Path $PSScriptRoot "installers\create-desktop-shortcut.ps1"
& $installer
