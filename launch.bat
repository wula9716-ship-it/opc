@echo off
cd /d C:\opc-os

:: Kill anything on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo.
echo  ========================================
echo    OPC OS - Starting Desktop App...
echo  ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)

call npm run electron:dev
pause
