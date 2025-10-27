@echo off
setlocal

REM CalorieAI Android APK Build (CMD wrapper)

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

powershell -ExecutionPolicy Bypass -NoProfile -File "%SCRIPT_DIR%build-apk.ps1"

endlocal
