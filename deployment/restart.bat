@echo off
cd /d "%~dp0"
echo Restarting Background Processes...
call npx pm2 restart all
echo Restarted all TRAI Citizen Hub processes.
