@echo off
echo Starting AI Test Platform...
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)

:: Check dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Install server dependencies
if not exist "server\node_modules" (
    echo Installing server dependencies...
    pushd server
    call npm install
    popd
)

:: Start API server (port 3001)
echo Starting API server on port 3001...
start "AI Test API" cmd /k "cd /d %~dp0server && node index.js"

:: Start frontend
echo.
echo ========================================
echo   Frontend: http://localhost:5173/
echo   API:      http://localhost:3001/
echo   Configure DeepSeek API Key in Model Library
echo ========================================
echo.

start /B "" cmd /c "timeout /t 6 /nobreak > nul && start http://localhost:5173"

call npm run dev
