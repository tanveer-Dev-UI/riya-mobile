@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js install nahi hai. Please install Node.js first.
  pause
  exit /b 1
)

where pm2 >nul 2>&1
if errorlevel 1 (
  echo Installing PM2...
  call npm install -g pm2
  if errorlevel 1 (
    echo PM2 install failed.
    pause
    exit /b 1
  )
)

if not exist node_modules (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency install failed.
    pause
    exit /b 1
  )
)

echo Saving current PM2 process list...
pm2 save

echo.
echo Running PM2 startup command...
echo NOTE: Agar admin permission maange to allow karo.
pm2 startup

echo.
echo Now run client-start.bat once, then restart system and verify:
echo pm2 status
pause
