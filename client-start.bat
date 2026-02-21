@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js install nahi hai. Please install Node.js first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies (first time only)...
  call npm install
  if errorlevel 1 (
    echo Dependency install failed.
    pause
    exit /b 1
  )
)

set ADMIN_USER=admin
set ADMIN_PASS=riya@123
set PORT=4000

where pm2 >nul 2>&1
if errorlevel 1 (
  echo Installing PM2 (first time only)...
  call npm install -g pm2
  if errorlevel 1 (
    echo PM2 install failed.
    pause
    exit /b 1
  )
)

echo Starting server with PM2...
pm2 describe riya-mobile-shop >nul 2>&1
if errorlevel 1 (
  pm2 start ecosystem.config.cjs --only riya-mobile-shop --update-env
) else (
  pm2 restart riya-mobile-shop --update-env
)

timeout /t 3 /nobreak >nul
start "" http://localhost:4000/
start "" http://localhost:4000/admin

echo.
echo Website: http://localhost:4000/
echo Admin:   http://localhost:4000/admin
echo.
echo PM2 status:
pm2 status
echo.
echo Stop server: client-stop.bat
echo One-time auto-start setup after reboot: setup-24x7.bat
pause
