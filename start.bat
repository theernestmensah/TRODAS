@echo off
cd /d "%~dp0"
echo Starting Trodas Technologies project portal...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
