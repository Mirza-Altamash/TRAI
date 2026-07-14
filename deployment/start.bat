@echo off
cd /d "%~dp0"
SET PROJECT_ROOT=%~dp0..
SET BACKEND_DIR=%PROJECT_ROOT%\backend
SET FRONTEND_DIR=%PROJECT_ROOT%\frontend

echo Starting Background Processes using PM2...

cd /d "%BACKEND_DIR%"
SET PORT=5002
SET HOST=0.0.0.0
SET CORS_ORIGIN=http://192.168.7.251:8085
SET CLIENT_URL=http://192.168.7.251:8085
call npx pm2 start npm --name "trai-backend" -- run start

cd /d "%FRONTEND_DIR%"
SET PORT=8085
SET HOST=0.0.0.0
call npx pm2 start .output/server/index.mjs --name "trai-frontend"

echo.
call npx pm2 save
echo.
echo Backend and Frontend are now running silently in the background!
echo You can safely close this terminal window.
echo To monitor logs, open a terminal and run: npx pm2 logs
echo.
echo Backend:  http://192.168.7.251:5002
echo Frontend: http://192.168.7.251:8085
pause
