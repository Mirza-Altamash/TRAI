@echo off
cd /d "%~dp0"
echo Stopping Background Processes...
call npx pm2 stop all
call npx pm2 delete all
echo Stopped all TRAI Citizen Hub processes.
