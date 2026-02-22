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
  echo Installing project dependencies...
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

echo Starting app in PM2...
npx pm2 describe riya-mobile-shop >nul 2>&1
if errorlevel 1 (
  npx pm2 start ecosystem.config.cjs --only riya-mobile-shop --update-env
) else (
  npx pm2 restart riya-mobile-shop --update-env
)

if errorlevel 1 (
  echo PM2 app start failed.
  pause
  exit /b 1
)

echo Saving PM2 process list...
npx pm2 save
if errorlevel 1 (
  echo PM2 save failed.
  pause
  exit /b 1
)

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "AUTOSTART_FILE=%STARTUP_DIR%\riya-mobile-shop-autostart.bat"

echo Creating Windows startup hook...
(
  echo @echo off
  echo cd /d "%cd%"
  echo set ADMIN_USER=admin
  echo set ADMIN_PASS=riya@123
  echo set PORT=4000
  echo npx pm2 resurrect ^>nul 2^>^&1
) > "%AUTOSTART_FILE%"

if errorlevel 1 (
  echo Failed to create startup file.
  pause
  exit /b 1
)

echo.
echo 24x7 setup complete.
echo App:      http://localhost:4000/
echo Admin:    http://localhost:4000/admin
echo.
echo Reboot ke baad app auto start hoga.
echo Current PM2 status:
npx pm2 status
pause

