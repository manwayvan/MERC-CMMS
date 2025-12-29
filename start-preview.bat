@echo off
echo Starting local preview server...
echo.

REM Check if port 8080 is in use and kill the process
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Port 8080 is in use. Stopping process %%a...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo Server will be available at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
npx http-server . -p 8080 -o

