@echo off
cd /d "%~dp0"
echo Restarting TRAI Citizen Hub processes only...
call npx pm2 restart trai-citizenhub-backend
call npx pm2 restart trai-citizenhub-frontend
echo.
echo TRAI Citizen Hub restarted. Other projects on this machine are NOT affected.
pause
