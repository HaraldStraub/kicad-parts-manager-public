@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Python-Umgebung fehlt. Bitte die Einrichtung in README.md ausfuehren.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -m kicad_parts_manager.browser
if errorlevel 1 pause
