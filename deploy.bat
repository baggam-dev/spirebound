@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\deploy.ps1"
if errorlevel 1 (echo Deployment failed.) else (echo Deployment complete.)
pause
