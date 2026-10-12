param([string]$Destination = [Environment]::GetFolderPath('Desktop'))
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$launcherName = 'Start-KiCad-Parts-Manager-Dev.cmd'
if ((Test-Path -LiteralPath (Join-Path $appRoot 'transfer.json')) -or (Test-Path -LiteralPath (Join-Path $appRoot 'publication-manifest.json'))) {
    $launcherName = 'Start-KiCad-Parts-Manager.cmd'
}
$launcherPath = Join-Path $appRoot $launcherName
if (-not (Test-Path -LiteralPath $launcherPath)) { throw "Start script missing: $launcherPath" }
if (-not (Test-Path -LiteralPath $Destination)) { throw "Desktop folder missing: $Destination" }
$linkPath = Join-Path $Destination 'KiCad Parts Manager.lnk'
$shortcutShell = New-Object -ComObject WScript.Shell
$shortcut = $shortcutShell.CreateShortcut($linkPath)
$shortcut.TargetPath = $launcherPath
$shortcut.WorkingDirectory = $appRoot
$shortcut.Description = 'KiCad Parts Manager - local component selection and simulation models'
$shortcut.WindowStyle = 7
$shortcut.Save()
Write-Output "Desktop shortcut: $linkPath"
