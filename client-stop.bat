@echo off
echo Stopping PM2 app...
npx pm2 stop riya-mobile-shop >nul 2>&1
npx pm2 delete riya-mobile-shop >nul 2>&1
taskkill /FI "WINDOWTITLE eq RiyaMobileServer" /T /F >nul 2>&1
echo Done.
pause
