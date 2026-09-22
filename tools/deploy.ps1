param(
    [string]$Server = '168.107.21.43',
    [string]$KeyPath = 'C:\baggam-dev\docs\spirebound-docs\ssh-key-2026-09-20.key',
    [switch]$PackageOnly
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$release = 'release-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,6)
$stage = Join-Path ([IO.Path]::GetTempPath()) ('spirebound-' + $release)
function Invoke-Checked([string]$Program, [string[]]$Arguments) {
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed (exit $LASTEXITCODE)." }
}
try {
    if ($Server -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw 'Server must be an IPv4 address.' }
    if (!(Test-Path -LiteralPath $KeyPath -PathType Leaf) -and !$PackageOnly) { throw "SSH key not found: $KeyPath" }
    New-Item -ItemType Directory -Path $stage | Out-Null
    $files = @(Get-ChildItem -LiteralPath $projectRoot -File | Where-Object {
        $_.Name -in @('index.html','style.css','layout.css','mobile.css','pixel-theme.css','pixel-font.woff2','title-art.png','FONT-LICENSE.txt') -or
        ($_.Name -match '^[a-z][a-z0-9-]*\.js$' -and $_.Name -ne 'server.js')
    })
    foreach ($required in @('index.html','game.js','mobile.css','mobile-ui.js')) {
        if ($required -notin $files.Name) { throw "Required file missing: $required" }
    }
    $archive = Join-Path $stage 'site.tar.gz'
    Invoke-Checked 'tar.exe' (@('-czf',$archive,'-C',$projectRoot) + @($files.Name))
    $remoteScript = Join-Path $stage 'deploy-remote.sh'
    $source = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'deploy-remote.sh')).Replace("`r`n","`n")
    [IO.File]::WriteAllText($remoteScript,$source,(New-Object Text.UTF8Encoding($false)))
    Write-Host "Packaged $($files.Count) runtime files: $archive"
    if ($PackageOnly) { exit 0 }
    $sshOptions = @('-i',$KeyPath,'-o','BatchMode=yes','-o','ConnectTimeout=15','-o','StrictHostKeyChecking=yes')
    $target = 'opc@' + $Server
    $remoteDir = '/tmp/spirebound-' + $release
    Invoke-Checked 'ssh.exe' ($sshOptions + @($target,"mkdir -m 700 '$remoteDir'"))
    Invoke-Checked 'scp.exe' ($sshOptions + @($archive,$remoteScript,($target + ':' + $remoteDir + '/')))
    Invoke-Checked 'ssh.exe' ($sshOptions + @($target,"sudo -n bash '$remoteDir/deploy-remote.sh' '$remoteDir' '$release' '$Server'"))
    $expected = (Get-FileHash -LiteralPath (Join-Path $projectRoot 'index.html') -Algorithm SHA256).Hash
    $download = Join-Path $stage 'served-index.html'
    Invoke-Checked 'curl.exe' @('--fail','--silent','--show-error','--connect-timeout','15','--max-time','30',"http://$Server/?release=$release",'-o',$download)
    if ((Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash -ne $expected) { throw 'Public HTTP content differs from the uploaded release. Check proxy/network before retrying.' }
    Write-Host "Verified deployment: http://$Server/ ($release)" -ForegroundColor Green
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
