@echo off
REM ACE-Step UI 智慧啟動：啟動前先規劃可用端口
setlocal

where pwsh >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-smart.ps1" %*
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-smart.ps1" %*
)

endlocal
