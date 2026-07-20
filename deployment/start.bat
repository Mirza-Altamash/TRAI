@echo off
cd /d "%~dp0"
SET PROJECT_ROOT=%~dp0..
SET BACKEND_DIR=%PROJECT_ROOT%\backend
SET FRONTEND_DIR=%PROJECT_ROOT%\frontend

REM === TRAI CITIZEN HUB (Ports: Frontend 8085, Backend 5002) ===
REM === These names are UNIQUE to this project. Do NOT use 'pm2 start/stop/restart all' ===

echo Stopping any previously running TRAI-CitizenHub processes...
call npx pm2 delete trai-citizenhub-backend 2>nul
call npx pm2 delete trai-citizenhub-frontend 2>nul

echo.
echo Starting TRAI Citizen Hub Backend on port 5002...
cd /d "%BACKEND_DIR%"
SET PORT=5002
SET HOST=0.0.0.0
SET CORS_ORIGIN=http://192.168.7.251:8085
SET CLIENT_URL=http://192.168.7.251:8085
call npx pm2 start dist/server.js --name "trai-citizenhub-backend"

echo.
echo Starting TRAI Citizen Hub Frontend on port 8085...
cd /d "%FRONTEND_DIR%"
SET PORT=8085
SET HOST=0.0.0.0
call npx pm2 start .output/server/index.mjs --name "trai-citizenhub-frontend"

echo.
call npx pm2 save
echo.
echo =====================================================
echo  TRAI Citizen Hub is now running!
echo  Backend:  http://192.168.7.251:5002
echo  Frontend: http://192.168.7.251:8085
echo =====================================================
echo  Other projects on this machine are NOT affected.
echo  To view logs: npx pm2 logs trai-citizenhub-backend
echo  To view logs: npx pm2 logs trai-citizenhub-frontend
echo =====================================================
pause
