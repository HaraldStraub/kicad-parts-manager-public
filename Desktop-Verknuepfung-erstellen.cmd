@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\desktop_shortcut.ps1"
if errorlevel 1 pause
