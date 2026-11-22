$ErrorActionPreference = 'Stop'
# Installs upstream skill directories through Codex's bundled installer.
$repo = 'gamedev-skills/awesome-gamedev-agent-skills'
$tree = Invoke-RestMethod "https://api.github.com/repos/$repo/git/trees/main?recursive=1"
$paths = @($tree.tree | Where-Object { $_.path -match '^(router|skills/.+)/SKILL\.md$' } | ForEach-Object { $_.path -replace '/SKILL\.md$', '' })
if ($paths.Count -lt 2) { throw 'Upstream skill discovery failed.' }
$installer = Join-Path $env:USERPROFILE '.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py'
$python = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
if (!(Test-Path -LiteralPath $python)) { throw "Bundled Python missing: $python" }
$dest = Join-Path $env:USERPROFILE '.codex/skills'
$pending = @($paths | Where-Object { !(Test-Path -LiteralPath (Join-Path $dest (Split-Path $_ -Leaf))) })
if ($pending.Count) {
    & $python $installer --repo $repo --ref $tree.sha --path @pending --dest $dest
    if ($LASTEXITCODE -ne 0) { throw "Installer failed: $LASTEXITCODE" }
}
$missing = @($paths | Where-Object { !(Test-Path -LiteralPath (Join-Path $dest "$(Split-Path $_ -Leaf)/SKILL.md")) })
if ($missing.Count) { throw "Missing skills: $($missing -join ', ')" }
Write-Output "Verified $($paths.Count) skill directories at commit $($tree.sha) in $dest"
