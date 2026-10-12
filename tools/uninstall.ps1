param([switch]$PreviewOnly, [string]$Language = 'de')
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
if ($appRoot -eq [IO.Path]::GetPathRoot($appRoot).TrimEnd('\')) { throw 'Unsafe installation root' }
if ((Get-Item -LiteralPath $appRoot -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked installation root; uninstall cancelled' }
if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'pyproject.toml'))) { throw 'Installation marker missing' }
if ((Get-Content -LiteralPath (Join-Path $appRoot 'pyproject.toml') -Raw) -notmatch 'name\s*=\s*"kicad-parts-manager"') { throw 'Wrong application' }
$english = $Language -eq 'en'
function Say($de, $en) { if ($english) { Write-Host $en } else { Write-Host $de } }
# Fixed program-only list. Never recursively remove the installation root or data folders.
$names = @('.venv', 'src', 'migrations', 'node_modules', '.pytest_cache', 'tests', 'scripts', 'tools',
 'Start-KiCad-Parts-Manager.cmd', 'Start-KiCad-Parts-Manager-Dev.cmd', 'Start-KiCad-Parts-Manager.sh',
 'Install-KiCad-Parts-Manager.cmd', 'Desktop-Verknuepfung-erstellen.cmd', 'Deinstallieren.cmd',
 'Setup-CERN-KiCad.cmd', 'Setup-Offene-KiCad-Libs.cmd', '.public-preview-ready')
$targets = @()
$settingsPath = Join-Path $appRoot 'db\user-import-settings.json'
$userLibrary = $null
if (Test-Path -LiteralPath $settingsPath) {
 $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
 if ($settings.folder) { $userLibrary = [IO.Path]::GetFullPath([string]$settings.folder).TrimEnd('\') }
}
foreach ($name in $names) {
 $path = [IO.Path]::GetFullPath((Join-Path $appRoot $name))
 if (-not $path.StartsWith($appRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Path outside installation' }
 if ($userLibrary -and ($userLibrary -eq $path -or $userLibrary.StartsWith($path+'\',[StringComparison]::OrdinalIgnoreCase))) {
  throw 'User library inside program files; uninstall cancelled to preserve data. / Benutzerbibliothek in Programmdateien: Deinstallation zum Datenschutz abgebrochen.'
 }
 if (Test-Path -LiteralPath $path) {
  $items = @(Get-Item -LiteralPath $path -Force)
  if ($items[0].PSIsContainer) { $items += @(Get-ChildItem -LiteralPath $path -Recurse -Force) }
  if ($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw "Linked path; uninstall cancelled: $path" }
  $targets += $path
 }
}
Say "Installation: $appRoot" "Installation: $appRoot"
Say 'Diese Programmdateien werden entfernt:' 'These program files will be removed:'
$targets | ForEach-Object { Write-Host "  $_" }
Say 'Erhalten: db, data, models, kicad, backups, Anleitungen und alle externen Benutzerbibliotheken. Eigene Daten zuerst sichern!' 'Kept: db, data, models, kicad, backups, documentation and all external user libraries. Back up your data first!'
Say 'KiCad-Projektbibliothekseintraege bleiben erhalten. Bei Bedarf dort manuell entfernen.' 'KiCad project library entries remain. Remove them manually there if needed.'
$link = Join-Path ([Environment]::GetFolderPath('Desktop')) 'KiCad Parts Manager.lnk'
$matchingLink = $false
if (Test-Path -LiteralPath $link) {
 $shell = New-Object -ComObject WScript.Shell
 $target = $shell.CreateShortcut($link).TargetPath
 $matchingLink = @('Start-KiCad-Parts-Manager.cmd','Start-KiCad-Parts-Manager-Dev.cmd') -contains (Split-Path -Leaf $target)
 $matchingLink = $matchingLink -and ([IO.Path]::GetFullPath((Split-Path -Parent $target)).TrimEnd('\') -eq $appRoot)
 if ($matchingLink) { Write-Host "  Desktop: $link" }
}
if ($PreviewOnly) { return }
if (Test-Path -LiteralPath (Join-Path $appRoot '.git')) { throw 'Development checkout: uninstall disabled. Use an extracted release package.' }
$busy = Get-CimInstance Win32_Process | Where-Object {
 $_.ProcessId -ne $PID -and ($_.Name -match '^(kicad|eeschema|pcbnew)\.exe$' -or
 ($_.Name -match '^python(w)?\.exe$' -and (($_.ExecutablePath -and $_.ExecutablePath.StartsWith($appRoot+'\',[StringComparison]::OrdinalIgnoreCase)) -or ($_.CommandLine -and $_.CommandLine.Contains($appRoot)))))
}
if ($busy) { throw 'Please close KiCad and the application server first. / Bitte KiCad und den Programmserver zuerst beenden.' }
Say 'Zum Entfernen DEINSTALLIEREN eingeben; Enter bricht ab.' 'Type DEINSTALLIEREN to remove; Enter cancels.'
if ((Read-Host) -cne 'DEINSTALLIEREN') { Say 'Abgebrochen.' 'Cancelled.'; return }
foreach ($path in $targets) { Remove-Item -LiteralPath $path -Recurse -Force }
if ($matchingLink) { Remove-Item -LiteralPath $link -Force }
Say 'Programm entfernt. Daten bleiben im angezeigten Ordner. Python, KiCad und ODBC wurden nicht entfernt.' 'Application removed. Data remains in the displayed folder. Python, KiCad and ODBC were not removed.'
