@echo off
cd /d "%~dp0"
echo Stopping TRAI Citizen Hub processes only...
call npx pm2 stop trai-citizenhub-backend
call npx pm2 stop trai-citizenhub-frontend
call npx pm2 delete trai-citizenhub-backend
call npx pm2 delete trai-citizenhub-frontend
echo.
echo TRAI Citizen Hub stopped. Other projects on this machine are NOT affected.
pause
